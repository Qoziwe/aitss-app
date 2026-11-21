import React, { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, useThemedStyles } from '@/theme';

// Calm cards: white surface and a thin line. Only `accent` has a fill (use it once per screen).
// ok / warn / bad only change the border color. `fill` is a quiet inner box with no background.
export type CardTone = 'default' | 'accent' | 'ok' | 'warn' | 'bad' | 'fill';

type Props = {
  tone?: CardTone;
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function Card({ tone = 'default', padded = true, onPress, style, children }: Props) {
  const s = useThemedStyles((c) => ({
    base: { backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderRadius: radius.xl, gap: spacing.lg },
    padded: { padding: spacing.xxl },
    accent: { backgroundColor: c.accentSoft, borderColor: c.accentSoft },
    ok: { borderColor: c.okBar },
    warn: { borderColor: c.warnBar },
    bad: { borderColor: c.badBar },
    fill: { backgroundColor: 'transparent', borderRadius: radius.lg },
  }));
  const toneStyle = tone === 'default' ? null : s[tone];
  const all = [s.base, padded ? s.padded : null, toneStyle, tone === 'fill' && padded ? { padding: spacing.lg } : null, style];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={all}>
        {children}
      </Pressable>
    );
  }
  return <View style={all}>{children}</View>;
}
