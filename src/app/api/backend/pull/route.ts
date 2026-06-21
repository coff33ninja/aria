import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { backendPullDeleteSchema } from "@/lib/api-schemas";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;

  const parsed = backendPullDeleteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { backendUrl, model } = parsed.data;

  try {
    const r = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/pull`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: model, stream: true }),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error || `Ollama pull error (${r.status})` },
        { status: r.status },
      );
    }

    const reader = r.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "No response body" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = new TextDecoder().decode(value).split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const chunk = JSON.parse(line);
                if (chunk.status) {
                  controller.enqueue(encoder.encode(JSON.stringify({ status: chunk.status }) + "\n"));
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "content-type": "application/x-ndjson" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Cannot reach backend at ${backendUrl}. Is Ollama running?\n\n${e.message}`
            : "Pull failed",
      },
      { status: 502 },
    );
  }
}
