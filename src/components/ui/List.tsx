import React, { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

/** Rows with a thin divider between them. Use instead of cards inside cards. */
export function List({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const items = Children.toArray(children);
  return (
    <View>
      {items.map((child, i) => (
        <View key={i} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
          {child}
        </View>
      ))}
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  /** Show a small arrow on the right (row opens something). */
  chevron?: boolean;
};

export function ListRow({ title, subtitle, left, right, onPress, selected, chevron }: RowProps) {
  const { colors } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 4, minHeight: 56 }}>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" color={selected ? 'accent' : 'text'}>{title}</Text>
        {subtitle ? <Text variant="small" color="muted">{subtitle}</Text> : null}
      </View>
      {right}
      {chevron ? <Icon name="chev" size={16} color={colors.muted} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}>
      {body}
    </Pressable>
  );
}
