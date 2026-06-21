"use client";

import { useMemo, useState } from "react";
import type { Mission } from "@/lib/types";
import { AGENTS } from "@/lib/agents";
import { useAria } from "@/store/useAria";
import Icon from "@/components/ui/Icon";
import AgentAvatar from "@/components/ui/AgentAvatar";

interface TimelineEvent {
  ts: number;
  type: "subtask_queued" | "subtask_started" | "subtask_done" | "subtask_failed" | "bus_msg" | "mission_result";
  agentId?: string;
  text: string;
}

function elapsed(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export default function TimelineReplay({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const bus = useAria((s) => s.bus);
  const [step, setStep] = useState(0);

  const events = useMemo(() => {
    const evts: TimelineEvent[] = [];

    for (const t of mission.subtasks) {
      evts.push({
        ts: mission.createdAt,
        type: "subtask_queued",
        agentId: t.agentId,
        text: `${AGENTS[t.agentId].name}: ${t.title}`,
      });
      if (t.startedAt) {
        evts.push({
          ts: t.startedAt,
          type: "subtask_started",
          agentId: t.agentId,
          text: `${AGENTS[t.agentId].name} started working`,
        });
      }
      if (t.finishedAt) {
        evts.push({
          ts: t.finishedAt,
          type: t.status === "failed" ? "subtask_failed" : "subtask_done",
          agentId: t.agentId,
          text: `${AGENTS[t.agentId].name}: ${t.status === "failed" ? "failed" : "done"}`,
        });
      }
    }

    const missionBus = bus.filter((m) => {
      if (mission.subtasks.some((t) => t.agentId === m.from)) return true;
      return false;
    });
    const busBeforeEnd = missionBus.filter((m) => !mission.subtasks.every((t) => t.finishedAt && m.ts > t.finishedAt));
    for (const bm of busBeforeEnd) {
      evts.push({
        ts: bm.ts,
        type: "bus_msg",
        agentId: bm.from,
        text: bm.text,
      });
    }

    if (mission.result && mission.status === "done") {
      evts.push({
        ts: mission.subtasks.reduce((max, t) => Math.max(max, t.finishedAt || 0), mission.createdAt) + 1,
        type: "mission_result",
        text: "Mission complete",
      });
    }

    evts.sort((a, b) => a.ts - b.ts);
    return evts;
  }, [mission, bus]);

  const current = events[step] ?? null;
  const total = events.length;
  const atEnd = step >= total - 1;

  const buildState = (idx: number) => {
    const visibleEvents = events.slice(0, idx + 1);
    const doneTasks = new Set<string>();
    const runningTasks = new Set<string>();
    const queuedTasks = new Set<string>();
    for (const e of visibleEvents) {
      if (e.type === "subtask_done" || e.type === "subtask_failed") {
        doneTasks.add(e.agentId!);
        runningTasks.delete(e.agentId!);
      } else if (e.type === "subtask_started") {
        runningTasks.add(e.agentId!);
      } else if (e.type === "subtask_queued") {
        queuedTasks.add(e.agentId!);
      }
    }
    return { doneTasks, runningTasks, queuedTasks };
  };

  const state = buildState(step);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-bg0/95 backdrop-blur-sm">
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px] font-medium text-text0">
          <Icon name="History" size={16} />
          Timeline Replay
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text3">{step + 1} / {total}</span>
          <button
            onClick={onClose}
            className="grid h-6 w-6 place-items-center rounded-md text-text3 hover:bg-white/10 hover:text-text0"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      </div>

      {/* agent state grid */}
      <div className="flex gap-2 border-b border-line px-4 py-2">
        {mission.subtasks.map((t) => {
          const ag = AGENTS[t.agentId];
          const isDone = state.doneTasks.has(t.agentId);
          const isRunning = state.runningTasks.has(t.agentId);
          const isQueued = state.queuedTasks.has(t.agentId);
          return (
            <div
              key={t.id}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5"
              style={{
                background: isDone ? `${ag.color}15` : isRunning ? `${ag.color}0d` : "transparent",
                opacity: isQueued && !isRunning && !isDone ? 0.4 : 1,
              }}
            >
              <AgentAvatar id={t.agentId} size={24} status={isDone ? "done" : isRunning ? "working" : "idle"} />
              <span className="text-[9px] text-text2">{ag.name}</span>
            </div>
          );
        })}
      </div>

      {/* current event display */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 scroll-thin">
        <div className="mb-3 flex items-center gap-2 text-[11px] text-text3">
          {current && <span>{elapsed(current.ts)} ago</span>}
          <span className="text-[9px]">·</span>
          {current && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px]">
              {current.type.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {events.slice(0, step + 1).map((evt, i) => {
            const isLast = i === step;
            const ag = evt.agentId && evt.agentId in AGENTS ? AGENTS[evt.agentId as keyof typeof AGENTS] : null;
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-[12px] ${
                  isLast ? "bg-accent/10 ring-1 ring-accent/30" : ""
                }`}
              >
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: ag?.color || "#7c6cff" }}
                />
                <div className="min-w-0">
                  <span className="font-medium text-text1">{ag?.name || "Aria"}</span>{" "}
                  <span className="text-text2">{evt.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* scrubber */}
      <div className="flex items-center gap-3 border-t border-line px-4 py-3">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="grid h-7 w-7 place-items-center rounded-md text-text2 hover:bg-white/10 disabled:opacity-30"
        >
          <Icon name="ChevronLeft" size={14} />
        </button>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          className="flex-1 accent-[var(--accent)]"
        />
        <button
          onClick={() => setStep(Math.min(total - 1, step + 1))}
          disabled={atEnd}
          className="grid h-7 w-7 place-items-center rounded-md text-text2 hover:bg-white/10 disabled:opacity-30"
        >
          <Icon name="ChevronRight" size={14} />
        </button>
        <button
          onClick={() => setStep(total - 1)}
          disabled={atEnd}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text2 hover:bg-white/10 disabled:opacity-30"
        >
          <Icon name="SkipForward" size={12} /> End
        </button>
      </div>
    </div>
  );
}
