import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './Text';

type Props = { title: string; subtitle?: string; right?: ReactNode };

/** Heading of a card block: title, one muted line, optional action on the right. */
export function Section({ title, subtitle, right }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="h3">{title}</Text>
        {subtitle ? <Text variant="small" color="muted">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
