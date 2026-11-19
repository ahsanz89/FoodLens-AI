import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Card, Chip, Row, Screen, SectionHeader, T } from '../../components/common/ui';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { AdBanner } from '../../components/ads/Ads';
import { useApp } from '../../store/useApp';
import { useFindRecipes } from '../../hooks/useFindRecipes';
import { useCatalog } from '../../hooks/useCatalog';
import { dailyRecipe } from '../../services/recipes/repository';
import { allergenConflicts } from '../../services/recipes/matching';
import { radius, spacing, useColors } from '../../theme';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning!' : h < 18 ? 'Good afternoon!' : 'Good evening!'; };

export default function Home() {
  const c = useColors();
  const router = useRouter();
  const name = useApp((s) => s.displayName);
  const prefs = useApp((s) => s.prefs);
  const history = useApp((s) => s.history);
  const scans = useApp((s) => s.scans);
  const saved = useApp((s) => s.savedRecipes);
  const left = useApp((s) => s.scansLeft());
  const catalog = useCatalog();
  const find = useFindRecipes();

  const daily = useMemo(() => dailyRecipe(catalog, prefs), [catalog, prefs]);
  const recommended = useMemo(() => {
    const viewedCuisines = history.map((h) => saved[h.recipeId]?.cuisine).filter(Boolean);
    const want = new Set([...prefs.cuisines.map((x) => x.toLowerCase()), ...viewedCuisines.map((x) => x!.toLowerCase())]);
    return catalog
      .filter((r) => allergenConflicts(r, prefs).length === 0)
      .filter((r) => !(prefs.diets.includes('Vegetarian') && !r.diets.includes('Vegetarian')) && !(prefs.diets.includes('Vegan') && !r.diets.includes('Vegan')))
      .map((r) => ({ r, s: (want.has(r.cuisine.toLowerCase()) ? 2 : 0) + (prefs.diets.includes('High Protein') && r.diets.includes('High Protein') ? 1 : 0) + (r.prepMinutes + r.cookMinutes <= (prefs.maxTime || 60) ? 1 : 0) }))
      .sort((a, b) => b.s - a.s).slice(0, 8).map((x) => x.r);
  }, [catalog, prefs, history, saved]);
  const recent = history.map((h) => saved[h.recipeId]).filter(Boolean).slice(0, 6);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <T size="lg" weight="bold" accessibilityRole="header">{greet()}</T>
          <T color="textSecondary">{name === 'Guest' ? 'Ready to cook something?' : `Hi ${name}`}</T>
        </View>
        <Row style={{ gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications settings" onPress={() => router.push('/(tabs)/profile')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={24} color={c.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/(tabs)/profile')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
            <T weight="bold" color="primaryOn">{name.slice(0, 1).toUpperCase()}</T>
          </Pressable>
        </Row>
      </Row>

      <Card style={{ marginTop: spacing.lg, padding: spacing.xl, backgroundColor: c.primary, borderColor: c.primary }}>
        <T size="xl" weight="bold" style={{ color: '#fff' }}>What's in your kitchen today?</T>
        <T style={{ color: '#E8F5EC', marginTop: 6, marginBottom: spacing.lg }}>Scan your ingredients and discover delicious recipes.</T>
        <Button title="Scan Ingredients" icon="camera" onPress={() => router.push('/scan')} style={{ backgroundColor: c.secondary }} />
        <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={{ marginTop: spacing.md, alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
          <T weight="semibold" style={{ color: '#fff' }}>Upload a Photo</T>
        </Pressable>
        <T size="sm" style={{ color: '#CFE8D8', textAlign: 'center' }}>{left} free scan{left === 1 ? '' : 's'} left today</T>
      </Card>

      <Row style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        {([['camera', 'Scan', '/scan'], ['add-circle', 'Add manually', '/manual'], ['compass', 'Explore', '/(tabs)/discover'], ['basket', 'My Kitchen', '/(tabs)/kitchen']] as const).map(([icon, label, to]) => (
          <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(to as any)}
            style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: spacing.md, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, minHeight: 72 }}>
            <Ionicons name={icon} size={24} color={c.primary} />
            <T size="sm" weight="semibold" numberOfLines={1}>{label}</T>
          </Pressable>
        ))}
      </Row>

      {daily ? (
        <>
          <SectionHeader title="Daily inspiration" />
          <RecipeCard recipe={daily} onPress={() => router.push(`/recipe/${daily.id}`)} />
        </>
      ) : null}

      <SectionHeader title="Recommended for you" action="See all" onAction={() => router.push('/(tabs)/discover')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {recommended.map((r) => <RecipeCard key={r.id} recipe={r} width={250} onPress={() => router.push(`/recipe/${r.id}`)} />)}
      </ScrollView>

      {recent.length ? (
        <>
          <SectionHeader title="Recently viewed" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
            {recent.map((r) => <RecipeCard key={r.id} recipe={r} width={220} onPress={() => router.push(`/recipe/${r.id}`)} />)}
          </ScrollView>
        </>
      ) : null}
      {scans.length ? (
        <>
          <SectionHeader title="Recent scans" />
          {scans.slice(0, 3).map((s) => (
            <Card key={s.id} style={{ padding: spacing.md, marginBottom: 8 }} onPress={() => find(s.ingredients)} label={`Find recipes again for ${s.ingredients.slice(0, 3).join(', ')}`}>
              <T weight="semibold" numberOfLines={1}>{s.ingredients.join(', ')}</T>
              <T size="sm" color="textSecondary">{new Date(s.createdAt).toLocaleDateString()}</T>
            </Card>
          ))}
        </>
      ) : null}

      <AdBanner placement="home_banner" />
      <View style={{ height: 90 }} />
    </Screen>
  );
}
