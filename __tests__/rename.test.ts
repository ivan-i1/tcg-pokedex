// eslint-disable-next-line @typescript-eslint/no-require-imports
const { identityFor } = require('../scripts/rename-app.js');

describe('identityFor', () => {
  it('derives store-safe identifiers from a display name', () => {
    expect(identityFor('Laberinto de Bolita', 'io.github.ivan_i1')).toEqual({
      name: 'Laberinto de Bolita',
      slug: 'laberinto-de-bolita',
      scheme: 'laberintodebolita',
      androidPackage: 'io.github.ivan_i1.laberinto_de_bolita',
      iosBundleId: 'io.github.ivan-i1.laberinto-de-bolita',
      storagePrefix: '@laberinto-de-bolita',
    });
  });
  it('strips accents and leading digits that stores reject', () => {
    const id = identityFor('3 Fútbol!', 'io.github.ivan_i1');
    expect(id.androidPackage).toBe('io.github.ivan_i1.app_3_futbol');
    expect(id.slug).toBe('3-futbol');
  });
});
