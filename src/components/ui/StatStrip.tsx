import React from 'react';
import { View } from 'react-native';
import type { Colors } from '@/theme';
import { Text } from './Text';

type Stat = { label: string; value: string; hint?: string; color?: keyof Colors };

/** Several numbers in one calm row. Replaces a row of separate stat cards. */
export function StatStrip({ items }: { items: Stat[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
      {items.map((s) => (
        <View key={s.label} style={{ flexGrow: 1, flexBasis: 150, gap: 4 }}>
          <Text variant="small" color="muted">{s.label}</Text>
          <Text variant="numLg" color={s.color}>{s.value}</Text>
          {s.hint ? <Text variant="small" color="muted">{s.hint}</Text> : null}
        </View>
      ))}
    </View>
  );
}
