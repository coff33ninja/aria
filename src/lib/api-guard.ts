import { requireAuth } from "./api-auth";
import { rateLimit } from "./rate-limit";

export function guard(request: Request): Response | null {
  let res = requireAuth(request);
  if (res) return res;
  res = rateLimit(request);
  if (res) return res;
  return null;
}
