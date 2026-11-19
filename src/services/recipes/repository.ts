import type { Preferences, Recipe, RecipeMatch } from '../../types';
import { SEED_RECIPES } from '../../data/seedRecipes';
import { computeMatch, allergenConflicts } from './matching';
import snapshot from '../../data/catalogSnapshot.json';
import { loadCached, fetchByIngredients } from './mealdb';

export async function allRecipes(): Promise<Recipe[]> {
  const cached = await loadCached();
  const merged = new Map<string, Recipe>();
  for (const r of [...SEED_RECIPES, ...(snapshot as Recipe[]), ...Object.values(cached)]) merged.set(r.id, r);
  return [...merged.values()];
}

export async function getRecipe(id: string, extra: Recipe[] = []): Promise<Recipe | undefined> {
  return (await allRecipes()).find((r) => r.id === id) ?? extra.find((r) => r.id === id);
}

export interface FindOptions {
  ingredients: string[];
  prefs: Preferences;
  maxMissing?: number;
  online?: boolean;
  hideBlocked?: boolean;
}

/** Local matching over seed + cached catalog; optionally tops up from the web first. */
export async function findRecipes(o: FindOptions): Promise<RecipeMatch[]> {
  if (o.online !== false) { try { await fetchByIngredients(o.ingredients); } catch { /* offline is fine */ } }
  const pool = await allRecipes();
  const matches = pool.map((r) => computeMatch(r, o.ingredients, { prefs: o.prefs }));
  return matches
    .filter((m) => m.matchPercent >= 30 && m.available.length > 0)
    .filter((m) => (o.maxMissing == null ? true : m.missing.length <= o.maxMissing))
    .filter((m) => (o.hideBlocked ? m.blockedBy.length === 0 : true))
    .filter((m) => dietOk(m.recipe, o.prefs));
}

function dietOk(r: Recipe, p: Preferences): boolean {
  for (const d of ['Vegetarian', 'Vegan', 'Pescatarian']) {
    if (p.diets.includes(d) && !r.diets.includes(d)) return false;
  }
  return true;
}

export function dailyRecipe(pool: Recipe[], prefs: Preferences, date = new Date()): Recipe | undefined {
  const ok = pool.filter((r) => allergenConflicts(r, prefs).length === 0 && dietOk(r, prefs));
  if (!ok.length) return pool[0];
  const day = Math.floor(date.getTime() / 86_400_000);
  return ok[day % ok.length];
}
