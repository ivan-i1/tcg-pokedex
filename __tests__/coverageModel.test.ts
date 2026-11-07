import type { Coverage } from '@/features/coverage/api';
import {
  GENERATIONS,
  RARITY_OUTLINE,
  generationOf,
  pokemonOrder,
  rarityTier,
  typeColors,
} from '@/features/coverage/model';

const COVERAGE: Coverage = {
  total: 5,
  coveredCount: 4,
  setCount: 2,
  picks: [
    {
      set: { id: 'new', name: 'New', releaseDate: '2023-11-03' },
      newPokemon: [
        { dex: 152, name: 'Chikorita', type: 'Grass', rarity: 'Common', number: '001' },
        { dex: 25, name: 'Pikachu', type: 'Lightning', rarity: 'Rare', number: '050' },
      ],
    },
    {
      set: { id: 'old', name: 'Old', releaseDate: '2020-02-07' },
      newPokemon: [
        { dex: 1, name: 'Bulbasaur', type: 'Grass', rarity: 'Common', number: '001' },
        { dex: 1021, name: 'Raging Bolt', type: 'Dragon', rarity: 'Double Rare', number: '123' },
      ],
    },
  ],
  missing: [{ dex: 151, name: 'Mew' }],
};

describe('generations', () => {
  it('split the National Dex at the official boundaries', () => {
    expect(GENERATIONS.map((g) => [g.gen, g.from, g.to])).toEqual([
      [1, 1, 151],
      [2, 152, 251],
      [3, 252, 386],
      [4, 387, 493],
      [5, 494, 649],
      [6, 650, 721],
      [7, 722, 809],
      [8, 810, 905],
      [9, 906, 1025],
    ]);
    expect([1, 151, 152, 809, 810, 906, 1021].map(generationOf)).toEqual([1, 1, 2, 7, 8, 9, 9]);
  });
});

describe('pokemonOrder', () => {
  it('lists every Pokémon by dex number, grouped by generation, with the pack that covers it', () => {
    const groups = pokemonOrder(COVERAGE);
    expect(groups.map((g) => [g.gen, g.entries.map((e) => [e.dex, e.set?.id ?? null])])).toEqual([
      [1, [[1, 'old'], [25, 'new'], [151, null]]],
      [2, [[152, 'new']]],
      [9, [[1021, 'old']]],
    ]);
  });

  it('keeps only one pack’s Pokémon when filtered', () => {
    const groups = pokemonOrder(COVERAGE, 'new');
    expect(groups.flatMap((g) => g.entries.map((e) => e.dex))).toEqual([25, 152]);
  });
});

describe('rarityTier', () => {
  it('maps the five named rarities to their outline groups', () => {
    expect(['Common', 'Uncommon', 'Rare', 'Rare Rainbow', 'Rare Secret'].map(rarityTier)).toEqual([
      'common',
      'uncommon',
      'rare',
      'rainbow',
      'secret',
    ]);
  });

  it('groups the other rarities into the four extra colours', () => {
    expect(rarityTier('Rare Holo')).toBe('holo');
    for (const r of ['Double Rare', 'Rare Ultra', 'Ultra Rare', 'Ultra-Rare Rare', 'Rare VMAX', 'Rare VSTAR']) expect(rarityTier(r)).toBe('ultra');
    for (const r of ['Illustration Rare', 'Special Illustration Rare']) expect(rarityTier(r)).toBe('illustration');
    for (const r of ['Rare Radiant', 'A']) expect(rarityTier(r)).toBe('shiny');
    expect(rarityTier('Hyper Rare')).toBe('secret');
    expect(rarityTier(undefined)).toBe('none');
    expect(rarityTier('Something New')).toBe('none');
  });

  it('gives each group a distinct outline colour', () => {
    const colours = Object.entries(RARITY_OUTLINE).filter(([k]) => k !== 'none').map(([, v]) => v);
    expect(new Set(colours).size).toBe(colours.length);
  });
});

describe('typeColors', () => {
  it('uses TCG energy colours, gray for unknown or missing', () => {
    expect(typeColors('Lightning').bg).not.toBe(typeColors('Grass').bg);
    expect(typeColors(undefined)).toEqual(typeColors('Item'));
  });

  it('picks dark text on light chips and light text on dark chips', () => {
    expect(typeColors('Lightning').fg).toBe('#1A1A1A');
    expect(typeColors('Darkness').fg).toBe('#FFFFFF');
  });
});
