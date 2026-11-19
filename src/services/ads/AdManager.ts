import { Platform } from 'react-native';
import { CONFIG } from '../../constants';
import { track } from '../analytics';

/**
 * Central ad controller. Native SDK is required lazily so the app still runs (without ads)
 * in Expo Go, on web and in tests. All unit IDs below are Google's TEST ids. Replace via
 * EXPO_PUBLIC_* variables for release builds (see docs/ADS_CONFIGURATION.md).
 */
let sdk: typeof import('react-native-google-mobile-ads') | null = null;
try { sdk = Platform.OS === 'android' ? require('react-native-google-mobile-ads') : null; } catch { sdk = null; }

const env = process.env;
export const AD_UNITS = {
  banner: env.EXPO_PUBLIC_ADMOB_BANNER_ID || sdk?.TestIds.BANNER || '',
  native: env.EXPO_PUBLIC_ADMOB_NATIVE_ID || sdk?.TestIds.NATIVE || '',
  rewarded: env.EXPO_PUBLIC_ADMOB_REWARDED_ID || sdk?.TestIds.REWARDED || '',
  interstitial: env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || sdk?.TestIds.INTERSTITIAL || '',
};

type Placement = 'home_banner' | 'discover_native' | 'results_native' | 'scan_limit_rewarded' | 'kitchen_banner' | 'session_interstitial';

class AdManagerImpl {
  ready = false;
  canRequestAds = false;
  nonPersonalized = true;
  private lastInterstitialAt = 0;
  private interstitialsThisSession = 0;
  private cookingActive = false;
  private scanning = false;
  private impressions: Record<string, number> = {};

  get available() { return !!sdk; }

  async init(): Promise<void> {
    if (!sdk || this.ready) return;
    try {
      // UMP consent (GDPR/EEA, US states). Shows a form only where legally required.
      const info = await sdk.AdsConsent.gatherConsent();
      this.canRequestAds = info.canRequestAds;
      const choices = await sdk.AdsConsent.getUserChoices().catch(() => null);
      this.nonPersonalized = !(choices && choices.selectPersonalisedAds);
      await sdk.default().setRequestConfiguration({
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: true, // conservative: age-appropriate handling
        maxAdContentRating: sdk.MaxAdContentRating.PG,
      });
      if (this.canRequestAds) { await sdk.default().initialize(); this.ready = true; }
    } catch { this.ready = false; }
  }

  requestOptions() { return { requestNonPersonalizedAdsOnly: this.nonPersonalized }; } // never keyword-target health/diet data

  setCooking(v: boolean) { this.cookingActive = v; }
  setScanning(v: boolean) { this.scanning = v; }

  logImpression(placement: Placement) {
    this.impressions[placement] = (this.impressions[placement] ?? 0) + 1; // aggregate only; no per-user profile
  }

  /** Interstitial after finishing a discovery session. Frequency-capped; never during scan/cook. */
  async maybeShowInterstitial(): Promise<boolean> {
    if (!sdk || !this.ready || this.cookingActive || this.scanning) return false;
    if (this.interstitialsThisSession >= 2) return false;
    if (Date.now() - this.lastInterstitialAt < CONFIG.INTERSTITIAL_MIN_INTERVAL_MS) return false;
    if (this.interstitialsThisSession === 0 && Date.now() - this.lastInterstitialAt < 60_000) return false;
    return new Promise<boolean>((resolve) => {
      const ad = sdk!.InterstitialAd.createForAdRequest(AD_UNITS.interstitial, this.requestOptions());
      const done = (v: boolean) => { off1(); off2(); off3(); resolve(v); };
      const off1 = ad.addAdEventListener(sdk!.AdEventType.LOADED, () => { this.lastInterstitialAt = Date.now(); this.interstitialsThisSession++; ad.show().catch(() => done(false)); });
      const off2 = ad.addAdEventListener(sdk!.AdEventType.CLOSED, () => done(true));
      const off3 = ad.addAdEventListener(sdk!.AdEventType.ERROR, () => done(false));
      ad.load();
      setTimeout(() => done(false), 8000);
    });
  }

  /** Resolves 'earned' only when the SDK confirms the reward; 'unavailable' on any failure. */
  showRewarded(): Promise<'earned' | 'dismissed' | 'unavailable'> {
    track('rewarded_ad_offered');
    if (!sdk || !this.ready) return Promise.resolve('unavailable');
    return new Promise((resolve) => {
      let earned = false;
      const ad = sdk!.RewardedAd.createForAdRequest(AD_UNITS.rewarded, this.requestOptions());
      const cleanup = () => { a(); b(); c(); d(); clearTimeout(timer); };
      const a = ad.addAdEventListener(sdk!.RewardedAdEventType.LOADED, () => { ad.show().catch(() => { cleanup(); resolve('unavailable'); }); });
      const b = ad.addAdEventListener(sdk!.RewardedAdEventType.EARNED_REWARD, () => { earned = true; });
      const c = ad.addAdEventListener(sdk!.AdEventType.CLOSED, () => { cleanup(); if (earned) track('rewarded_ad_completed'); resolve(earned ? 'earned' : 'dismissed'); });
      const d = ad.addAdEventListener(sdk!.AdEventType.ERROR, () => { cleanup(); resolve('unavailable'); });
      const timer = setTimeout(() => { cleanup(); resolve(earned ? 'earned' : 'unavailable'); }, 15000);
      ad.load();
    });
  }

  async showPrivacyOptions() { try { await sdk?.AdsConsent.showPrivacyOptionsForm(); } catch { /* not required in this region */ } }
}

export const AdManager = new AdManagerImpl();
export const adsSdk = sdk;
