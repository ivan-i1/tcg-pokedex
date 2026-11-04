import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Screen, Section } from '@/components/Screen';
import { SettingsFields } from '@/components/SettingsFields';
import { useSettings } from '@/core/settings/store';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const reset = useSettings((s) => s.reset);
  return (
    <Screen>
      <Section>
        <SettingsFields />
      </Section>
      <Button variant="secondary" label={t('common.reset')} onPress={reset} />
    </Screen>
  );
}
