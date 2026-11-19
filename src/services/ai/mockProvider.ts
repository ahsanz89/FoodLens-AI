import type { DetectedIngredient } from '../../types';
import type { IngredientRecognitionService, RecognitionResult } from './types';

/**
 * DEVELOPMENT ONLY. Does not look at the image: returns a rotating demo basket so the
 * whole flow is testable without API keys. Production uses RemoteRecognitionService.
 */
const BASKETS: Array<Array<[string, DetectedIngredient['category'], number]>> = [
  [['Tomato', 'Vegetable', 0.96], ['Onion', 'Vegetable', 0.93], ['Egg', 'Dairy', 0.9], ['Garlic', 'Vegetable', 0.82], ['Bell pepper', 'Vegetable', 0.55]],
  [['Chicken', 'Meat', 0.92], ['Carrot', 'Vegetable', 0.9], ['Rice', 'Grains', 0.85], ['Onion', 'Vegetable', 0.88], ['Lemon', 'Fruit', 0.6]],
  [['Potato', 'Vegetable', 0.94], ['Tomato', 'Vegetable', 0.9], ['Chickpeas', 'Grains', 0.8], ['Yogurt', 'Dairy', 0.7], ['Cucumber', 'Vegetable', 0.52]],
];
let i = 0;

export class MockRecognitionService implements IngredientRecognitionService {
  readonly name = 'mock';
  async detect(): Promise<RecognitionResult> {
    await new Promise((r) => setTimeout(r, 1200));
    const basket = BASKETS[i++ % BASKETS.length];
    return {
      provider: this.name,
      status: 'success',
      imageQuality: 'good',
      warnings: ['Demo mode: results are sample data, not read from your photo.'],
      ingredients: basket.map(([name, category, confidence], n) => ({
        id: `m${i}-${n}`, name, category, quantity: null, unit: null, confidence, needsConfirmation: confidence < 0.65,
      })),
    };
  }
}
