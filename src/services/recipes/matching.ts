import type { Recipe, RecipeIngredient, RecipeMatch, Preferences } from '../../types/index';

/** Pantry staples assumed present when matching (can be toggled off). */
export const STAPLES = ['salt', 'pepper', 'black pepper', 'water', 'oil', 'cooking oil', 'sugar'];

const SYNONYMS: Record<string, string> = {
  tomatoes: 'tomato', 'chopped tomatoes': 'tomato', 'plum tomatoes': 'tomato', 'cherry tomatoes': 'tomato',
  potatoes: 'potato', onions: 'onion', 'red onion': 'onion', 'white onion': 'onion', 'spring onions': 'spring onion',
  'green onion': 'spring onion', scallion: 'spring onion', scallions: 'spring onion',
  'garlic clove': 'garlic', 'garlic cloves': 'garlic', 'chicken breasts': 'chicken', 'chicken breast': 'chicken',
  'chicken thighs': 'chicken', 'minced beef': 'beef', 'ground beef': 'beef', 'beef mince': 'beef',
  eggs: 'egg', 'free-range eggs': 'egg', 'egg yolks': 'egg', 'egg white': 'egg',
  'olive oil': 'oil', 'vegetable oil': 'oil', 'sunflower oil': 'oil', 'extra virgin olive oil': 'oil',
  'bell pepper': 'pepper', 'red pepper': 'pepper', 'green pepper': 'pepper', 'capsicum': 'pepper',
  chilli: 'chili', chillies: 'chili', 'chili powder': 'chili', 'red chilli': 'chili', 'green chilli': 'chili',
  carrots: 'carrot', mushrooms: 'mushroom', lemons: 'lemon', limes: 'lime', apples: 'apple', bananas: 'banana',
  'plain flour': 'flour', 'all-purpose flour': 'flour', 'self-raising flour': 'flour', 'wheat flour': 'flour',
  'whole milk': 'milk', 'full fat milk': 'milk', 'double cream': 'cream', 'heavy cream': 'cream',
  'unsalted butter': 'butter', 'parmesan cheese': 'parmesan', 'parmigiano-reggiano': 'parmesan',
  'penne rigate': 'pasta', penne: 'pasta', spaghetti: 'pasta', fusilli: 'pasta', macaroni: 'pasta',
  'basmati rice': 'rice', 'long-grain rice': 'rice', 'white rice': 'rice', 'jasmine rice': 'rice',
  'soy sauce': 'soy sauce', 'light soy sauce': 'soy sauce', 'dark soy sauce': 'soy sauce',
  yoghurt: 'yogurt', 'natural yogurt': 'yogurt', 'greek yogurt': 'yogurt', 'plain yogurt': 'yogurt',
  coriander: 'cilantro', 'fresh coriander': 'cilantro', 'ginger paste': 'ginger', 'garlic paste': 'garlic',
  'peas': 'pea', 'green beans': 'green bean', beans: 'bean', lentils: 'lentil', chickpeas: 'chickpea',
  prawns: 'shrimp', 'king prawns': 'shrimp', shrimps: 'shrimp',
};

const DESCRIPTORS = new Set([
  'fresh', 'chopped', 'diced', 'sliced', 'minced', 'large', 'small', 'medium', 'ripe', 'dried',
  'ground', 'whole', 'frozen', 'canned', 'tinned', 'boneless', 'skinless', 'finely', 'roughly', 'grated',
]);

export function normalizeIngredient(raw: string): string {
  let s = raw.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (SYNONYMS[s]) return SYNONYMS[s];
  const words = s.split(' ').filter((w) => !DESCRIPTORS.has(w));
  s = words.join(' ').trim();
  if (SYNONYMS[s]) return SYNONYMS[s];
  // naive singularisation
  if (s.endsWith('ies')) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('oes')) s = s.slice(0, -2);
  else if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) s = s.slice(0, -1);
  return SYNONYMS[s] ?? s;
}

function haveIngredient(have: Set<string>, needName: string): boolean {
  const n = normalizeIngredient(needName);
  if (have.has(n)) return true;
  // multi-word containment: "chicken stock" does not match "chicken", but "red lentil" matches "lentil"
  const words = n.split(' ');
  if (words.length > 1 && have.has(words[words.length - 1])) return true;
  return false;
}

