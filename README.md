# TCG Pokédex

An installable app (Android, iOS and an installable PWA on the web) for one collecting goal: **own one Pokémon TCG card for every Pokémon in the National Pokédex** (more than 1,000 species).

Not every expansion prints every Pokémon. The app walks the expansions in **reverse release order**, newest first. It answers two questions:

- **How many** sets you need to cover the whole Pokédex.
- **Which** sets they are, and which Pokémon each set adds that newer sets did not already cover.

The app gets its card and set data from a server.

> **Status:** proof of concept. The greedy coverage algorithm, a read-only API with the seed data, and a "Sets to collect" screen work end to end. See [Roadmap](#roadmap).

## How the answer is computed

`src/core/coverage/coverage.ts` (pure logic, tested in `__tests__/coverage.test.ts`):

1. Take the English sets, sorted from newest to oldest.
2. Keep a set only if it adds at least one Pokémon that no newer kept set covers. Stop once every Pokémon is covered.
3. Card rules:
   - Tag Team cards never count.
   - Mega Evolution cards never count.
   - A Pokémon that evolves from another counts only from a Stage 1, Stage 2 or "Evolves from" card. Charizard EX (Basic) does not count; Mewtwo EX does.

This favours the most recent sets. It does not find the smallest possible number of sets.

**The seed data has no stage information**, so the evolution rule cannot apply yet: every card with a dex number counts.

## The "Sets to collect" screen

`src/app/coverage.tsx`, with its pure view logic in `src/features/coverage/model.ts`:

- **View options** at the top switch between:
  - **Pack order:** the answer, newest pack first.
  - **Pokémon order:** every Pokémon by dex number, split by generation (Gen 1 #1–151 … Gen 9 #906–1025).

  Later search refinements (for example including Mega Evolutions) belong in the same menu.
- **Chips:** each Pokémon is a chip showing `#dex name`. It describes the lowest-numbered card that covers it in its pack.
  - **Fill:** the card's energy type. Pokémon that no pack covers are gray with a dashed outline.
  - **Outline:** the rarity group. Common is green, uncommon blue, rare red, rainbow white, and secret/hyper gold. Holo is purple; ultra (ex, V, VMAX, VSTAR) is pink; illustration rares are orange; radiant/amazing rares are cyan.
- **Side panel** (left; a drawer below 900px width) shows the other axis:
  - In Pack order it lists every Pokémon, searchable. Tapping one scrolls to the pack that covers it and highlights the chip.
  - In Pokémon order it lists the packs. Tapping one shows only that pack's Pokémon.

## Data

`server/data/` holds the seed, taken from the Google Drive folder "Pokemon TCG":

| File | What |
|---|---|
| `drive/<set id>.csv` | One CSV per set: `dexNumber,name,setName,setNumber,rarity,type`. Where Drive had several copies of a set, the one with the most dex numbers filled in was kept |
| `sets.json` | The 22 sets (Sword & Shield to Paradox Rift). Set ids and release dates come from [TCGdex](https://tcgdex.dev), checked on 2026-11-03 |
| `national-dex.csv` | The NationalDex tab of the "Pokemon TCG: Pokedex project" sheet (#1–#1021) |

Known gaps:

- The data stops at Paradox Rift (2023-11-03) and the dex stops at #1021.
- The Trainer Gallery, Galarian Gallery and Shining Vault subsets were empty in Drive.
- Rows without a dex number (Trainers and Energy) are ignored.

## Server

`server/` is a read-only JSON API with no dependencies. It runs the TypeScript directly on Node 24 and reuses the coverage algorithm.

| Route | Returns |
|---|---|
| `GET /health` | `{ "ok": true }` |
| `GET /v1/sets` | Sets, newest first, with card counts |
| `GET /v1/coverage` | `{ total, coveredCount, setCount, picks: [{ set, newPokemon: [{ dex, name, type, rarity, number }] }], missing }` |
| any other `GET` | The web app, when `WEB_DIR` is set (unknown paths get `index.html`) |

```bash
node server/main.ts        # local: http://localhost:18100 (PORT and HOST override)
```

**Deployed** on the home server (`escalenusserver`) in `~/services/tcg-pokedex`, which is a clone of this repo. The Docker container listens on 127.0.0.1:18100, and two proxies reach it:

| Address | Who can reach it | Proxy |
|---|---|---|
| `https://escalenusserver.tailec6a2c.ts.net:10000` | **Anyone** (public) | Tailscale Funnel: `sudo tailscale funnel --bg --https=10000 http://127.0.0.1:18100` |
| `https://escalenusserver.tailec6a2c.ts.net:8443` | Tailnet devices only | Caddy |

**Rate limit:** each visitor gets 60 `/v1` requests per minute (`RATE_LIMIT_PER_MIN`, 0 turns it off). Over the limit, the API answers `429` with `Retry-After`. `/health`, CORS preflight and the web app's files are never limited. The visitor's address comes from `X-Forwarded-For`, which both proxies overwrite with the real client address.

To redeploy:

```bash
ssh escalenus@escalenusserver 'cd ~/services/tcg-pokedex && git pull && docker compose -f server/compose.yml up -d --build'
```

To point the app at it, copy `.env.example` to `.env.local`. It holds the public address, which works for anyone.

## Stack

The app is an Expo SDK 54 project (React Native 0.81, React 19, Expo Router), copied from the workspace's [BaseApp](https://github.com/ivan-i1/BaseApp) template. These BaseApp modules were removed: game loop, Phaser, audio, haptics, sensors, menu manager and demos. These are kept:

| Module | Where |
|---|---|
| Navigation (Expo Router: Home, Settings, About) | `src/app/` |
| Translations: en, es, fr, it, de, pt, with device detection, plurals and typed keys | `src/core/i18n/` |
| Persisted settings (language, theme), validated on load | `src/core/settings/` |
| Light and dark theme tokens | `src/core/theme/` |
| API client (env base URL, retries, 429 handling, streaming) | `src/engines/api/` |
| PWA manifest, icons and web HTML template | `public/` |
| Icon, splash and favicon pipeline from one image | `scripts/generate-icons.mjs` |
| Android release signing that keeps secrets out of git | `plugins/withReleaseSigning.js` |

## Quick start

```bash
npm install
npm run web                # browser: http://localhost:8081
npm run android            # development build on an emulator or device
npm run ios                # development build on the iOS Simulator (needs Xcode)
```

You need Node 20 or newer. Android needs JDK 17 and the Android SDK. iOS needs Xcode and CocoaPods.

## Hosted web app

The home server serves the web app and its API together at **https://escalenusserver.tailec6a2c.ts.net:10000**. That address is public through Tailscale Funnel, so any device can use it: home Wi-Fi, mobile data, or anyone you share it with.

- `server/Dockerfile` builds the app (`expo export` with `EXPO_PUBLIC_API_URL=/`) in its first stage.
- The Node server then serves those files next to the API.
- Redeploying (see [Server](#server)) rebuilds the app too. On the 2015 MacBook that takes a few minutes, while the old container keeps serving.

## Installing as a web app (PWA)

`npm run export:web` writes a static single-page app to `dist/`. Host it on any static host over HTTPS. Browsers will then offer **Install app** or **Add to Home Screen**.

- The HTML template is `public/index.html`. It links `public/manifest.json` and the icons in `public/icons/`.
- If you change `assets/images/icon.png`, regenerate the PWA icons:

  ```bash
  for s in 192 512; do magick assets/images/icon.png -resize ${s}x${s} public/icons/icon-$s.png; done
  ```

- There is no service worker yet, so the app does not work offline.

## Quality gates

```bash
npm run check          # typecheck + jest + lint
npm run export:web     # web bundle smoke check
npm run export:native  # android + ios JS bundle smoke check
```

## Configuration

| What | Where |
|---|---|
| Server URL | `EXPO_PUBLIC_API_URL` in `.env.local` (see `.env.example`). It ships inside the bundle, so it is public |
| Settings | `src/core/settings/settings.ts` (type, defaults, `mergeSettings`) |
| Strings | `src/core/i18n/locales/*.json`. English is the reference; a test fails if any language is missing a key |
| Colours | `src/core/theme/tokens.ts` |

## Release signing (Android)

1. Copy `credentials.example/` to `credentials/`, which is gitignored.
2. Generate a **new** upload keystore for this app. The command is in `credentials.example/keystore.properties`.
3. Back the keystore and its passwords up somewhere off this machine.

`/android` and `/ios` are generated by `expo prebuild` and are gitignored. Change native behaviour in `app.json` or a plugin.

## Roadmap

- Add stage and "Evolves from" data from a public source (for example TCGdex), so the evolution rule applies.
- Add sets newer than Paradox Rift and older than Sword & Shield, and Pokémon #1022–#1025.
- Decide edge cases: baby Pokémon (Pikachu from Pichu), V → VMAX/VSTAR, and multi-Pokémon cards that are not Tag Teams.
- Other algorithms, for custom collections.
- An Uptime Kuma monitor for the API, and a custom domain (for example through a Cloudflare Tunnel) if the `ts.net` address becomes limiting.
- Offline support (service worker) for the PWA.
