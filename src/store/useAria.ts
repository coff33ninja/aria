"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  AgentId,
  AgentMessage,
  ChatMessage,
  FileDoc,
  FolderDoc,
  Mission,
  Subtask,
} from "@/lib/types";
import { getAgent } from "@/lib/agents";
import {
  extractName,
  isMission,
  planMission,
  simulateOutput,
  smallTalk,
  synthesize,
} from "@/lib/simEngine";
import { callReal, callRealStream } from "@/lib/realEngine";
import { searchWeb, formatResearch, generateImageUrl } from "@/lib/runtime/tools";
import { runJs } from "@/lib/runtime/exec";
import { runCustomTool } from "@/lib/runtime/customTools";
import { localComplete, localReady } from "@/lib/runtime/localBrain";
import { callBackend, callBackendStream, generateEmbedding } from "@/lib/runtime/backendBrain";
import { memoryStore, type MemoryEntry } from "@/lib/runtime/memoryStore";
import { useOS, type Settings } from "./useOS";
import { speak } from "@/lib/voice";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Turn = { role: "user" | "assistant"; content: string };

/**
 * Brain-agnostic completion. Tries the selected real brain (local in-browser
 * model, or BYO-key API); returns null to signal "fall back to the simulated
 * engine". Agents are written once and run on whichever brain is active.
 */
async function think(
  settings: Settings,
  system: string,
  prompt: string,
  history: Turn[] = [],
): Promise<string | null> {
  system = withContext(system); // sync context docs (no memory search in mission runner)
  if (settings.brain === "local" && localReady(settings.localModel)) {
    try {
      return await localComplete(system, prompt, history);
    } catch {
      return null;
    }
  }
  if (settings.brain === "api" && settings.apiKey) {
    try {
      return await callReal(
        {
          provider: settings.apiProvider,
          apiKey: settings.apiKey,
          model: settings.apiModel || undefined,
        },
        system,
        prompt,
        history,
      );
    } catch {
      return null;
    }
  }
  if (settings.brain === "backend") {
    try {
      return await callBackend(
        { backendUrl: settings.backendUrl, model: settings.backendModel || undefined },
        system,
        prompt,
        history,
      );
    } catch {
      return null;
    }
  }
  return null;
}

/** Append context docs to a system prompt (sync, used in mission runner). */
function withContext(system: string): string {
  const docs = useAria.getState().contextDocs;
  if (!docs.length) return system;
  const ctx = docs.map((d) => `[${d.title}]\n${d.content}`).join("\n\n");
  return `${system}\n\nReference context you must use:\n${ctx}`;
}

