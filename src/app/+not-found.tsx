import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Stack.Screen options={{ title: '404' }} />
      <Text variant="heading">404</Text>
      <Link href="/" replace asChild>
        <Button label={t('common.back')} />
      </Link>
    </Screen>
  );
}
