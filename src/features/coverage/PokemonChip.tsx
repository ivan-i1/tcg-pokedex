import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';
import { RARITY_OUTLINE, rarityTier, typeColors } from './model';

const pad = (dex: number) => String(dex).padStart(4, '0');

/**
 * A Pokémon as a chip: fill = the card's energy type (gray when no card), outline = the
 * card's rarity group. Missing Pokémon get a dashed outline.
 */
export function PokemonChip({
  dex,
  name,
  type,
  rarity,
  missing,
  highlighted,
  onPress,
}: {
  dex: number;
  name: string;
  type?: string;
  rarity?: string;
  missing?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const { bg, fg } = typeColors(missing ? undefined : type);
  const outline = RARITY_OUTLINE[rarityTier(rarity)];
  const label = `#${pad(dex)} ${name}`;
  const body = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: missing ? colors.textMuted : outline === 'transparent' ? bg : outline,
          borderStyle: missing ? 'dashed' : 'solid',
        },
        highlighted && { outlineColor: colors.primary, outlineWidth: 3, outlineStyle: 'solid', transform: [{ scale: 1.08 }] },
      ]}>
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={[label, type, rarity].filter(Boolean).join(', ')}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 2.5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 13, fontWeight: '600' },
});
