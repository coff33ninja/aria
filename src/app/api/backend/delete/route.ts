import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;

  let body: { backendUrl: string; model: string };
  try {
    body = (await req.json()) as { backendUrl: string; model: string };
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { backendUrl, model } = body;
  if (!backendUrl || !model) {
    return NextResponse.json(
      { error: "Missing backendUrl or model" },
      { status: 400 },
    );
  }

  try {
    const r = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/delete`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: model }),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error || `Ollama delete error (${r.status})` },
        { status: r.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Cannot reach backend at ${backendUrl}\n\n${e.message}`
            : "Delete failed",
      },
      { status: 502 },
    );
  }
}
