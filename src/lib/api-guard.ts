import { requireAuth } from "./api-auth";
import { rateLimit } from "./rate-limit";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://sumanthkm.com",
  "https://www.sumanthkm.com",
];

function checkOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const url = origin || referer;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (ALLOWED_ORIGINS.some((o) => new URL(o).origin === parsed.origin)) return null;
  } catch {
    // unparseable — deny
  }
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export function guard(request: Request): Response | null {
  let res = checkOrigin(request);
  if (res) return res;
  res = requireAuth(request);
  if (res) return res;
  res = rateLimit(request);
  if (res) return res;
  return null;
}
