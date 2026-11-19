import { CONFIG } from '../../constants';
import { MockRecognitionService } from './mockProvider';
import { RemoteRecognitionService } from './remoteProvider';
import type { IngredientRecognitionService } from './types';

/** Single switch point. Swap providers by config; no screen imports a concrete provider. */
export function getRecognitionService(): IngredientRecognitionService {
  return CONFIG.AI_PROVIDER === 'remote' ? new RemoteRecognitionService() : new MockRecognitionService();
}
export * from './types';
export { localSubstitutions } from './substitutions';
