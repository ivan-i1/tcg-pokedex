import { request } from '@/engines/api';

/** Response of GET /v1/coverage (server/api.ts). */
export type NamedPokemon = { dex: number; name: string };
export type Coverage = {
  total: number;
  coveredCount: number;
  setCount: number;
  picks: { set: { id: string; name: string; releaseDate: string }; newPokemon: NamedPokemon[] }[];
  missing: NamedPokemon[];
};

export const fetchCoverage = (signal?: AbortSignal) => request<Coverage>('/v1/coverage', { signal });
