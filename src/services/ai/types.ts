import type { DetectedIngredient, Preferences, Recipe } from '../../types';
import type { Substitution } from './schemas';

export interface RecognitionResult {
  ingredients: DetectedIngredient[];
  imageQuality: 'good' | 'poor' | 'unusable';
  warnings: string[];
  status: 'success' | 'partial' | 'no_food' | 'error';
  provider: string;
}

export interface IngredientRecognitionService {
  readonly name: string;
  detect(imageBase64: string, mime: string, signal?: AbortSignal): Promise<RecognitionResult>;
}

export interface RecipeGenerationService {
  readonly name: string;
  generate(input: { ingredients: string[]; prefs: Preferences; servings: number; maxMinutes?: number }): Promise<Recipe[]>;
}

export interface IngredientSubstitutionService {
  substitute(input: { ingredient: string; recipeTitle: string; prefs: Preferences }): Promise<Substitution[]>;
}

export class AIError extends Error {
  constructor(public code: 'offline' | 'timeout' | 'limit' | 'provider' | 'invalid' | 'auth', message: string) { super(message); }
}
