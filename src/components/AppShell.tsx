import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lmsApi } from '@/api/endpoints';
import { useQuery } from '@/api/useQuery';
import type { TeacherDashboard } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { useLayout } from '@/hooks/useLayout';
import { Avatar, Icon, Text, type IconName } from '@/components/ui';
import { radius, spacing, useTheme } from '@/theme';
import type { Role } from '@/api/types';

type NavItem = { key: string; label: string; short: string; icon: IconName; href: string; match: string; badge?: number };

function useNav(role: Role): { main: NavItem[]; settings: NavItem; profile: NavItem; tabs: NavItem[] } {
  // The teacher dashboard is cached: this costs no extra request when the screen is open.
  const teacher = useQuery<TeacherDashboard | null>(role === 'teacher' ? 'teacher.dashboard' : 'nav.student', async () => (role === 'teacher' ? lmsApi.teacherDashboard() : null));
  const firstGroup = teacher.data?.groups[0]?.id ?? 1;
  const pending = teacher.data?.escalations.length ?? 0;

  if (role === 'student') {
    const main: NavItem[] = [
      { key: 'home', label: 'Home', short: 'Home', icon: 'home', href: '/student/dashboard', match: '/student/dashboard' },
      { key: 'subjects', label: 'Subjects', short: 'Subjects', icon: 'book', href: '/student/subjects', match: '/student/subjects' },
      { key: 'tutor', label: 'AI Tutor', short: 'Tutor', icon: 'chat', href: '/student/tutor', match: '/student/tutor' },
      { key: 'graph', label: 'Knowledge Graph', short: 'Graph', icon: 'graph', href: '/student/graph', match: '/student/graph' },
      { key: 'homework', label: 'Homework', short: 'Tasks', icon: 'task', href: '/student/homework', match: '/student/homework' },
    ];
    return {
      main,
      tabs: main,
      settings: { key: 'settings', label: 'Settings', short: 'Settings', icon: 'gear', href: '/student/settings', match: '/student/settings' },
      profile: { key: 'profile', label: 'Profile', short: 'Profile', icon: 'user', href: '/student/profile', match: '/student/profile' },
    };
  }

  const main: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', short: 'Home', icon: 'home', href: '/teacher/dashboard', match: '/teacher/dashboard', badge: pending },
    { key: 'groups', label: 'My Study Groups', short: 'Groups', icon: 'users', href: `/teacher/groups/${firstGroup}`, match: '/teacher/groups' },
    { key: 'lessons', label: 'Lessons', short: 'Lessons', icon: 'book', href: '/teacher/lessons', match: '/teacher/lessons' },
    { key: 'calendar', label: 'Calendar', short: 'Calendar', icon: 'calendar', href: '/teacher/calendar', match: '/teacher/calendar' },
  ];
  const settings: NavItem = { key: 'settings', label: 'Settings', short: 'Settings', icon: 'gear', href: '/teacher/settings', match: '/teacher/settings' };
  const profile: NavItem = { key: 'profile', label: 'Profile', short: 'Profile', icon: 'user', href: '/teacher/profile', match: '/teacher/profile' };
  return { main, settings, profile, tabs: [...main, settings] };
}

function Logo() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bolt" size={18} color={colors.onAccent} />
      </View>
      <Text variant="h2">AITSS</Text>
    </View>
  );
}

function SideItem({ item, active }: { item: NavItem; active: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => router.push(item.href as never)}
      style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: active ? colors.accentSoft : 'transparent' }}
    >
      <Icon name={item.icon} size={20} color={active ? colors.accent : colors.muted} />
      <Text variant={active ? 'bodyStrong' : 'body'} color={active ? 'accent' : 'muted'} style={{ flex: 1 }}>
        {item.label}
      </Text>
      {item.badge ? (
        <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.bad, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="smallStrong" style={{ color: colors.card, fontSize: 12, lineHeight: 16 }}>{item.badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Sidebar({ role, nav, pathname }: { role: Role; nav: ReturnType<typeof useNav>; pathname: string }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isActive = (i: NavItem) => pathname.startsWith(i.match);
  return (
    <View style={{ width: 264, backgroundColor: colors.card, borderRightWidth: 1, borderRightColor: colors.line, padding: spacing.lg, gap: spacing.xl }}>
      <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
        <Logo />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 4 }}>
        {nav.main.map((i) => (
          <SideItem key={i.key} item={i} active={isActive(i)} />
        ))}
      </ScrollView>
      <View style={{ gap: 4 }}>
        <SideItem item={nav.settings} active={isActive(nav.settings)} />
        {user ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push(nav.profile.href as never)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginTop: 8, borderRadius: radius.md, borderWidth: 1, borderColor: isActive(nav.profile) ? colors.accent : colors.line, backgroundColor: isActive(nav.profile) ? colors.accentSoft : 'transparent' }}
          >
            <Avatar name={user.full_name} size={36} />
            <View style={{ flex: 1 }}>
              <Text variant="smallStrong" numberOfLines={1}>{user.full_name}</Text>
              <Text variant="small" color="muted">{role === 'student' ? 'Student' : 'Teacher'}</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function TabBar({ nav, pathname }: { nav: ReturnType<typeof useNav>; pathname: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 6), paddingTop: 6 }}>
      {nav.tabs.map((i) => {
        const active = pathname.startsWith(i.match);
        return (
          <Pressable
            key={i.key}
            accessibilityRole="button"
            accessibilityLabel={i.label}
            accessibilityState={{ selected: active }}
            onPress={() => router.push(i.href as never)}
            style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            <View>
              <Icon name={i.icon} size={22} color={active ? colors.accent : colors.muted} />
              {i.badge ? <View style={{ position: 'absolute', top: -2, right: -6, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bad }} /> : null}
            </View>
            <Text variant="small" color={active ? 'accent' : 'muted'} style={{ fontSize: 12, lineHeight: 16 }}>
              {i.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Side menu on wide screens, bottom tab bar on phones. */
export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { colors } = useTheme();
  const { isWide } = useLayout();
  const pathname = usePathname();
  const nav = useNav(role);

  return (
    <View style={{ flex: 1, flexDirection: isWide ? 'row' : 'column', backgroundColor: colors.bg }}>
      {isWide ? <Sidebar role={role} nav={nav} pathname={pathname} /> : null}
      <View style={{ flex: 1 }}>{children}</View>
      {!isWide ? <TabBar nav={nav} pathname={pathname} /> : null}
    </View>
  );
}
