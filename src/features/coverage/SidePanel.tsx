import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Text';
import { radius, spacing } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';
import type { PackRef } from './api';
import { typeColors, type DexEntry } from './model';

type Row = { key: string; label: string; detail?: string; selected?: boolean; swatch?: string; onPress: () => void };

function PanelList({ rows, header }: { rows: Row[]; header?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.key}
      ListHeaderComponent={header ? <View style={styles.header}>{header}</View> : null}
      initialNumToRender={40}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !!item.selected }}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: item.selected ? colors.primary : pressed ? colors.border : 'transparent' },
          ]}>
          {item.swatch && <View style={[styles.swatch, { backgroundColor: item.swatch }]} />}
          <Text numberOfLines={1} style={[styles.label, item.selected && { color: colors.onPrimary }]}>
            {item.label}
          </Text>
          {item.detail && (
            <Text variant="caption" style={item.selected && { color: colors.onPrimary }}>
              {item.detail}
            </Text>
          )}
        </Pressable>
      )}
    />
  );
}

/** Pack order view: every Pokémon by dex; pressing one jumps to the pack that covers it. */
export function PokemonPanel({ entries, onSelect }: { entries: DexEntry[]; onSelect: (e: DexEntry) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => !q || e.name.toLowerCase().includes(q) || String(e.dex) === q.replace(/^#0*/, ''))
      .map<Row>((e) => ({
        key: String(e.dex),
        label: `#${String(e.dex).padStart(4, '0')} ${e.name}`,
        detail: e.set ? undefined : t('coverage.notInPack'),
        swatch: typeColors(e.set ? e.type : undefined).bg,
        onPress: () => onSelect(e),
      }));
  }, [entries, query, onSelect, t]);
  return (
    <PanelList
      rows={rows}
      header={
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('coverage.searchPokemon')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('coverage.searchPokemon')}
          style={[styles.search, { color: colors.text, borderColor: colors.border }]}
        />
      }
    />
  );
}

/** Pokémon order view: the packs; pressing one shows only that pack's Pokémon. */
export function PackPanel({
  packs,
  selectedId,
  onSelect,
}: {
  packs: { set: PackRef; count: number }[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const { t } = useTranslation();
  const rows: Row[] = [
    { key: '*', label: t('coverage.allPacks'), selected: !selectedId, onPress: () => onSelect(undefined) },
    ...packs.map((p) => ({
      key: p.set.id,
      label: p.set.name,
      detail: String(p.count),
      selected: p.set.id === selectedId,
      onPress: () => onSelect(p.set.id),
    })),
  ];
  return <PanelList rows={rows} />;
}

const styles = StyleSheet.create({
  header: { padding: spacing.sm },
  search: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontSize: 15 },
});
