import type { Recipe, RecipeIngredient, Difficulty } from '../../types/index';
import { deriveAllergens, deriveDiets } from './matching';

/** Parse "200 g pasta" | "2 tomato" | "salt" into a RecipeIngredient. */
export function I(s: string): RecipeIngredient {
  const m = s.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(g|kg|ml|l|cup|cups|tbsp|tsp|can|bunch|pcs|clove|cloves|slice|slices)?\s+(.+)$/i);
  if (!m) return { name: s, quantity: null, unit: null };
  const q = m[1].includes('/') ? Number(m[1].split('/')[0]) / Number(m[1].split('/')[1]) : Number(m[1]);
  const unit = m[2] ? m[2].toLowerCase().replace(/s$/, '') : 'pcs';
  return { name: m[3], quantity: q, unit: m[2] ? unit : null };
}

export interface SeedInput {
  id: string; title: string; cuisine: string; category: string; difficulty: Difficulty;
  prep: number; cook: number; servings: number; description: string;
  ingredients: string[]; steps: string[]; tips?: string[]; budget?: boolean;
}

export function makeRecipe(s: SeedInput): Recipe {
  const ingredients = s.ingredients.map(I);
  const allergens = deriveAllergens(ingredients);
  return {
    id: s.id, title: s.title, description: s.description, cuisine: s.cuisine, category: s.category,
    difficulty: s.difficulty, prepMinutes: s.prep, cookMinutes: s.cook, servings: s.servings,
    imageUrl: null, ingredients,
    instructions: s.steps.map((instruction, i) => ({ step: i + 1, instruction })),
    allergens, diets: deriveDiets(ingredients, allergens), tips: s.tips ?? [],
    sourceType: 'seed', budget: s.budget,
  };
}
