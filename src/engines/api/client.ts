import { fetch as expoFetch } from 'expo/fetch';

import { getClientId } from './clientId';
import { apiUrl } from './config';
import { backoffDelay, isRetryable, parseRetryAfter } from './retry';

export class ApiError extends Error {
  constructor(
    public status: number | undefined,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** HTTP 429. `retryAfterMs` comes from the Retry-After header or a JSON `retryAfterSeconds`. */
export class RateLimitError extends ApiError {
  constructor(
    public retryAfterMs: number | undefined,
    body?: unknown
  ) {
    super(429, 'Rate limited', body);
    this.name = 'RateLimitError';
  }
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Extra attempts for network errors and 5xx (default 2). */
  retries?: number;
};

const sleep = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

async function errorFor(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => '');
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {}
  if (res.status === 429) {
    const fromBody = (body as { retryAfterSeconds?: number })?.retryAfterSeconds;
    return new RateLimitError(parseRetryAfter(res.headers.get('retry-after')) ?? (fromBody ? fromBody * 1000 : undefined), body);
  }
  const message = (body as { error?: string })?.error ?? (res.statusText || `HTTP ${res.status}`);
  return new ApiError(res.status, message, body);
}

/**
 * fetch with JSON in/out, the client-id header, retries with backoff for network
 * errors and 5xx, and typed errors. Returns the raw Response when `raw` is set
 * (used by streaming).
 */
export async function request(path: string, o: RequestOptions & { raw: true }): Promise<Response>;
export async function request<T = unknown>(path: string, o?: RequestOptions): Promise<T>;
export async function request(path: string, o: RequestOptions & { raw?: boolean } = {}) {
  const { body, retries = 2, raw, headers, ...init } = o;
  const h: Record<string, string> = {
    accept: raw ? 'text/plain, text/event-stream, application/json' : 'application/json',
    'x-client-id': await getClientId(),
    ...(headers as Record<string, string>),
  };
  if (body !== undefined) h['content-type'] = 'application/json';

  for (let attempt = 0; ; attempt++) {
    let res: Response | undefined;
    try {
      // expo/fetch, not the global: React Native's built-in fetch has no streaming
      // Response.body on iOS/Android. expo/fetch implements WinterCG fetch everywhere.
      res = (await expoFetch(apiUrl(path), {
        ...(init as object),
        headers: h,
        body: body === undefined ? undefined : JSON.stringify(body),
      })) as unknown as Response;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError' || attempt >= retries) throw new ApiError(undefined, String((err as Error)?.message ?? err));
    }
    if (res?.ok) return raw ? res : res.status === 204 ? undefined : res.json();
    if (res && (!isRetryable(res.status) || attempt >= retries)) throw await errorFor(res);
    await sleep(backoffDelay(attempt, { baseMs: 400, maxMs: 4000 }), init.signal);
  }
}

/** Streams a text response chunk by chunk (plain text or SSE `data:` lines). */
export async function* streamText(path: string, o: RequestOptions = {}): AsyncIterable<string> {
  const res = await request(path, { method: 'POST', retries: 0, ...o, raw: true });
  const reader = res.body?.getReader();
  if (!reader) {
    yield await res.text();
    return;
  }
  const sse = (res.headers.get('content-type') ?? '').includes('text/event-stream');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (!sse) {
      yield chunk;
      continue;
    }
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trimStart();
      if (data === '[DONE]') return;
      yield data;
    }
  }
}
