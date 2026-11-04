import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Screen, Section } from '@/components/Screen';
import { Text } from '@/components/Text';

export default function About() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Section>
        <Text variant="heading">{Constants.expoConfig?.name}</Text>
        <Text>{t('about.version', { version: Constants.expoConfig?.version ?? '?' })}</Text>
        <Text variant="caption">{t('about.platform', { platform: Platform.OS })}</Text>
        <Text>{t('about.body')}</Text>
      </Section>
    </Screen>
  );
}
