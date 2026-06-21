import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { validateUrl } from "@/lib/validate-url";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const backendUrl = req.nextUrl.searchParams.get("url");
  if (!backendUrl) {
    return NextResponse.json({ error: "Missing backend URL" }, { status: 400 });
  }
  const urlErr = validateUrl(backendUrl);
  if (urlErr) return NextResponse.json({ error: urlErr }, { status: 400 });

  try {
    const r = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/tags`);
    if (!r.ok) {
      return NextResponse.json(
        { error: `Ollama error (${r.status})` },
        { status: r.status },
      );
    }
    const data = await r.json();
    const models = (data?.models || []).map((m: { name: string; size?: number }) => ({
      name: m.name,
      size: m.size,
    }));
    return NextResponse.json({ models });
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
