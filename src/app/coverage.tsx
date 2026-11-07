import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ChoiceRow } from '@/components/Rows';
import { Screen, Section } from '@/components/Screen';
import { Text } from '@/components/Text';
import { radius, spacing } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';
import { isApiConfigured } from '@/engines/api';
import { fetchCoverage, type Coverage } from '@/features/coverage/api';
import { pokemonOrder, RARITY_LEGEND, RARITY_OUTLINE, type DexEntry } from '@/features/coverage/model';
import { PokemonChip } from '@/features/coverage/PokemonChip';
import { PackPanel, PokemonPanel } from '@/features/coverage/SidePanel';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: Coverage };
type Order = 'pack' | 'pokemon';

/** Below this width the side panel becomes an overlay opened from the options bar. */
const WIDE = 900;
const MISSING_KEY = '__missing';

export default function CoverageScreen() {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback((signal?: AbortSignal) => {
    setState({ kind: 'loading' });
    fetchCoverage(signal)
      .then((data) => setState({ kind: 'ready', data }))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setState({ kind: 'error', message: e.message });
      });
  }, []);

  useEffect(() => {
    if (!isApiConfigured()) return;
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  if (!isApiConfigured()) {
    return (
      <Screen>
        <Text>{t('coverage.notConfigured')}</Text>
      </Screen>
    );
  }
  if (state.kind === 'loading') {
    return (
      <Screen>
        <ActivityIndicator accessibilityLabel={t('common.loading')} />
      </Screen>
    );
  }
  if (state.kind === 'error') {
    return (
      <Screen>
        <Text>{t('coverage.error', { message: state.message })}</Text>
        <Button label={t('common.retry')} onPress={() => load()} />
      </Screen>
    );
  }
  return <CoverageView data={state.data} />;
}

function CoverageView({ data }: { data: Coverage }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wide = useWindowDimensions().width >= WIDE;

  const [order, setOrder] = useState<Order>('pack');
  const [packFilter, setPackFilter] = useState<string | undefined>();
  const [highlight, setHighlight] = useState<number | undefined>();
  const [panelOpen, setPanelOpen] = useState(false);

  const scroll = useRef<ScrollView>(null);
  const sectionY = useRef(new Map<string, number>());

  const allPokemon = useMemo(() => pokemonOrder(data).flatMap((g) => g.entries), [data]);
  const generations = useMemo(() => pokemonOrder(data, packFilter), [data, packFilter]);
  const packs = useMemo(() => data.picks.map((p) => ({ set: p.set, count: p.newPokemon.length })), [data]);

  const jumpTo = useCallback(
    (e: DexEntry) => {
      const y = sectionY.current.get(e.set?.id ?? MISSING_KEY);
      if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - spacing.sm), animated: true });
      setHighlight(e.dex);
      setPanelOpen(false);
    },
    []
  );
  const filterPack = useCallback((id: string | undefined) => {
    setPackFilter(id);
    setPanelOpen(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, []);
  const changeOrder = (o: Order) => {
    setOrder(o);
    setHighlight(undefined);
    setPackFilter(undefined);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const track = (key: string) => (ev: { nativeEvent: { layout: { y: number } } }) => {
    sectionY.current.set(key, ev.nativeEvent.layout.y);
  };

  const panel =
    order === 'pack' ? (
      <PokemonPanel entries={allPokemon} onSelect={jumpTo} />
    ) : (
      <PackPanel packs={packs} selectedId={packFilter} onSelect={filterPack} />
    );
  const filteredPack = packs.find((p) => p.set.id === packFilter)?.set;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.root, { backgroundColor: colors.background }]}>
      {wide && <View style={[styles.sidebar, { borderColor: colors.border, backgroundColor: colors.surface }]}>{panel}</View>}

      <ScrollView ref={scroll} style={styles.main} contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          {/* View options: today only the order; later the search refinements (megas, …). */}
          <Section title={<Text variant="heading">{t('coverage.options')}</Text>}>
            <ChoiceRow<Order>
              label={t('coverage.order')}
              value={order}
              onChange={changeOrder}
              options={[
                { value: 'pack', label: t('coverage.packOrder') },
                { value: 'pokemon', label: t('coverage.pokemonOrder') },
              ]}
            />
            {!wide && (
              <Button
                variant="secondary"
                label={order === 'pack' ? t('coverage.showPokemonList') : t('coverage.showPackList')}
                onPress={() => setPanelOpen(true)}
              />
            )}
            <View style={styles.legend} accessibilityLabel={t('coverage.legend')}>
              <Text variant="caption">{t('coverage.legend')}</Text>
              {RARITY_LEGEND.map((tier) => (
                <View key={tier} style={styles.legendItem}>
                  <View style={[styles.legendRing, { borderColor: RARITY_OUTLINE[tier] }]} />
                  <Text variant="caption">{t(`coverage.rarity.${tier}`)}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section>
            <Text variant="heading">{t('coverage.summary', { count: data.setCount, covered: data.coveredCount, total: data.total })}</Text>
            <Text variant="caption">{t('coverage.explainer')}</Text>
          </Section>

          {order === 'pack' ? (
            <>
              {data.picks.map((p, i) => (
                <View key={p.set.id} onLayout={track(p.set.id)}>
                  <Section title={<Text variant="heading">{`${i + 1}. ${p.set.name}`}</Text>}>
                    <Text variant="caption">
                      {t('coverage.released', { date: p.set.releaseDate })} · {t('coverage.newPokemon', { count: p.newPokemon.length })}
                    </Text>
                    <View style={styles.chips}>
                      {p.newPokemon.map((x) => (
                        <PokemonChip key={x.dex} {...x} highlighted={x.dex === highlight} />
                      ))}
                    </View>
                  </Section>
                </View>
              ))}
              {data.missing.length > 0 && (
                <View onLayout={track(MISSING_KEY)}>
                  <Section title={<Text variant="heading">{t('coverage.missing', { count: data.missing.length })}</Text>}>
                    <View style={styles.chips}>
                      {data.missing.map((x) => (
                        <PokemonChip key={x.dex} {...x} missing highlighted={x.dex === highlight} />
                      ))}
                    </View>
                  </Section>
                </View>
              )}
            </>
          ) : (
            <>
              {filteredPack && (
                <Pressable accessibilityRole="button" onPress={() => filterPack(undefined)}>
                  <Text variant="caption">{t('coverage.filteredBy', { pack: filteredPack.name })}</Text>
                </Pressable>
              )}
              {generations.map((g) => (
                <Section key={g.gen} title={<Text variant="heading">{t('coverage.generation', { gen: g.gen, from: g.from, to: g.to })}</Text>}>
                  <View style={styles.chips}>
                    {g.entries.map((e) => (
                      <PokemonChip key={e.dex} {...e} missing={!e.set} />
                    ))}
                  </View>
                </Section>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {!wide && panelOpen && (
        <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.drawer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.drawerBar}>
              <Button variant="secondary" label={t('common.close')} onPress={() => setPanelOpen(false)} />
            </View>
            {panel}
          </View>
          <Pressable style={styles.scrim} accessibilityLabel={t('common.close')} onPress={() => setPanelOpen(false)} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 280, borderRightWidth: 1 },
  main: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { padding: spacing.md, gap: spacing.md, width: '100%', maxWidth: 900, alignSelf: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendRing: { width: 14, height: 14, borderRadius: radius.pill, borderWidth: 3, backgroundColor: '#8E8E93' },
  overlay: { flexDirection: 'row' },
  drawer: { width: '85%', maxWidth: 360, borderRightWidth: 1 },
  drawerBar: { padding: spacing.sm },
  scrim: { flex: 1 },
});
