import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, ErrorState, IconButton, Row, T } from '../../components/common/ui';
import { useApp } from '../../store/useApp';
import { getRecipe } from '../../services/recipes/repository';
import { formatQuantity } from '../../services/recipes/matching';
import { stepMinutes } from '../../services/recipes/steps';
import { AdManager } from '../../services/ads/AdManager';
import { track } from '../../services/analytics';
import { radius, spacing, useColors } from '../../theme';
import type { Recipe } from '../../types';

export default function Cook() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const router = useRouter();
  const saved = useApp((s) => s.savedRecipes);
  const keepAwake = useApp((s) => s.keepAwake);
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [i, setI] = useState(0);
  const [showIng, setShowIng] = useState(false);
  const [left, setLeft] = useState<number | null>(null); // seconds
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { AdManager.setCooking(true); return () => AdManager.setCooking(false); }, []); // never show ads while cooking
  useEffect(() => { getRecipe(id).then((r) => setRecipe(r ?? saved[id] ?? null)); }, [id]);
  useEffect(() => {
    if (keepAwake) activateKeepAwakeAsync('cooking').catch(() => {});
    return () => { deactivateKeepAwake('cooking').catch(() => {}); };
  }, [keepAwake]);
  useEffect(() => { setRunning(false); setLeft(null); }, [i]);
  useEffect(() => {
    if (!running) { if (tick.current) clearInterval(tick.current); return; }
    tick.current = setInterval(() => setLeft((s) => (s == null ? s : s - 1)), 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running]);
  useEffect(() => { if (left != null && left <= 0) setRunning(false); }, [left]);

  const step = recipe?.instructions[i];
  const mins = useMemo(() => (step ? stepMinutes(step.instruction, step.durationMinutes) : null), [step]);

  if (recipe === undefined) return <View style={{ flex: 1, backgroundColor: c.background }} />;
  if (!recipe || !step) return <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}><ErrorState message="This recipe can't be opened right now." onRetry={() => router.back()} retryLabel="Close" /></SafeAreaView>;

  const last = i === recipe.instructions.length - 1;
  const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg }}>
        <T style={{ fontSize: 72, textAlign: 'center' }}>🎉</T>
        <T size="xl" weight="bold" style={{ textAlign: 'center' }}>Enjoy your {recipe.title}!</T>
        <T color="textSecondary" style={{ textAlign: 'center' }}>Make sure everything is cooked through and piping hot before serving.</T>
        <Button title="Done" onPress={() => router.dismissAll?.() ?? router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: spacing.sm }}>
        <IconButton icon="close" label="Exit cooking mode" onPress={() => router.back()} />
        <T weight="semibold" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>{recipe.title}</T>
        <IconButton icon={showIng ? 'list' : 'list-outline'} label="Show ingredients" onPress={() => setShowIng(!showIng)} />
      </Row>
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: spacing.lg }} accessibilityLabel={`Step ${i + 1} of ${recipe.instructions.length}`}>
        {recipe.instructions.map((_, n) => <View key={n} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: n <= i ? c.primary : c.border }} />)}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, flexGrow: 1, justifyContent: showIng ? 'flex-start' : 'center' }}>
        {showIng ? (
          <View>
            <T size="lg" weight="bold" style={{ marginBottom: 8 }}>Ingredients</T>
            {recipe.ingredients.map((ing, n) => <T key={n} size="md" style={{ paddingVertical: 4 }}>{formatQuantity(ing.quantity, ing.unit)} {ing.name}</T>)}
          </View>
        ) : (
          <>
            <T color="primary" weight="bold" size="md">Step {i + 1} of {recipe.instructions.length}</T>
            <T weight="semibold" style={{ fontSize: 26, lineHeight: 36 }}>{step.instruction}</T>
            {step.temperature ? <Chip icon="thermometer" label={step.temperature} /> : null}
            {mins ? (
              <View style={{ backgroundColor: c.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
                <T size="xxl" weight="bold" accessibilityLiveRegion={left === 0 ? 'assertive' : 'none'}>{fmt(left ?? mins * 60)}</T>
                {left === 0 ? <T color="error" weight="bold">Time's up!</T> : null}
                <Row style={{ gap: spacing.sm }}>
                  <Button small title={running ? 'Pause' : left == null ? `Start ${mins} min timer` : 'Resume'} icon={running ? 'pause' : 'timer'} onPress={() => { if (left == null) setLeft(mins * 60); setRunning(!running); }} />
                  {left != null ? <Button small variant="secondary" title="Reset" onPress={() => { setRunning(false); setLeft(null); }} /> : null}
                </Row>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <Row style={{ padding: spacing.lg, gap: spacing.md }}>
        <Button style={{ flex: 1 }} variant="secondary" title="Previous" icon="chevron-back" disabled={i === 0} onPress={() => setI(i - 1)} />
        <Button style={{ flex: 1 }} title={last ? 'Finish' : 'Next'} icon={last ? 'checkmark' : 'chevron-forward'} onPress={() => { if (last) { track('cooking_mode_completed'); setDone(true); } else setI(i + 1); }} />
      </Row>
    </SafeAreaView>
  );
}
