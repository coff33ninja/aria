/**
 * Core runtime contracts. Everything in Aria's engine is written against these
 * interfaces so the brain (intelligence source) and tools (capabilities) can be
 * swapped without touching the orchestrator or the UI.
 */
import type { AgentId } from "@/lib/types";

/* ───────────────────────────── Brains ───────────────────────────── */

export interface CompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  system: string;
  messages: CompletionMessage[];
  /** tool schemas the brain may call, if it supports function-calling */
  tools?: ToolSpec[];
  maxTokens?: number;
}

export interface CompletionResult {
  text: string;
  /** tool calls the brain wants to make, if any */
  toolCalls?: { name: string; args: Record<string, unknown> }[];
}

export interface Brain {
  id: "simulated" | "api" | "local";
  label: string;
  /** can this brain run in the current environment right now? */
  available(): boolean;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

/* ───────────────────────────── Tools ───────────────────────────── */

export interface ToolSpec {
  name: string;
  description: string;
  /** minimal JSON-schema-ish parameter description */
  parameters: Record<string, { type: string; description: string }>;
}

export interface ToolResult {
  ok: boolean;
  /** short human summary shown in the activity bus */
  summary: string;
  /** structured payload for downstream use */
  data?: unknown;
}

export interface ToolContext {
  agentId: AgentId;
  missionPrompt: string;
}

export interface Tool<A = Record<string, unknown>> extends ToolSpec {
  run(args: A, ctx: ToolContext): Promise<ToolResult>;
}

/* ───────────────────────────── Events ───────────────────────────── */

export type RuntimeEvent =
  | { type: "tool.call"; agentId: AgentId; tool: string; args: Record<string, unknown> }
  | { type: "tool.result"; agentId: AgentId; tool: string; result: ToolResult };

/* ───────────────────────────── Search ───────────────────────────── */

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}
