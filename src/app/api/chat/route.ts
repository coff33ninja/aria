import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";

export const runtime = "edge";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  provider: "openai" | "anthropic";
  apiKey: string;
  model?: string;
  system: string;
  prompt: string;
  history?: Msg[];
  stream?: boolean;
}

function sse(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${data}\n\n`);
}

async function streamOpenAI(body: Body): Promise<Response> {
  const model = body.model || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${body.apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: body.system },
        ...(body.history || []),
        { role: "user", content: body.prompt },
      ],
    }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(
      { error: data?.error?.message || "OpenAI error" },
      { status: r.status },
    );
  }
  const reader = r.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const json = trimmed.slice(6);
          if (json === "[DONE]") continue;
          try {
            const chunk = JSON.parse(json);
            const token = chunk?.choices?.[0]?.delta?.content || "";
            if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          } catch { /* skip malformed */ }
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}

async function streamAnthropic(body: Body): Promise<Response> {
  const model = body.model || "claude-3-5-haiku-latest";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": body.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: body.system,
      stream: true,
      messages: [...(body.history || []), { role: "user", content: body.prompt }],
    }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(
      { error: data?.error?.message || "Anthropic error" },
      { status: r.status },
    );
  }
  const reader = r.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const json = trimmed.slice(6);
          try {
            const chunk = JSON.parse(json);
            if (chunk?.type === "content_block_delta") {
              const token = chunk?.delta?.text || "";
              if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            }
          } catch { /* skip malformed */ }
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { provider, apiKey, system, prompt, stream } = body;
  const history = (body.history || []).slice(-10);
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 400 });
  }

  try {
    if (stream) {
      return provider === "anthropic" ? streamAnthropic({ ...body, history }) : streamOpenAI({ ...body, history });
    }

    if (provider === "anthropic") {
      const model = body.model || "claude-3-5-haiku-latest";
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system,
          messages: [...history, { role: "user", content: prompt }],
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        return NextResponse.json(
          { error: data?.error?.message || "Anthropic error" },
          { status: r.status },
        );
      }
      const text =
        data?.content?.map((c: { text?: string }) => c.text || "").join("") ||
        "";
      return NextResponse.json({ text });
    }

    // default: OpenAI
    const model = body.model || "gpt-4o-mini";
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: prompt },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI error" },
        { status: r.status },
      );
    }
    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upstream error" },
      { status: 502 },
    );
  }
}
