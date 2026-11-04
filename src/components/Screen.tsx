import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/useTheme';

/** Standard screen: themed background, safe-area padding, optional scroll. */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  const body = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView> : body}
    </SafeAreaView>
  );
}

export function Section({ title, children }: { title?: ReactNode; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flex: 1, padding: spacing.md, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  section: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.sm + 4 },
});
