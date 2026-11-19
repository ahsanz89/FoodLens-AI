# Environment variables

App (public, bundled, so no secrets): `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_AI_PROVIDER` (`mock`|`remote`), `EXPO_PUBLIC_ADMOB_BANNER_ID`, `_NATIVE_ID`, `_REWARDED_ID`, `_INTERSTITIAL_ID`.

Server (Supabase secrets, never in the app): `GEMINI_API_KEY`, optional `GEMINI_VISION_MODEL`. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase into functions.

Tooling: `MEALDB_BASE` (optional) for `npm run sync-recipes`.
