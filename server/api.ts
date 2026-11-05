/**
 * Read-only HTTP API over the dataset, as a pure router (method, url) -> response so it
 * can be tested without a socket. The coverage result is computed once at startup.
 */
import { solveReverseRelease } from '../src/core/coverage/coverage.ts';
import type { RateLimiter } from './rateLimit.ts';
import type { Dataset } from './seed.ts';

export type ApiResponse = { status: number; headers: Record<string, string>; body: unknown };

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  // Public, read-only card data: any origin may read it (the web app is served elsewhere).
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  // The app's API client sends x-client-id on every request (src/engines/api/client.ts).
  'access-control-allow-headers': 'content-type, x-client-id',
  'cache-control': 'public, max-age=300',
};

export function createApi(data: Dataset, options: { rateLimiter?: RateLimiter } = {}) {
  const names = new Map(data.species.map((s) => [s.dex, s.name]));
  const named = (dex: number) => ({ dex, name: names.get(dex) ?? `#${dex}` });
  const result = solveReverseRelease(data);
  const coverage = {
    total: result.total,
    coveredCount: result.coveredCount,
    setCount: result.setCount,
    picks: result.picks.map((p) => ({
      set: { id: p.set.id, name: p.set.name, releaseDate: p.set.releaseDate },
      newPokemon: p.newDex.map(named),
    })),
    missing: result.missing.map(named),
  };
  const cardCount = new Map<string, number>();
  for (const c of data.cards) cardCount.set(c.setId, (cardCount.get(c.setId) ?? 0) + 1);
  const sets = [...data.sets]
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : a.releaseDate > b.releaseDate ? -1 : 0))
    .map((s) => ({ id: s.id, name: s.name, releaseDate: s.releaseDate, cardCount: cardCount.get(s.id) ?? 0 }));

  const routes: Record<string, unknown> = {
    '/health': { ok: true },
    '/v1/coverage': coverage,
    '/v1/sets': sets,
  };

  /** `client` is the visitor's address (see clientKey); health checks and preflight are never limited. */
  return function handle(method: string, url: string, client = 'unknown'): ApiResponse {
    const path = url.split('?')[0].replace(/\/+$/, '') || '/';
    if (method === 'OPTIONS') return { status: 204, headers: HEADERS, body: null };
    if (path !== '/health' && options.rateLimiter) {
      const d = options.rateLimiter(client);
      if (!d.ok) {
        return {
          status: 429,
          headers: { ...HEADERS, 'retry-after': String(d.retryAfterSeconds), 'cache-control': 'no-store' },
          body: { error: 'rate_limited', retryAfterSeconds: d.retryAfterSeconds },
        };
      }
    }
    if (!(path in routes)) return { status: 404, headers: HEADERS, body: { error: 'not_found' } };
    if (method !== 'GET' && method !== 'HEAD') return { status: 405, headers: HEADERS, body: { error: 'method_not_allowed' } };
    return { status: 200, headers: HEADERS, body: routes[path] };
  };
}
