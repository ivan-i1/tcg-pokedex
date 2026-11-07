import { cardCovers, solveReverseRelease, type Card, type CardSet, type Species } from '@/core/coverage/coverage';

// A tiny Pokédex: Charmander line, Mewtwo (no evolutions), Pichu/Pikachu.
const SPECIES: Species[] = [
  { dex: 4, name: 'Charmander' },
  { dex: 5, name: 'Charmeleon', evolvesFrom: 4 },
  { dex: 6, name: 'Charizard', evolvesFrom: 5 },
  { dex: 150, name: 'Mewtwo' },
  { dex: 172, name: 'Pichu' },
  { dex: 25, name: 'Pikachu', evolvesFrom: 172 },
];
const byDex = new Map(SPECIES.map((s) => [s.dex, s]));

let n = 0;
const card = (setId: string, dex: number[], subtypes: string[], extra: Partial<Card> = {}): Card => ({
  id: `${setId}-${++n}`,
  setId,
  name: extra.name ?? dex.map((d) => byDex.get(d)?.name).join(' & '),
  dexNumbers: dex,
  subtypes,
  ...extra,
});

describe('cardCovers (eligibility rules)', () => {
  it('lets any single-Pokémon card cover a species with no pre-evolution', () => {
    expect(cardCovers(card('s', [150], ['Basic', 'EX']), byDex)).toEqual([150]);
    expect(cardCovers(card('s', [4], ['Basic']), byDex)).toEqual([4]);
  });

  it('rejects a Basic card of an evolved species (Charizard EX)', () => {
    expect(cardCovers(card('s', [6], ['Basic', 'EX'], { name: 'Charizard-EX' }), byDex)).toEqual([]);
  });

  it('accepts an evolved species printed as Stage 1/2 or with evolvesFrom', () => {
    expect(cardCovers(card('s', [6], ['Stage 2']), byDex)).toEqual([6]);
    expect(cardCovers(card('s', [5], [], { evolvesFrom: 'Charmander' }), byDex)).toEqual([5]);
  });

  it('rejects Tag Team cards', () => {
    expect(cardCovers(card('s', [25, 150], ['Basic', 'TAG TEAM', 'GX']), byDex)).toEqual([]);
  });

  it('rejects Mega Evolution cards, by subtype or by name', () => {
    expect(cardCovers(card('s', [150], ['MEGA', 'EX'], { name: 'M Mewtwo-EX' }), byDex)).toEqual([]);
    expect(cardCovers(card('s', [150], ['Basic', 'ex'], { name: 'Mega Mewtwo ex' }), byDex)).toEqual([]);
  });

  it('ignores Pokédex numbers outside the catalog', () => {
    expect(cardCovers(card('s', [9999], ['Basic']), byDex)).toEqual([]);
  });
});

describe('solveReverseRelease (greedy, newest first)', () => {
  const sets: CardSet[] = [
    { id: 'old', name: 'Old', releaseDate: '1999-01-09' },
    { id: 'mid', name: 'Mid', releaseDate: '2010-05-01' },
    { id: 'new', name: 'New', releaseDate: '2024-03-22' },
    { id: 'jp', name: 'Japanese only', releaseDate: '2025-01-01', language: 'ja' },
  ];
  const cards: Card[] = [
    card('new', [150], ['Basic']),
    card('new', [6], ['Basic', 'ex'], { name: 'Charizard ex' }), // evolved species as Basic: does not count
    card('mid', [150], ['Basic']), // already covered by New
    card('mid', [4], ['Basic']),
    card('mid', [6], ['Stage 2']),
    card('old', [5], ['Stage 1']),
    card('old', [172], ['Basic']),
    card('jp', [25], ['Stage 1']), // not English: ignored
  ];

  it('walks sets newest to oldest and keeps only sets that add new Pokémon', () => {
    const r = solveReverseRelease({ sets, cards, species: SPECIES });
    expect(r.picks.map((p) => [p.set.id, p.newDex])).toEqual([
      ['new', [150]],
      ['mid', [4, 6]],
      ['old', [5, 172]],
    ]);
    expect(r.setCount).toBe(3);
  });

  it('reports species no eligible English card covers', () => {
    const r = solveReverseRelease({ sets, cards, species: SPECIES });
    expect(r.missing).toEqual([25]);
    expect(r.coveredCount).toBe(5);
    expect(r.total).toBe(6);
  });

  it('skips a set that adds nothing new', () => {
    const r = solveReverseRelease({
      sets: [...sets, { id: 'dup', name: 'Dup', releaseDate: '2024-01-01' }],
      cards: [...cards, card('dup', [150], ['Basic'])],
      species: SPECIES,
    });
    expect(r.picks.map((p) => p.set.id)).not.toContain('dup');
  });

  it('stops as soon as everything is covered', () => {
    const r = solveReverseRelease({
      sets,
      cards: [...cards, card('new', [4], ['Basic']), card('new', [5], ['Stage 1']), card('new', [6], ['Stage 2']), card('new', [172], ['Basic']), card('new', [25], ['Stage 1'])],
      species: SPECIES,
    });
    expect(r.picks.map((p) => p.set.id)).toEqual(['new']);
    expect(r.missing).toEqual([]);
  });

  it('breaks release-date ties deterministically by set id', () => {
    const tie: CardSet[] = [
      { id: 'b', name: 'B', releaseDate: '2020-01-01' },
      { id: 'a', name: 'A', releaseDate: '2020-01-01' },
    ];
    const r = solveReverseRelease({
      sets: tie,
      cards: [card('a', [150], ['Basic']), card('b', [150], ['Basic'])],
      species: SPECIES,
    });
    expect(r.picks.map((p) => p.set.id)).toEqual(['a']);
  });
});
