import React from 'react';
import { View } from 'react-native';
import { fonts, useTheme } from '@/theme';
import { initials } from '@/utils/format';
import { Text } from './Text';

type Props = { name: string; size?: number };

export function Avatar({ name, size = 36 }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.accent, fontFamily: fonts.semibold, fontSize: size * 0.36, lineHeight: size * 0.5 }}>{initials(name)}</Text>
    </View>
  );
}
