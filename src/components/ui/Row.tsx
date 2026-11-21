import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/theme';

type Props = {
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function Row({ gap = spacing.md, align = 'center', justify, wrap, style, children }: Props) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: align, justifyContent: justify, gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>
      {children}
    </View>
  );
}

export function Stack({ gap = spacing.md, style, children }: { gap?: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}
