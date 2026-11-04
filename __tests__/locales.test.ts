import { resources } from '@/core/i18n/resources';
import { SUPPORTED_LANGUAGES } from '@/core/i18n/languages';

type Tree = { [k: string]: string | Tree };
const keys = (t: Tree, prefix = ''): string[] =>
  Object.entries(t).flatMap(([k, v]) => (typeof v === 'string' ? [prefix + k] : keys(v, `${prefix}${k}.`)));

describe('locale files', () => {
  // CLDR plural suffixes differ per language (es/fr/it/pt need `_many`, en does not),
  // so compare the base keys and separately require `_one` + `_other` for every plural.
  const PLURAL = /_(zero|one|two|few|many|other)$/;
  const base = (lang: keyof typeof resources) =>
    [...new Set(keys(resources[lang].translation as Tree).map((k) => k.replace(PLURAL, '')))].sort();
  const reference = base('en');
  it.each(SUPPORTED_LANGUAGES.filter((l) => l !== 'en'))('%s has exactly the same keys as en', (lang) => {
    expect(base(lang)).toEqual(reference);
  });
  it.each([...SUPPORTED_LANGUAGES])('%s defines _one and _other for every plural', (lang) => {
    const all = keys(resources[lang].translation as Tree);
    for (const k of all.filter((k) => PLURAL.test(k))) {
      const stem = k.replace(PLURAL, '');
      expect(all).toEqual(expect.arrayContaining([`${stem}_one`, `${stem}_other`]));
    }
  });
  it.each([...SUPPORTED_LANGUAGES])('%s has no empty strings', (lang) => {
    const flat = JSON.stringify(resources[lang].translation);
    expect(flat).not.toMatch(/:""/);
  });
});
