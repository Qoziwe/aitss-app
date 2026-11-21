import React from 'react';
import { Pressable, View } from 'react-native';
import { minTouch, radius, useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Option<V extends string> = { value: V; label: string; icon?: IconName };
type Props<V extends string> = { options: Option<V>[]; value: V; onChange: (v: V) => void };

export function Segmented<V extends string>({ options, value, onChange }: Props<V>) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.fill, borderRadius: radius.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minHeight: minTouch - 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: radius.sm,
              backgroundColor: active ? colors.card : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: colors.line,
            }}
          >
            {o.icon ? <Icon name={o.icon} size={16} color={active ? colors.accent : colors.muted} /> : null}
            <Text variant="smallStrong" color={active ? 'text' : 'muted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
