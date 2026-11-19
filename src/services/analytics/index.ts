/**
 * Analytics facade. Events are named per the PRD. Swap `sink` for Firebase Analytics
 * (@react-native-firebase/analytics) once google-services.json is added; see docs/SETUP.md.
 */
export type EventName =
  | 'app_open' | 'onboarding_completed' | 'guest_started' | 'account_created'
  | 'scan_started' | 'scan_completed' | 'scan_failed' | 'ingredient_confirmed' | 'ingredient_edited'
  | 'recipe_generation_started' | 'recipe_generation_completed' | 'recipe_viewed' | 'recipe_saved'
  | 'cooking_mode_started' | 'cooking_mode_completed' | 'shopping_item_added'
  | 'rewarded_ad_offered' | 'rewarded_ad_completed';

type Sink = (name: EventName, params?: Record<string, string | number | boolean>) => void;
let sink: Sink = (name, params) => { if (__DEV__) console.log('[analytics]', name, params ?? ''); };
export function setAnalyticsSink(s: Sink) { sink = s; }
/** Never pass allergy, diet or health data as params. */
export function track(name: EventName, params?: Record<string, string | number | boolean>) {
  try { sink(name, params); } catch { /* analytics must never break the app */ }
}
