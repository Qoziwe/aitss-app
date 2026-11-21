import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { minTouch, radius, spacing, useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Option = { value: string; label: string };
type Props = { label?: string; value: string; options: Option[]; onChange: (v: string) => void };

export function Select({ label, value, options, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text variant="label" color="muted">{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={{ minHeight: minTouch, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }}
      >
        <Text numberOfLines={1} style={{ flex: 1 }}>{current?.label ?? 'Select'}</Text>
        <Icon name="chev" size={16} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ alignSelf: 'center', width: '100%', maxWidth: 420, maxHeight: '70%', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.sm }}>
            <ScrollView>
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={{ minHeight: minTouch, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, backgroundColor: active ? colors.accentSoft : 'transparent' }}
                  >
                    <Text variant={active ? 'bodyStrong' : 'body'}>{o.label}</Text>
                    {active ? <Icon name="check" size={18} color={colors.accent} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
