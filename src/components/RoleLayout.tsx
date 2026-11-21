import React from 'react';
import { Redirect, Slot } from 'expo-router';
import type { Role } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { AppShell } from './AppShell';

/** Guards a section: signed out -> /auth, wrong role -> own dashboard. */
export function RoleLayout({ role }: { role: Role }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Redirect href="/auth" />;
  if (user.role !== role) return <Redirect href={`/${user.role}/dashboard` as never} />;
  return (
    <AppShell role={role}>
      <Slot />
    </AppShell>
  );
}
