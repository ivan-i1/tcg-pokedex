/**
 * Base URL of your backend, from EXPO_PUBLIC_API_URL (see .env.example). EXPO_PUBLIC_*
 * values are inlined into the JS bundle at build time — never put secrets here.
 * - An absolute URL ("https://host:port") for native apps and for a web app served elsewhere.
 * - "/" when the web app is served by the API itself (same origin; see server/Dockerfile).
 * Note: on an Android emulator, the host machine is 10.0.2.2, not localhost.
 */
const RAW = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
export const API_URL = RAW.replace(/\/+$/, '');
export const isApiConfigured = () => RAW.length > 0;
export const apiUrl = (path: string) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
