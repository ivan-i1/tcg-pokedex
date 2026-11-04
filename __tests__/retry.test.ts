import { backoffDelay, isRetryable, parseRetryAfter } from '@/engines/api/retry';

describe('retry policy', () => {
  it('backs off exponentially with a cap', () => {
    expect(backoffDelay(0, { baseMs: 100, maxMs: 1000 }, () => 0)).toBe(100);
    expect(backoffDelay(2, { baseMs: 100, maxMs: 1000 }, () => 0)).toBe(400);
    expect(backoffDelay(10, { baseMs: 100, maxMs: 1000 }, () => 0)).toBe(1000);
  });
  it('adds at most 50% jitter', () => {
    expect(backoffDelay(0, { baseMs: 100, maxMs: 1000 }, () => 0.999)).toBeLessThan(150);
  });
  it('retries network failures and 5xx, never 4xx (429 is handled separately)', () => {
    expect(isRetryable(undefined)).toBe(true);
    expect(isRetryable(503)).toBe(true);
    expect(isRetryable(404)).toBe(false);
    expect(isRetryable(429)).toBe(false);
  });
  it('parses Retry-After seconds and HTTP dates', () => {
    expect(parseRetryAfter('7', 0)).toBe(7000);
    expect(parseRetryAfter('Thu, 01 Jan 1970 00:00:10 GMT', 0)).toBe(10000);
    expect(parseRetryAfter(null, 0)).toBeUndefined();
    expect(parseRetryAfter('soon', 0)).toBeUndefined();
  });
});
