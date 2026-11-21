import React, { type ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { fonts, fontSize, useTheme, type Colors } from '@/theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'eyebrow'
  | 'num'
  | 'numLg'
  | 'label';

const VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.headingBold, fontSize: fontSize.h1, lineHeight: 50, letterSpacing: -1 },
  title: { fontFamily: fonts.headingBold, fontSize: fontSize.h2, lineHeight: 36, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 30 },
  h3: { fontFamily: fonts.semibold, fontSize: fontSize.lg, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: fontSize.md, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: fontSize.md, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: fontSize.sm, lineHeight: 20 },
  smallStrong: { fontFamily: fonts.semibold, fontSize: fontSize.sm, lineHeight: 20 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: fontSize.xs, lineHeight: 18, letterSpacing: 0.2 },
  num: { fontFamily: fonts.headingBold, fontSize: fontSize.h2, lineHeight: 36 },
  numLg: { fontFamily: fonts.headingBold, fontSize: fontSize.num, lineHeight: 46, letterSpacing: -0.5 },
  label: { fontFamily: fonts.medium, fontSize: fontSize.sm, lineHeight: 20 },
};

type Props = {
  variant?: TextVariant;
  color?: keyof Colors;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
  selectable?: boolean;
};

export function Text({ variant = 'body', color, align, numberOfLines, style, children, selectable }: Props) {
  const { colors } = useTheme();
  const fallback: keyof Colors = variant === 'eyebrow' ? 'muted' : 'text';
  return (
    <RNText
      selectable={selectable}
      numberOfLines={numberOfLines}
      style={[VARIANTS[variant], { color: colors[color ?? fallback] }, align ? { textAlign: align } : null, style]}
    >
      {children}
    </RNText>
  );
}
