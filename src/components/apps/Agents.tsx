"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAria } from "@/store/useAria";
import { AGENTS, AGENT_LIST } from "@/lib/agents";
import type { Mission, Subtask } from "@/lib/types";
import AgentAvatar from "@/components/ui/AgentAvatar";
import Markdown from "@/components/ui/Markdown";
import Icon from "@/components/ui/Icon";

const EXAMPLES = [
  "Research and compare the top 3 CRMs for a startup",
  "Build a landing page for a habit-tracking app",
  "Plan and write a 6-email onboarding sequence",
];

function StatusChip({ status }: { status: Subtask["status"] }) {
  const map = {
    queued: { label: "Queued", color: "#5b6275", icon: "Clock" },
    running: { label: "Working", color: "#22d3ee", icon: "Loader" },
    done: { label: "Done", color: "#34d399", icon: "Check" },
    failed: { label: "Failed", color: "#fb7185", icon: "X" },
  }[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: `${map.color}22`, color: map.color }}
    >
      <Icon
        name={map.icon}
        size={10}
        className={status === "running" ? "animate-spin-slow" : ""}
      />
      {map.label}
    </span>
  );
}

function MissionView({ mission }: { mission: Mission }) {
  return (
    <div className="space-y-3">
      {mission.subtasks.map((t, i) => {
        const ag = AGENTS[t.agentId];
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative pl-7"
          >
            {/* connector */}
            {i < mission.subtasks.length - 1 && (
              <span className="absolute left-[11px] top-7 h-[calc(100%+0.75rem)] w-px bg-line" />
            )}
            <span
              className="absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2"
              style={{
                borderColor: ag.color,
                background:
                  t.status === "done"
                    ? ag.color
                    : t.status === "running"
                      ? `${ag.color}66`
                      : "var(--bg-1)",
              }}
            />
            <div
              className="rounded-2xl border p-3"
              style={{
                borderColor: t.status === "running" ? `${ag.color}55` : "var(--line)",
                background:
                  t.status === "running" ? `${ag.color}0d` : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <AgentAvatar id={t.agentId} size={30} status={t.status === "running" ? "working" : t.status === "done" ? "done" : "idle"} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text0">{t.title}</div>
                  <div className="text-[11px] text-text3">
                    {ag.name} · {ag.role}
                  </div>
                </div>
                <StatusChip status={t.status} />
              </div>
              {t.output && (
                <div className="mt-2.5 max-h-56 overflow-y-auto rounded-xl bg-black/20 p-3 scroll-thin">
                  <Markdown text={t.output} />
                  {t.status === "running" && <span className="caret" />}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {mission.status === "done" && (
        <div className="ml-7 rounded-2xl border border-good/30 bg-good/5 p-3">
          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-good">
            <Icon name="CircleCheck" size={14} /> Mission complete
          </div>
          <Markdown text={mission.result} />
        </div>
      )}
    </div>
  );
}

export default function Agents() {
  const missions = useAria((s) => s.missions);
  const activeMissionId = useAria((s) => s.activeMissionId);
  const status = useAria((s) => s.agentStatus);
  const bus = useAria((s) => s.bus);
  const runMission = useAria((s) => s.runMission);

  const [prompt, setPrompt] = useState("");
  const busFeedRef = useRef<HTMLDivElement>(null);
  const running = activeMissionId != null;
  const mission = missions[0];

  useEffect(() => {
    busFeedRef.current?.scrollTo({ top: busFeedRef.current.scrollHeight });
  }, [bus]);

  const launch = (p: string) => {
    const t = p.trim();
    if (!t || running) return;
    setPrompt("");
    runMission(t);
  };

  return (
    <div className="flex h-full bg-bg1/40">
      {/* roster */}
      <div className="hidden w-44 shrink-0 flex-col border-r border-line p-3 sm:flex">
        <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-text3">
          The Team
        </div>
        <div className="space-y-1.5">
          {AGENT_LIST.map((a) => (
            <div key={a.id} className="flex items-center gap-2.5 rounded-xl p-1.5">
              <AgentAvatar id={a.id} size={30} status={status[a.id]} />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-text0">{a.name}</div>
                <div className="truncate text-[10px] text-text3">{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-line p-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.05] p-1.5">
            <Icon name="Wand2" size={16} className="ml-2 text-text3" />
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && launch(prompt)}
              disabled={running}
              placeholder={running ? "Team is working…" : "Give the team a mission…"}
              className="flex-1 bg-transparent px-1 py-1.5 text-[13px] text-text0 outline-none placeholder:text-text3 disabled:opacity-60"
            />
            <button
              onClick={() => launch(prompt)}
              disabled={running || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-xl accent-grad px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
            >
              {running ? (
                <Icon name="Loader" size={14} className="animate-spin-slow" />
              ) : (
                <Icon name="Play" size={14} />
              )}
              {running ? "Running" : "Dispatch"}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 scroll-thin">
          {mission ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold text-text0">{mission.title}</div>
                  <div className="text-[11px] text-text3">
                    {mission.engine === "real" ? "Live LLM" : "Simulated"} ·{" "}
                    {mission.subtasks.length} steps
                  </div>
                </div>
                {missions.length > 1 && (
                  <span className="text-[11px] text-text3">
                    {missions.length} missions this session
                  </span>
                )}
              </div>
              <MissionView mission={mission} />
            </>
          ) : (
            <div className="grid h-full place-items-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex w-fit gap-1.5">
                  {AGENT_LIST.slice(0, 7).map((a) => (
                    <AgentAvatar key={a.id} id={a.id} size={28} />
                  ))}
                </div>
                <h3 className="text-[15px] font-semibold">Your AI team is ready</h3>
                <p className="mt-1 text-[12px] text-text2">
                  Hand them a goal and watch Atlas plan it, the specialists build
                  it, and Echo review it — live.
                </p>
                <div className="mt-4 space-y-2">
                  {EXAMPLES.map((e) => (
                    <button
                      key={e}
                      onClick={() => launch(e)}
                      className="block w-full rounded-xl border border-line bg-white/[0.03] p-2.5 text-left text-[12px] text-text1 hover:border-accent/50 hover:bg-accent/10"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* activity bus */}
      <div className="hidden w-52 shrink-0 flex-col border-l border-line md:flex">
        <div className="border-b border-line px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text3">
          Activity
        </div>
        <div ref={busFeedRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 scroll-thin">
          <AnimatePresence initial={false}>
            {bus.slice(-40).map((m) => {
              const ag = m.from === "system" ? null : AGENTS[m.from];
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 text-[11px]"
                >
                  <span
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: ag?.color || "#5b6275" }}
                  />
                  <div className="min-w-0">
                    <span className="font-medium text-text1">{ag?.name || "System"}</span>{" "}
                    <span className="text-text3">{m.text}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {bus.length === 0 && (
            <div className="pt-6 text-center text-[11px] text-text3">
              Agent chatter shows up here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
