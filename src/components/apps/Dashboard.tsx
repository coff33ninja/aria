"use client";

import { useEffect, useMemo, useState } from "react";
import { useAria } from "@/store/useAria";
import { AGENTS, AGENT_LIST } from "@/lib/agents";
import { AreaChart, Bars, Ring, Sparkline } from "@/components/ui/Charts";
import Icon from "@/components/ui/Icon";

function Kpi({
  icon,
  label,
  value,
  color,
  spark,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  spark: number[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between">
        <span
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: `${color}22` }}
        >
          <Icon name={icon} size={16} color={color} />
        </span>
        <Sparkline data={spark} color={color} />
      </div>
      <div className="mt-2 text-[22px] font-semibold tabular-nums text-text0">{value}</div>
      <div className="text-[11px] text-text3">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const missions = useAria((s) => s.missions);
  const files = useAria((s) => s.files);
  const tokens = useAria((s) => s.tokens);
  const status = useAria((s) => s.agentStatus);
  const working = Object.values(status).filter((v) => v === "working").length;

  const [series, setSeries] = useState<number[]>(() =>
    Array.from({ length: 28 }, (_, i) => 30 + Math.sin(i / 2) * 14 + i * 0.6),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => {
      setSeries((s) => {
        const base = s[s.length - 1];
        const drift = (Math.random() - 0.45) * 10 + working * 6;
        const next = Math.max(8, Math.min(100, base + drift));
        return [...s.slice(1), next];
      });
    }, 1500);
    return () => clearInterval(t);
  }, [working]);

  const agentLoad = useMemo(() => {
    const counts: Record<string, number> = {};
    missions.forEach((m) =>
      m.subtasks.forEach((t) => {
        if (t.status === "done") counts[t.agentId] = (counts[t.agentId] || 0) + 1;
      }),
    );
    return AGENT_LIST.map((a) => ({
      label: a.name.slice(0, 3),
      value: counts[a.id] || 0,
      color: a.color,
    }));
  }, [missions]);

  const done = missions.filter((m) => m.status === "done").length;
  const successRate = missions.length ? done / missions.length : 1;
  const spark = (seed: number) =>
    Array.from({ length: 12 }, (_, i) => seed + Math.sin(i + seed) * 4 + i);

  return (
    <div className="h-full overflow-y-auto bg-bg1/40 p-4 scroll-thin">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold">System Dashboard</h2>
          <p className="text-[12px] text-text3">Live view of Aria&apos;s agent runtime</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-good/15 px-2.5 py-1 text-[11px] text-good">
          <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-soft" />
          {working > 0 ? `${working} active` : "idle"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon="Target" label="Missions" value={String(missions.length)} color="#7c6cff" spark={spark(3)} />
        <Kpi icon="Zap" label="Tokens used" value={tokens > 999 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens)} color="#22d3ee" spark={spark(6)} />
        <Kpi icon="FileText" label="Artifacts" value={String(files.length)} color="#34d399" spark={spark(2)} />
        <Kpi icon="Users" label="Agents" value="7" color="#f59e0b" spark={spark(5)} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white/[0.03] p-4 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[13px] font-medium text-text1">Agent throughput</span>
            <span className="text-[11px] text-text3">last {series.length} ticks</span>
          </div>
          {mounted && <AreaChart data={series} color="#7c6cff" height={150} />}
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white/[0.03] p-4">
          <Ring value={successRate} color="#34d399" size={96} label="success" />
          <div className="mt-2 text-center text-[11px] text-text3">
            {done}/{missions.length || 0} missions delivered
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white/[0.03] p-4">
          <div className="mb-3 text-[13px] font-medium text-text1">Agent utilization</div>
          <div className="h-32">
            <Bars data={agentLoad} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white/[0.03] p-4">
          <div className="mb-2 text-[13px] font-medium text-text1">Recent missions</div>
          <div className="space-y-1.5">
            {missions.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-[12px]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: m.status === "done" ? "#34d399" : "#22d3ee",
                  }}
                />
                <span className="flex-1 truncate text-text1">{m.title}</span>
                <span className="text-text3">{m.subtasks.length} steps</span>
              </div>
            ))}
            {missions.length === 0 && (
              <div className="py-6 text-center text-[12px] text-text3">
                No missions yet — start one from the Agents app.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-line bg-white/[0.03] p-4">
        <div className="mb-3 text-[13px] font-medium text-text1">Live agent status</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {AGENT_LIST.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.02] p-2.5"
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: `${a.color}22` }}
              >
                <Icon name={AGENTS[a.id].icon} size={16} color={a.color} />
              </span>
              <span className="text-[11px] font-medium text-text1">{a.name}</span>
              <span
                className="text-[9px]"
                style={{
                  color:
                    status[a.id] === "working"
                      ? a.color
                      : status[a.id] === "done"
                        ? "#34d399"
                        : "#5b6275",
                }}
              >
                {status[a.id] === "working" ? "working" : status[a.id] === "done" ? "done" : "idle"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
