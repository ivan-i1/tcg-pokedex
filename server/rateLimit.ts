/**
 * Per-client fixed-window rate limit, in memory (one API process). Pure: the clock is
 * injectable for tests.
 */
export type RateDecision = { ok: true } | { ok: false; retryAfterSeconds: number };
export type RateLimiter = (key: string) => RateDecision;

export function createRateLimiter(o: { limit: number; windowMs: number; maxKeys?: number; now?: () => number }): RateLimiter {
  const { limit, windowMs, maxKeys = 10_000, now = Date.now } = o;
  const windows = new Map<string, { start: number; count: number }>();
  return (key) => {
    const t = now();
    let w = windows.get(key);
    if (!w || t - w.start >= windowMs) {
      windows.delete(key); // re-insert so Map order stays oldest-window-first
      w = { start: t, count: 0 };
      windows.set(key, w);
      while (windows.size > maxKeys) windows.delete(windows.keys().next().value as string);
    }
    w.count++;
    if (w.count <= limit) return { ok: true };
    return { ok: false, retryAfterSeconds: Math.ceil((w.start + windowMs - t) / 1000) };
  };
}

/**
 * The visitor's address. The container is reachable only from the host, through
 * Tailscale Funnel or Caddy; both replace X-Forwarded-For with the real client address
 * (checked on 2026-11-05: a spoofed value was dropped). The last entry is used, so a
 * proxy that appends instead would still win over a client-supplied value.
 */
export function clientKey(headers: Record<string, string | string[] | undefined>, remoteAddress: string | undefined): string {
  const raw = headers['x-forwarded-for'];
  const xff = Array.isArray(raw) ? raw.join(',') : raw;
  const last = xff?.split(',').map((s) => s.trim()).filter(Boolean).pop();
  return last ?? remoteAddress ?? 'unknown';
}
