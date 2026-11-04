/**
 * Reverse-release coverage: which English sets, walked from newest to oldest, give
 * one eligible card for every Pokémon in the National Pokédex.
 *
 * Greedy by design (proof of concept): a set is kept when it adds at least one
 * species that no newer kept set already covers. This favours the most recent
 * sets; it does not minimise the number of sets.
 *
 * Import-free pure logic, tested in __tests__/coverage.test.ts.
 */

/** One National Pokédex entry. `evolvesFrom` is the dex number of its pre-evolution, if any. */
export type Species = { dex: number; name: string; evolvesFrom?: number };

export type CardSet = {
  id: string;
  name: string;
  /** ISO date (YYYY-MM-DD). pokemontcg.io's YYYY/MM/DD also sorts correctly. */
  releaseDate: string;
  /** Defaults to 'en'. Only English sets take part. */
  language?: string;
};

export type Card = {
  id: string;
  setId: string;
  name: string;
  /** National Pokédex numbers of the Pokémon on the card. */
  dexNumbers: number[];
  /** pokemontcg.io-style subtypes: 'Basic', 'Stage 1', 'Stage 2', 'TAG TEAM', 'MEGA', 'EX', … */
  subtypes: string[];
  /** The card's "Evolves from" text, if printed. */
  evolvesFrom?: string;
  /** Collector number within the set, e.g. "001". */
  number?: string;
  rarity?: string;
};

export type Pick = { set: CardSet; newDex: number[] };

export type CoverageResult = {
  picks: Pick[];
  setCount: number;
  coveredCount: number;
  total: number;
  /** Species that no eligible English card covers, ascending. */
  missing: number[];
};

const has = (card: Card, subtype: string) => card.subtypes.some((s) => s.toUpperCase() === subtype);
const isMega = (card: Card) => has(card, 'MEGA') || /^(M |Mega )/.test(card.name);

/**
 * The species this card counts for under the collection rules:
 * - Tag Team cards never count.
 * - Mega Evolution cards never count.
 * - A species with a pre-evolution only counts from a card that evolves from something
 *   (Stage 1, Stage 2 or printed "Evolves from"). So Charizard-EX (Basic) does not count,
 *   but Mewtwo-EX does.
 */
export function cardCovers(card: Card, species: ReadonlyMap<number, Species>): number[] {
  if (has(card, 'TAG TEAM') || isMega(card)) return [];
  const evolves = has(card, 'STAGE 1') || has(card, 'STAGE 2') || !!card.evolvesFrom;
  return card.dexNumbers.filter((dex) => {
    const s = species.get(dex);
    return s !== undefined && (s.evolvesFrom === undefined || evolves);
  });
}

const newestFirst = (a: CardSet, b: CardSet) =>
  a.releaseDate < b.releaseDate ? 1 : a.releaseDate > b.releaseDate ? -1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export function solveReverseRelease(input: { sets: CardSet[]; cards: Card[]; species: Species[] }): CoverageResult {
  const species = new Map(input.species.map((s) => [s.dex, s]));
  const bySet = new Map<string, Set<number>>();
  for (const card of input.cards) {
    const covers = cardCovers(card, species);
    if (covers.length === 0) continue;
    const dex = bySet.get(card.setId) ?? new Set<number>();
    covers.forEach((d) => dex.add(d));
    bySet.set(card.setId, dex);
  }

  const covered = new Set<number>();
  const picks: Pick[] = [];
  const english = input.sets.filter((s) => (s.language ?? 'en') === 'en').sort(newestFirst);
  for (const set of english) {
    if (covered.size === species.size) break;
    const newDex = [...(bySet.get(set.id) ?? [])].filter((d) => !covered.has(d)).sort((a, b) => a - b);
    if (newDex.length === 0) continue;
    newDex.forEach((d) => covered.add(d));
    picks.push({ set, newDex });
  }

  const missing = [...species.keys()].filter((d) => !covered.has(d)).sort((a, b) => a - b);
  return { picks, setCount: picks.length, coveredCount: covered.size, total: species.size, missing };
}
