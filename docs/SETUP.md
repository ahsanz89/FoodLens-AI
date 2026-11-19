# Setup

## 1. Run the demo (no accounts needed)
`npm install && npx expo start`. The AI provider defaults to `mock`.

## 2. Backend (real ingredient recognition)
1. Create a Supabase project. Auth → Providers → enable **Anonymous sign-ins**.
2. `supabase link --project-ref <ref>` then `supabase db push` (runs `supabase/migrations/0001_init.sql`).
3. `supabase secrets set GEMINI_API_KEY=<key>` (get one at Google AI Studio). Optionally `GEMINI_VISION_MODEL=...`.
4. `supabase functions deploy scan-ingredients grant-bonus delete-account`.
5. Copy `.env.example` to `.env`, fill the URL/anon key, set `EXPO_PUBLIC_AI_PROVIDER=remote`.

## 3. Bundle more recipes
`npm run sync-recipes` (needs normal internet access) writes `src/data/catalogSnapshot.json`.

## 4. Analytics (Firebase)
Add `@react-native-firebase/app` + `analytics`, put `google-services.json` in the project root, reference it in `app.json` (`android.googleServicesFile`), then call `setAnalyticsSink(...)` in `_layout.tsx`. Event names are in `src/services/analytics`.

## 5. Google sign-in
Not implemented. Plan: Supabase `signInWithIdToken` with `@react-native-google-signin/google-signin`, then `linkIdentity` on the anonymous user so existing data is kept (user id stays the same).
