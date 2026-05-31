"use client";

import { AGENTS } from "@/lib/agents";
import type { AgentId } from "@/lib/types";
import { cn } from "@/lib/cn";
import Icon from "./Icon";

interface Props {
  id: AgentId;
  size?: number;
  status?: "idle" | "working" | "done";
  ring?: boolean;
}

export default function AgentAvatar({
  id,
  size = 36,
  status = "idle",
  ring = true,
}: Props) {
  const a = AGENTS[id];
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-xl shrink-0",
        status === "working" && "animate-pulse-soft",
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${a.color}33, ${a.color}10)`,
        border: ring ? `1px solid ${a.color}66` : "none",
        boxShadow:
          status === "working" ? `0 0 0 3px ${a.color}22` : undefined,
      }}
      title={`${a.name} · ${a.role}`}
    >
      <Icon name={a.icon} size={size * 0.5} color={a.color} strokeWidth={2} />
      {status === "working" && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
          style={{ background: a.color, borderColor: "var(--bg-1)" }}
        />
      )}
      {status === "done" && (
        <span
          className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2"
          style={{ background: "var(--good)", borderColor: "var(--bg-1)" }}
        >
          <Icon name="Check" size={8} color="#04120c" strokeWidth={4} />
        </span>
      )}
    </div>
  );
}
