import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storageKey } from '@/core/storage/keys';
import { DEFAULT_SETTINGS, mergeSettings, type Settings } from './settings';

type SettingsStore = Settings & {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
};

/**
 * Persisted settings. React reads it with `useSettings(s => s.theme)`; code that runs
 * outside React reads `useSettings.getState()`
 * synchronously — one source of truth, so there is no module-state/React-state dual
 * write to keep in sync.
 */
export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: storageKey('settings'),
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _set, reset: _reset, ...settings }) => settings,
      // Storage is untrusted: clamp and validate every field on the way in.
      merge: (persisted, current) => ({ ...current, ...mergeSettings(persisted) }),
    }
  )
);

export const getSettings = (): Settings => useSettings.getState();
