import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Same-origin image proxy. Generating images cross-origin gets blocked by the
 * browser (ORB), so we fetch the image server-side and stream it back. Keyless
 * by default (Pollinations); the bytes are served from our own origin.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = (searchParams.get("prompt") || "").slice(0, 300);
  const seed = searchParams.get("seed") || "1";
  const w = searchParams.get("w") || "512";
  const h = searchParams.get("h") || "512";
  if (!prompt) return new Response("missing prompt", { status: 400 });

  // model=turbo is the fast generator — keeps interactive latency low
  const upstream = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${w}&height=${h}&nologo=true&model=turbo&seed=${seed}`;

  try {
    const r = await fetch(upstream, { headers: { accept: "image/*" } });
    if (!r.ok) return new Response("upstream error", { status: 502 });
    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: {
        "content-type": r.headers.get("content-type") || "image/jpeg",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("fetch failed", { status: 502 });
  }
}
