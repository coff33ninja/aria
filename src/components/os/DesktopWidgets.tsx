"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useOS, type Settings } from "@/store/useOS";
import { useAria } from "@/store/useAria";
import { AGENT_LIST } from "@/lib/agents";
import { ALL_WIDGETS, type WidgetId } from "@/lib/widgets";
import type { AppId } from "@/lib/apps";
import AgentAvatar from "@/components/ui/AgentAvatar";
import Icon from "@/components/ui/Icon";

function ClockWidget({ openApp }: { openApp: (id: AppId) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      onClick={() => openApp("dashboard")}
      className="pointer-events-auto rounded-3xl glass p-5 text-left shadow-xl hover:bg-white/[0.06]"
    >
      <div className="text-[44px] font-semibold leading-none tracking-tight tabular-nums text-text0">
        {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
      </div>
      <div className="mt-1.5 text-[13px] text-text2">
        {now
          ? now.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          : ""}
      </div>
    </motion.button>
  );
}

function AriaStatusWidget({ openApp }: { openApp: (id: AppId) => void }) {
  const status = useAria((s) => s.agentStatus);
  const working = Object.values(status).filter((v) => v === "working").length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      onClick={() => openApp("assistant")}
      className="pointer-events-auto flex items-center gap-3 rounded-3xl glass p-4 text-left shadow-xl hover:bg-white/[0.06]"
    >
      <div className="relative grid h-11 w-11 place-items-center rounded-2xl accent-grad">
        <Icon name="Sparkles" size={20} className="text-white" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg1 bg-good" />
      </div>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-text0">Aria</div>
        <div className="text-[11px] text-text2">
          {working > 0 ? `${working} agents working…` : "online · ready"}
        </div>
      </div>
    </motion.button>
  );
}

function TeamWidget({ openApp }: { openApp: (id: AppId) => void }) {
  const status = useAria((s) => s.agentStatus);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      onClick={() => openApp("agents")}
      className="pointer-events-auto rounded-3xl glass p-4 text-left shadow-xl hover:bg-white/[0.06]"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-text1">The Team</span>
        <span className="text-[11px] text-text3">7 agents</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {AGENT_LIST.map((a) => (
          <AgentAvatar key={a.id} id={a.id} size={36} status={status[a.id]} />
        ))}
      </div>
    </motion.button>
  );
}

function StatsWidget() {
  const missions = useAria((s) => s.missions);
  const files = useAria((s) => s.files);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="grid grid-cols-2 gap-3"
    >
      <div className="rounded-2xl glass p-3 text-center shadow-xl">
        <div className="text-[20px] font-semibold text-text0">{missions.length}</div>
        <div className="text-[10px] text-text3">missions</div>
      </div>
      <div className="rounded-2xl glass p-3 text-center shadow-xl">
        <div className="text-[20px] font-semibold text-text0">{files.length}</div>
        <div className="text-[10px] text-text3">artifacts</div>
      </div>
    </motion.div>
  );
}

const BRAIN_LABELS: Record<Settings["brain"], string> = {
  simulated: "Simulated",
  api: "Cloud API",
  local: "Local (WebGPU)",
  backend: "Backend",
};

