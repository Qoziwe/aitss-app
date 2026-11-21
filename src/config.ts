// Runtime config. Values come from .env (see .env.example). EXPO_PUBLIC_* are inlined at build time.

/** Backend root, without /api/v1. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Prefix shared by the Flask (/lms) and FastAPI (/ai) modules. */
export const API_PREFIX = '/api/v1';

/** true: every request is answered by the built-in mock server (src/api/mock). false: real backend. */
export const USE_MOCK = (process.env.EXPO_PUBLIC_USE_MOCK ?? 'true') === 'true';
