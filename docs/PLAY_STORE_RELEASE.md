# Google Play release guide

Everything the repo can prepare is done: icons, feature graphic, `eas.json`, a build-and-submit GitHub workflow, a privacy-policy page, and the listing text below. The steps in **Your one-time steps** need your accounts and cannot be done by anyone else.

## Your one-time steps (about 1–2 hours, plus Google's waiting periods)

1. **Play Console developer account** (play.google.com/console, one-time US$25, identity verification). If it is a *personal* account created after Nov 2023, Google requires a **closed test with 12+ testers opted in for 14 days** before you can apply for production access. Organisation accounts skip this.
2. **Expo account** (expo.dev, free). Run `npx eas-cli@latest login`, then `npx eas-cli@latest init` in the repo and commit the `projectId` it adds to `app.json`.
3. **Backend** (docs/SETUP.md): deploy Supabase + edge functions, then set `EXPO_PUBLIC_*` values as EAS environment variables (`eas env:create`). Without it the app ships in demo mode with fake scan results, which is **not acceptable for a store release**.
4. **AdMob** (admob.google.com): create the app and four ad units, put the real IDs in EAS env vars and the app ID in `app.json` (`react-native-google-mobile-ads.androidAppId`). Ads run on test IDs until you do.
5. **First upload must be manual.** Play requires the first AAB to be uploaded by hand: run `npx eas-cli@latest build -p android --profile production`, download the `.aab`, create the app in Play Console and upload it to the Internal testing track. (EAS manages the signing key; opt in to Play App Signing.)
6. **Automated releases after that.** Create a Play *service account* (Play Console → Setup → API access → Google Cloud), grant it Release manager rights, download the JSON key. In GitHub → Settings → Secrets → Actions add `EXPO_TOKEN` and `PLAY_SERVICE_ACCOUNT_JSON`. Then Actions → *Android release (EAS)* → Run workflow (tick "submit"). It uploads a **draft** to Internal testing.
7. **Privacy policy URL.** Replace `ahsan.zaheer009@gmail.com` in `docs/site/privacy.html`, enable GitHub Pages (Settings → Pages → Source: GitHub Actions); the URL will be `https://ahsanz89.github.io/FoodLens-AI/privacy.html`. Get the text legally reviewed.
8. **Complete the Play Console forms** using the answers below, take real screenshots (min. 2 phone screenshots, from a device build), then roll out.

## Store listing (copy/paste)

- **App name:** FoodLens AI: Recipes from Photo
- **Short description (≤80):** Snap your ingredients and discover recipes you can cook right now.
- **Full description:**
  Not sure what to cook? Take a photo of your ingredients, check the list, and FoodLens AI shows recipes matched to what you already have.
  • Scan or upload a photo, or add ingredients by hand (no limit)
  • Edit what the AI found. It asks you to confirm anything it is unsure about
  • Recipes ranked by how many of your ingredients they use, with missing items clearly listed
  • Filter by time, difficulty, cuisine, vegetarian, vegan, high protein, low carb and gluten free
  • Set allergies and diets once; recipes that appear to contain them are flagged or hidden
  • Step-by-step cooking mode with timers and a screen that stays awake
  • Shopping list, favorites and collections
  • Free, with ads. 3 free scans a day; watch a short ad for an extra one
  AI can make mistakes and allergen information is estimated. Always check labels and food safety yourself.
- **Category:** Food & Drink · **Tags:** recipes, cooking, meal planning
- **Assets:** `assets/store/play-icon-512.png`, `assets/store/feature-graphic-1024x500.png`; screenshots still needed.

## Policy answers

**Content rating questionnaire:** no violence, no sexual content, no gambling, no user-generated content shared with others, no location sharing. Expected: Everyone.
**Target audience:** 18+ / general audience, *not* designed for children (avoids Families policy requirements).
**Ads:** Yes, contains ads.
**App access:** all functionality available without login.
**AI-generated content:** the app uses AI to identify ingredients from photos; there is no open-ended chat. Disclose in listing (done above); Play's AI-content policy expects an in-app way to report offensive output; add a "Report a problem" link (**not built yet**, listed in To-do).
**Data safety (verify against final SDK set before submitting):**
| Data | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Photos (user-chosen, sent for analysis) | Yes | Yes, AI processor | App functionality | Yes |
| Device or other IDs (advertising ID) | Yes | Yes, ad network | Advertising | Yes (consent) |
| App interactions / diagnostics | Yes (if Firebase on) | Yes | Analytics | No |
| Email, name | Only if user creates an account | No | Account | Yes |
All data encrypted in transit. Users can request deletion in-app (Profile → Delete all my data) and by email.

## To-do before production (not done)
- Real recognition backend deployed and tested end-to-end; remove demo mode.
- Real-device testing of camera, ads consent, offline, dark mode, small screens.
- In-app "Report AI content" action; Firebase analytics; Google sign-in (or remove the button).
- Real screenshots, legal review, support email.
- Target API level: Play requires the current target SDK; `app.json` sets `targetSdkVersion` 36. Re-check Play's requirement at submission time.
