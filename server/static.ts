/**
 * Serves the exported web app (expo export → WEB_DIR) next to the API, so the app and
 * its data share one origin. Unknown paths fall back to index.html (client-side routes).
 */
import { existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};

/** Requests the JSON API answers; everything else is the web app. */
export const isApiPath = (url: string) => {
  const path = url.split('?')[0];
  return path === '/health' || path === '/v1' || path.startsWith('/v1/');
};

export type StaticFile = { file: string; contentType: string; cacheControl: string };

export function resolveStatic(webDir: string, url: string): StaticFile {
  const index = { file: join(webDir, 'index.html'), contentType: TYPES['.html'], cacheControl: 'no-cache' };
  let path: string;
  try {
    path = decodeURIComponent(url.split('?')[0]);
  } catch {
    return index;
  }
  const file = normalize(join(webDir, path));
  if (!file.startsWith(webDir + sep) || !existsSync(file) || !statSync(file).isFile()) return index;
  const hashed = path.startsWith('/_expo/static/'); // content-hashed bundle names
  return {
    file,
    contentType: TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    cacheControl: file === index.file ? 'no-cache' : hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  };
}
