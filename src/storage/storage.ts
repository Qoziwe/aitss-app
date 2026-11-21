import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin wrapper over AsyncStorage: JSON in, JSON out, never throws.

export const KEYS = {
  theme: 'aitss.theme',
  language: 'aitss.language',
  token: 'aitss.token',
  user: 'aitss.user',
  offlineBundles: 'aitss.offline.bundles',
  offlineQueue: 'aitss.offline.queue',
} as const;

export async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best-effort: the app keeps working with in-memory state.
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}
