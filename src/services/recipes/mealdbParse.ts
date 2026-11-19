import type { Recipe, Difficulty } from '../../types/index';
import { I, makeRecipe } from './build';
import { deriveAllergens, deriveDiets } from './matching';

const AREA_TO_CUISINE: Record<string, string> = {
  Indian: 'Indian', Pakistani: 'Pakistani', Italian: 'Italian', Mexican: 'Mexican', American: 'American',
  Chinese: 'Asian', Japanese: 'Asian', Thai: 'Asian', Vietnamese: 'Asian', Malaysian: 'Asian', Filipino: 'Asian', Indonesian: 'Asian', Korean: 'Asian',
  Greek: 'Mediterranean', Turkish: 'Middle Eastern', Egyptian: 'Middle Eastern', Moroccan: 'Middle Eastern', Tunisian: 'Middle Eastern', Lebanese: 'Middle Eastern', Syrian: 'Middle Eastern', Saudi: 'Middle Eastern',
};

const CATEGORY_MAP: Record<string, string> = {
  Breakfast: 'Breakfast', Dessert: 'Dessert', Starter: 'Snack', Side: 'Snack', Miscellaneous: 'Lunch',
};

export interface MealDbMeal { [k: string]: string | null }

function splitSteps(text: string): string[] {
  const cleaned = text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean)
    .map((l) => l.replace(/^(step\s*)?\d+[.):]?\s*/i, '')).filter((l) => l.length > 2 && !/^step\s*\d*$/i.test(l));
  if (cleaned.length >= 3) return cleaned;
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
}

export function parseMealDb(m: MealDbMeal): Recipe | null {
  if (!m.idMeal || !m.strMeal || !m.strInstructions) return null;
  const rawIng: string[] = [];
  for (let n = 1; n <= 20; n++) {
    const name = (m[`strIngredient${n}`] ?? '').trim();
    const measure = (m[`strMeasure${n}`] ?? '').trim();
    if (!name) continue;
    rawIng.push(name + '|' + measure);
  }
  if (rawIng.length === 0) return null;
  const steps = splitSteps(m.strInstructions);
  const total = Math.min(120, Math.max(15, steps.length * 5));
  const difficulty: Difficulty = steps.length <= 5 && rawIng.length <= 8 ? 'Easy' : steps.length <= 9 ? 'Medium' : 'Hard';
  const base = makeRecipe({
    id: `mealdb-${m.idMeal}`, title: m.strMeal, cuisine: AREA_TO_CUISINE[m.strArea ?? ''] ?? (m.strArea || 'Other'),
    category: CATEGORY_MAP[m.strCategory ?? ''] ?? 'Dinner', difficulty, prep: Math.round(total * 0.3), cook: Math.round(total * 0.7), servings: 4,
    description: `${m.strArea ?? 'Global'} ${m.strCategory ?? 'recipe'}${m.strTags ? ' · ' + m.strTags.split(',').join(', ') : ''}`,
    ingredients: [], steps: [],
  });
  base.ingredients = rawIng.map((r) => {
    const [name, measure] = r.split('|');
    const parsed = I(`${measure} ${name}`.trim());
    // If the measure was non-numeric (e.g. "a pinch"), keep the text as unit.
    if (parsed.quantity == null && measure) return { name, quantity: null, unit: measure };
    return parsed.name === name ? parsed : { name, quantity: parsed.quantity, unit: parsed.unit };
  });
  base.instructions = steps.map((instruction, i) => ({ step: i + 1, instruction }));
  // re-derive after ingredients are known
  base.allergens = deriveAllergens(base.ingredients);
  base.diets = deriveDiets(base.ingredients, base.allergens);
  base.imageUrl = m.strMealThumb ? `${m.strMealThumb}/medium` : null;
  base.sourceType = 'themealdb';
  base.sourceUrl = m.strSource || `https://www.themealdb.com/meal/${m.idMeal}`;
  base.tips = [];
  return base;
}
