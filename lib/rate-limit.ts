// Simple in-memory sliding-window rate limiter.
// Note: state is per-process; in a serverless environment each cold-start
// gets a fresh store. This still prevents burst abuse within a single
// invocation and provides adequate protection for a low-traffic app.

const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request should be allowed, false if it should be blocked.
 * @param key     - Unique identifier (e.g. "guest:1.2.3.4")
 * @param limit   - Max requests allowed in the window
 * @param windowMs - Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
