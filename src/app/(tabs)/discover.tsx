import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Chip, EmptyState, Row, Screen, SearchField, SectionHeader, T } from '../../components/common/ui';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { NativeAdCard } from '../../components/ads/Ads';
import { useCatalog } from '../../hooks/useCatalog';
import { useApp } from '../../store/useApp';
import { allergenConflicts } from '../../services/recipes/matching';
import { searchOnline } from '../../services/recipes/mealdb';
import { spacing } from '../../theme';
import { CUISINE_OPTIONS, MEAL_CATEGORIES } from '../../constants';

const COLLECTIONS = ['Trending', 'Quick meals', 'Budget meals', 'Healthy', 'Seasonal', ...MEAL_CATEGORIES] as const;
const PAGE = 12;

export default function Discover() {
  const router = useRouter();
  const prefs = useApp((s) => s.prefs);
  const catalog = useCatalog();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string>('Trending');
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [online, setOnline] = useState<typeof catalog>([]);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 3) { setOnline([]); return; }
    const h = setTimeout(() => searchOnline(t).then(setOnline), 500); // debounce; avoids excess requests
    return () => clearTimeout(h);
  }, [q]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let l = [...catalog, ...online.filter((o) => !catalog.some((c) => c.id === o.id))].filter((r) => allergenConflicts(r, prefs).length === 0);
    if (t) l = l.filter((r) => r.title.toLowerCase().includes(t) || r.cuisine.toLowerCase().includes(t) || r.ingredients.some((i) => i.name.toLowerCase().includes(t)));
    else {
      const month = new Date().getMonth();
      const warm = month >= 4 && month <= 8; // coarse northern-hemisphere hint only
      if (sel === 'Quick meals') l = l.filter((r) => r.prepMinutes + r.cookMinutes <= 30);
      else if (sel === 'Budget meals') l = l.filter((r) => r.budget || r.ingredients.length <= 7);
      else if (sel === 'Healthy') l = l.filter((r) => r.diets.includes('Vegetarian') || r.diets.includes('High Protein') || r.diets.includes('Low Carb'));
      else if (sel === 'Seasonal') l = l.filter((r) => (warm ? r.cookMinutes <= 15 : r.cookMinutes >= 20));
      else if ((MEAL_CATEGORIES as readonly string[]).includes(sel)) l = l.filter((r) => r.category === sel);
      else l = l.sort((a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl)); // "Trending": until server popularity exists, favour recipes with photos
    }
    if (cuisine) l = l.filter((r) => r.cuisine === cuisine);
    return l;
  }, [catalog, online, q, sel, cuisine, prefs]);

  useEffect(() => setLimit(PAGE), [q, sel, cuisine]);
  const page = list.slice(0, limit);

  return (
    <Screen>
      <T size="xl" weight="bold" accessibilityRole="header">Discover</T>
      <View style={{ marginTop: spacing.md }}><SearchField value={q} onChangeText={setQ} placeholder="Search recipes, cuisines, ingredients" /></View>
      {!q ? (
        <>
          <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }}>{COLLECTIONS.map((c) => <Chip key={c} label={c} selected={sel === c} onPress={() => setSel(c)} />)}</Row>
          <SectionHeader title="Popular cuisines" />
          <Row style={{ flexWrap: 'wrap' }}>
            <Chip label="All" selected={!cuisine} onPress={() => setCuisine(null)} />
            {CUISINE_OPTIONS.map((c) => <Chip key={c} label={c} selected={cuisine === c} onPress={() => setCuisine(cuisine === c ? null : c)} />)}
          </Row>
        </>
      ) : null}
      <SectionHeader title={q ? `Results for “${q}”` : sel} />
      {page.length === 0 ? <EmptyState icon="search-outline" title="Nothing found" message="Try another search or a different category." /> : null}
      <View style={{ gap: spacing.lg }}>
        {page.map((r, i) => (
          <React.Fragment key={r.id}>
            <RecipeCard recipe={r} onPress={() => router.push(`/recipe/${r.id}`)} />
            {i === 3 ? <NativeAdCard placement="discover_native" /> : null}
          </React.Fragment>
        ))}
      </View>
      {list.length > limit ? <View style={{ marginTop: spacing.lg }}><Chip label={`Show more (${list.length - limit})`} icon="chevron-down" onPress={() => setLimit(limit + PAGE)} /></View> : null}
      <View style={{ height: 90 }} />
    </Screen>
  );
}
