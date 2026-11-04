import { resolveLanguage, SUPPORTED_LANGUAGES } from '@/core/i18n/languages';

describe('resolveLanguage', () => {
  it('honours an explicit supported choice over the device', () => {
    expect(resolveLanguage('fr', ['de-DE'])).toBe('fr');
  });
  it('follows the first supported device locale when set to system', () => {
    expect(resolveLanguage('system', ['ja-JP', 'pt-BR', 'en-US'])).toBe('pt');
  });
  it('falls back to English when nothing matches', () => {
    expect(resolveLanguage('system', ['ja-JP'])).toBe('en');
    expect(resolveLanguage('system', [])).toBe('en');
  });
  it('ships the six agreed languages', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(['de', 'en', 'es', 'fr', 'it', 'pt']);
  });
});
