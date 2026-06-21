import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;

  let body: { model?: string; prompt: string; backendUrl: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { prompt, backendUrl } = body;
  if (!prompt || !backendUrl) {
    return NextResponse.json({ error: "Missing prompt or backendUrl" }, { status: 400 });
  }
  const model = body.model || "llama3.2";
  try {
    const r = await fetch(`${backendUrl.replace(/\/$/, "")}/api/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, prompt }),
    });
    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error || "Embedding request failed" },
        { status: r.status },
      );
    }
    return NextResponse.json({ embedding: data?.embedding || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upstream error" },
      { status: 502 },
    );
  }
}
