import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMatch, normalizeIngredient, deriveAllergens, deriveDiets, scaleQuantity, allergenConflicts } from '../src/services/recipes/matching';

const ing = (name: string, quantity: number | null = 1, unit: string | null = null) => ({ name, quantity, unit });
const recipe: any = {
  id: 'r1', title: 'Tomato Pasta', ingredients: [ing('Penne rigate'), ing('Chopped tomatoes'), ing('Garlic'), ing('Olive oil'), ing('Salt'), ing('Parmigiano-Reggiano')],
  allergens: [], diets: [],
};

test('normalizes synonyms', () => {
  assert.equal(normalizeIngredient('Chopped Tomatoes'), 'tomato');
  assert.equal(normalizeIngredient('Penne rigate'), 'pasta');
  assert.equal(normalizeIngredient('fresh Carrots'), 'carrot');
});

test('match percent is computed from confirmed ingredients and staples', () => {
  const m = computeMatch(recipe, ['tomato', 'pasta', 'garlic']);
  // available: pasta, tomato, garlic, oil(staple), salt(staple); missing: parmesan
  assert.equal(m.available.length, 5);
  assert.equal(m.missing.length, 1);
  assert.equal(m.matchPercent, 83);
});

test('staples can be disabled', () => {
  const m = computeMatch(recipe, ['tomato', 'pasta', 'garlic', 'parmesan'], { assumeStaples: false });
  assert.equal(m.missing.length, 2);
});

test('coconut milk is not satisfied by milk', () => {
  const r: any = { ...recipe, ingredients: [ing('Coconut milk')] };
  assert.equal(computeMatch(r, ['milk']).matchPercent, 0);
});

test('allergens: nutmeg is not a nut, butter is dairy, pasta is wheat', () => {
  assert.deepEqual(deriveAllergens([ing('Nutmeg')]), []);
  assert.deepEqual(deriveAllergens([ing('Butter'), ing('Penne')]), ['Dairy', 'Wheat']);
});

test('diets', () => {
  const a = deriveAllergens([ing('Chicken'), ing('Rice')]);
  const d = deriveDiets([ing('Chicken'), ing('Rice')], a);
  assert.ok(!d.includes('Vegetarian'));
  assert.ok(d.includes('Gluten Free'));
  assert.ok(d.includes('High Protein'));
  const v = deriveDiets([ing('Chickpeas'), ing('Tomato')], []);
  assert.ok(v.includes('Vegan'));
});

test('allergen conflicts block conservatively, incl custom', () => {
  const r: any = { title: 'X', allergens: ['Dairy'], ingredients: [ing('Sesame oil')] };
  assert.deepEqual(allergenConflicts(r, { allergies: ['Dairy'], customAllergies: ['sesame'] }).sort(), ['Dairy', 'sesame']);
});

test('scaling', () => {
  assert.equal(scaleQuantity(200, 2, 3), 300);
  assert.equal(scaleQuantity(null, 2, 4), null);
});
