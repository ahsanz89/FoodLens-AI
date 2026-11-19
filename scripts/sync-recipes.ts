/**
 * One-off: downloads the full TheMealDB catalogue (a–z) and writes src/data/catalogSnapshot.json
 * so the app ships with hundreds of global recipes that work offline.
 *   npm run sync-recipes
 * Needs normal internet access (run on your machine). Respect TheMealDB's terms; consider a supporter key
 * for commercial use: https://www.themealdb.com/api.php
 */
import { writeFileSync } from 'node:fs';
import { parseMealDb } from '../src/services/recipes/mealdbParse';

const BASE = process.env.MEALDB_BASE ?? 'https://www.themealdb.com/api/json/v1/1';
const out: Record<string, unknown> = {};
for (const l of 'abcdefghijklmnopqrstuvwxyz') {
  const res = await fetch(`${BASE}/search.php?f=${l}`);
  if (!res.ok) { console.error(`letter ${l}: HTTP ${res.status}`); continue; }
  const j = (await res.json()) as { meals: Record<string, string | null>[] | null };
  for (const m of j.meals ?? []) { const r = parseMealDb(m); if (r) out[r.id] = r; }
  console.log(l, Object.keys(out).length);
  await new Promise((r) => setTimeout(r, 400));
}
writeFileSync(new URL('../src/data/catalogSnapshot.json', import.meta.url), JSON.stringify(Object.values(out)));
console.log(`Wrote ${Object.keys(out).length} recipes`);
