"use client";

import { motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import type { Mission, Subtask } from "@/lib/types";
import AgentAvatar from "@/components/ui/AgentAvatar";
import Icon from "@/components/ui/Icon";

interface Node {
  task: Subtask;
  x: number; // 0..100
  y: number;
}

const TOOL_BADGE: Record<string, string> = {
  sage: "web_search",
  forge: "run_js",
};

function avatarStatus(s: Subtask["status"]) {
  return s === "running" ? "working" : s === "done" ? "done" : "idle";
}

export default function AgentGraph({ mission }: { mission: Mission }) {
  const atlas = mission.subtasks.find((t) => t.agentId === "atlas");
  const echo = mission.subtasks.find((t) => t.agentId === "echo");
  const core = mission.subtasks.filter(
    (t) => t.agentId !== "atlas" && t.agentId !== "echo",
  );

  const nodes: Node[] = [];
  if (atlas) nodes.push({ task: atlas, x: 50, y: 15 });
  core.forEach((t, i) => {
    const x = core.length === 1 ? 50 : 16 + (i * 68) / (core.length - 1);
    nodes.push({ task: t, x, y: 50 });
  });
  if (echo) nodes.push({ task: echo, x: 50, y: 85 });

  const pos = (id: string) => nodes.find((n) => n.task.id === id);
  const edges: { from: Node; to: Node; live: boolean }[] = [];
  if (atlas) {
    const a = pos(atlas.id)!;
    core.forEach((t) => {
      const c = pos(t.id);
      if (c) edges.push({ from: a, to: c, live: atlas.status === "done" && t.status !== "done" });
    });
  }
  if (echo) {
    const e = pos(echo.id)!;
    core.forEach((t) => {
      const c = pos(t.id);
      if (c) edges.push({ from: c, to: e, live: t.status === "done" && echo.status !== "done" });
    });
  }

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[640px]">
      {/* edges */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {edges.map((e, i) => {
          const done = e.from.task.status === "done";
          return (
            <g key={i}>
              <line
                x1={e.from.x}
                y1={e.from.y}
                x2={e.to.x}
                y2={e.to.y}
                stroke={done ? `${AGENTS[e.from.task.agentId].color}` : "rgba(255,255,255,0.1)"}
                strokeWidth={done ? 0.5 : 0.4}
                strokeOpacity={done ? 0.5 : 1}
                vectorEffect="non-scaling-stroke"
              />
              {e.live && (
                <line
                  x1={e.from.x}
                  y1={e.from.y}
                  x2={e.to.x}
                  y2={e.to.y}
                  stroke={AGENTS[e.to.task.agentId].color}
                  strokeWidth={0.7}
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                  style={{ animation: "dashFlow 0.6s linear infinite" }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* nodes */}
      {nodes.map((n) => {
        const ag = AGENTS[n.task.agentId];
        const st = n.task.status;
        const badge = (st === "running" || st === "done") && TOOL_BADGE[n.task.agentId];
        return (
          <motion.div
            key={n.task.id}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: st === "queued" ? 0.55 : 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <AgentAvatar id={n.task.agentId} size={52} status={avatarStatus(st)} />
            <div className="text-center">
              <div className="text-[12px] font-semibold text-text0">{ag.name}</div>
              <div className="text-[10px] text-text3">{ag.role}</div>
            </div>
            {badge && (
              <span
                className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                style={{ background: `${ag.color}22`, color: ag.color }}
              >
                <Icon name="Wrench" size={8} /> {badge}
              </span>
            )}
          </motion.div>
        );
      })}

      {/* caption */}
      <div className="absolute inset-x-0 bottom-0 text-center text-[11px] text-text3">
        {mission.status === "done"
          ? "Mission complete — every agent reported in."
          : "Atlas routes the plan · specialists work in parallel · Echo reviews"}
      </div>
    </div>
  );
}
