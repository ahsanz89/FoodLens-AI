import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEED_RECIPES } from '../src/data/seedRecipes';
import { computeMatch, sortMatches, applyFilter } from '../src/services/recipes/matching';
import { localSubstitutions } from '../src/services/ai/substitutions';
import { stepMinutes } from '../src/services/recipes/steps';

test('every seed recipe is well-formed', () => {
  const ids = new Set<string>();
  for (const r of SEED_RECIPES) {
    assert.ok(!ids.has(r.id), `duplicate id ${r.id}`); ids.add(r.id);
    assert.ok(r.ingredients.length >= 3, r.id);
    assert.ok(r.instructions.length >= 2, r.id);
    assert.ok(r.servings > 0 && r.prepMinutes >= 0 && r.cookMinutes >= 0, r.id);
    for (const i of r.ingredients) assert.ok(i.name.length > 0 && !/^\d/.test(i.name), `${r.id}: bad ingredient name "${i.name}"`);
  }
});

test('basket of tomato, onion, egg, garlic ranks egg dishes highly and flags none as 100% falsely', () => {
  const m = SEED_RECIPES.map((r) => computeMatch(r, ['tomato', 'onion', 'egg', 'garlic']));
  const top = sortMatches(m.filter((x) => x.matchPercent > 0), 'Best Match').slice(0, 3).map((x) => x.recipe.id);
  assert.ok(top.includes('seed-shakshuka') || top.includes('seed-veg-omelette'), top.join());
  for (const x of m) assert.equal(x.available.length + x.missing.length, x.recipe.ingredients.filter((i) => !i.optional).length);
});

test('vegan filter never includes meat, dairy or egg dishes', () => {
  const m = SEED_RECIPES.map((r) => computeMatch(r, []));
  for (const x of applyFilter(m, 'Vegan')) assert.ok(!x.recipe.allergens.includes('Dairy') && !x.recipe.allergens.includes('Eggs'), x.recipe.id);
});

test('substitutions respect allergies', () => {
  const subs = localSubstitutions('butter', { allergies: [], customAllergies: ['coconut'], diets: [] });
  assert.ok(subs.every((s) => !s.substitute.toLowerCase().includes('coconut')));
  const noWheat = localSubstitutions('milk', { allergies: ['Wheat'], customAllergies: [], diets: [] });
  assert.ok(noWheat.every((s) => s.substitute !== 'Oat milk'));
});

test('step timer parsing', () => {
  assert.equal(stepMinutes('Simmer 8 minutes until saucy.'), 8);
  assert.equal(stepMinutes('Cook 5-6 min until set'), 6);
  assert.equal(stepMinutes('Chop the onion'), null);
});
