# API

Base: `EXPO_PUBLIC_API_BASE_URL` (Supabase Edge Functions). All calls send `Authorization: Bearer <user JWT>`.

| Endpoint | Body | Success | Errors |
|---|---|---|---|
| `POST /scan-ingredients` | `{ image: base64 jpeg/png/webp (≤1.5M chars), mime }` | Detection JSON (see AI_PROMPTS.md) | 401 auth, 413 bad image, 429 daily limit, 502 provider |
| `POST /grant-bonus` | `{}` | `{ ok: true }` | 401, 429 daily bonus cap |
| `POST /delete-account` | – | `{ ok: true }` | 401, 500 |

The PRD's longer REST list (`/api/v1/...` for scans, recipes, favorites, kitchen, shopping list, preferences) is **not implemented**: those collections are local-first for now, and the tables are ready (secured by RLS) so supabase-js or PostgREST can be used directly when sync is added.

Behaviours: input validated, size capped, 25 s provider timeout, no image or model output logged, usage metadata logged to `ai_usage_logs`. The client re-validates responses with zod (`src/services/ai/schemas.ts`) and shows a specific message for offline, timeout, limit, invalid and provider errors.

Known gaps: no per-IP rate limiting beyond the daily quota; no result caching; `grant-bonus` trusts the client within a daily cap (use AdMob SSV to harden); recipe generation by AI is not wired. Recipes come from the bundled/cached catalogue with local matching.
