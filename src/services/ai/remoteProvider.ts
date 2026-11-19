import { CONFIG } from '../../constants';
import type { DetectedIngredient, IngredientCategory, Recipe } from '../../types';
import { INGREDIENT_CATEGORIES } from '../../constants';
import { DetectionSchema, SubstitutionSchema } from './schemas';
import { AIError, type IngredientRecognitionService, type IngredientSubstitutionService, type RecognitionResult } from './types';
import { z } from 'zod';

let authToken: string | null = null;
export function setAuthToken(t: string | null) { authToken = t; }

async function post(path: string, body: unknown, timeoutMs = CONFIG.AI_TIMEOUT_MS, signal?: AbortSignal): Promise<any> {
  if (!CONFIG.API_BASE_URL) throw new AIError('provider', 'Backend is not configured.');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (res.status === 429) throw new AIError('limit', 'Daily scan limit reached.');
    if (res.status === 401 || res.status === 403) throw new AIError('auth', 'Please restart the app.');
    if (!res.ok) throw new AIError('provider', `Server error (${res.status}).`);
    return await res.json();
  } catch (e: any) {
    if (e instanceof AIError) throw e;
    if (e?.name === 'AbortError') throw new AIError('timeout', 'The request took too long.');
    throw new AIError('offline', 'Could not reach the server.');
  } finally { clearTimeout(t); }
}

const cat = (c: string): IngredientCategory =>
  (INGREDIENT_CATEGORIES as readonly string[]).includes(c) ? (c as IngredientCategory) : 'Other';

export class RemoteRecognitionService implements IngredientRecognitionService {
  readonly name = 'remote';
  async detect(imageBase64: string, mime: string, signal?: AbortSignal): Promise<RecognitionResult> {
    const raw = await post('/scan-ingredients', { image: imageBase64, mime }, CONFIG.AI_TIMEOUT_MS, signal);
    const parsed = DetectionSchema.safeParse(raw);
    if (!parsed.success) throw new AIError('invalid', 'The AI returned an unreadable answer.');
    const d = parsed.data;
    const ingredients: DetectedIngredient[] = d.ingredients.map((x, n) => ({
      id: `r${Date.now()}-${n}`, name: x.name, category: cat(x.category), quantity: x.estimated_quantity, unit: x.unit,
      confidence: x.confidence, needsConfirmation: x.needs_confirmation || x.confidence < 0.65,
    }));
    return { ingredients, imageQuality: d.image_quality, warnings: d.warnings, status: d.overall_status, provider: this.name };
  }
}

/** Tells the server a rewarded ad completed (server caps bonuses per day). */
export async function reportRewardedBonus(): Promise<boolean> {
  try { await post('/grant-bonus', {}, 10000); return true; } catch { return false; }
}

export class RemoteSubstitutionService implements IngredientSubstitutionService {
  async substitute(input: { ingredient: string; recipeTitle: string; prefs: { allergies: string[]; customAllergies: string[]; diets: string[] } }) {
    const raw = await post('/substitute', input, 15000);
    return z.array(SubstitutionSchema).parse(raw.substitutions);
  }
}

export type { Recipe };
