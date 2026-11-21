import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './client';

// Small data hook: cached data is shown at once, then refreshed from the server.
// The key must contain every parameter of the request, e.g. `group.${id}`.

const cache = new Map<string, unknown>();

export function clearQueryCache(): void {
  cache.clear();
}

export function invalidateQuery(key: string): void {
  cache.delete(key);
}

export function invalidatePrefix(prefix: string): void {
  for (const k of Array.from(cache.keys())) if (k.startsWith(prefix)) cache.delete(k);
}

export type QueryResult<T> = {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
  /** Replace the data locally (optimistic update). */
  mutate: (next: T | ((prev: T | undefined) => T)) => void;
};

export function useQuery<T>(key: string, fetcher: () => Promise<T>): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(() => cache.get(key) as T | undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !cache.has(key));
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      cache.set(key, result);
      setData(result);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    setData(cache.get(key) as T | undefined);
    setLoading(!cache.has(key));
    void load();
  }, [key, load]);

  const mutate = useCallback(
    (next: T | ((prev: T | undefined) => T)) => {
      setData((prev) => {
        const value = typeof next === 'function' ? (next as (p: T | undefined) => T)(prev) : next;
        cache.set(key, value);
        return value;
      });
    },
    [key],
  );

  return { data, error, loading, refetch: load, mutate };
}
