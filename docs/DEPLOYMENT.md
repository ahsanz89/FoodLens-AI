# Deployment checklist (Google Play)

1. Deploy backend (docs/SETUP.md) and set `EXPO_PUBLIC_AI_PROVIDER=remote`.
2. Replace test AdMob IDs and `androidAppId`; set the Android `package` in `app.json` if `com.ahsanz89.foodlens` is taken.
3. Add real icon/splash assets (current ones are the Expo template placeholders).
4. Replace the support email in `src/app/legal.tsx`; have privacy policy and terms reviewed and hosted at a public URL.
5. `npx eas init`, then `npx eas build --platform android --profile production` (AAB). Test a preview/dev APK on real devices first (camera, ads consent flow, offline, dark mode, font scaling, small screens).
6. Play Console: store listing, content rating, Data safety form, ads declaration, target audience (not primarily for children), privacy policy URL, internal testing track before production.
7. Verify before launch: RLS (try reading another user's rows), quota returns 429 on the 4th scan, delete-account removes data, rewarded ad grants only after completion, no ads during cooking/scanning.
