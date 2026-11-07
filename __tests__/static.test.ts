import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { isApiPath, resolveStatic } from '../server/static';

const web = mkdtempSync(join(tmpdir(), 'tcg-web-'));
writeFileSync(join(web, 'index.html'), '<html></html>');
writeFileSync(join(web, 'manifest.json'), '{}');
mkdirSync(join(web, '_expo', 'static', 'js', 'web'), { recursive: true });
writeFileSync(join(web, '_expo', 'static', 'js', 'web', 'entry-abc.js'), '1');

describe('isApiPath', () => {
  it('routes /v1 and /health to the API, everything else to the web app', () => {
    expect(['/v1/coverage', '/v1/sets?x=1', '/health'].map(isApiPath)).toEqual([true, true, true]);
    expect(['/', '/coverage', '/v10', '/healthy', '/manifest.json'].map(isApiPath)).toEqual([false, false, false, false, false]);
  });
});

describe('resolveStatic', () => {
  it('serves existing files with their content type', () => {
    expect(resolveStatic(web, '/manifest.json')).toMatchObject({ file: join(web, 'manifest.json'), contentType: 'application/json; charset=utf-8' });
    expect(resolveStatic(web, '/_expo/static/js/web/entry-abc.js?v=1')).toMatchObject({
      contentType: 'text/javascript; charset=utf-8',
      cacheControl: 'public, max-age=31536000, immutable',
    });
  });

  it('falls back to index.html for app routes, never cached', () => {
    expect(resolveStatic(web, '/coverage')).toEqual({ file: join(web, 'index.html'), contentType: 'text/html; charset=utf-8', cacheControl: 'no-cache' });
    expect(resolveStatic(web, '/')).toMatchObject({ file: join(web, 'index.html') });
  });

  it('never leaves the web directory', () => {
    for (const p of ['/../package.json', '/%2e%2e/%2e%2e/etc/passwd', '/_expo/../../secret']) {
      expect(resolveStatic(web, p).file).toBe(join(web, 'index.html'));
    }
  });
});
