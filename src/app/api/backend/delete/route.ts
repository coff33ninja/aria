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
