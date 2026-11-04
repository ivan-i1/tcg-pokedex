import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { radius, spacing } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';
import { Text } from './Text';

export function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

export function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text>{label}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={[
                styles.chip,
                { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' },
              ]}>
              <Text style={{ color: selected ? colors.onPrimary : colors.text }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  label: { flex: 1, paddingRight: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
