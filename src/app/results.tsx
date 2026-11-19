import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Chip, EmptyState, ErrorState, IconButton, Row, Screen, Skeleton, T } from '../components/common/ui';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { NativeAdCard } from '../components/ads/Ads';
import { FILTERS } from '../constants';
import { useSession } from '../store/useSession';
import { useApp } from '../store/useApp';
import { applyFilter, sortMatches, type SortKey } from '../services/recipes/matching';
import { findRecipes } from '../services/recipes/repository';
import { AdManager } from '../services/ads/AdManager';
import { spacing } from '../theme';

const SORTS: SortKey[] = ['Best Match', 'Quickest', 'Easiest', 'Most Popular'];
const TIMES = [{ l: 'Any time', v: 0 }, { l: '≤ 15 min', v: 15 }, { l: '≤ 30 min', v: 30 }, { l: '≤ 60 min', v: 60 }];
const MISSING = [{ l: 'Any missing', v: -1 }, { l: 'Nothing missing', v: 0 }, { l: '≤ 1 missing', v: 1 }, { l: '≤ 2 missing', v: 2 }];

export default function Results() {
  const router = useRouter();
  const { matches, status, error, ingredients, setResults, setStatus, bumpDiscovery } = useSession();
  const prefs = useApp((s) => s.prefs);
  const [filter, setFilter] = useState<string>('All Recipes');
  const [sort, setSort] = useState<SortKey>('Best Match');
  const [maxTime, setMaxTime] = useState(prefs.maxTime || 0);
  const [maxMissing, setMaxMissing] = useState(-1);
  const [diff, setDiff] = useState<string>('Any');
  const [cuisine, setCuisine] = useState<string>('Any');
  const [hideBlocked, setHideBlocked] = useState(true);
  const [more, setMore] = useState(false);

  const cuisines = useMemo(() => ['Any', ...new Set(matches.map((m) => m.recipe.cuisine))].slice(0, 12), [matches]);
  const shown = useMemo(() => {
    let l = applyFilter(matches, filter);
    if (maxTime) l = l.filter((m) => m.recipe.prepMinutes + m.recipe.cookMinutes <= maxTime);
    if (maxMissing >= 0) l = l.filter((m) => m.missing.length <= maxMissing);
    if (diff !== 'Any') l = l.filter((m) => m.recipe.difficulty === diff);
    if (cuisine !== 'Any') l = l.filter((m) => m.recipe.cuisine === cuisine);
    if (hideBlocked) l = l.filter((m) => m.blockedBy.length === 0);
    return sortMatches(l, sort);
  }, [matches, filter, sort, maxTime, maxMissing, diff, cuisine, hideBlocked]);
  const hiddenForAllergy = matches.filter((m) => m.blockedBy.length > 0).length;

  useEffect(() => { bumpDiscovery(); }, []);
  const leave = async () => { router.back(); if (useSession.getState().discoveryCount >= 2) setTimeout(() => AdManager.maybeShowInterstitial(), 400); };
  const retry = async () => {
    setStatus('loading');
    try { setResults(await findRecipes({ ingredients, prefs })); } catch { setStatus('error', 'Still could not load recipes. Check your connection.'); }
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="arrow-back" label="Back" onPress={leave} />
        <T size="sm" color="textSecondary" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>{ingredients.slice(0, 4).join(', ')}{ingredients.length > 4 ? ` +${ingredients.length - 4}` : ''}</T>
      </Row>
      <T size="xl" weight="bold" accessibilityRole="header" style={{ marginTop: spacing.sm }}>Delicious ideas for you</T>
      {status === 'done' ? <T color="textSecondary">{shown.length} recipe{shown.length === 1 ? '' : 's'} found</T> : null}

      {status === 'loading' ? (
        <View style={{ gap: spacing.lg, marginTop: spacing.lg }} accessibilityLabel="Loading recipes">
          {[0, 1, 2].map((i) => <View key={i} style={{ gap: 8 }}><Skeleton height={140} /><Skeleton width="70%" /><Skeleton width="50%" /></View>)}
        </View>
      ) : null}

      {status === 'error' ? <ErrorState message={error ?? 'Something went wrong.'} onRetry={retry} secondary={{ label: 'Edit ingredients', onPress: () => router.back() }} /> : null}

      {status === 'done' ? (
        <>
          <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }}>{FILTERS.map((f) => <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />)}</Row>
          <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Row style={{ flexWrap: 'wrap', flex: 1 }}>{SORTS.map((s) => <Chip key={s} label={s} icon={sort === s ? 'swap-vertical' : undefined} selected={sort === s} onPress={() => setSort(s)} />)}</Row>
          </Row>
          <Button small variant="ghost" title={more ? 'Hide filters' : 'More filters'} icon="options" onPress={() => setMore(!more)} style={{ alignSelf: 'flex-start' }} />
          {more ? (
            <View style={{ marginBottom: spacing.md }}>
              <T size="sm" color="textSecondary" weight="semibold">Cooking time</T>
              <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>{TIMES.map((t) => <Chip key={t.l} label={t.l} selected={maxTime === t.v} onPress={() => setMaxTime(t.v)} />)}</Row>
              <T size="sm" color="textSecondary" weight="semibold">Difficulty</T>
              <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>{['Any', 'Easy', 'Medium', 'Hard'].map((d) => <Chip key={d} label={d} selected={diff === d} onPress={() => setDiff(d)} />)}</Row>
              <T size="sm" color="textSecondary" weight="semibold">Missing ingredients</T>
              <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>{MISSING.map((t) => <Chip key={t.l} label={t.l} selected={maxMissing === t.v} onPress={() => setMaxMissing(t.v)} />)}</Row>
              <T size="sm" color="textSecondary" weight="semibold">Cuisine</T>
              <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>{cuisines.map((d) => <Chip key={d} label={d} selected={cuisine === d} onPress={() => setCuisine(d)} />)}</Row>
            </View>
          ) : null}
          {hiddenForAllergy > 0 ? (
            <Chip label={hideBlocked ? `${hiddenForAllergy} hidden for your allergies — show` : 'Hide recipes with your allergens'} icon="shield-checkmark" tone="warn" onPress={() => setHideBlocked(!hideBlocked)} />
          ) : null}

          {shown.length === 0 ? (
            <EmptyState icon="search-outline" title="No recipes found" message="Try removing a filter, or add a few more ingredients." actionLabel="Add ingredients" onAction={() => router.push('/manual?mode=append')} />
          ) : (
            <View style={{ gap: spacing.lg, marginTop: spacing.sm }}>
              {shown.map((m, i) => (
                <React.Fragment key={m.recipe.id}>
                  <RecipeCard recipe={m.recipe} match={m} onPress={() => router.push(`/recipe/${m.recipe.id}`)} />
                  {i === 3 ? <NativeAdCard placement="results_native" /> : null}
                </React.Fragment>
              ))}
            </View>
          )}
        </>
      ) : null}
    </Screen>
  );
}
