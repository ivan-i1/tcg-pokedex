import { useColorScheme } from 'react-native';

import { useSettings } from '@/core/settings/store';
import { palette, type Scheme } from './tokens';

/** The active scheme: the user's choice in Settings, or the device's when 'system'. */
export function useScheme(): Scheme {
  const choice = useSettings((s) => s.theme);
  const device = useColorScheme();
  if (choice !== 'system') return choice;
  return device === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useScheme();
  return { scheme, colors: palette[scheme] };
}