/** Words that are never "hidden" inside a safe match, to avoid "coconut milk" ≈ "milk". */
const NOT_INTERCHANGEABLE = [['coconut milk', 'milk'], ['peanut butter', 'butter'], ['almond milk', 'milk'], ['soy milk', 'milk']];

export function computeMatch(
  recipe: Recipe,
  haveRaw: string[],
  opts: { assumeStaples?: boolean; prefs?: Pick<Preferences, 'allergies' | 'customAllergies'> } = {},
): RecipeMatch {
  const assumeStaples = opts.assumeStaples ?? true;
  const have = new Set(haveRaw.map(normalizeIngredient));
  const staples = new Set(STAPLES.map(normalizeIngredient));

  const available: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];
  for (const ing of recipe.ingredients) {
    if (ing.optional) continue;
    const norm = normalizeIngredient(ing.name);
    const lower = ing.name.toLowerCase();
    const trap = NOT_INTERCHANGEABLE.some(([full, short]) => lower.includes(full) && have.has(short) && !have.has(normalizeIngredient(full)));
    const isStaple = assumeStaples && staples.has(norm);
    if (!trap && (haveIngredient(have, ing.name) || isStaple)) available.push(ing);
    else missing.push(ing);
  }
  const required = available.length + missing.length;
  const matchPercent = required === 0 ? 0 : Math.round((available.length / required) * 100);
  return {
    recipe,
    matchPercent,
    available,
    missing,
    blockedBy: opts.prefs ? allergenConflicts(recipe, opts.prefs) : [],
  };
}

// ---------------- allergens & diets (rule based, conservative) ----------------

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  Peanuts: ['peanut', 'groundnut'],
  'Tree nuts': ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio', 'macadamia', 'pine nut', 'nut'],
  Dairy: ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'ghee', 'paneer', 'parmesan', 'mozzarella', 'feta', 'custard', 'whey', 'parmigiano', 'reggiano', 'pecorino', 'ricotta', 'mascarpone', 'cheddar', 'gruyere', 'halloumi', 'brie', 'gouda', 'creme fraiche', 'kefir', 'buttermilk', 'condensed milk', 'lactose'],
  Eggs: ['egg', 'mayonnaise', 'mayo'],
  Soy: ['soy', 'tofu', 'miso', 'tempeh', 'edamame'],
  Wheat: ['flour', 'bread', 'pasta', 'spaghetti', 'penne', 'noodle', 'couscous', 'breadcrumb', 'tortilla', 'pastry', 'wheat', 'semolina', 'bulgur', 'naan', 'roti'],
  Fish: ['fish', 'salmon', 'tuna', 'cod', 'anchov', 'sardine', 'mackerel', 'haddock', 'trout', 'fish sauce'],
  Shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'squid', 'scallop'],
};

const MEAT = ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'ham', 'sausage', 'mince', 'turkey', 'duck', 'veal', 'mutton', 'chorizo', 'salami', 'gelatin'];
const FISH_SHELL = [...ALLERGEN_KEYWORDS.Fish, ...ALLERGEN_KEYWORDS.Shellfish];
const ANIMAL_PRODUCTS = [...ALLERGEN_KEYWORDS.Dairy, ...ALLERGEN_KEYWORDS.Eggs, 'honey'];
const CARB_HEAVY = ['pasta', 'spaghetti', 'rice', 'flour', 'bread', 'potato', 'noodle', 'sugar', 'tortilla', 'couscous', 'oat'];
const PROTEIN = [...MEAT, ...FISH_SHELL, 'egg', 'tofu', 'lentil', 'chickpea', 'bean', 'paneer', 'tempeh'];

const hit = (name: string, words: string[]) => words.some((w) => name.toLowerCase().includes(w));

export function deriveAllergens(ings: RecipeIngredient[]): string[] {
  const found = new Set<string>();
  for (const i of ings) {
    for (const [allergen, words] of Object.entries(ALLERGEN_KEYWORDS)) {
      // "coconut" is not a tree nut for this check; "nutmeg" must not trigger "nut"
      const name = i.name.toLowerCase().replace(/nutmeg|coconut|butternut|doughnut/g, '');
      if (hit(name, words)) found.add(allergen);
    }
  }
  return [...found].sort();
}

