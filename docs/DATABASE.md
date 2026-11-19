# Database

Defined in `supabase/migrations/0001_init.sql`. Tables follow the PRD (users, user_preferences, ingredients, kitchen_ingredients, scans, recipes, recipe_ingredients, favorites, shopping_list_items, recipe_history, ai_usage_logs, ad_impression_events) plus `app_settings`, `scan_credits`.

- UUID keys, foreign keys with cascade deletes from `users`, indexes on user/time lookups.
- **RLS on every table.** User-owned tables: `user_id = auth.uid()`. `ai_usage_logs` and `scan_credits` are read-only to their owner; writes happen via service role. `app_settings` has no client policy. Catalogue tables are read-only to signed-in users.
- `ad_impression_events` has **no user_id** by design (aggregate analytics only).
- Quota: `consume_scan()` is atomic and server-authoritative; the limit lives in `app_settings.free_scans_per_day`.
- Scan photos: private `scans` bucket, folder per user. Photos are not persisted by the edge function; if you later store them, delete after analysis.
- Guest → account: anonymous users are real auth users; linking an identity keeps the same id, so no data migration is needed.

**Current limitation:** the app stores favorites, kitchen, shopping list, preferences and history **locally** (AsyncStorage). The tables exist and are secured, but client sync to them is not implemented yet.
