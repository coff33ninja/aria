import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { backendEmbeddingsSchema } from "@/lib/api-schemas";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;

  const parsed = backendEmbeddingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { prompt, backendUrl, model: modelOpt } = parsed.data;
  const model = modelOpt || "llama3.2";
  try {
    const r = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/embeddings`, {
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
