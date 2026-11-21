import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import type { Colors } from './tokens';

type Style = ViewStyle | TextStyle | ImageStyle;

/**
 * Themed StyleSheet. The factory runs again only when the color scheme changes.
 *
 *   const s = useThemedStyles((c) => ({ box: { backgroundColor: c.card } }));
 */
export function useThemedStyles<T extends Record<string, Style>>(factory: (c: Colors) => T): T {
  const { colors } = useTheme();
  // The factory is expected to be a pure function of the colors.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(colors)) as T, [colors]);
}
