import { useEffect, useState } from 'react';
import type { Recipe } from '../types';
import { allRecipes } from '../services/recipes/repository';
import { SEED_RECIPES } from '../data/seedRecipes';

export function useCatalog(): Recipe[] {
  const [list, setList] = useState<Recipe[]>(SEED_RECIPES);
  useEffect(() => { let a = true; allRecipes().then((r) => a && setList(r)); return () => { a = false; }; }, []);
  return list;
}
