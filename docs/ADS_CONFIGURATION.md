# Ads (AdMob)

Central controller: `src/services/ads/AdManager.ts`. Components: `src/components/ads/Ads.tsx`.

| Placement | Format | Where |
|---|---|---|
| A | Adaptive banner | bottom of Home |
| B | Native (labelled "Ad · Sponsored", dashed, tinted) | Discover, after the 4th card |
| C | Native | Results, after the 4th card |
| D | Rewarded | scan limit screen, explicit button; reward only on SDK `EARNED_REWARD` |
| E | Adaptive banner | bottom of My Kitchen |
| F | Interstitial | after leaving Results, ≥2nd discovery, max 2 per session, ≥5 min apart |

Never shown during scanning or cooking (`setScanning` / `setCooking` guards). If an ad fails or the SDK is missing, the slot renders nothing (no blank gap). Consent uses Google's UMP (`AdsConsent.gatherConsent`) and ads are requested non-personalised unless the user opted in. Diet/allergy data is never passed to ad requests. Content rating is capped at PG and the age-of-consent tag is on.

**IDs:** all units default to Google's *test* IDs. For release set `EXPO_PUBLIC_ADMOB_{BANNER,NATIVE,REWARDED,INTERSTITIAL}_ID` and replace `androidAppId` in `app.json` with your real AdMob app ID. Never click your own live ads.

Play Console: declare ads, data safety (advertising ID, diagnostics, photos sent to a server for analysis) and add the privacy policy URL.
