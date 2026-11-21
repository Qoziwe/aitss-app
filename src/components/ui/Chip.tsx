import React from 'react';
import { View } from 'react-native';
import { radius, useTheme } from '@/theme';
import { toneColors, type Tone } from '@/utils/mastery';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = { label: string; tone?: Tone; icon?: IconName };

/** Small label. Neutral = outline only. Status tones = soft fill, used only for status. */
export function Chip({ label, tone = 'neutral', icon }: Props) {
  const { colors } = useTheme();
  const t = toneColors(colors, tone);
  const neutral = tone === 'neutral';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: neutral ? 'transparent' : t.bg,
        borderWidth: neutral ? 1 : 0,
        borderColor: colors.line,
      }}
    >
      {icon ? <Icon name={icon} size={14} color={t.fg} strokeWidth={2} /> : null}
      <Text variant="smallStrong" style={{ color: t.fg, fontSize: 13, lineHeight: 18 }}>
        {label}
      </Text>
    </View>
  );
}
