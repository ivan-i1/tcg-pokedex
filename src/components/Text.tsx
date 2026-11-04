import { Text as RNText, type TextProps } from 'react-native';

import { fontSize } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';

type Variant = 'title' | 'heading' | 'body' | 'caption';

const VARIANTS: Record<Variant, { fontSize: number; fontWeight: '400' | '600' | '700'; muted?: boolean }> = {
  title: { fontSize: fontSize.xxl, fontWeight: '700' },
  heading: { fontSize: fontSize.lg, fontWeight: '600' },
  body: { fontSize: fontSize.md, fontWeight: '400' },
  caption: { fontSize: fontSize.sm, fontWeight: '400', muted: true },
};

export function Text({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  const { colors } = useTheme();
  const v = VARIANTS[variant];
  return (
    <RNText
      style={[{ color: v.muted ? colors.textMuted : colors.text, fontSize: v.fontSize, fontWeight: v.fontWeight }, style]}
      {...rest}
    />
  );
}
