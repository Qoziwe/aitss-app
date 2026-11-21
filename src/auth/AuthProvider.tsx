import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { lmsApi } from '@/api/endpoints';
import { clearQueryCache } from '@/api/useQuery';
import type { AuthResponse, LoginBody, RegisterBody, User } from '@/api/types';
import { KEYS, getItem, removeItem, setItem } from '@/storage/storage';

type AuthContextValue = {
  user: User | null;
  /** False until the saved session is read from the device. */
  ready: boolean;
  login: (body: LoginBody) => Promise<User>;
  register: (body: RegisterBody) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getItem<User | null>(KEYS.user, null).then((saved) => {
      if (!alive) return;
      setUser(saved);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const finish = useCallback(async (res: AuthResponse) => {
    await setItem(KEYS.token, res.token);
    await setItem(KEYS.user, res.user);
    clearQueryCache();
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(async (body: LoginBody) => finish(await lmsApi.login(body)), [finish]);
  const register = useCallback(async (body: RegisterBody) => finish(await lmsApi.register(body)), [finish]);

  const logout = useCallback(async () => {
    await removeItem(KEYS.token);
    await removeItem(KEYS.user);
    clearQueryCache();
    setUser(null);
  }, []);

  const updateUser = useCallback((next: User) => {
    setUser(next);
    void setItem(KEYS.user, next);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout, updateUser }), [user, ready, login, register, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
