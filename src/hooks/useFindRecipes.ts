import { useRouter } from 'expo-router';
import { useApp } from '../store/useApp';
import { useSession } from '../store/useSession';
import { findRecipes } from '../services/recipes/repository';
import { track } from '../services/analytics';

/** Runs matching over confirmed ingredients and navigates to results. */
export function useFindRecipes() {
  const router = useRouter();
  const prefs = useApp((s) => s.prefs);
  const remember = useApp((s) => s.rememberIngredients);
  const sess = useSession();
  return async (names: string[]) => {
    const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    if (!clean.length) return;
    remember(clean);
    sess.setIngredients(clean);
    sess.setStatus('loading');
    track('ingredient_confirmed', { count: clean.length });
    track('recipe_generation_started');
    router.push('/results');
    try {
      const matches = await findRecipes({ ingredients: clean, prefs });
      sess.setResults(matches);
      track('recipe_generation_completed', { count: matches.length });
    } catch {
      sess.setStatus('error', 'We could not look up recipes. Check your connection and try again.');
    }
  };
}
