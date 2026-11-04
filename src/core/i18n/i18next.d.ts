import 'i18next';
import type { Translation } from './resources';

// Typed keys: t('home.title') autocompletes and a typo is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translation };
  }
}
