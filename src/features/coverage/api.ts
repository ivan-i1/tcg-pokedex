import { request } from '@/engines/api';

/** Response of GET /v1/coverage (server/api.ts). */
export type NamedPokemon = { dex: number; name: string };
/** A Pokémon a pack adds, described by the lowest-numbered card that covers it. */
export type PackPokemon = NamedPokemon & { type: string; rarity: string; number: string };
export type PackRef = { id: string; name: string; releaseDate: string };
export type Coverage = {
  total: number;
  coveredCount: number;
  setCount: number;
  picks: { set: PackRef; newPokemon: PackPokemon[] }[];
  missing: NamedPokemon[];
};

export const fetchCoverage = (signal?: AbortSignal) => request<Coverage>('/v1/coverage', { signal });
