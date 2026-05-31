# Aria — Architecture

Aria is a browser-native, multi-agent **AI operating system**. This document describes how
the pieces fit together. The guiding principle is a clean separation between **the brain**
(where intelligence comes from), **the tools** (what agents can actually do), **the runtime**
(how a mission is orchestrated), and **the OS shell** (how you see and drive it).

```
┌──────────────────────────────────────────────────────────────┐
│                        OS Shell (React)                        │
│   Desktop · Window Manager · Dock · Spotlight · Voice · Apps    │
└───────────────▲───────────────────────────────┬──────────────┘
                │ subscribes to events           │ dispatches missions
                │                                 ▼
┌───────────────┴───────────────────────────────────────────────┐
│                       Runtime (orchestrator)                    │
│   plan → schedule subtasks → run agent loops → synthesize        │
│   emits a typed event stream (agent.start, tool.call, token…)    │
└───────┬──────────────────────────────┬────────────────────────┘
        │ uses                          │ uses
        ▼                               ▼
┌───────────────┐               ┌────────────────────────────────┐
│     Brains     │               │            Tools                │
│  (LLM source)  │               │  (real capabilities)            │
│  • Simulated   │               │  • web_search   • run_python    │
│  • API (BYO)   │               │  • write_file   • run_js        │
│  • Local/WebGPU │               │  • generate_image               │
└───────────────┘               └────────────────────────────────┘
```

## 1. Brains — where intelligence comes from

Every source of intelligence implements one interface, so the rest of the system never knows
or cares which is in use:

```ts
interface Brain {
  id: "simulated" | "api" | "local";
  label: string;
  available(): boolean;                 // can it run right now?
  complete(req: CompletionRequest): Promise<CompletionResult>;
}
```

- **SimulatedBrain** — deterministic, offline, zero-cost. Powers the instant-clone demo and the
  fallback when nothing else is available. It still calls real tools, so even "simulated"
  missions produce real artifacts.
- **ApiBrain** — bring-your-own-key OpenAI / Anthropic, proxied through `/api/chat` so the key
  is forwarded per-request and never persisted server-side.
- **LocalBrain** — a real small LLM (Qwen / Llama) running in-browser via **WebGPU / WebLLM**.
  No server, no key, fully private. Downloaded on demand with progress.

The brain is selected by capability + user preference; `available()` drives graceful fallback
(`local → api → simulated`).

## 2. Tools — what agents can actually do

A tool is a typed, self-describing capability. Brains that support function-calling invoke them
natively; the simulated brain invokes them deterministically. Either way the *effect is real*.

```ts
interface Tool<A = unknown> {
  name: string;
  description: string;
  parameters: JSONSchema;               // validated before run
  run(args: A, ctx: ToolContext): Promise<ToolResult>;
}
```

Shipping / planned tools:

| Tool | Real effect | Backend |
|---|---|---|
| `web_search` | Fetches live facts | `/api/search` — keyless (DuckDuckGo IA + Wikipedia), pluggable to Tavily/Brave |
| `write_file` | Saves a real, downloadable artifact | In-OS virtual FS (Files app) |
| `run_python` | Executes Python, returns real output | Pyodide (WASM), in-browser |
| `run_js` | Executes JS in a sandbox | QuickJS / Worker |
| `generate_image` | Produces a real image | BYO-key image API |

## 3. Runtime — orchestrating a mission

The runtime is brain- and tool-agnostic. Given a goal it:

1. **Plans** — the orchestrator (Atlas) decomposes the goal into a dependency-aware subtask graph.
2. **Schedules** — independent subtasks run in parallel; dependents wait.
3. **Runs agent loops** — each agent runs a ReAct-style loop: think → (optionally) call tools →
   observe results → repeat → final answer.
4. **Synthesizes** — results are stitched into a final deliverable and saved to Files.

Throughout, it emits a **typed event stream**:

```ts
type RuntimeEvent =
  | { type: "mission.start"; missionId; plan }
  | { type: "agent.start"; agentId; subtaskId }
  | { type: "token"; subtaskId; text }
  | { type: "tool.call"; agentId; tool; args }
  | { type: "tool.result"; agentId; tool; result }
  | { type: "agent.done"; agentId; subtaskId; output }
  | { type: "mission.done"; missionId; result };
```

The UI never reaches into engine internals — it only subscribes to this stream. That decoupling
is what makes the live agent-graph visualization (Phase 4) and mission replay possible.

## 4. OS shell — how you see and drive it

A React desktop environment with a window manager, dock, Spotlight, voice, and seven apps.
State lives in two Zustand stores: `useOS` (windows, dock, settings) and `useAria` (chat,
missions, files, memory). Both persist the right slices to `localStorage`. The shell is a pure
*consumer* of the runtime's event stream.

## Design decisions (ADRs live in `docs/adr/`)

- **Brain-agnostic from day one** — agents are written once and run on simulated, API, or local
  models unchanged. This is the core architectural bet.
- **Real effects even in simulated mode** — tools do real work regardless of brain, so the
  project is never "just theater."
- **Local-first & private by default** — nothing leaves the browser unless you opt into a
  hosted model with your own key; the UI always shows which.
- **Event-sourced UI** — the shell renders an event stream, not engine state, enabling
  visualization and replay.

## Roadmap

| Phase | Scope |
|---|---|
| 1 | Brain + Tool framework · real web search · real artifacts |
| 2 | In-browser local LLM (WebGPU) |
| 3 | Live code execution (Python / JS) |
| 4 | Agent-graph visualization + mission replay |
| 5 | Tests + CI + docs + live demo + landing |
