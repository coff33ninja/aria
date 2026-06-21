import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  backendUrl: string;
  model?: string;
  system: string;
  prompt: string;
  history?: Msg[];
  stream?: boolean;
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

  const { backendUrl, system, prompt, stream } = body;
  const history = (body.history || []).slice(-10);

  if (!backendUrl) {
    return NextResponse.json({ error: "Missing backend URL" }, { status: 400 });
  }

  const model = body.model || "llama3.2";

  try {
    const r = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: prompt },
        ],
        stream: stream ?? false,
      }),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error || `Ollama error (${r.status})` },
        { status: r.status },
      );
    }

    if (stream) {
      const reader = r.body?.getReader();
      if (!reader) {
        return NextResponse.json({ error: "No response body" }, { status: 502 });
      }

      const encoder = new TextEncoder();
      const resStream = new ReadableStream({
        async start(controller) {
          try {
            let buf = "";
            const dec = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() || "";
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const chunk = JSON.parse(line);
                  if (chunk.done) {
                    controller.enqueue(encoder.encode("DONE\n"));
                  } else if (chunk.message?.content) {
                    controller.enqueue(encoder.encode(JSON.stringify({ token: chunk.message.content }) + "\n"));
                  }
                } catch {
                  // skip malformed
                }
              }
            }
          } finally {
            reader.releaseLock();
            controller.close();
          }
        },
      });

      return new Response(resStream, {
        headers: { "content-type": "application/x-ndjson" },
      });
    }

    const data = await r.json();
    const text = data?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Cannot reach backend at ${backendUrl}. Is Ollama running?\n\n${e.message}`
            : "Backend error",
      },
      { status: 502 },
    );
  }
}
