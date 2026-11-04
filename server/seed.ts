/**
 * Turns the Google Drive seed (one CSV per set, a National Dex CSV, sets.json) into the
 * coverage model. Pure: file access is injected, so this runs under jest and in Node.
 *
 * The Drive CSVs carry no stage, subtype or "evolves from" data, so every card has empty
 * subtypes and no species has a pre-evolution: the evolution rule cannot apply yet.
 */
import type { Card, CardSet, Species } from '../src/core/coverage/coverage.ts';

export type SetMeta = { id: string; name: string; releaseDate: string; file: string };
export type Dataset = { sets: CardSet[]; cards: Card[]; species: Species[] };

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, CRLF, leading BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * The NationalDex sheet: "#0001","Bulbasaur" rows; regional-form rows are skipped. Some
 * cells list the default form on later lines ("Deoxys\nNormal Forme"): keep line one.
 */
export function parseNationalDex(text: string): Species[] {
  const out: Species[] = [];
  for (const [id, cell] of parseCsv(text)) {
    const m = /^#(\d+)$/.exec((id ?? '').trim());
    const name = (cell ?? '').split(/\r?\n/)[0].trim();
    if (m && name) out.push({ dex: Number(m[1]), name });
  }
  return out;
}

/** One set CSV. Accepts both header styles (setName/setNumber and set/entryNumber). */
export function parseSetCsv(text: string, setId: string): Card[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h.trim()));
  const iDex = col('dexNumber');
  const iName = col('name');
  const iNum = col('setNumber', 'entryNumber');
  const iRarity = col('rarity');
  const cards: Card[] = [];
  for (const r of rows) {
    const dex = (r[iDex] ?? '').trim();
    if (!/^\d+$/.test(dex)) continue; // Trainers and Energy have no dex number
    const number = (r[iNum] ?? '').trim();
    cards.push({
      id: `${setId}-${number}`,
      setId,
      name: (r[iName] ?? '').trim(),
      number,
      rarity: (r[iRarity] ?? '').trim(),
      dexNumbers: [Number(dex)],
      subtypes: [],
    });
  }
  return cards;
}

export function buildDataset(sets: SetMeta[], readSetFile: (file: string) => string, nationalDexText: string): Dataset {
  return {
    sets: sets.map(({ id, name, releaseDate }) => ({ id, name, releaseDate, language: 'en' })),
    cards: sets.flatMap((s) => parseSetCsv(readSetFile(s.file), s.id)),
    species: parseNationalDex(nationalDexText),
  };
}
