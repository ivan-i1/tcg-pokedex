/**
 * Pure view logic for the coverage screen: Pokémon order by generation, rarity outline
 * groups and TCG energy-type colours. Type-only imports; tested in
 * __tests__/coverageModel.test.ts.
 */
import type { Coverage, PackRef } from './api';

export const GENERATIONS = [
  { gen: 1, from: 1, to: 151 }, // Bulbasaur – Mew
  { gen: 2, from: 152, to: 251 }, // Chikorita – Celebi
  { gen: 3, from: 252, to: 386 }, // Treecko – Deoxys
  { gen: 4, from: 387, to: 493 }, // Turtwig – Arceus
  { gen: 5, from: 494, to: 649 }, // Victini – Genesect
  { gen: 6, from: 650, to: 721 }, // Chespin – Volcanion
  { gen: 7, from: 722, to: 809 }, // Rowlet – Melmetal
  { gen: 8, from: 810, to: 905 }, // Grookey – Enamorus
  { gen: 9, from: 906, to: 1025 }, // Sprigatito – Pecharunt
] as const;

export const generationOf = (dex: number) => GENERATIONS.find((g) => dex >= g.from && dex <= g.to)?.gen ?? 0;

/** One Pokémon in Pokémon order. `set` is the pack that covers it; absent when no pack does. */
export type DexEntry = { dex: number; name: string; type?: string; rarity?: string; number?: string; set?: PackRef };
export type GenerationGroup = { gen: number; from: number; to: number; entries: DexEntry[] };

/** Every Pokémon (covered and missing) by dex number, grouped by generation; optionally one pack only. */
export function pokemonOrder(c: Coverage, setId?: string): GenerationGroup[] {
  const entries: DexEntry[] = [];
  for (const p of c.picks) {
    if (setId && p.set.id !== setId) continue;
    for (const x of p.newPokemon) entries.push({ ...x, set: p.set });
  }
  if (!setId) entries.push(...c.missing);
  entries.sort((a, b) => a.dex - b.dex);
  return GENERATIONS.map((g) => ({ ...g, entries: entries.filter((e) => e.dex >= g.from && e.dex <= g.to) })).filter(
    (g) => g.entries.length > 0
  );
}

/**
 * Outline groups. Five come from the brief (common green, uncommon blue, rare red,
 * rainbow white, secret gold); the other rarities in the data share the four extra
 * colours by family.
 */
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'rainbow' | 'secret' | 'holo' | 'ultra' | 'illustration' | 'shiny' | 'none';

const TIERS: Record<string, RarityTier> = {
  Common: 'common',
  Uncommon: 'uncommon',
  Rare: 'rare',
  'Rare Rainbow': 'rainbow',
  'Rare Secret': 'secret',
  'Hyper Rare': 'secret', // gold cards
  'Rare Holo': 'holo',
  'Double Rare': 'ultra',
  'Rare Ultra': 'ultra',
  'Ultra Rare': 'ultra',
  'Ultra-Rare Rare': 'ultra',
  'Rare VMAX': 'ultra',
  'Rare VSTAR': 'ultra',
  'Illustration Rare': 'illustration',
  'Special Illustration Rare': 'illustration',
  'Rare Radiant': 'shiny',
  A: 'shiny', // "Amazing Rare" in Vivid Voltage / Shining Fates, abbreviated in the data
};

export const rarityTier = (rarity: string | undefined): RarityTier => (rarity ? (TIERS[rarity] ?? 'none') : 'none');

export const RARITY_OUTLINE: Record<RarityTier, string> = {
  common: '#2E9E44', // green
  uncommon: '#2F6FE0', // blue
  rare: '#D62828', // red
  rainbow: '#FFFFFF', // white
  secret: '#F2B705', // gold
  holo: '#8E44AD', // purple
  ultra: '#E85AAD', // pink
  illustration: '#F28C28', // orange
  shiny: '#22C3D6', // cyan
  none: 'transparent',
};

/** Rarity groups in the order the legend shows them. */
export const RARITY_LEGEND: Exclude<RarityTier, 'none'>[] = ['common', 'uncommon', 'rare', 'holo', 'ultra', 'illustration', 'shiny', 'rainbow', 'secret'];

const TYPE_BG: Record<string, string> = {
  Grass: '#4E9F3D',
  Fire: '#E4572E',
  Water: '#2F8FE0',
  Lightning: '#F7D02C',
  Psychic: '#A35BC4',
  Fighting: '#C0703A',
  Darkness: '#2E4A4F',
  Metal: '#9AA5AE',
  Dragon: '#B08D2C',
  Colorless: '#E8E2D0',
  Fairy: '#EC8FC1',
};
const UNKNOWN_BG = '#8E8E93';

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Chip colours for a card's energy type; gray when unknown or the Pokémon has no card. */
export function typeColors(type: string | undefined): { bg: string; fg: string } {
  const bg = (type && TYPE_BG[type]) || UNKNOWN_BG;
  const l = luminance(bg);
  const fg = contrast(l, luminance('#1A1A1A')) >= contrast(l, 1) ? '#1A1A1A' : '#FFFFFF';
  return { bg, fg };
}
