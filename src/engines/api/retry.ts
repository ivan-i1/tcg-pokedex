export type BackoffOptions = { baseMs: number; maxMs: number };

/** Exponential backoff (base·2^attempt, capped) plus up to 50% jitter. */
export function backoffDelay(attempt: number, o: BackoffOptions, rng: () => number = Math.random): number {
  const exp = Math.min(o.maxMs, o.baseMs * 2 ** attempt);
  return Math.min(o.maxMs, exp + exp * 0.5 * rng());
}

/**
 * Network failures (no status) and 5xx are worth retrying. 4xx are the caller's fault
 * and will fail again; 429 is excluded because the server told us when to come back.
 */
export function isRetryable(status: number | undefined): boolean {
  return status === undefined || status >= 500;
}

/** Retry-After as milliseconds from `nowMs`; accepts delta-seconds or an HTTP date. */
export function parseRetryAfter(header: string | null | undefined, nowMs: number = Date.now()): number | undefined {
  if (!header) return undefined;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const at = Date.parse(trimmed);
  return Number.isNaN(at) ? undefined : Math.max(0, at - nowMs);
}
