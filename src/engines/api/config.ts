/**
 * Base URL of your backend, from EXPO_PUBLIC_API_URL (see .env.example). EXPO_PUBLIC_*
 * values are inlined into the JS bundle at build time — never put secrets here.
 * Note: on an Android emulator, the host machine is 10.0.2.2, not localhost.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
export const isApiConfigured = () => API_URL.length > 0;
export const apiUrl = (path: string) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
