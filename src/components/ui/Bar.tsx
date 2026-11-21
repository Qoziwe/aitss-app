import React from 'react';
import { View } from 'react-native';
import { radius, useTheme } from '@/theme';
import { toneColors, type Tone } from '@/utils/mastery';

type Props = { value: number; tone?: Tone; height?: number };

export function Bar({ value, tone = 'accent', height = 6 }: Props) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ height, borderRadius: radius.pill, backgroundColor: colors.fill, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height, borderRadius: radius.pill, backgroundColor: toneColors(colors, tone).bar }} />
    </View>
  );
}
