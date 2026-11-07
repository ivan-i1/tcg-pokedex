/** EXPO_PUBLIC_API_URL: absolute URL, "/" for same origin, or unset. */
const load = (value: string | undefined) => {
  const prev = process.env.EXPO_PUBLIC_API_URL;
  if (value === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = value;
  let mod: typeof import('@/engines/api/config') | undefined;
  jest.isolateModules(() => {
    mod = require('@/engines/api/config');
  });
  if (prev === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = prev;
  return mod!;
};

describe('api config', () => {
  it('joins an absolute base URL', () => {
    const c = load('https://example.test:10000/');
    expect(c.isApiConfigured()).toBe(true);
    expect(c.apiUrl('/v1/coverage')).toBe('https://example.test:10000/v1/coverage');
  });

  it('treats "/" as the same origin that served the web app', () => {
    const c = load('/');
    expect(c.isApiConfigured()).toBe(true);
    expect(c.apiUrl('/v1/coverage')).toBe('/v1/coverage');
  });

  it('is not configured when unset or blank', () => {
    expect(load(undefined).isApiConfigured()).toBe(false);
    expect(load('  ').isApiConfigured()).toBe(false);
  });
});
