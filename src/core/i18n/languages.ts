export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'it', 'de', 'pt'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguageChoice = Language | 'system';
export const FALLBACK_LANGUAGE: Language = 'en';

/** Native names, so a user who cannot read the current language can still find theirs. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  pt: 'Português',
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * The language to render: an explicit choice wins; 'system' takes the first device
 * locale (in preference order) whose language we ship; otherwise English.
 */
export function resolveLanguage(choice: LanguageChoice, deviceLocales: readonly string[]): Language {
  if (choice !== 'system') return choice;
  for (const tag of deviceLocales) {
    const lang = tag.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(lang)) return lang;
  }
  return FALLBACK_LANGUAGE;
}