/** Cosine similarity between two vectors. */
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/** Search memory entries for the top-k most relevant to a query embedding. */
function searchMemories(
  entries: MemoryEntry[],
  query: number[],
  k = 3,
  threshold = 0.35,
): MemoryEntry[] {
  const scored = entries.map((e) => ({ entry: e, score: cosine(query, e.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score >= threshold).slice(0, k).map((s) => s.entry);
}

/** Append context docs and relevant memories to a system prompt. */
async function withMemory(system: string, query: string): Promise<string> {
  let enriched = withContext(system);
  const entries = useAria.getState().memoryEntries;
  if (entries.length > 0) {
    const os = useOS.getState();
    if (os.settings.brain === "backend" && os.settings.backendUrl) {
      try {
        const embedding = await generateEmbedding(os.settings.backendUrl, query.slice(0, 256));
        const relevant = searchMemories(entries, embedding);
        if (relevant.length) {
          enriched += `\n\nRelevant memories from past conversations:\n${relevant.map((m) => `- ${m.text}`).join("\n")}`;
        }
      } catch { /* memory search unavailable */ }
    }
  }
  return enriched;
}

/** Stream `full` out in small chunks, calling onChunk with the text-so-far. */
async function typeStream(
  full: string,
  onChunk: (soFar: string) => void,
  charsPer = 5,
  delay = 14,
) {
  let i = 0;
  while (i < full.length) {
    i = Math.min(full.length, i + charsPer);
    onChunk(full.slice(0, i));
    await sleep(delay);
  }
}

const FILE_FOR: Partial<Record<AgentId, { kind: FileDoc["kind"]; name: string }>> = {
  sage: { kind: "md", name: "research.md" },
  forge: { kind: "code", name: "solution.ts" },
  quill: { kind: "md", name: "draft.md" },
  iris: { kind: "note", name: "design-notes.md" },
  ledger: { kind: "data", name: "analysis.md" },
};

export interface ContextDoc {
  id: string;
  title: string;
  content: string;
}

interface AriaState {
  chat: ChatMessage[];
  missions: Mission[];
  files: FileDoc[];
  folders: FolderDoc[];
  bus: AgentMessage[];
  agentStatus: Record<AgentId, "idle" | "working" | "done">;
  activeMissionId: string | null;
  tokens: number;
  busy: boolean;
  memory: { name?: string };
  contextDocs: ContextDoc[];
  memoryEntries: MemoryEntry[];

  sendChat: (text: string, spoken?: boolean) => Promise<void>;
  runMission: (prompt: string) => Promise<string>;
  clearChat: () => void;
  removeFile: (id: string) => void;
  addNote: (name: string, content: string) => string;
  updateFile: (id: string, patch: { name?: string; content?: string }) => void;
  addFile: (file: Omit<FileDoc, "id" | "ts">) => string;
  addFolder: (name: string, parentId?: string) => string;
  removeFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  moveFileToFolder: (fileId: string, folderId?: string) => void;
  addContextDoc: (title: string, content: string) => void;
  removeContextDoc: (id: string) => void;
  embedAndStore: (text: string, source: MemoryEntry["source"]) => Promise<void>;
  reset: () => void;
}

const idleStatus = (): Record<AgentId, "idle" | "working" | "done"> => ({
  atlas: "idle",
  sage: "idle",
  forge: "idle",
  quill: "idle",
  iris: "idle",
  ledger: "idle",
  echo: "idle",
});

export const useAria = create<AriaState>()(
  persist(
    (set, get) => ({
      chat: [
        {
          id: "welcome",
          role: "aria",
          text: "Hi, I'm Aria — your AI operating system. Give me a goal and I'll put my team of seven agents on it. Try “research the best mechanical keyboards” or “build me a pricing page”.",
          ts: Date.now(),
        },
      ],
      missions: [],
      files: [],
      folders: [],
      bus: [],
      agentStatus: idleStatus(),
      activeMissionId: null,
      tokens: 0,
      busy: false,
      memory: {},
      contextDocs: [],
      memoryEntries: [],

      clearChat: () =>
        set({
          chat: [
            {
              id: nanoid(8),
              role: "aria",
              text: "Fresh start. What are we building?",
              ts: Date.now(),
            },
          ],
        }),

      removeFile: (id) =>
        set((s) => ({ files: s.files.filter((f) => f.id !== id) })),

      addNote: (name, content) => {
        const id = nanoid(8);
        set((s) => ({
          files: [
            {
              id,
              name,
              kind: "note",
              content,
              createdBy: "you",
              ts: Date.now(),
            },
            ...s.files,
          ],
        }));
        return id;
      },

      updateFile: (id, patch) =>
        set((s) => ({
          files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),

      addFile: (file) => {
        const id = nanoid(8);
        set((s) => ({
          files: [{ ...file, id, ts: Date.now() } as FileDoc, ...s.files],
        }));
        return id;
      },

      addFolder: (name, parentId) => {
        const id = nanoid(8);
        set((s) => ({
          folders: [...s.folders, { id, name, parentId, createdAt: Date.now() }],
        }));
        return id;
      },

      removeFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          files: s.files.map((f) => (f.folderId === id ? { ...f, folderId: undefined } : f)),
        })),

      renameFolder: (id, name) =>
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),

      moveFileToFolder: (fileId, folderId) =>
        set((s) => ({
          files: s.files.map((f) => (f.id === fileId ? { ...f, folderId } : f)),
        })),

      addContextDoc: (title, content) =>
        set((s) => ({
          contextDocs: [...s.contextDocs, { id: nanoid(8), title, content }],
        })),

      removeContextDoc: (id) =>
        set((s) => ({
          contextDocs: s.contextDocs.filter((d) => d.id !== id),
        })),

      embedAndStore: async (text, source) => {
        const os = useOS.getState();
        if (os.settings.brain !== "backend" || !os.settings.backendUrl) return;
        try {
          const embedding = await generateEmbedding(os.settings.backendUrl, text.slice(0, 512));
          const entry: MemoryEntry = {
            id: nanoid(8),
            text: text.slice(0, 512),
            embedding,
            source,
            ts: Date.now(),
          };
          memoryStore.add(entry);
          set((s) => ({ memoryEntries: [...s.memoryEntries, entry] }));
        } catch {
          // embedding failed silently
        }
      },

      reset: () =>
        set({
          missions: [],
          files: [],
          folders: [],
          bus: [],
          agentStatus: idleStatus(),
          activeMissionId: null,
          tokens: 0,
          contextDocs: [],
          memoryEntries: [],
        }),

      sendChat: async (text, spoken = false) => {
        const trimmed = text.trim();
        if (!trimmed || get().busy) return;
        const os = useOS.getState();

        // lightweight memory: remember a name the user shares
        const captured = extractName(trimmed);
        if (captured) set((s) => ({ memory: { ...s.memory, name: captured } }));

        const userMsg: ChatMessage = {
          id: nanoid(8),
          role: "user",
          text: trimmed,
          ts: Date.now(),
        };
        const ariaMsg: ChatMessage = {
          id: nanoid(8),
          role: "aria",
          text: "",
          ts: Date.now() + 1,
          streaming: true,
        };
        set((s) => ({ chat: [...s.chat, userMsg, ariaMsg], busy: true }));

        const patchAria = (txt: string) =>
          set((s) => ({
            chat: s.chat.map((m) =>
              m.id === ariaMsg.id ? { ...m, text: txt } : m,
            ),
          }));
        const finishAria = (missionId?: string) =>
          set((s) => ({
            chat: s.chat.map((m) =>
              m.id === ariaMsg.id
                ? { ...m, streaming: false, missionId }
                : m,
            ),
          }));

        if (isMission(trimmed)) {
          const ack =
            "On it — briefing the team now. Open the **Agents** app to watch them work. I'll report back when it's done.";
          await typeStream(ack, patchAria);
          finishAria();
          os.openApp("agents");
          if (spoken && os.settings.voiceEnabled) speak(ack);

          const result = await get().runMission(trimmed);

          // Aria reports the synthesis as a follow-up message.
          const followId = nanoid(8);
          set((s) => ({
            chat: [
              ...s.chat,
              {
                id: followId,
                role: "aria",
                text: "",
                ts: Date.now(),
                streaming: true,
              },
            ],
          }));
          await typeStream(result, (txt) =>
            set((s) => ({
              chat: s.chat.map((m) =>
                m.id === followId ? { ...m, text: txt } : m,
              ),
            })),
          );
          set((s) => ({
            chat: s.chat.map((m) =>
              m.id === followId ? { ...m, streaming: false } : m,
            ),
            busy: false,
          }));
          if (spoken && os.settings.voiceEnabled) speak(result);
          return;
        }

        // plain conversational reply — now with memory + context
        const ctx = {
          name: get().memory.name,
          lastMissionTitle: get().missions[0]?.title,
          missionsCount: get().missions.length,
          filesCount: get().files.length,
        };
        const history = get()
          .chat.filter(
            (m) => m.id !== ariaMsg.id && m.id !== userMsg.id && !!m.text,
          )
          .slice(-8)
          .map((m) => ({
            role: (m.role === "user" ? "user" : "assistant") as
              | "user"
              | "assistant",
            content: m.text,
          }));

        if (os.settings.brain === "backend" || (os.settings.brain === "api" && os.settings.apiKey)) {
          try {
            const streamSys = await withMemory(`You are Aria, a warm, concise AI operating system assistant with a team of agents. Reply in 1-3 sentences.${ctx.name ? ` The user's name is ${ctx.name}.` : ""}`, trimmed);
            if (os.settings.brain === "backend") {
              await callBackendStream(
                { backendUrl: os.settings.backendUrl, model: os.settings.backendModel || undefined },
                streamSys,
                trimmed,
                (token) => patchAria(get().chat.find((m) => m.id === ariaMsg.id)?.text + token || token),
                history,
              );
            } else {
              await callRealStream(
                { provider: os.settings.apiProvider, apiKey: os.settings.apiKey, model: os.settings.apiModel || undefined },
                streamSys,
                trimmed,
                (token) => patchAria(get().chat.find((m) => m.id === ariaMsg.id)?.text + token || token),
                history,
              );
            }
          } catch {
            const fallback = smallTalk(trimmed, ctx);
            await typeStream(fallback, patchAria);
          }
          finishAria();
          set({ busy: false });
          const finalText = get().chat.find((m) => m.id === ariaMsg.id)?.text || "";
          if (os.settings.brain === "backend") {
            get().embedAndStore(trimmed, "chat");
            get().embedAndStore(finalText, "chat");
          }
          if (spoken && os.settings.voiceEnabled) speak(finalText);
          return;
        }
        const sys = `You are Aria, a warm, concise AI operating system assistant with a team of agents. Reply in 1-3 sentences.${
          ctx.name ? ` The user's name is ${ctx.name}.` : ""
        }`;
        const llm = await think(os.settings, sys, trimmed, history);
        const reply = llm ?? smallTalk(trimmed, ctx);
        await typeStream(reply, patchAria);
        finishAria();
        set({ busy: false });
        get().embedAndStore(trimmed, "chat");
        get().embedAndStore(reply, "chat");
        if (spoken && os.settings.voiceEnabled) speak(reply);
      },

      runMission: async (prompt) => {
        const os = useOS.getState();
        const useLocal =
          os.settings.brain === "local" && localReady(os.settings.localModel);
        const useApi = os.settings.brain === "api" && !!os.settings.apiKey;
        const engineKind: Mission["engine"] = useLocal
          ? "local"
          : useApi
            ? "real"
            : "sim";
        const { title, subtasks } = planMission(prompt);
        const mission: Mission = {
          id: nanoid(8),
          title,
          prompt,
          status: "planning",
          createdAt: Date.now(),
          subtasks,
          result: "",
          engine: engineKind,
        };
        set((s) => ({
          missions: [mission, ...s.missions],
          activeMissionId: mission.id,
          agentStatus: idleStatus(),
        }));

        const mid = mission.id;
        const patchTask = (subId: string, patch: Partial<Subtask>) =>
          set((s) => ({
            missions: s.missions.map((m) =>
              m.id === mid
                ? {
                    ...m,
                    subtasks: m.subtasks.map((t) =>
                      t.id === subId ? { ...t, ...patch } : t,
                    ),
                  }
                : m,
            ),
          }));
        const setMission = (patch: Partial<Mission>) =>
          set((s) => ({
            missions: s.missions.map((m) =>
              m.id === mid ? { ...m, ...patch } : m,
            ),
          }));
        const post = (m: Omit<AgentMessage, "id" | "ts">) =>
          set((s) => ({
            bus: [
              ...s.bus,
              { ...m, id: nanoid(8), ts: Date.now() },
            ].slice(-200),
          }));
        const setStatus = (id: AgentId, st: "idle" | "working" | "done") =>
          set((s) => ({ agentStatus: { ...s.agentStatus, [id]: st } }));

        setMission({ status: "running" });

        const runTask = async (task: Subtask) => {
          const ag = getAgent(task.agentId, useOS.getState().settings.customAgents);
          setStatus(task.agentId, "working");
          patchTask(task.id, { status: "running", startedAt: Date.now() });
          post({ from: task.agentId, text: `Picking up: ${task.title}.` });
          await sleep(250 + Math.random() * 400);

          // Real tool use: Sage searches the live web before reasoning.
          let research = "";
          if (task.agentId === "sage") {
            post({ from: "sage", text: `🔎 web_search("${prompt.slice(0, 48)}")` });
            const { results, source } = await searchWeb(prompt);
            if (results.length) {
              research = formatResearch(prompt, results);
              post({
                from: "sage",
                text: `✓ ${results.length} live source${results.length > 1 ? "s" : ""} (${source})`,
              });
            } else {
              post({ from: "sage", text: "web_search came back empty — reasoning instead" });
            }
          }

          // Build custom tool prompt for agents.
          const customTools = useOS.getState().settings.customTools.filter((t) => t.enabled && t.name);
          const toolsPrompt = customTools.length
            ? `\n\nAvailable custom tools you can invoke:\n${customTools.map((t) => `  - ${t.name}: ${t.description || "No description"}\n    JSON params: ${t.parameters || "{}"}\n    Invoke by writing: \`${t.name}(<JSON args>)\``).join("\n")}`
            : "";

          // One brain-agnostic call; null → fall back to the simulated engine.
          let full: string;
          if (task.agentId === "sage" && research) {
            const llm = await think(
              os.settings,
              ag.system + toolsPrompt,
              `Mission: ${prompt}\n\nYou ran a web_search and got these LIVE results:\n\n${research}\n\nDeliver your subtask "${task.title}": synthesize the key findings in tight bullets and cite the sources.`,
            );
            full = llm ?? research;
          } else {
            const llm = await think(
              os.settings,
              ag.system + toolsPrompt,
              `Mission: ${prompt}\n\nYour subtask: ${task.title}\nRespond as ${ag.name} (${ag.role}).`,
            );
            full = llm ?? simulateOutput(task.agentId, prompt);
          }

          // Real tool use: Forge actually RUNS the JS it writes.
          if (task.agentId === "forge") {
            const m = full.match(/```(?:js|javascript)\n([\s\S]*?)```/);
            if (m) {
              post({ from: "forge", text: "▶ run_js(prototype)" });
              const res = await runJs(m[1]);
              full += res.ok
                ? `\n\n**▶ Live output** (${res.durationMs}ms):\n\`\`\`\n${res.output || "(no output)"}\n\`\`\``
                : `\n\n**▶ Execution failed:** ${res.error}`;
              post({
                from: "forge",
                text: res.ok ? `✓ ran in ${res.durationMs}ms` : "execution failed",
              });
            }
          }

          // Custom tool invocation: scan output for toolName(...)
          for (const ct of customTools) {
            const re = new RegExp(`\`${ct.name}\\(([^)]*)\\)\``);
            const m = full.match(re);
            if (m) {
              let args: Record<string, unknown> = {};
              try {
                args = m[1].trim() ? JSON.parse(m[1]) : {};
              } catch { /* will pass empty args */ }
              post({ from: task.agentId, text: `🛠 ${ct.name}(…)` });
              const res = await runCustomTool(ct, args, { agentId: task.agentId, missionPrompt: prompt });
              full += res.ok
                ? `\n\n**${ct.name} result:** ${res.summary}\n\`\`\`json\n${JSON.stringify(res.data)}\n\`\`\``
                : `\n\n**${ct.name} error:** ${res.summary}`;
              post({ from: task.agentId, text: res.ok ? `✓ ${ct.name} done` : `✗ ${ct.name} failed` });
            }
          }

          // Real tool use: Iris generates an actual concept image.
          if (task.agentId === "iris") {
            post({ from: "iris", text: "🎨 image_gen(concept)" });
            const imgPrompt = `${prompt.slice(0, 70)}, minimal concept art, dark`;
            const url = generateImageUrl(
              imgPrompt,
              1 + Math.floor(Math.random() * 9999),
            );
            full += `\n\n![concept](${url})`;
            set((s) => ({
              files: [
                {
                  id: nanoid(8),
                  name: "concept.jpg",
                  kind: "image",
                  content: url,
                  createdBy: "iris",
                  missionId: mid,
                  ts: Date.now(),
                },
                ...s.files,
              ],
            }));
            post({ from: "iris", text: "✓ generated concept image" });
          }

          await typeStream(
            full,
            (txt) => patchTask(task.id, { output: txt }),
            6,
            12,
          );
          patchTask(task.id, { status: "done", finishedAt: Date.now() });
          setStatus(task.agentId, "done");
          set((s) => ({ tokens: s.tokens + Math.ceil(full.length / 4) }));
          post({ from: task.agentId, text: `Finished: ${task.title}.` });

          // save artifact files for the building agents
          const fileSpec = FILE_FOR[task.agentId];
          if (fileSpec) {
            set((s) => ({
              files: [
                {
                  id: nanoid(8),
                  name: fileSpec.name,
                  kind: fileSpec.kind,
                  content: full,
                  createdBy: task.agentId,
                  missionId: mid,
                  ts: Date.now(),
                },
                ...s.files,
              ],
            }));
          }
        };

        // 1. Atlas plans first.
        const atlas = subtasks.find((t) => t.agentId === "atlas")!;
        await runTask(atlas);

        // 2. Core specialists work in parallel.
        const core = subtasks.filter(
          (t) => t.agentId !== "atlas" && t.agentId !== "echo",
        );
        await Promise.all(core.map(runTask));

        // 3. Echo reviews last.
        const echo = subtasks.find((t) => t.agentId === "echo");
        if (echo) await runTask(echo);

        const result = synthesize(prompt);
        setMission({ status: "done", result });
        set({ activeMissionId: null });

        // save the synthesis + reset agent badges shortly after
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        set((s) => ({
          files: [
            {
              id: nanoid(8),
              name: `${slug || "mission"}.md`,
              kind: "md",
              content: `# ${title}\n\n${result}\n\n---\n\n${subtasks
                .map((t) => `## ${getAgent(t.agentId, useOS.getState().settings.customAgents).name} — ${t.title}\n\n${t.output}`)
                .join("\n\n")}`,
              createdBy: "atlas",
              missionId: mid,
              ts: Date.now(),
            },
            ...s.files,
          ],
        }));

        useOS.getState().notify({
          title: "Mission complete",
          body: title,
          icon: "Sparkles",
          color: "#7c6cff",
        });

        get().embedAndStore(`Mission: ${title}\n${result}`, "mission");
        return result;
      },
    }),
    {
      name: "aria-data",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        chat: s.chat,
        files: s.files,
        folders: s.folders,
        missions: s.missions,
        memory: s.memory,
        contextDocs: s.contextDocs,
        memoryEntries: s.memoryEntries,
      }),
    },
  ),
);
