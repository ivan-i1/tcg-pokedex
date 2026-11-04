import Constants from 'expo-constants';

/**
 * Every AsyncStorage key is namespaced by the app slug, so two apps built from Base
 * App never read each other's data on web (where storage is per-origin, and
 * localhost:8081 is shared by every app you develop).
 */
const prefix = `@${Constants.expoConfig?.slug ?? 'app'}`;

export const storageKey = (name: string) => `${prefix}:${name}`;
