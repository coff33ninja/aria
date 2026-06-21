"use client";

import { useEffect, useState } from "react";
import { useOS } from "@/store/useOS";
import { useAria } from "@/store/useAria";
import { WALLPAPERS } from "@/lib/apps";
import Icon from "@/components/ui/Icon";
import {
  LOCAL_MODELS,
  loadLocalModel,
  localReady,
  webgpuAvailable,
  browserSupport,
  type LoadProgress,
} from "@/lib/runtime/localBrain";
import { fetchModels, pullModel, deleteModel, type BackendModel } from "@/lib/runtime/backendBrain";
import { AGENT_LIST } from "@/lib/agents";
import { IS_STATIC } from "@/lib/env";

const ACCENTS = ["#7c6cff", "#22d3ee", "#34d399", "#f472b6", "#f59e0b", "#fb7185"];

const POPULAR_MODELS = [
  "llama3.2", "llama3.1", "llama3",
  "qwen2.5", "qwen2",
  "mistral", "mixtral",
  "codellama", "deepseek-coder",
  "gemma2", "phi4", "phi3",
];

function LocalBrainPanel() {
  const localModel = useOS((s) => s.settings.localModel);
  const set = useOS((s) => s.setSettings);
  const [prog, setProg] = useState<LoadProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const gpu = webgpuAvailable();

  useEffect(() => setReady(localReady(localModel)), [localModel]);

  const load = async () => {
    setErr("");
    setLoading(true);
    setProg({ progress: 0, text: "Starting…" });
    try {
      await loadLocalModel(localModel, setProg);
      setReady(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const model = LOCAL_MODELS.find((m) => m.id === localModel);

  return (
    <>
      {!gpu && (
        <Row title="WebGPU" desc="Required to run a model in the browser">
          <span className="max-w-48 text-right text-[11px] text-bad">
            {browserSupport().guidance}
          </span>
        </Row>
      )}
      <Row title="Model" desc="Runs fully on your machine — nothing ever leaves the browser">
        <select
          value={localModel}
          onChange={(e) => {
            set({ localModel: e.target.value });
            setReady(localReady(e.target.value));
          }}
          className="w-52 rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent"
        >
          {LOCAL_MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-bg2">
              {m.label} · {m.size}
            </option>
          ))}
        </select>
      </Row>
      <Row
        title={ready ? "Brain ready" : "Download a brain"}
        desc={ready ? "Loaded & private — agents run on it now" : model?.note}
      >
        {ready ? (
          <span className="flex items-center gap-1.5 text-[12px] text-good">
            <Icon name="Check" size={14} /> Loaded
          </span>
        ) : (
          <button
            onClick={load}
            disabled={loading || !gpu}
            className="flex items-center gap-1.5 rounded-lg accent-grad px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
          >
            {loading ? (
              <Icon name="Loader" size={13} className="animate-spin-slow" />
            ) : (
              <Icon name="Download" size={13} />
            )}
            {loading ? "Downloading" : "Download"}
          </button>
        )}
      </Row>
      {loading && prog && (
        <div className="px-1 pb-2 pt-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full accent-grad transition-all"
              style={{ width: `${Math.round((prog.progress || 0) * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 text-[10px] text-text3">{prog.text}</div>
        </div>
      )}
      {err && <div className="px-1 pb-2 text-[11px] text-bad">{err}</div>}
    </>
  );
}

function BackendPanel() {
  const backendUrl = useOS((s) => s.settings.backendUrl);
  const backendModel = useOS((s) => s.settings.backendModel);
  const set = useOS((s) => s.setSettings);
  const [models, setModels] = useState<BackendModel[]>([]);
  const [fetchErr, setFetchErr] = useState("");
  const [pullName, setPullName] = useState("");
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState("");
  const [pullErr, setPullErr] = useState("");
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [delErr, setDelErr] = useState("");

  const loadModels = async () => {
    setFetchErr("");
    try {
      const [list, ok] = await Promise.all([
        fetchModels(backendUrl),
        fetch(`${backendUrl.replace(/\/+$/, "")}/api/tags`).then((r) => r.ok).catch(() => false),
      ]);
      setModels(list);
      setHealthy(ok);
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : String(e));
      setHealthy(false);
    }
  };

  useEffect(() => { loadModels(); }, [backendUrl]);

  const doPull = async (model: string) => {
    if (!model) return;
    setPullName("");
    setPulling(true);
    setPullStatus("");
    setPullErr("");
    try {
      await pullModel(backendUrl, model, (s) => setPullStatus(s));
      await loadModels();
      set({ backendModel: model });
    } catch (e) {
      setPullErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPulling(false);
      setPullStatus("");
    }
  };

  const doDelete = async (model: string) => {
    setDelErr("");
    try {
      await deleteModel(backendUrl, model);
      if (backendModel === model) set({ backendModel: "" });
      setModels((prev) => prev.filter((m) => m.name !== model));
    } catch (e) {
      setDelErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <Row title="Server URL" desc="Ollama or compatible endpoint">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${healthy === null ? "bg-text3" : healthy ? "bg-good" : "bg-bad"}`}
            title={healthy === null ? "Checking…" : healthy ? "Reachable" : "Unreachable"}
          />
          <input
            value={backendUrl}
            onChange={(e) => set({ backendUrl: e.target.value })}
            placeholder="http://localhost:11434"
            className="w-44 rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent"
          />
        </div>
      </Row>
      {fetchErr && (
        <div className="px-1 pb-2 text-[11px] text-bad">{fetchErr}</div>
      )}
      <Row title="Installed models" desc="Detected from your backend">
        <div className="flex gap-1">
          <select
            value={backendModel}
            onChange={(e) => set({ backendModel: e.target.value })}
            className="w-36 rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent"
          >
            <option value="">— pick —</option>
            {models.map((m) => (
              <option key={m.name} value={m.name} className="bg-bg2">
                {m.name}
              </option>
            ))}
          </select>
          {backendModel && (
            <button
              onClick={() => doDelete(backendModel)}
              className="flex items-center rounded-lg border border-bad/40 px-2 py-1.5 text-[11px] text-bad hover:bg-bad/10"
              title="Delete this model"
            >
              <Icon name="Trash2" size={12} />
            </button>
          )}
        </div>
      </Row>
      {delErr && <div className="px-1 pb-2 text-[11px] text-bad">{delErr}</div>}
      <Row title="Pull a model" desc="Download a model to your backend">
        <div className="flex gap-1.5">
          <input
            value={pullName}
            onChange={(e) => setPullName(e.target.value)}
            placeholder="e.g. llama3.2"
            className="w-28 rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent"
          />
          <button
            onClick={() => doPull(pullName)}
            disabled={!pullName || pulling}
            className="flex items-center gap-1 rounded-lg accent-grad px-2.5 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
          >
            {pulling ? (
              <Icon name="Loader" size={12} className="animate-spin-slow" />
            ) : (
              <Icon name="Download" size={12} />
            )}
            Pull
          </button>
        </div>
      </Row>
      {pulling && pullStatus && (
        <div className="px-1 pb-2 text-[11px] text-text3">{pullStatus}</div>
      )}
      {pullErr && <div className="px-1 pb-2 text-[11px] text-bad">{pullErr}</div>}
      {models.length === 0 && !fetchErr && (
        <Row title="Try popular models" desc="Click to pull one">
          <div className="flex max-w-56 flex-wrap gap-1">
            {POPULAR_MODELS.map((name) => (
              <button
                key={name}
                onClick={() => doPull(name)}
                disabled={pulling}
                className="rounded-md border border-line bg-white/[0.04] px-2 py-0.5 text-[11px] text-text2 hover:border-accent/50 hover:text-text0 disabled:opacity-40"
              >
                {name}
              </button>
            ))}
          </div>
        </Row>
      )}
    </>
  );
}

function AgentsPanel() {
  const customAgents = useOS((s) => s.settings.customAgents);
  const set = useOS((s) => s.setSettings);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (id: string, sys: string) => {
    setEditing(id);
    setDraft(customAgents[id]?.system ?? sys);
  };

  const save = (id: string) => {
    set({ customAgents: { ...customAgents, [id]: { system: draft } } });
    setEditing(null);
  };

  const resetAgent = (id: string) => {
    const next = { ...customAgents };
    delete next[id];
    set({ customAgents: next });
    setEditing(null);
  };

  return (
    <>
      {AGENT_LIST.map((a) => (
        <div key={a.id} className="border-b border-line py-2 last:border-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                <span className="text-[13px] font-medium text-text0">{a.name}</span>
                <span className="text-[11px] text-text2">{a.role}</span>
                {customAgents[a.id] && <span className="text-[10px] text-accent">(edited)</span>}
              </div>
            </div>
            <button
              onClick={() => startEdit(a.id, a.system)}
              className="rounded-lg p-1.5 text-text3 hover:bg-white/10 hover:text-text0"
            >
              <Icon name="Pencil" size={12} />
            </button>
          </div>
          {editing === a.id && (
            <div className="mt-2 space-y-1.5 pl-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent scroll-thin"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => save(a.id)}
                  className="rounded-lg accent-grad px-2.5 py-1 text-[11px] font-medium text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-line px-2.5 py-1 text-[11px] text-text2 hover:bg-white/5"
                >
                  Cancel
                </button>
                {customAgents[a.id] && (
                  <button
                    onClick={() => resetAgent(a.id)}
                    className="rounded-lg border border-bad/40 px-2.5 py-1 text-[11px] text-bad hover:bg-bad/10"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function ContextPanel() {
  const contextDocs = useAria((s) => s.contextDocs);
  const addContextDoc = useAria((s) => s.addContextDoc);
  const removeContextDoc = useAria((s) => s.removeContextDoc);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const add = () => {
    if (!title.trim() || !content.trim()) return;
    addContextDoc(title.trim(), content.trim());
    setTitle("");
    setContent("");
  };

  return (
    <>
      {contextDocs.map((d) => (
        <Row key={d.id} title={d.title} desc={d.content.slice(0, 80) + (d.content.length > 80 ? "…" : "")}>
          <button
            onClick={() => removeContextDoc(d.id)}
            className="rounded-lg p-1 text-text3 hover:bg-white/10 hover:text-bad"
            title="Remove"
          >
            <Icon name="X" size={13} />
          </button>
        </Row>
      ))}
      <div className="space-y-2 pt-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Doc title"
          className="w-full rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste reference content here…"
          rows={3}
          className="w-full resize-none rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent scroll-thin"
        />
        <button
          onClick={add}
          disabled={!title.trim() || !content.trim()}
          className="flex items-center gap-1 rounded-lg accent-grad px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
        >
          <Icon name="Plus" size={12} /> Add to context
        </button>
      </div>
    </>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-[13px] text-text0">{title}</div>
        {desc && <div className="text-[11px] text-text3">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-accent" : "bg-white/15"}`}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? 22 : 2 }}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white/[0.03] p-4">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text3">
        {title}
      </div>
      <div className="divide-y divide-line">{children}</div>
    </div>
  );
}

export default function Settings() {
  const s = useOS((st) => st.settings);
  const set = useOS((st) => st.setSettings);
  const reset = useAria((st) => st.reset);
  const missions = useAria((st) => st.missions.length);

  return (
    <div className="h-full overflow-y-auto bg-bg1/40 p-4 scroll-thin">
      {/* hero */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl accent-grad text-2xl font-bold text-white">
          A
        </div>
        <div>
          <div className="text-[16px] font-semibold">Aria</div>
          <div className="text-[12px] text-text2">
            your AI operating system · v1.0 · {missions} missions this session
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Section title="Appearance">
          <Row title="Accent color">
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => set({ accent: c })}
                  className={`h-6 w-6 rounded-full border-2 ${
                    s.accent === c ? "border-white" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Row>
          <Row title="Wallpaper">
            <div className="flex gap-1.5">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => set({ wallpaper: w.id })}
                  className={`h-8 w-12 rounded-md border-2 ${
                    s.wallpaper === w.id ? "border-white" : "border-transparent"
                  }`}
                  style={{ background: w.css }}
                  title={w.name}
                />
              ))}
            </div>
          </Row>
          <Row title="Reduce motion" desc="Calms animations across the OS">
            <Switch on={s.reduceMotion} onClick={() => set({ reduceMotion: !s.reduceMotion })} />
          </Row>
        </Section>

        <Section title="Voice">
          <Row title="Aria speaks replies" desc="Text-to-speech for spoken conversations">
            <Switch on={s.voiceEnabled} onClick={() => set({ voiceEnabled: !s.voiceEnabled })} />
          </Row>
        </Section>

        <Section title="AI Engine">
          <Row title="Brain" desc="Where your agents' intelligence comes from">
            <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
              {(
                [
                  ["simulated", "Simulated"],
                  ["local", "Local"],
                  ["backend", "Backend"],
                  ["api", "API key"],
                ] as const
              )
                .filter(([k]) => !IS_STATIC || (k !== "api" && k !== "backend"))
                .map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => set({ brain: k, useReal: k === "api" })}
                  className={`rounded-md px-2.5 py-1 text-[12px] ${
                    s.brain === k ? "bg-accent text-white" : "text-text2 hover:text-text0"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Row>
          {s.brain === "simulated" && (
            <Row
              title="Offline engine"
              desc="Deterministic agents that still use real tools (web search, code execution). No key, no cost."
            >
              <span className="text-[11px] text-good">Active</span>
            </Row>
          )}
          {s.brain === "local" && <LocalBrainPanel />}
          {s.brain === "backend" && !IS_STATIC && <BackendPanel />}
          {s.brain === "api" && !IS_STATIC && (
            <>
              <Row title="Provider">
                <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
                  {(["openai", "anthropic"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => set({ apiProvider: p })}
                      className={`rounded-md px-2.5 py-1 text-[12px] capitalize ${
                        s.apiProvider === p ? "bg-accent text-white" : "text-text2"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Row>
              <Row title="API key" desc="Stored only in this browser. Never sent to Aria's servers.">
                <input
                  type="password"
                  value={s.apiKey}
                  onChange={(e) => set({ apiKey: e.target.value })}
                  placeholder={s.apiProvider === "anthropic" ? "sk-ant-…" : "sk-…"}
                  className="w-48 rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent"
                />
              </Row>
              <Row title="Model" desc="Optional — leave blank for a sensible default">
                <input
                  value={s.apiModel}
                  onChange={(e) => set({ apiModel: e.target.value })}
                  placeholder={s.apiProvider === "anthropic" ? "claude-3-5-haiku-latest" : "gpt-4o-mini"}
                  className="w-48 rounded-lg border border-line bg-black/30 px-2.5 py-1.5 text-[12px] text-text0 outline-none focus:border-accent"
                />
              </Row>
            </>
          )}
        </Section>

        <Section title="Agents">
          <AgentsPanel />
        </Section>

        <Section title="Context">
          <ContextPanel />
        </Section>

        <Section title="Danger zone">
          <Row title="Clear missions & files" desc="Wipes this session's agent data">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-bad/40 px-3 py-1.5 text-[12px] text-bad hover:bg-bad/10"
            >
              <Icon name="Trash2" size={13} /> Reset
            </button>
          </Row>
          <Row title="Reboot Aria">
            <button
              onClick={() => useOS.getState().setBooted(false)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] text-text1 hover:bg-white/5"
            >
              <Icon name="RotateCcw" size={13} /> Reboot
            </button>
          </Row>
        </Section>

        <p className="px-1 pb-2 text-center text-[11px] text-text3">
          Aria is open source · built with Next.js, React & Tailwind
        </p>
      </div>
    </div>
  );
}
