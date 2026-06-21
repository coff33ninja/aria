interface Bucket {
  count: number;
  reset: number;
}

const store = new Map<string, Bucket>();

const MAX = Math.max(1, parseInt(process.env.RATE_LIMIT_MAX || "", 10) || 60);
const WINDOW = Math.max(1000, parseInt(process.env.RATE_LIMIT_WINDOW_MS || "", 10) || 60000);

// Periodic cleanup to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store) {
      if (bucket.reset <= now) store.delete(key);
    }
  }, WINDOW * 2).unref?.();
}

function ipKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(request: Request): Response | null {
  const key = ipKey(request);
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + WINDOW };
    store.set(key, bucket);
  }

  bucket.count++;

  if (bucket.count > MAX) {
    const retryAfter = Math.ceil((bucket.reset - now) / 1000);
    return new Response(JSON.stringify({ error: "Too Many Requests" }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
        "x-ratelimit-limit": String(MAX),
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(bucket.reset),
      },
    });
  }

  return null;
}
