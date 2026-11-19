# FoodLens AI

Snap your ingredients. Discover what you can cook. Android app built with Expo (React Native + TypeScript).

## Status (honest)

| Area | State |
|---|---|
| All MVP screens and flows (onboarding, scan, confirm, results, detail, cooking mode, manual entry, My Kitchen, favorites, shopping list, profile, legal) | Implemented. Bundles for Android with Metro. **Not yet run on a device or emulator.** |
| Recipe matching, allergen and diet rules, scaling, substitutions | Implemented and unit-tested (15 tests) |
| Recipe data | 24 bundled recipes + live TheMealDB lookups, cached. Run `npm run sync-recipes` once on a machine with internet to bundle hundreds more |
| Ingredient recognition | **Mock provider by default** (returns sample baskets, labelled "Demo mode"). Real recognition needs the Supabase backend + a Gemini key (see docs/SETUP.md) |
| Backend | SQL migration + edge functions written, **never deployed or run** |
| Ads | AdMob wired with Google **test** IDs. Needs a development build, not Expo Go |
| Analytics | Event facade in place; Firebase sink not connected yet |
| Google sign-in | Button present; the flow is a placeholder that creates a local "account" profile until auth is wired |
| Legal text | Templates only. Needs professional review |

## Quick start

```bash
npm install            # .npmrc sets legacy-peer-deps
npm test               # unit tests
npm run typecheck
npx expo start         # dev server (scan demo works with the mock AI)
```
Ads and the camera need a development build: `npx eas build --profile development --platform android`.

## Layout
`src/app` routes (Expo Router) · `src/components` UI · `src/services/{ai,recipes,ads,api,analytics}` · `src/store` state · `supabase/` SQL + edge functions · `docs/`.

Key design rules from the PRD that the code enforces: AI output is validated (zod) and never treated as fact; match % is computed from confirmed ingredients; allergies filter conservatively with disclaimers; no ads during scan or cooking; keys live only on the server.
