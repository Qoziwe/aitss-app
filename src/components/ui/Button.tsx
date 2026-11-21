import React, { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { minTouch, radius, spacing, useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = {
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md';
  icon?: IconName;
  iconRight?: IconName;
  /** Route to open. Use onPress for actions. */
  href?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  selected?: boolean;
  children?: ReactNode;
};

export function Button({ label, variant = 'primary', size = 'md', icon, iconRight, href, onPress, disabled, loading, full, selected, children }: Props) {
  const { colors } = useTheme();

  const bg =
    variant === 'primary' ? colors.accent : variant === 'secondary' ? (selected ? colors.accentSoft : colors.card) : 'transparent';
  const fg = variant === 'primary' ? colors.onAccent : variant === 'link' || selected ? colors.accent : colors.text;
  const border = variant === 'secondary' ? (selected ? colors.accent : colors.line) : 'transparent';

  const handle = () => {
    if (disabled || loading) return;
    if (href) router.push(href as never);
    else onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      onPress={handle}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: size === 'sm' ? 36 : minTouch,
        paddingHorizontal: variant === 'link' ? 0 : size === 'sm' ? spacing.md : spacing.lg,
        borderRadius: radius.md,
        backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: full ? 'stretch' : 'flex-start',
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
        {label ? (
          <Text variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} style={{ color: fg }}>
            {label}
          </Text>
        ) : null}
        {children}
        {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
      </View>
    </Pressable>
  );
}
