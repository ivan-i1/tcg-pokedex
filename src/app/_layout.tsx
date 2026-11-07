import '@/core/i18n';

import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettings } from '@/core/settings/store';
import { palette } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';

// Hold the splash until persisted settings are loaded, so the first frame already has
// the user's language and theme instead of flashing the defaults.
SplashScreen.preventAutoHideAsync().catch(() => {});

function useSettingsHydrated() {
  const [hydrated, setHydrated] = useState(() => useSettings.persist.hasHydrated());
  useEffect(() => {
    const unsub = useSettings.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useSettings.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

const navTheme = (scheme: 'light' | 'dark'): Theme => {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = palette[scheme];
  return {
    ...base,
    colors: { ...base.colors, primary: c.primary, background: c.background, card: c.surface, text: c.text, border: c.border },
  };
};

export default function RootLayout() {
  const hydrated = useSettingsHydrated();
  const { scheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;
  return (
    <ThemeProvider value={navTheme(scheme)}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={{ title: t('home.title') }} />
        <Stack.Screen name="coverage" options={{ title: t('coverage.title') }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen name="about" options={{ title: t('about.title') }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
