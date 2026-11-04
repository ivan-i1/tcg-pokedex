import { readFileSync } from 'fs';
import { join } from 'path';

import { createApi } from '../server/api';
import { buildDataset, parseCsv, parseNationalDex, parseSetCsv, type SetMeta } from '../server/seed';

const DATA = join(__dirname, '..', 'server', 'data');

describe('parseCsv', () => {
  it('handles a BOM, quotes, embedded commas and CRLF', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });
});

describe('parseNationalDex', () => {
  it('keeps only "#NNNN" rows and skips regional-form rows', () => {
    expect(parseNationalDex('"#0019","Rattata"\n"Rattata",""\n"Alolan Form",""\n"#0020","Raticate"\n')).toEqual([
      { dex: 19, name: 'Rattata' },
      { dex: 20, name: 'Raticate' },
    ]);
  });
});

describe('parseSetCsv', () => {
  it('reads both header styles and skips rows without a dex number (Trainers, Energy)', () => {
    const a = 'dexNumber,name,setName,setNumber,rarity,type\n283,Surskit,Paradox Rift,001,Common,Grass\n,Boss\'s Orders,Paradox Rift,172,Uncommon,\n';
    const b = 'dexNumber,name,set,entryNumber,rarity,type\n187,Hoppip,Paldea Evolved,001,Common,Grass\n';
    expect(parseSetCsv(a, 'sv04')).toEqual([
      { id: 'sv04-001', setId: 'sv04', name: 'Surskit', number: '001', rarity: 'Common', dexNumbers: [283], subtypes: [] },
    ]);
    expect(parseSetCsv(b, 'sv02').map((c) => c.id)).toEqual(['sv02-001']);
  });
});

describe('buildDataset', () => {
  it('joins set metadata, card CSVs and the dex', () => {
    const sets: SetMeta[] = [{ id: 'x1', name: 'X', releaseDate: '2024-01-01', file: 'x1.csv' }];
    const d = buildDataset(sets, () => 'dexNumber,name,setName,setNumber,rarity,type\n1,Bulbasaur,X,001,Common,Grass\n', '"#0001","Bulbasaur"\n');
    expect(d.sets).toEqual([{ id: 'x1', name: 'X', releaseDate: '2024-01-01', language: 'en' }]);
    expect(d.cards).toHaveLength(1);
    expect(d.species).toEqual([{ dex: 1, name: 'Bulbasaur' }]);
  });
});

describe('api', () => {
  const sets: SetMeta[] = [
    { id: 'old', name: 'Old', releaseDate: '2020-01-01', file: 'old.csv' },
    { id: 'new', name: 'New', releaseDate: '2023-01-01', file: 'new.csv' },
  ];
  const csv: Record<string, string> = {
    'old.csv': 'dexNumber,name,setName,setNumber,rarity,type\n1,Bulbasaur,Old,001,Common,Grass\n2,Ivysaur,Old,002,Common,Grass\n',
    'new.csv': 'dexNumber,name,setName,setNumber,rarity,type\n1,Bulbasaur,New,001,Common,Grass\n',
  };
  const api = createApi(buildDataset(sets, (f) => csv[f], '"#0001","Bulbasaur"\n"#0002","Ivysaur"\n"#0003","Venusaur"\n'));

  it('answers health checks', () => {
    expect(api('GET', '/health')).toMatchObject({ status: 200, body: { ok: true } });
  });

  it('serves the coverage result newest first, with names', () => {
    const r = api('GET', '/v1/coverage');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      total: 3,
      coveredCount: 2,
      setCount: 2,
      picks: [
        { set: { id: 'new', name: 'New', releaseDate: '2023-01-01' }, newPokemon: [{ dex: 1, name: 'Bulbasaur' }] },
        { set: { id: 'old' }, newPokemon: [{ dex: 2, name: 'Ivysaur' }] },
      ],
      missing: [{ dex: 3, name: 'Venusaur' }],
    });
  });

  it('lists sets newest first with card counts', () => {
    const r = api('GET', '/v1/sets?x=1');
    expect(r.body).toEqual([
      { id: 'new', name: 'New', releaseDate: '2023-01-01', cardCount: 1 },
      { id: 'old', name: 'Old', releaseDate: '2020-01-01', cardCount: 2 },
    ]);
  });

  it('allows cross-origin reads and preflight', () => {
    expect(api('GET', '/health').headers['access-control-allow-origin']).toBe('*');
    expect(api('OPTIONS', '/v1/coverage').status).toBe(204);
  });

  it("allows the app client's x-client-id header in preflight", () => {
    expect(api('OPTIONS', '/v1/coverage').headers['access-control-allow-headers']).toContain('x-client-id');
  });

  it('rejects unknown routes and methods', () => {
    expect(api('GET', '/nope').status).toBe(404);
    expect(api('POST', '/v1/coverage').status).toBe(405);
  });
});

describe('the committed Drive seed', () => {
  const sets: SetMeta[] = JSON.parse(readFileSync(join(DATA, 'sets.json'), 'utf8'));
  const data = buildDataset(sets, (f) => readFileSync(join(DATA, 'drive', f), 'utf8'), readFileSync(join(DATA, 'national-dex.csv'), 'utf8'));
  const body = createApi(data)('GET', '/v1/coverage').body as { total: number; coveredCount: number; picks: { set: { id: string } }[] };

  it('loads all 22 sets and the 1021-entry dex', () => {
    expect(data.sets).toHaveLength(22);
    expect(data.species).toHaveLength(1021);
  });

  it('starts from the newest set in the data (Paradox Rift)', () => {
    expect(body.picks[0].set.id).toBe('sv04');
    expect(body.coveredCount).toBeGreaterThan(0);
    expect(body.coveredCount).toBeLessThanOrEqual(body.total);
  });
});
