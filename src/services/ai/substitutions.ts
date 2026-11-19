import type { Preferences } from '../../types';
import type { Substitution } from './schemas';
import { normalizeIngredient } from '../recipes/matching';

interface Rule { sub: string; conv: string; why: string; allergens: string[]; diets?: string[] }

const RULES: Record<string, Rule[]> = {
  butter: [
    { sub: 'Olive oil', conv: '¾ amount of oil per 1 amount of butter', why: 'Adds richness; slightly less creamy and no browning flavor.', allergens: [] },
    { sub: 'Coconut oil', conv: '1:1', why: 'Solid at room temperature like butter; adds a mild coconut note.', allergens: [] },
  ],
  milk: [
    { sub: 'Oat milk', conv: '1:1', why: 'Creamy and neutral; works in most cooking and baking.', allergens: ['Wheat'] },
    { sub: 'Water + a little oil', conv: '1 cup water + 1 tsp oil per cup of milk', why: 'Works for pancakes and sauces; less rich.', allergens: [] },
  ],
  egg: [
    { sub: 'Mashed banana', conv: '¼ cup per egg', why: 'Binds baked goods; adds sweetness and banana flavor.', allergens: [] },
    { sub: 'Ground flax + water', conv: '1 tbsp flax + 3 tbsp water per egg', why: 'Good binder for pancakes and baking; denser result.', allergens: [] },
  ],
  cream: [{ sub: 'Coconut milk', conv: '1:1', why: 'Rich and creamy; adds mild coconut flavor.', allergens: [] }],
  yogurt: [{ sub: 'Coconut yogurt', conv: '1:1', why: 'Similar tang and texture.', allergens: [] }],
  flour: [{ sub: 'Oat flour (blend oats finely)', conv: '1:1', why: 'Softer, denser crumb. Check oats are labelled gluten-free if needed.', allergens: [] }],
  tomato: [{ sub: 'Canned tomatoes or tomato paste', conv: '1 can per 4 fresh; 2 tbsp paste per 2 tomatoes', why: 'More concentrated, less fresh.', allergens: [] }],
  onion: [{ sub: 'Spring onion / shallot', conv: '1:1 by volume', why: 'Milder and sweeter.', allergens: [] }],
  garlic: [{ sub: 'Garlic powder', conv: '⅛ tsp per clove', why: 'Less pungent; add with the spices.', allergens: [] }],
  lemon: [{ sub: 'Lime juice or vinegar', conv: '1:1 juice; ½ amount vinegar', why: 'Similar acidity.', allergens: [] }],
  'soy sauce': [{ sub: 'Salt + a splash of water', conv: '¼ tsp salt per tbsp', why: 'Salty without the umami; also soy-free and gluten-free.', allergens: [] }],
  rice: [{ sub: 'Couscous or quinoa', conv: '1:1 dry', why: 'Cooks faster (couscous) or adds protein (quinoa).', allergens: ['Wheat'] }],
  parmesan: [{ sub: 'Any hard cheese', conv: '1:1', why: 'Sharper or milder depending on the cheese.', allergens: ['Dairy'] }],
};

/** Offline rule-based substitutions. Never returns a substitute that conflicts with the user's allergies. */
export function localSubstitutions(ingredient: string, prefs: Pick<Preferences, 'allergies' | 'customAllergies' | 'diets'>): Substitution[] {
  const key = normalizeIngredient(ingredient);
  const rules = RULES[key] ?? [];
  const blocked = new Set(prefs.allergies);
  return rules
    .filter((r) => r.allergens.every((a) => !blocked.has(a)))
    .filter((r) => !prefs.customAllergies.some((c) => c && r.sub.toLowerCase().includes(c.toLowerCase())))
    .map((r) => ({
      original: ingredient,
      substitute: r.sub,
      quantity_conversion: r.conv,
      explanation: r.why,
      allergen_warning: r.allergens.length ? `Contains: ${r.allergens.join(', ')}.` : null,
    }));
}
