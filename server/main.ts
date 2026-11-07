/**
 * TCG Pokédex API. Run with Node 24+ (native TypeScript type stripping):
 *   node server/main.ts            # PORT=18100 HOST=0.0.0.0 RATE_LIMIT_PER_MIN=60 by default
 */
import { createReadStream, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

import { createApi } from './api.ts';
import { clientKey, createRateLimiter } from './rateLimit.ts';
import { buildDataset, type SetMeta } from './seed.ts';
import { isApiPath, resolveStatic } from './static.ts';

const DATA = join(import.meta.dirname, 'data');
const read = (...p: string[]) => readFileSync(join(DATA, ...p), 'utf8');

const perMinute = Number(process.env.RATE_LIMIT_PER_MIN ?? 60);
const sets: SetMeta[] = JSON.parse(read('sets.json'));
const handle = createApi(buildDataset(sets, (file) => read('drive', file), read('national-dex.csv')), {
  rateLimiter: perMinute > 0 ? createRateLimiter({ limit: perMinute, windowMs: 60_000 }) : undefined,
});

const port = Number(process.env.PORT ?? 18100);
const host = process.env.HOST ?? '0.0.0.0';

// The exported web app, served next to the API when WEB_DIR is set (see server/Dockerfile).
const webDir = process.env.WEB_DIR;

createServer((req, res) => {
  const url = req.url ?? '/';
  if (webDir && !isApiPath(url) && (req.method === 'GET' || req.method === 'HEAD')) {
    const f = resolveStatic(webDir, url);
    res.writeHead(200, { 'content-type': f.contentType, 'cache-control': f.cacheControl });
    if (req.method === 'HEAD') return void res.end();
    createReadStream(f.file).on('error', () => res.destroy()).pipe(res);
    return;
  }
  const r = handle(req.method ?? 'GET', url, clientKey(req.headers, req.socket.remoteAddress));
  res.writeHead(r.status, r.headers);
  res.end(r.body === null || req.method === 'HEAD' ? undefined : JSON.stringify(r.body));
}).listen(port, host, () => {
  console.log(
    `tcg-pokedex api listening on ${host}:${port} (${sets.length} sets, ${perMinute || 'no'} requests/min per client, web app: ${webDir ?? 'off'})`
  );
});
