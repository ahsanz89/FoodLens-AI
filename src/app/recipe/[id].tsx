import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner, Button, Card, Chip, ErrorState, IconButton, Row, Screen, SectionHeader, Skeleton, T } from '../../components/common/ui';
import { FavButton, RecipeImage } from '../../components/recipe/RecipeCard';
import { useToast } from '../../components/common/toast';
import { useApp } from '../../store/useApp';
import { useSession } from '../../store/useSession';
import { getRecipe } from '../../services/recipes/repository';
import { allergenConflicts, computeMatch, formatQuantity, normalizeIngredient, scaleQuantity } from '../../services/recipes/matching';
import { localSubstitutions } from '../../services/ai';
import { track } from '../../services/analytics';
import { DISCLAIMERS } from '../../constants';
import { radius, spacing, useColors } from '../../theme';
import type { Recipe } from '../../types';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const router = useRouter();
  const toast = useToast();
  const prefs = useApp((s) => s.prefs);
  const saved = useApp((s) => s.savedRecipes);
  const kitchen = useApp((s) => s.kitchen);
  const addShopping = useApp((s) => s.addShopping);
  const pushHistory = useApp((s) => s.pushHistory);
  const toggleFav = useApp((s) => s.toggleFavorite);
  const isFav = useApp((s) => s.favorites.includes(id));
  const sessionIng = useSession((s) => s.ingredients);
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [servings, setServings] = useState(2);
  const [manual, setManual] = useState<string[]>([]); // user-marked "I have this"
  const [step, setStep] = useState(0);
  const [subFor, setSubFor] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = (await getRecipe(id)) ?? saved[id] ?? null;
      if (!alive) return;
      setRecipe(r);
      if (r) { setServings(r.servings); pushHistory(r); track('recipe_viewed'); }
    })();
    return () => { alive = false; };
  }, [id]);

  const have = useMemo(() => [...sessionIng, ...kitchen.map((k) => k.name), ...manual], [sessionIng, kitchen, manual]);
  const match = useMemo(() => (recipe ? computeMatch(recipe, have, { prefs }) : null), [recipe, have, prefs]);

  if (recipe === undefined) return <Screen><Skeleton height={220} /><Skeleton style={{ marginTop: 16 }} width="60%" height={28} /><Skeleton style={{ marginTop: 12 }} /></Screen>;
  if (recipe === null || !match) return <Screen><ErrorState title="Recipe not found" message="This recipe isn't available offline. Connect to the internet and try again." onRetry={() => router.back()} retryLabel="Go back" /></Screen>;

  const total = recipe.prepMinutes + recipe.cookMinutes;
  const availSet = new Set(match.available.map((i) => i.name));
  const subs = subFor ? localSubstitutions(subFor, prefs) : [];

  return (
    <Screen
      padded={false} edges={[]}
      footer={
        <Row style={{ gap: spacing.sm }}>
          <Button style={{ flex: 1 }} title="Start Cooking" icon="flame" onPress={() => { track('cooking_mode_started'); router.push(`/cook/${recipe.id}`); }} />
          <Button variant="secondary" icon={isFav ? 'heart' : 'heart-outline'} title={isFav ? 'Saved' : 'Save'} onPress={() => { toggleFav(recipe); if (!isFav) track('recipe_saved'); }} />
        </Row>
      }
    >
      <View>
        <RecipeImage recipe={recipe} height={260} />
        <View style={{ position: 'absolute', top: 40, left: 12 }}><IconButton icon="arrow-back" label="Back" bg="rgba(255,255,255,0.92)" onPress={() => router.back()} /></View>
        <View style={{ position: 'absolute', top: 40, right: 12, flexDirection: 'row', gap: 8 }}>
          <IconButton icon="share-outline" label="Share recipe" bg="rgba(255,255,255,0.92)" onPress={() => Share.share({ title: recipe.title, message: `${recipe.title}\n\n${recipe.ingredients.map((i) => `• ${formatQuantity(i.quantity, i.unit)} ${i.name}`.trim()).join('\n')}\n\n${recipe.instructions.map((s) => `${s.step}. ${s.instruction}`).join('\n')}\n\nShared from FoodLens AI` })} />
          <FavButton recipe={recipe} />
        </View>
      </View>

      <View style={{ padding: spacing.lg }}>
        <T size="xl" weight="bold" accessibilityRole="header">{recipe.title}</T>
        <T color="textSecondary" style={{ marginTop: 4 }}>{recipe.description}</T>
        <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }}>
          <Chip icon="earth" label={recipe.cuisine} />
          <Chip icon="speedometer" label={recipe.difficulty} />
          <Chip icon="time" label={`Prep ${recipe.prepMinutes}m`} />
          <Chip icon="flame" label={`Cook ${recipe.cookMinutes}m`} />
          <Chip icon="hourglass" label={`Total ${total}m`} />
        </Row>
        {recipe.sourceType !== 'seed' ? <T size="sm" color="textSecondary">Source: {recipe.sourceType === 'themealdb' ? 'TheMealDB' : 'AI-generated'}{recipe.sourceType === 'ai' ? ' · ' + DISCLAIMERS.ai : ''}</T> : null}

        {match.blockedBy.length > 0 ? <Banner tone="error" text={`Heads up: this recipe appears to contain ${match.blockedBy.join(', ')}, which you told us to avoid. Don't cook it unless you've checked every ingredient.`} /> : null}

        <SectionHeader title="Ingredients" />
        <Row style={{ justifyContent: 'space-between' }}>
          <T color="textSecondary">Servings</T>
          <Row style={{ gap: 4 }}>
            <IconButton icon="remove-circle-outline" label="Fewer servings" onPress={() => setServings(Math.max(1, servings - 1))} />
            <T weight="bold" size="md" style={{ minWidth: 28, textAlign: 'center' }} accessibilityLiveRegion="polite">{servings}</T>
            <IconButton icon="add-circle-outline" label="More servings" onPress={() => setServings(Math.min(24, servings + 1))} />
          </Row>
        </Row>
        <Card style={{ padding: spacing.md, marginTop: spacing.sm }}>
          {recipe.ingredients.map((ing, i) => {
            const ok = availSet.has(ing.name) || ing.optional;
            return (
              <Row key={i} style={{ paddingVertical: 8, gap: 10 }}>
                <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={ok ? c.primary : c.textSecondary} accessibilityLabel={ok ? 'Available' : 'Missing'} />
                <T style={{ flex: 1 }}>{ing.name}</T>
                <T color="textSecondary">{formatQuantity(scaleQuantity(ing.quantity, recipe.servings, servings), ing.unit)}</T>
              </Row>
            );
          })}
        </Card>

        {match.missing.length > 0 ? (
          <>
            <SectionHeader title="You may need these ingredients" />
            <Card style={{ padding: spacing.md }}>
              {match.missing.map((ing) => (
                <View key={ing.name} style={{ paddingVertical: 8, gap: 6 }}>
                  <Row style={{ gap: 8 }}>
                    <T style={{ flex: 1 }} weight="semibold">{ing.name}</T>
                    <T color="textSecondary" size="sm">{formatQuantity(scaleQuantity(ing.quantity, recipe.servings, servings), ing.unit)}</T>
                  </Row>
                  <Row style={{ flexWrap: 'wrap' }}>
                    <Chip icon="checkmark" label="I have this" onPress={() => setManual((m) => [...m, ing.name])} />
                    <Chip icon="swap-horizontal" label="Substitute" selected={subFor === ing.name} onPress={() => setSubFor(subFor === ing.name ? null : ing.name)} />
                    <Chip icon="cart" label="Add to list" onPress={() => { addShopping([{ name: ing.name, quantity: scaleQuantity(ing.quantity, recipe.servings, servings), unit: ing.unit, recipeId: recipe.id }]); track('shopping_item_added'); toast(`${ing.name} added to shopping list`); }} />
                  </Row>
                  {subFor === ing.name ? (
                    subs.length ? subs.map((s) => (
                      <View key={s.substitute} style={{ backgroundColor: c.surfaceAlt, borderRadius: radius.md, padding: spacing.md }}>
                        <T weight="bold">{s.substitute}</T>
                        <T size="sm">Use: {s.quantity_conversion}</T>
                        <T size="sm" color="textSecondary">{s.explanation}</T>
                        {s.allergen_warning ? <T size="sm" style={{ color: '#7A4F00', marginTop: 2 }}>⚠ {s.allergen_warning}</T> : null}
                      </View>
                    )) : <T size="sm" color="textSecondary">No safe substitute suggestions for this ingredient given your allergies. Try leaving it out or buying it.</T>
                  ) : null}
                </View>
              ))}
              <Button small variant="secondary" icon="cart" title="Add all missing to shopping list" style={{ marginTop: 8 }}
                onPress={() => { addShopping(match.missing.map((m) => ({ name: m.name, quantity: scaleQuantity(m.quantity, recipe.servings, servings), unit: m.unit, recipeId: recipe.id }))); track('shopping_item_added'); toast('Added to shopping list'); }} />
            </Card>
          </>
        ) : null}

        <SectionHeader title="Instructions" />
        {recipe.instructions.map((s, i) => (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Step ${s.step}`} onPress={() => setStep(i)}
            style={{ flexDirection: 'row', gap: 12, padding: spacing.md, borderRadius: radius.md, marginBottom: 8, backgroundColor: i === step ? c.surfaceAlt : 'transparent', borderWidth: i === step ? 2 : 0, borderColor: c.primary }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: i === step ? c.primary : c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <T weight="bold" style={{ color: i === step ? '#fff' : c.text }}>{s.step}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T size="md" style={{ lineHeight: 24 }}>{s.instruction}</T>
              {s.durationMinutes ? <T size="sm" color="textSecondary">⏱ {s.durationMinutes} min</T> : null}
            </View>
          </Pressable>
        ))}

        <SectionHeader title="Good to know" />
        {recipe.tips.length ? recipe.tips.map((t, i) => <T key={i} style={{ marginBottom: 4 }}>💡 {t}</T>) : null}
        <T weight="semibold" style={{ marginTop: 8 }}>Allergens (estimated)</T>
        <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>
          {recipe.allergens.length ? recipe.allergens.map((a) => <Chip key={a} tone="warn" icon="warning" label={a} />) : <T color="textSecondary">None detected automatically.</T>}
        </Row>
        <Banner tone="warn" text={DISCLAIMERS.allergen} />
        <T weight="semibold">Nutrition</T>
        <T color="textSecondary" size="sm">No verified nutrition data for this recipe. {DISCLAIMERS.nutrition}</T>
        <T weight="semibold" style={{ marginTop: 8 }}>Storage</T>
        <T color="textSecondary" size="sm">Cool leftovers quickly and refrigerate within 2 hours. Eat within 3 days and reheat until steaming hot.</T>
        <Button variant="ghost" title="Add all ingredients to shopping list" icon="cart-outline" onPress={() => { addShopping(recipe.ingredients.map((m) => ({ name: m.name, quantity: scaleQuantity(m.quantity, recipe.servings, servings), unit: m.unit, recipeId: recipe.id }))); track('shopping_item_added'); toast('Added to shopping list'); }} />
      </View>
    </Screen>
  );
}
