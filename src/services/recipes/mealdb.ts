import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants';
import type { Recipe } from '../../types';
import { parseMealDb, type MealDbMeal } from './mealdbParse';

const CACHE_KEY = 'foodlens.mealdb.v1';
let memory: Record<string, Recipe> | null = null;

async function timeoutFetch(url: string, ms = 12000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function loadCached(): Promise<Record<string, Recipe>> {
  if (memory) return memory;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    memory = raw ? JSON.parse(raw) : {};
  } catch {
    memory = {};
  }
  return memory!;
}

async function persist() {
  try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memory ?? {})); } catch { /* storage full: ignore */ }
}

function ingest(meals: MealDbMeal[] | null | undefined): Recipe[] {
  const out: Recipe[] = [];
  for (const m of meals ?? []) {
    const r = parseMealDb(m);
    if (r) { memory![r.id] = r; out.push(r); }
  }
  return out;
}

/** Fetch recipes by first letter (a–z). Safe to call repeatedly; resumes where it stopped. */
export async function syncCatalog(onProgress?: (done: number, total: number) => void): Promise<number> {
  await loadCached();
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const doneKey = 'foodlens.mealdb.letters';
  const done = new Set<string>(JSON.parse((await AsyncStorage.getItem(doneKey)) ?? '[]'));
  let count = 0;
  for (const [i, l] of letters.entries()) {
    if (done.has(l)) { onProgress?.(i + 1, letters.length); continue; }
    try {
      const json = await timeoutFetch(`${CONFIG.MEALDB_BASE}/search.php?f=${l}`);
      count += ingest(json.meals).length;
      done.add(l);
      await AsyncStorage.setItem(doneKey, JSON.stringify([...done]));
    } catch {
      break; // offline or rate-limited: keep what we have, resume next time
    }
    onProgress?.(i + 1, letters.length);
  }
  await persist();
  return count;
}

/** Targeted fetch: recipes whose main ingredient matches one of the user's ingredients. */
export async function fetchByIngredients(names: string[], limit = 12): Promise<Recipe[]> {
  await loadCached();
  const ids = new Set<string>();
  for (const n of names.slice(0, 6)) {
    try {
      const json = await timeoutFetch(`${CONFIG.MEALDB_BASE}/filter.php?i=${encodeURIComponent(n.trim().replace(/\s+/g, '_'))}`, 8000);
      for (const m of (json.meals ?? []).slice(0, 6)) ids.add(`mealdb-${m.idMeal}`);
    } catch { /* ignore a single failure */ }
  }
  const want = [...ids].filter((id) => !memory![id]).slice(0, limit);
  await Promise.all(want.map(async (id) => {
    try {
      const json = await timeoutFetch(`${CONFIG.MEALDB_BASE}/lookup.php?i=${id.replace('mealdb-', '')}`, 8000);
      ingest(json.meals);
    } catch { /* ignore */ }
  }));
  await persist();
  return [...ids].map((id) => memory![id]).filter(Boolean);
}

export async function searchOnline(query: string): Promise<Recipe[]> {
  await loadCached();
  try {
    const json = await timeoutFetch(`${CONFIG.MEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`, 8000);
    const r = ingest(json.meals);
    await persist();
    return r;
  } catch { return []; }
}
