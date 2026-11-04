import AsyncStorage from '@react-native-async-storage/async-storage';

import { storageKey } from '@/core/storage/keys';

const KEY = storageKey('client-id');
let cached: string | null = null;

function uuidv4(): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Anonymous, persisted install id — sent as `x-client-id` so a backend can apply
 * per-install quotas without accounts. Persisted: regenerating it on each launch would
 * reset any server-side quota (a bug Tessera had).
 */
export async function getClientId(): Promise<string> {
  if (cached) return cached;
  const stored = await AsyncStorage.getItem(KEY).catch(() => null);
  cached = stored ?? uuidv4();
  if (!stored) await AsyncStorage.setItem(KEY, cached).catch(() => {});
  return cached;
}
