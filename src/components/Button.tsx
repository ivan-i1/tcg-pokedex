import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { fontSize, radius, spacing } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';
import { Text } from './Text';

type Props = Omit<PressableProps, 'children'> & { label: string; variant?: 'primary' | 'secondary' };

export function Button({ label, variant = 'primary', onPress, disabled, style, ...rest }: Props) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={(state) => [
        styles.base,
        {
          backgroundColor: primary ? colors.primary : colors.surface,
          borderColor: primary ? colors.primary : colors.border,
          opacity: disabled ? 0.45 : state.pressed ? 0.75 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Text style={{ color: primary ? colors.onPrimary : colors.text, fontWeight: '600', fontSize: fontSize.md }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