function RecentMissionsWidget({ openApp }: { openApp: (id: AppId) => void }) {
  const missions = useAria((s) => s.missions);
  const recent = missions.slice(0, 3);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      onClick={() => openApp("missions")}
      className="pointer-events-auto rounded-3xl glass p-4 text-left shadow-xl hover:bg-white/[0.06]"
    >
      <div className="mb-2 text-[12px] font-medium text-text1">Recent Missions</div>
      {recent.length === 0 ? (
        <div className="text-[11px] text-text3">No missions yet</div>
      ) : (
        <div className="space-y-1.5">
          {recent.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  m.status === "done" ? "bg-good" : m.status === "running" ? "bg-warn" : "bg-text3"
                }`}
              />
              <span className="truncate text-[12px] text-text2">{m.title}</span>
            </div>
          ))}
        </div>
      )}
    </motion.button>
  );
}

function BrainStatusWidget() {
  const brain = useOS((s) => s.settings.brain);
  const apiModel = useOS((s) => s.settings.apiModel);
  const localModel = useOS((s) => s.settings.localModel);
  const backendModel = useOS((s) => s.settings.backendModel);

  const model =
    brain === "api" ? apiModel || "gpt-4o-mini"
    : brain === "local" ? localModel
    : brain === "backend" ? backendModel || "llama3.2"
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="rounded-2xl glass p-3 shadow-xl"
    >
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg accent-grad">
          <Icon name="Brain" size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-text1">{BRAIN_LABELS[brain]}</div>
          {model && <div className="truncate text-[10px] text-text3">{model}</div>}
        </div>
      </div>
    </motion.div>
  );
}

function QuickMissionWidget() {
  const [value, setValue] = useState("");
  const openApp = useOS((s) => s.openApp);
  const runMission = useAria((s) => s.runMission);
  const busy = useAria((s) => s.busy);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setValue("");
    openApp("assistant");
    await new Promise((r) => setTimeout(r, 100));
    runMission(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl glass p-3 shadow-xl"
    >
      <div className="mb-1.5 text-[11px] font-medium text-text2">Quick Mission</div>
      <div className="flex gap-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="What should Aria do?"
          className="min-w-0 flex-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[12px] text-text0 outline-none placeholder:text-text3"
        />
        <button
          onClick={submit}
          disabled={busy || !value.trim()}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg accent-grad disabled:opacity-40"
        >
          <Icon name="Send" size={12} className="text-white" />
        </button>
      </div>
    </motion.div>
  );
}

function NotificationsWidget() {
  const notifs = useOS((s) => s.notifs);
  const dismissNotif = useOS((s) => s.dismissNotif);
  const recent = notifs.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl glass p-3 shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-text2">Notifications</span>
        {recent.length > 0 && (
          <button onClick={() => useOS.getState().clearNotifs()} className="text-[10px] text-text3 hover:text-text1">
            Clear
          </button>
        )}
      </div>
      {recent.length === 0 ? (
        <div className="text-[11px] text-text3">No notifications</div>
      ) : (
        <div className="space-y-1">
          {recent.map((n) => (
            <div key={n.id} className="group flex items-start gap-2">
              <span
                className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: n.color || "var(--accent)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium text-text1">{n.title}</div>
                <div className="line-clamp-1 text-[10px] text-text3">{n.body}</div>
              </div>
              <button
                onClick={() => dismissNotif(n.id)}
                className="mt-0.5 hidden shrink-0 group-hover:grid place-items-center"
              >
                <Icon name="X" size={10} className="text-text3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AgentActivityWidget() {
  const bus = useAria((s) => s.bus);
  const recent = bus.slice(-5).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="rounded-2xl glass p-3 shadow-xl"
    >
      <div className="mb-2 text-[11px] font-medium text-text2">Agent Activity</div>
      {recent.length === 0 ? (
        <div className="text-[11px] text-text3">No recent activity</div>
      ) : (
        <div className="space-y-1">
          {recent.map((m) => (
            <div key={m.id} className="line-clamp-1 text-[11px]">
              <span className="font-medium text-accent">{m.from}</span>
              <span className="text-text3"> {m.text}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const QUICK_ACTIONS = [
  { appId: "notes", label: "Note", icon: "FileText" },
  { appId: "terminal", label: "Terminal", icon: "Terminal" },
  { appId: "files", label: "Files", icon: "Folder" },
  { appId: "dashboard", label: "Dashboard", icon: "BarChart3" },
] as const;

function QuickActionsWidget({ openApp }: { openApp: (id: AppId) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl glass p-3 shadow-xl"
    >
      <div className="mb-2 text-[11px] font-medium text-text2">Quick Actions</div>
      <div className="grid grid-cols-2 gap-1.5">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.appId}
            onClick={() => openApp(a.appId)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-text2 hover:bg-white/[0.06] hover:text-text1"
          >
            <Icon name={a.icon} size={12} />
            {a.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

const WIDGET_MAP: Record<WidgetId, (props: { openApp: (id: AppId) => void }) => React.ReactNode> = {
  clock: (p) => <ClockWidget {...p} />,
  "aria-status": (p) => <AriaStatusWidget {...p} />,
  team: (p) => <TeamWidget {...p} />,
  stats: () => <StatsWidget />,
  "recent-missions": (p) => <RecentMissionsWidget {...p} />,
  "brain-status": () => <BrainStatusWidget />,
  "quick-mission": () => <QuickMissionWidget />,
  notifications: () => <NotificationsWidget />,
  "agent-activity": () => <AgentActivityWidget />,
  "quick-actions": (p) => <QuickActionsWidget {...p} />,
};

export default function DesktopWidgets() {
  const openApp = useOS((s) => s.openApp);
  const activeIds = useOS((s) => s.settings.widgets);
  const offsets = useOS((s) => s.settings.widgetPositions);
  const setSettings = useOS((s) => s.setSettings);
  const dragRef = useRef<{ ox: number; oy: number; ox0: number; oy0: number } | null>(null);
  const [liveDelta, setLiveDelta] = useState<{ x: number; y: number } | null>(null);

  const widgets = ALL_WIDGETS.filter((w) => activeIds.includes(w.id));

  return (
    <div className="pointer-events-none absolute right-5 top-12 z-0 flex w-[230px] flex-col gap-4">
      {widgets.map((w) => {
        const render = WIDGET_MAP[w.id];
        if (!render) return null;
        const offset = offsets[w.id];
        const delta = liveDelta ?? { x: 0, y: 0 };
        const tx = (offset?.x ?? 0) + delta.x;
        const ty = (offset?.y ?? 0) + delta.y;

        return (
          <div
            key={w.id}
            className="pointer-events-auto"
            style={{
              transform: tx || ty ? `translate(${tx}px,${ty}px)` : undefined,
              zIndex: liveDelta ? 50 : undefined,
            }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("input, textarea, button, a")) return;
              const el = e.currentTarget as HTMLElement;
              dragRef.current = { ox: e.clientX, oy: e.clientY, ox0: offset?.x ?? 0, oy0: offset?.y ?? 0 };
              el.setPointerCapture(e.pointerId);

              const onMove = (ev: PointerEvent) => {
                const d = dragRef.current;
                if (!d) return;
                setLiveDelta({ x: ev.clientX - d.ox, y: ev.clientY - d.oy });
              };

              const onUp = (ev: PointerEvent) => {
                const d = dragRef.current;
                if (!d) return;
                const nx = d.ox0 + ev.clientX - d.ox;
                const ny = d.oy0 + ev.clientY - d.oy;
                if (Math.abs(nx) > 5 || Math.abs(ny) > 5) {
                  setSettings({ widgetPositions: { ...useOS.getState().settings.widgetPositions, [w.id]: { x: nx, y: ny } } });
                }
                setLiveDelta(null);
                dragRef.current = null;
                el.removeEventListener("pointermove", onMove);
                el.removeEventListener("pointerup", onUp);
              };

              el.addEventListener("pointermove", onMove);
              el.addEventListener("pointerup", onUp);
            }}
          >
            <div style={{ pointerEvents: "auto" }}>{render({ openApp })}</div>
          </div>
        );
      })}
    </div>
  );
}
