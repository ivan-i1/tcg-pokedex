# CLAUDE.md

TCG Pokédex: which Pokémon TCG sets, walked newest to oldest, cover one card of every Pokémon. Scaffolded from BaseApp.

Read `AGENTS.md` (Expo's general rules) and `README.md` (what each module is) first.

## Commands

```bash
npm run web | android | ios    # android/ios are dev builds (expo run:*), not Expo Go
npm run check                  # tsc --noEmit + jest + expo lint — the automated gates
npm run export:web             # web bundle smoke check
npm run export:native          # android + ios JS bundle smoke check
npx jest -t "mergeSettings"    # single test by name
```

The gates only reach pure logic. Rendering must be verified in a browser, simulator or device. Say what you actually ran.

## Architecture rules that are easy to break

- **Settings live in one zustand store** (`src/core/settings/store.ts`), persisted with validation through `mergeSettings`.
  - React reads it with `useSettings(selector)`. Code outside React reads `useSettings.getState()`.
  - Do not mirror settings into module variables.
  - Adding a setting means editing the type, `DEFAULT_SETTINGS` and `mergeSettings` together.
- **Pure logic goes in import-free modules** (`retry.ts`, `settings.ts`, `languages.ts`; the coverage algorithm belongs here too) with tests in `__tests__/`.
- **Streaming must use `fetch` from `expo/fetch`.** RN's global fetch has no `Response.body` on native.
- **Strings:** every user-visible string goes through `t()`, with keys in all six locale files. `__tests__/locales.test.ts` enforces parity. Plurals need `_one` and `_other`; es, fr, it and pt also take `_many`.
- **Native folders are generated.** Never edit `/android` or `/ios`; change `app.json` or a plugin and run `npm run prebuild`.
- **Never commit** `credentials/`, keystores or `.env.local`. The repo is public.
- **Server** (`server/`) runs on Node 24 type stripping: import sibling and shared files **with** the `.ts` extension (`tsconfig` allows it), use only erasable TypeScript (no enums or namespaces), and import nothing from `src/` except the import-free `src/core/coverage/coverage.ts`. The Dockerfile copies exactly that file.
- **Deploying the API** changes the shared home server: `git pull && docker compose -f server/compose.yml up -d --build` in `~/services/tcg-pokedex`. Reload Caddy with `caddy reload`, never `restart`, which drops Zitadel/Kuma/Beszel too. Port 10000 is **public** through Tailscale Funnel. Keep the API read-only and rate-limited, and never route another service through that port.
- **`EXPO_PUBLIC_*` values are cached by Metro.** After changing `.env.local`, export with `npx expo export --platform web --clear`, or the bundle keeps the old value. Grep `dist/` for the URL to confirm.
- **PWA:** the web build uses `public/index.html` (manifest link, apple-touch-icon). Keep `app.json` → `web.output` as `single`, or that template stops applying.
