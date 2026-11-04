// Design tokens. Screens use these through useTheme(); never hard-code a colour.
export const palette = {
  light: {
    background: '#F7F7FA',
    surface: '#FFFFFF',
    text: '#14141A',
    textMuted: '#5E6070',
    primary: '#4B5BDC',
    onPrimary: '#FFFFFF',
    border: '#DADBE5',
    danger: '#C62D3B',
    overlay: 'rgba(10, 10, 20, 0.55)',
  },
  dark: {
    background: '#0F1016',
    surface: '#1A1B24',
    text: '#F1F1F6',
    textMuted: '#A2A4B5',
    primary: '#8C98FF',
    onPrimary: '#0F1016',
    border: '#2E3040',
    danger: '#FF6B78',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
} as const;

export type ColorName = keyof (typeof palette)['light'];
export type Scheme = keyof typeof palette;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const fontSize = { sm: 14, md: 16, lg: 20, xl: 28, xxl: 34 } as const;
