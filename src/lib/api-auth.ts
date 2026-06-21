const API_KEY = process.env.ARIA_API_KEY;

export function requireAuth(request: Request): Response | null {
  if (!API_KEY) return null;
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ") || header.slice(7) !== API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}
