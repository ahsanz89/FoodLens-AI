import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants';
import type { Collection, DetectedIngredient, KitchenItem, Preferences, Recipe, ScanRecord, ShoppingItem } from '../types';

export const defaultPrefs: Preferences = {
  diets: [], allergies: [], customAllergies: [], cuisines: [], skill: 'Beginner', maxTime: 0,
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const today = () => new Date().toISOString().slice(0, 10);

interface State {
  hydrated: boolean;
  onboarded: boolean;
  mode: 'guest' | 'account';
  displayName: string;
  email: string | null;
  prefs: Preferences;
  favorites: string[];
  collections: Collection[];
  kitchen: KitchenItem[];
  shopping: ShoppingItem[];
  history: { recipeId: string; at: string }[];
  scans: ScanRecord[];
  recentIngredients: string[];
  savedRecipes: Record<string, Recipe>; // snapshots so favorites work offline
  scanUsage: { date: string; used: number; bonus: number };
  notifications: { daily: boolean; reminders: boolean };
  adConsent: 'unknown' | 'personalized' | 'non_personalized';
  keepAwake: boolean;
  // working session (not persisted)
  draft: DetectedIngredient[];
}

interface Actions {
  completeOnboarding: (mode: 'guest' | 'account', name?: string, email?: string | null) => void;
  setPrefs: (p: Partial<Preferences>) => void;
  toggleFavorite: (r: Recipe) => void;
  addCollection: (name: string) => void;
  toggleInCollection: (cid: string, rid: string) => void;
  addKitchen: (items: Omit<KitchenItem, 'id'>[]) => void;
  updateKitchen: (id: string, patch: Partial<KitchenItem>) => void;
  removeKitchen: (id: string) => void;
  addShopping: (items: Omit<ShoppingItem, 'id' | 'done'>[]) => void;
  toggleShopping: (id: string) => void;
  removeShopping: (id: string) => void;
  clearDoneShopping: () => void;
  pushHistory: (r: Recipe) => void;
  addScan: (s: Omit<ScanRecord, 'id' | 'createdAt'>) => void;
  rememberIngredients: (names: string[]) => void;
  setDraft: (d: DetectedIngredient[]) => void;
  scansLeft: () => number;
  consumeScan: () => boolean;
  grantBonusScan: () => void;
  setNotifications: (n: Partial<State['notifications']>) => void;
  setAdConsent: (c: State['adConsent']) => void;
  setKeepAwake: (v: boolean) => void;
  setProfile: (name: string, email?: string | null) => void;
  deleteAllData: () => void;
}

const initial = (): State => ({
  hydrated: false, onboarded: false, mode: 'guest', displayName: 'Guest', email: null,
  prefs: defaultPrefs, favorites: [], collections: [], kitchen: [], shopping: [], history: [], scans: [],
  recentIngredients: [], savedRecipes: {}, scanUsage: { date: today(), used: 0, bonus: 0 },
  notifications: { daily: false, reminders: false }, adConsent: 'unknown', keepAwake: true, draft: [],
});

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial(),
      completeOnboarding: (mode, name, email) =>
        set({ onboarded: true, mode, displayName: name || (mode === 'guest' ? 'Guest' : 'Chef'), email: email ?? null }),
      setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
      toggleFavorite: (r) =>
        set((s) => {
          const has = s.favorites.includes(r.id);
          return {
            favorites: has ? s.favorites.filter((i) => i !== r.id) : [r.id, ...s.favorites],
            savedRecipes: has ? s.savedRecipes : { ...s.savedRecipes, [r.id]: r },
            collections: has ? s.collections.map((c) => ({ ...c, recipeIds: c.recipeIds.filter((i) => i !== r.id) })) : s.collections,
          };
        }),
      addCollection: (name) => set((s) => ({ collections: [...s.collections, { id: uid(), name: name.trim(), recipeIds: [] }] })),
      toggleInCollection: (cid, rid) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== cid ? c : { ...c, recipeIds: c.recipeIds.includes(rid) ? c.recipeIds.filter((i) => i !== rid) : [...c.recipeIds, rid] }),
        })),
      addKitchen: (items) =>
        set((s) => {
          const next = [...s.kitchen];
          for (const it of items) {
            const ex = next.find((k) => k.name.toLowerCase() === it.name.toLowerCase());
            if (ex) { ex.quantity = it.quantity ?? ex.quantity; ex.unit = it.unit ?? ex.unit; }
            else next.push({ ...it, id: uid() });
          }
          return { kitchen: next };
        }),
      updateKitchen: (id, patch) => set((s) => ({ kitchen: s.kitchen.map((k) => (k.id === id ? { ...k, ...patch } : k)) })),
      removeKitchen: (id) => set((s) => ({ kitchen: s.kitchen.filter((k) => k.id !== id) })),
      addShopping: (items) =>
        set((s) => {
          const next = [...s.shopping];
          for (const it of items) if (!next.some((n) => !n.done && n.name.toLowerCase() === it.name.toLowerCase())) next.push({ ...it, id: uid(), done: false });
          return { shopping: next };
        }),
      toggleShopping: (id) => set((s) => ({ shopping: s.shopping.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
      removeShopping: (id) => set((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) })),
      clearDoneShopping: () => set((s) => ({ shopping: s.shopping.filter((i) => !i.done) })),
      pushHistory: (r) =>
        set((s) => ({
          history: [{ recipeId: r.id, at: new Date().toISOString() }, ...s.history.filter((h) => h.recipeId !== r.id)].slice(0, 50),
          savedRecipes: s.savedRecipes[r.id] ? s.savedRecipes : { ...s.savedRecipes, [r.id]: r },
        })),
      addScan: (sc) => set((s) => ({ scans: [{ ...sc, id: uid(), createdAt: new Date().toISOString() }, ...s.scans].slice(0, 20) })),
      rememberIngredients: (names) =>
        set((s) => ({ recentIngredients: [...new Set([...names, ...s.recentIngredients])].slice(0, 20) })),
      setDraft: (d) => set({ draft: d }),
      scansLeft: () => {
        const u = get().scanUsage;
        const used = u.date === today() ? u.used : 0;
        const bonus = u.date === today() ? u.bonus : 0;
        return Math.max(0, CONFIG.FREE_SCANS_PER_DAY + bonus - used);
      },
      consumeScan: () => {
        if (get().scansLeft() <= 0) return false;
        set((s) => (s.scanUsage.date === today() ? { scanUsage: { ...s.scanUsage, used: s.scanUsage.used + 1 } } : { scanUsage: { date: today(), used: 1, bonus: 0 } }));
        return true;
      },
      grantBonusScan: () =>
        set((s) => (s.scanUsage.date === today() ? { scanUsage: { ...s.scanUsage, bonus: s.scanUsage.bonus + 1 } } : { scanUsage: { date: today(), used: 0, bonus: 1 } })),
      setNotifications: (n) => set((s) => ({ notifications: { ...s.notifications, ...n } })),
      setAdConsent: (c) => set({ adConsent: c }),
      setKeepAwake: (v) => set({ keepAwake: v }),
      setProfile: (name, email) => set({ displayName: name, email: email ?? null }),
      deleteAllData: () => set({ ...initial(), hydrated: true }),
    }),
    {
      name: 'foodlens.app.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ draft, hydrated, ...rest }) => rest as any,
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);

export const newId = uid;
