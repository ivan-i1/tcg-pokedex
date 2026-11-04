import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/Button';
import { Screen, Section } from '@/components/Screen';
import { Text } from '@/components/Text';
import { isApiConfigured } from '@/engines/api';
import { fetchCoverage, type Coverage } from '@/features/coverage/api';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: Coverage };

/** The answer: which sets, newest first, and what each one adds. */
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

  const { data } = state;
  return (
    <Screen>
      <Section>
        <Text variant="heading">{t('coverage.summary', { count: data.setCount, covered: data.coveredCount, total: data.total })}</Text>
        <Text variant="caption">{t('coverage.explainer')}</Text>
      </Section>
      {data.picks.map((p, i) => (
        <Section key={p.set.id} title={<Text variant="heading">{`${i + 1}. ${p.set.name}`}</Text>}>
          <Text variant="caption">
            {t('coverage.released', { date: p.set.releaseDate })} · {t('coverage.newPokemon', { count: p.newPokemon.length })}
          </Text>
          <Text>{p.newPokemon.map((x) => x.name).join(', ')}</Text>
        </Section>
      ))}
      {data.missing.length > 0 && (
        <Section title={<Text variant="heading">{t('coverage.missing', { count: data.missing.length })}</Text>}>
          <Text>{data.missing.map((x) => `#${x.dex} ${x.name}`).join(', ')}</Text>
        </Section>
      )}
    </Screen>
  );
}
