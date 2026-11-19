export const CONFIG = {
  FREE_SCANS_PER_DAY: 3, // mirrored server-side; client value is display-only
  MAX_IMAGE_EDGE: 1024,
  IMAGE_QUALITY: 0.7,
  AI_TIMEOUT_MS: 30000,
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  AI_PROVIDER: (process.env.EXPO_PUBLIC_AI_PROVIDER ?? 'mock') as 'mock' | 'remote',
  MEALDB_BASE: 'https://www.themealdb.com/api/json/v1/1',
  INTERSTITIAL_MIN_INTERVAL_MS: 5 * 60 * 1000,
};

export const DIET_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Mediterranean', 'High Protein',
] as const;

export const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Fish', 'Shellfish',
] as const;

export const CUISINE_OPTIONS = [
  'Asian', 'Indian', 'Pakistani', 'Italian', 'Mexican', 'Mediterranean',
  'American', 'Middle Eastern', 'Other',
] as const;

export const INGREDIENT_CATEGORIES = [
  'Vegetable', 'Fruit', 'Dairy', 'Meat', 'Seafood', 'Grains',
  'Spices', 'Condiments', 'Bakery', 'Other',
] as const;

export const UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'can', 'bunch'] as const;

export const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] as const;

export const FILTERS = [
  'All Recipes', 'Quick Meals', 'Budget Friendly', 'High Protein',
  'Vegetarian', 'Vegan', 'Low Carb', 'Gluten Free',
] as const;

export const DISCLAIMERS = {
  allergen:
    'Allergen information is automatically estimated and may be incomplete. It does not account for hidden ingredients or cross-contamination. Always check product labels.',
  nutrition: 'Nutrition values are rough estimates, not verified data.',
  ai: 'AI-generated content can contain mistakes. Check ingredients and cooking safety yourself.',
  food: 'FoodLens cannot judge freshness or spoilage from a photo. When in doubt, throw it out.',
  imageUpload:
    'Your photo is sent to an AI service to identify ingredients. It is not shared publicly and is deleted after analysis.',
};
