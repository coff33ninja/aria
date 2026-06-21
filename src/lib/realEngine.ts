export interface ApiConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model?: string;
}

export interface HistoryMsg {
  role: "user" | "assistant";
  content: string;
}

/** Call a real LLM through Aria's BYO-key proxy. Throws on failure. */
export async function callReal(
  cfg: ApiConfig,
  system: string,
  prompt: string,
  history: HistoryMsg[] = [],
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...cfg, system, prompt, history }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return (data?.text as string) || "";
}

/** Stream a real LLM response token-by-token through Aria's BYO-key proxy. */
export async function callRealStream(
  cfg: ApiConfig,
  system: string,
  prompt: string,
  onToken: (token: string) => void,
  history: HistoryMsg[] = [],
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...cfg, system, prompt, history, stream: true }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Request failed");
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
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed === "data: [DONE]") return;
      if (!trimmed.startsWith("data: ")) continue;
      try {
        const chunk = JSON.parse(trimmed.slice(6));
        if (chunk.token) onToken(chunk.token);
      } catch { /* skip malformed */ }
    }
  }
}
