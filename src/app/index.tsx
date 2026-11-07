import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

export default function Home() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={require('@assets/images/icon.png')} style={styles.logo} contentFit="contain" accessibilityIgnoresInvertColors />
        <Text variant="title">{t('home.title')}</Text>
        <Text variant="caption" style={styles.center}>
          {t('home.subtitle')}
        </Text>
      </View>
      <Link href="/coverage" asChild>
        <Button label={t('home.coverage')} />
      </Link>
      <Link href="/settings" asChild>
        <Button variant="secondary" label={t('home.settings')} />
      </Link>
      <Link href="/about" asChild>
        <Button variant="secondary" label={t('home.about')} />
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  logo: { width: 96, height: 96, borderRadius: 22 },
  center: { textAlign: 'center', alignSelf: 'stretch' },
});
