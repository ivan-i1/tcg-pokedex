import { createApi } from '../server/api';
import { clientKey, createRateLimiter } from '../server/rateLimit';
import { buildDataset } from '../server/seed';

describe('createRateLimiter', () => {
  it('allows `limit` requests per window per key, then reports when to retry', () => {
    let t = 0;
    const hit = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => t });
    expect(hit('a')).toEqual({ ok: true });
    expect(hit('a')).toEqual({ ok: true });
    t = 15_000;
    expect(hit('a')).toEqual({ ok: false, retryAfterSeconds: 45 });
    expect(hit('b')).toEqual({ ok: true }); // other clients are unaffected
    t = 60_000;
    expect(hit('a')).toEqual({ ok: true }); // new window
  });

  it('never remembers more than maxKeys clients', () => {
    let t = 0;
    const hit = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2, now: () => t });
    hit('a');
    hit('b');
    hit('c'); // evicts the oldest ('a')
    expect(hit('a')).toEqual({ ok: true });
  });
});

describe('clientKey', () => {
  it('uses the address the proxy appended last in X-Forwarded-For', () => {
    expect(clientKey({ 'x-forwarded-for': '6.6.6.6, 187.224.79.247' }, '127.0.0.1')).toBe('187.224.79.247');
    expect(clientKey({ 'x-forwarded-for': ['10.0.0.1'] }, '127.0.0.1')).toBe('10.0.0.1');
  });

  it('falls back to the socket address without a proxy header', () => {
    expect(clientKey({}, '172.18.0.1')).toBe('172.18.0.1');
    expect(clientKey({}, undefined)).toBe('unknown');
  });
});

describe('api with a rate limit', () => {
  const data = buildDataset(
    [{ id: 'x', name: 'X', releaseDate: '2024-01-01', file: 'x.csv' }],
    () => 'dexNumber,name,setName,setNumber,rarity,type\n1,Bulbasaur,X,001,Common,Grass\n',
    '"#0001","Bulbasaur"\n'
  );
  const api = () => createApi(data, { rateLimiter: createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0 }) });

  it('answers 429 with Retry-After once a client is over the limit', () => {
    const handle = api();
    expect(handle('GET', '/v1/sets', '1.1.1.1').status).toBe(200);
    const r = handle('GET', '/v1/coverage', '1.1.1.1');
    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBe('60');
    expect(r.body).toEqual({ error: 'rate_limited', retryAfterSeconds: 60 });
    expect(r.headers['access-control-allow-origin']).toBe('*'); // browsers can read the 429
    expect(handle('GET', '/v1/sets', '2.2.2.2').status).toBe(200);
  });

  it('never limits health checks or CORS preflight', () => {
    const handle = api();
    for (let i = 0; i < 3; i++) {
      expect(handle('GET', '/health', '1.1.1.1').status).toBe(200);
      expect(handle('OPTIONS', '/v1/sets', '1.1.1.1').status).toBe(204);
    }
    expect(handle('GET', '/v1/sets', '1.1.1.1').status).toBe(200);
  });
});