export function deriveDiets(ings: RecipeIngredient[], allergens: string[]): string[] {
  const names = ings.map((i) => i.name);
  const diets: string[] = [];
  const hasMeat = names.some((n) => hit(n, MEAT));
  const hasFish = names.some((n) => hit(n, FISH_SHELL));
  const hasAnimal = names.some((n) => hit(n, ANIMAL_PRODUCTS));
  if (!hasMeat && !hasFish) diets.push('Vegetarian');
  if (!hasMeat && !hasFish && !hasAnimal) diets.push('Vegan');
  if (!hasMeat) diets.push('Pescatarian');
  if (!allergens.includes('Wheat')) diets.push('Gluten Free');
  if (!names.some((n) => hit(n, CARB_HEAVY))) diets.push('Low Carb');
  if (names.filter((n) => hit(n, PROTEIN)).length >= 1 && (hasMeat || hasFish || names.some((n) => hit(n, ['egg', 'tofu', 'lentil', 'chickpea', 'paneer'])))) diets.push('High Protein');
  return diets;
}

/** Conservative: any keyword hit blocks. Custom allergies match by substring. */
export function allergenConflicts(recipe: Recipe, prefs: Pick<Preferences, 'allergies' | 'customAllergies'>): string[] {
  const conflicts = new Set<string>();
  for (const a of prefs.allergies) if (recipe.allergens.includes(a)) conflicts.add(a);
  for (const c of prefs.customAllergies) {
    const k = c.trim().toLowerCase();
    if (!k) continue;
    if (recipe.ingredients.some((i) => i.name.toLowerCase().includes(k)) || recipe.title.toLowerCase().includes(k)) conflicts.add(c.trim());
  }
  return [...conflicts];
}

export function scaleQuantity(q: number | null, from: number, to: number): number | null {
  if (q == null || from <= 0) return q;
  const v = (q * to) / from;
  return Math.round(v * 100) / 100;
}

export function formatQuantity(q: number | null, unit: string | null): string {
  if (q == null) return unit ?? '';
  const fr: Record<number, string> = { 0.25: '¼', 0.33: '⅓', 0.5: '½', 0.67: '⅔', 0.75: '¾' };
  const whole = Math.floor(q);
  const frac = Math.round((q - whole) * 100) / 100;
  const f = fr[frac];
  const num = f ? `${whole > 0 ? whole : ''}${f}` : String(q);
  return `${num}${unit ? ' ' + unit : ''}`;
}

export type SortKey = 'Best Match' | 'Quickest' | 'Easiest' | 'Most Popular';
const DIFF_RANK = { Easy: 0, Medium: 1, Hard: 2 } as const;

export function sortMatches(list: RecipeMatch[], key: SortKey): RecipeMatch[] {
  const l = [...list];
  switch (key) {
    case 'Quickest': return l.sort((a, b) => a.recipe.prepMinutes + a.recipe.cookMinutes - (b.recipe.prepMinutes + b.recipe.cookMinutes));
    case 'Easiest': return l.sort((a, b) => DIFF_RANK[a.recipe.difficulty] - DIFF_RANK[b.recipe.difficulty] || b.matchPercent - a.matchPercent);
    case 'Most Popular': return l.sort((a, b) => b.recipe.id.localeCompare(a.recipe.id)); // placeholder until server popularity counts exist
    default: return l.sort((a, b) => b.matchPercent - a.matchPercent || a.missing.length - b.missing.length);
  }
}

export function applyFilter(list: RecipeMatch[], filter: string): RecipeMatch[] {
  switch (filter) {
    case 'Quick Meals': return list.filter((m) => m.recipe.prepMinutes + m.recipe.cookMinutes <= 30);
    case 'Budget Friendly': return list.filter((m) => m.recipe.budget || m.recipe.ingredients.length <= 8);
    case 'High Protein':
    case 'Vegetarian':
    case 'Vegan':
    case 'Low Carb':
    case 'Gluten Free': return list.filter((m) => m.recipe.diets.includes(filter));
    default: return list;
  }
}
