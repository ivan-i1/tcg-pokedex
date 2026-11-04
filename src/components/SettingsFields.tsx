import { useTranslation } from 'react-i18next';

import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type LanguageChoice } from '@/core/i18n';
import type { ThemeChoice } from '@/core/settings/settings';
import { useSettings } from '@/core/settings/store';
import { ChoiceRow } from './Rows';

/** The settings controls shown on the Settings screen. */
export function SettingsFields() {
  const { t } = useTranslation();
  const s = useSettings();
  const languages = [
    { value: 'system' as LanguageChoice, label: t('settings.languageSystem') },
    ...SUPPORTED_LANGUAGES.map((l) => ({ value: l as LanguageChoice, label: LANGUAGE_NAMES[l] })),
  ];
  const themes: { value: ThemeChoice; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];
  return (
    <>
      <ChoiceRow label={t('settings.language')} value={s.language} options={languages} onChange={(v) => s.set('language', v)} />
      <ChoiceRow label={t('settings.theme')} value={s.theme} options={themes} onChange={(v) => s.set('theme', v)} />
    </>
  );
}
