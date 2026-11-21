import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';

type Props = { value: boolean; onChange: (v: boolean) => void; label?: string };

export function Toggle({ value, onChange, label }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: value ? colors.accent : colors.line, justifyContent: 'center', padding: 3 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: value ? colors.onAccent : colors.card,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}
