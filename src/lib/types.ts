/** Core domain types for Aria's multi-agent OS. */

export type AgentId =
  | "atlas"
  | "sage"
  | "forge"
  | "quill"
  | "iris"
  | "ledger"
  | "echo";

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  blurb: string;
  /** lucide-react icon name */
  icon: string;
  color: string;
  specialties: string[];
  /** system prompt used in BYO-key (real LLM) mode */
  system: string;
}

export type SubtaskStatus = "queued" | "running" | "done" | "failed";

export interface Subtask {
  id: string;
  agentId: AgentId;
  title: string;
  status: SubtaskStatus;
  output: string;
  /** ids of subtasks that must finish before this one runs */
  deps: string[];
  startedAt?: number;
  finishedAt?: number;
}

export type MissionStatus = "planning" | "running" | "done" | "failed";

export interface Mission {
  id: string;
  title: string;
  prompt: string;
  status: MissionStatus;
  createdAt: number;
  subtasks: Subtask[];
  result: string;
  /** how this mission was executed */
  engine: "sim" | "real" | "local";
}

export interface AgentMessage {
  id: string;
  from: AgentId | "system";
  to?: AgentId;
  text: string;
  ts: number;
}

export type ChatRole = "user" | "aria";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
  streaming?: boolean;
  /** if this message kicked off a mission, link it */
  missionId?: string;
}

export interface FileDoc {
  id: string;
  name: string;
  kind: "md" | "code" | "data" | "note";
  content: string;
  createdBy: AgentId | "you";
  missionId?: string;
  ts: number;
}
