import { create } from 'zustand';
import type { RecipeMatch } from '../types';

interface Session {
  ingredients: string[];
  matches: RecipeMatch[];
  status: 'idle' | 'loading' | 'done' | 'error';
  error: string | null;
  discoveryCount: number;
  setIngredients: (i: string[]) => void;
  setResults: (m: RecipeMatch[]) => void;
  setStatus: (s: Session['status'], error?: string | null) => void;
  bumpDiscovery: () => number;
}
export const useSession = create<Session>((set, get) => ({
  ingredients: [], matches: [], status: 'idle', error: null, discoveryCount: 0,
  setIngredients: (ingredients) => set({ ingredients }),
  setResults: (matches) => set({ matches, status: 'done', error: null }),
  setStatus: (status, error = null) => set({ status, error }),
  bumpDiscovery: () => { set({ discoveryCount: get().discoveryCount + 1 }); return get().discoveryCount; },
}));
