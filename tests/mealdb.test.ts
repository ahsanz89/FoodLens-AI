import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMealDb } from '../src/services/recipes/mealdbParse';

test('parses a TheMealDB meal', () => {
  const r = parseMealDb({
    idMeal: '52771', strMeal: 'Spicy Arrabiata Penne', strCategory: 'Vegetarian', strArea: 'Italian', strTags: 'Pasta,Curry',
    strInstructions: 'Bring a large pot of water to a boil.\r\nAdd garlic.\r\nSimmer the sauce.\r\nToss the pasta.',
    strMealThumb: 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg',
    strIngredient1: 'penne rigate', strMeasure1: '1 pound', strIngredient2: 'olive oil', strMeasure2: '1/4 cup',
    strIngredient3: 'garlic', strMeasure3: '3 cloves', strIngredient4: 'Parmigiano-Reggiano', strMeasure4: 'sprinkling', strIngredient5: '', strMeasure5: '',
  } as any)!;
  assert.equal(r.id, 'mealdb-52771');
  assert.equal(r.cuisine, 'Italian');
  assert.equal(r.ingredients.length, 4);
  assert.equal(r.ingredients[3].unit, 'sprinkling');
  assert.ok(r.allergens.includes('Wheat') && r.allergens.includes('Dairy'));
  assert.equal(r.instructions.length, 4);
});

test('rejects incomplete meals', () => {
  assert.equal(parseMealDb({ idMeal: '1', strMeal: 'x' } as any), null);
});
