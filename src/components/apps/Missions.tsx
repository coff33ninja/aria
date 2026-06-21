"use client";

import { useMemo, useState } from "react";
import { useAria } from "@/store/useAria";
import type { Mission } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import TimelineReplay from "./TimelineReplay";

const STATUS_ICON: Record<Mission["status"], string> = {
  planning: "Clock",
  running: "LoaderCircle",
  done: "CheckCircle2",
  failed: "XCircle",
};

const STATUS_COLOR: Record<Mission["status"], string> = {
  planning: "#9aa3b8",
  running: "#22d3ee",
  done: "#34d399",
  failed: "#ef4444",
};

const ENGINE_LABEL: Record<Mission["engine"], string> = {
  sim: "Simulated",
  real: "Real LLM",
  local: "Local",
};

function elapsed(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function Missions() {
  const missions = useAria((s) => s.missions);
  const [search, setSearch] = useState("");
  const [selId, setSelId] = useState<string | null>(missions[0]?.id ?? null);
  const [timelineId, setTimelineId] = useState<string | null>(null);
  const sel = missions.find((m) => m.id === selId) ?? null;

  const filtered = useMemo(
    () =>
      missions.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.prompt.toLowerCase().includes(search.toLowerCase()),
      ),
    [missions, search],
  );

  return (
    <div className="flex h-full bg-bg1/40">
      {/* list sidebar */}
      <div className="flex w-60 shrink-0 flex-col border-r border-line">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <Icon name="Search" size={14} className="text-text3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter missions…"
            className="flex-1 bg-transparent text-[12px] text-text0 outline-none placeholder:text-text3"
          />
        </div>
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text3">
          Missions &middot; {filtered.length}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          {filtered.length === 0 && (
            <div className="p-4 text-center text-[12px] text-text3">
              {search ? "No missions match your filter." : "No missions yet."}
            </div>
          )}
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelId(m.id)}
              className={`block w-full px-3 py-2.5 text-left ${
                sel?.id === m.id ? "bg-accent/15" : "hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  name={STATUS_ICON[m.status]}
                  size={14}
                  color={STATUS_COLOR[m.status]}
                />
                <span className="flex-1 truncate text-[12.5px] text-text0">
                  {m.title}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 pl-[22px]">
                <span className="text-[10px] text-text3">{ENGINE_LABEL[m.engine]}</span>
                <span className="text-[10px] text-text3">{elapsed(m.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* detail panel */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {sel ? (
          <>
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <Icon
                name={STATUS_ICON[sel.status]}
                size={16}
                color={STATUS_COLOR[sel.status]}
              />
              <span className="flex-1 truncate text-[13px] font-medium text-text0">
                {sel.title}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{
                  background: `${STATUS_COLOR[sel.status]}22`,
                  color: STATUS_COLOR[sel.status],
                }}
              >
                {sel.status}
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-text3">
                {ENGINE_LABEL[sel.engine]}
              </span>
              {sel.status === "done" && (
                <button
                  onClick={() => setTimelineId(timelineId === sel.id ? null : sel.id)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors ${
                    timelineId === sel.id ? "bg-accent text-white" : "text-text2 hover:bg-white/10"
                  }`}
                >
                  <Icon name="History" size={12} /> Timeline
                </button>
              )}
            </div>
            {timelineId === sel.id && <TimelineReplay mission={sel} onClose={() => setTimelineId(null)} />}

            <div className="min-h-0 flex-1 overflow-y-auto p-4 scroll-thin">
              <div className="mb-4">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text3">
                  Prompt
                </div>
                <div className="rounded-lg bg-white/[0.04] p-3 text-[12.5px] leading-relaxed text-text1">
                  {sel.prompt}
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text3">
                  Steps &middot; {sel.subtasks.length}
                </div>
                <div className="space-y-1">
                  {sel.subtasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2"
                    >
                      <Icon
                        name={
                          t.status === "done"
                            ? "CheckCircle2"
                            : t.status === "running"
                              ? "LoaderCircle"
                              : t.status === "failed"
                                ? "XCircle"
                                : "Circle"
                        }
                        size={12}
                        color={
                          t.status === "done"
                            ? "#34d399"
                            : t.status === "running"
                              ? "#22d3ee"
                              : t.status === "failed"
                                ? "#ef4444"
                                : "#9aa3b8"
                        }
                      />
                      <span className="text-[12px] text-text1">{t.title}</span>
                      {t.output && (
                        <span className="ml-auto max-w-[120px] truncate text-[10px] text-text3">
                          {t.output.replace(/#{2,}\s/g, "").slice(0, 50)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {sel.result && (
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text3">
                    Result
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg bg-white/[0.04] p-3 text-[12.5px] leading-relaxed text-text1">
                    {sel.result}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center text-center text-text3">
            <div>
              <Icon name="ListChecks" size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-[12px]">Select a mission to inspect</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
