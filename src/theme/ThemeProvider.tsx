import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { KEYS, getItem, setItem } from '@/storage/storage';
import { colorsByScheme, type Colors, type Scheme, type ThemeMode } from './tokens';

export type ThemeContextValue = {
  /** What the user picked: light, dark or system. */
  mode: ThemeMode;
  /** What is actually shown right now. */
  scheme: Scheme;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
  /** False until the saved choice is read from the device. */
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getItem<ThemeMode>(KEYS.theme, 'system').then((saved) => {
      if (!alive) return;
      if (isMode(saved)) setModeState(saved);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void setItem(KEYS.theme, next);
  }, []);

  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors: colorsByScheme[scheme], setMode, ready }),
    [mode, scheme, setMode, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
