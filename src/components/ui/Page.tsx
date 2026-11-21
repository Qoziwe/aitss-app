import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { useLayout } from '@/hooks/useLayout';
import { spacing, useTheme } from '@/theme';
import { Avatar } from './Avatar';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
};

/** Standard screen: scroll, centered content, title row. Avatar opens the profile on phones. */
export function Page({ title, subtitle, eyebrow, right, children }: Props) {
  const { colors } = useTheme();
  const { isWide } = useLayout();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingHorizontal: isWide ? spacing.xxxl : spacing.lg,
        paddingTop: (isWide ? spacing.huge : spacing.lg) + (isWide ? 0 : insets.top),
        paddingBottom: spacing.giant + spacing.xl,
        alignItems: 'center',
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ width: '100%', maxWidth: 1080, gap: spacing.xxxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg }}>
          <View style={{ flex: 1, gap: 6 }}>
            {eyebrow ? <Text variant="eyebrow">{eyebrow}</Text> : null}
            <Text variant="title">{title}</Text>
            {subtitle ? <Text color="muted">{subtitle}</Text> : null}
          </View>
          {right}
          {!isWide && user ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => router.push(`/${user.role}/profile` as never)}
            >
              <Avatar name={user.full_name} size={40} />
            </Pressable>
          ) : null}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}
