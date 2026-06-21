export interface BackendConfig {
  backendUrl: string;
  model?: string;
}

export interface HistoryMsg {
  role: "user" | "assistant";
  content: string;
}

export interface BackendModel {
  name: string;
  size?: number;
}

export async function fetchModels(backendUrl: string): Promise<BackendModel[]> {
  const res = await fetch(`/api/backend/models?url=${encodeURIComponent(backendUrl)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch models");
  return data?.models || [];
}

export async function pullModel(
  backendUrl: string,
  model: string,
  onStatus?: (status: string) => void,
): Promise<void> {
  const res = await fetch("/api/backend/pull", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ backendUrl, model }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Pull failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const chunk = JSON.parse(line);
        onStatus?.(chunk.status || "");
      } catch {
        // skip
      }
    }
  }
}

export async function callBackend(
  cfg: BackendConfig,
  system: string,
  prompt: string,
  history: HistoryMsg[] = [],
): Promise<string> {
  const res = await fetch("/api/backend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...cfg, system, prompt, history, stream: false }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Backend request failed");
  return (data?.text as string) || "";
}

export async function callBackendStream(
  cfg: BackendConfig,
  system: string,
  prompt: string,
  onToken: (token: string) => void,
  history: HistoryMsg[] = [],
): Promise<void> {
  const res = await fetch("/api/backend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...cfg, system, prompt, history, stream: true }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Backend request failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      if (line === "DONE") return;
      try {
        const chunk = JSON.parse(line);
        if (chunk.token) onToken(chunk.token);
      } catch {
        // skip
      }
    }
  }
}

export async function deleteModel(
  backendUrl: string,
  model: string,
): Promise<void> {
  const res = await fetch("/api/backend/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ backendUrl, model }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Delete failed");
  }
}
