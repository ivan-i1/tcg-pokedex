import { DEFAULT_SETTINGS, mergeSettings } from '@/core/settings/settings';

describe('mergeSettings', () => {
  it('returns defaults for empty or non-object input', () => {
    expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings('garbage')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid stored values', () => {
    expect(mergeSettings({ language: 'es', theme: 'dark' })).toEqual({ language: 'es', theme: 'dark' });
  });

  it('falls back per field on invalid values and drops unknown keys', () => {
    const merged = mergeSettings({ language: 'xx', theme: 'neon', sound: true });
    expect(merged).toEqual(DEFAULT_SETTINGS);
  });
});
