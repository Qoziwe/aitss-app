import { API_PREFIX, API_URL, USE_MOCK } from '@/config';
import { KEYS, getItem } from '@/storage/storage';
import { ApiError, NetworkError } from './errors';
import { mockRequest } from './mock/server';

export { ApiError, NetworkError, errorMessage, isNetworkError } from './errors';

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/**
 * One function for every request. Paths start with /lms/... or /ai/...
 * The Bearer token is read from the device storage.
 */
export async function api<T>(method: Method, path: string, body?: unknown): Promise<T> {
  if (USE_MOCK) return mockRequest<T>(method, path, body);

  const token = await getItem<string | null>(KEYS.token, null);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${API_PREFIX}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string; detail?: string; error?: string };
      message = data.message ?? data.detail ?? data.error ?? message;
    } catch {
      // body is not JSON: keep the default message
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
