import './polyfills';

import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { useSettings } from '@/core/settings/store';
import { FALLBACK_LANGUAGE, resolveLanguage } from './languages';
import { resources } from './resources';

const deviceLocales = () => getLocales().map((l) => l.languageTag);
const currentLanguage = () => resolveLanguage(useSettings.getState().language, deviceLocales());

i18n.use(initReactI18next).init({
  resources,
  lng: currentLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

// Follow the persisted choice: on rehydration from storage and on every change.
useSettings.subscribe((state, prev) => {
  if (state.language !== prev.language) i18n.changeLanguage(resolveLanguage(state.language, deviceLocales()));
});
useSettings.persist.onFinishHydration(() => i18n.changeLanguage(currentLanguage()));

export default i18n;
export * from './languages';
