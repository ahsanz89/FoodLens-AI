export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type IngredientCategory =
  | 'Vegetable' | 'Fruit' | 'Dairy' | 'Meat' | 'Seafood' | 'Grains'
  | 'Spices' | 'Condiments' | 'Bakery' | 'Other';

export interface DetectedIngredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number | null;
  unit: string | null;
  confidence: number; // 0..1
  needsConfirmation: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional?: boolean;
}

export interface RecipeStep {
  step: number;
  instruction: string;
  durationMinutes?: number | null;
  temperature?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  category: string; // Breakfast | Lunch | Dinner | Snack | Dessert | ...
  difficulty: Difficulty;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  imageUrl: string | null;
  ingredients: RecipeIngredient[];
  instructions: RecipeStep[];
  allergens: string[]; // derived by rule, never guaranteed
  diets: string[]; // derived by rule: Vegetarian, Vegan, Gluten Free, Low Carb, High Protein
  tips: string[];
  sourceType: 'seed' | 'themealdb' | 'ai';
  sourceUrl?: string | null;
  budget?: boolean;
}

export interface RecipeMatch {
  recipe: Recipe;
  matchPercent: number; // computed from confirmed ingredients, never from AI
  available: RecipeIngredient[];
  missing: RecipeIngredient[];
  blockedBy: string[]; // allergen warnings
}

export interface Preferences {
  diets: string[];
  allergies: string[];
  customAllergies: string[];
  cuisines: string[];
  skill: 'Beginner' | 'Intermediate' | 'Advanced';
  maxTime: 15 | 30 | 60 | 0; // 0 = flexible
}

export interface KitchenItem {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number | null;
  unit: string | null;
  expiry?: string | null; // ISO date
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  recipeId?: string;
  done: boolean;
}

export interface ScanRecord {
  id: string;
  createdAt: string;
  ingredients: string[];
  provider: string;
}

export interface Collection {
  id: string;
  name: string;
  recipeIds: string[];
}
