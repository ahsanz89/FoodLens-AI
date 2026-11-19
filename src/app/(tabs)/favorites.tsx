import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Chip, EmptyState, Field, Row, Screen, SearchField, T } from '../../components/common/ui';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { useApp } from '../../store/useApp';
import { spacing } from '../../theme';

export default function Favorites() {
  const router = useRouter();
  const favs = useApp((s) => s.favorites);
  const saved = useApp((s) => s.savedRecipes);
  const collections = useApp((s) => s.collections);
  const addCollection = useApp((s) => s.addCollection);
  const toggleIn = useApp((s) => s.toggleInCollection);
  const [q, setQ] = useState('');
  const [col, setCol] = useState<string>('all');
  const [sortOld, setSortOld] = useState(false);
  const [newName, setNewName] = useState('');
  const [manage, setManage] = useState<string | null>(null);

  const list = useMemo(() => {
    let ids = col === 'all' ? favs : collections.find((c) => c.id === col)?.recipeIds ?? [];
    let l = ids.map((i) => saved[i]).filter(Boolean).filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
    if (sortOld) l = [...l].reverse();
    return l;
  }, [favs, saved, col, q, sortOld, collections]);

  return (
    <Screen>
      <T size="xl" weight="bold" accessibilityRole="header">Favorites</T>
      {favs.length === 0 ? (
        <EmptyState icon="heart-outline" title="No saved recipes yet" message="Tap the heart on any recipe to keep it here." actionLabel="Discover recipes" onAction={() => router.push('/(tabs)/discover')} />
      ) : (
        <>
          <View style={{ marginVertical: spacing.md }}><SearchField value={q} onChangeText={setQ} placeholder="Search favorites" /></View>
          <Row style={{ flexWrap: 'wrap' }}>
            <Chip label="All" selected={col === 'all'} onPress={() => setCol('all')} />
            {collections.map((c) => <Chip key={c.id} label={`${c.name} (${c.recipeIds.length})`} selected={col === c.id} onPress={() => setCol(c.id)} />)}
            <Chip icon="swap-vertical" label={sortOld ? 'Oldest first' : 'Recently saved'} onPress={() => setSortOld(!sortOld)} />
          </Row>
          <Row style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ flex: 1 }}><Field placeholder="New collection (e.g. Weekend Meals)" value={newName} onChangeText={setNewName} style={{ marginBottom: 0 }} /></View>
            <Button small title="Create" onPress={() => { if (newName.trim()) { addCollection(newName); setNewName(''); } }} />
          </Row>
          {list.length === 0 ? <EmptyState icon="folder-open-outline" title="Nothing here" message="No recipes match this view." /> : null}
          <View style={{ gap: spacing.lg }}>
            {list.map((r) => (
              <View key={r.id} style={{ gap: 6 }}>
                <RecipeCard recipe={r} onPress={() => router.push(`/recipe/${r.id}`)} />
                {collections.length ? (
                  <>
                    <Chip icon="folder" label={manage === r.id ? 'Done' : 'Add to collection'} onPress={() => setManage(manage === r.id ? null : r.id)} />
                    {manage === r.id ? <Row style={{ flexWrap: 'wrap' }}>{collections.map((c) => <Chip key={c.id} label={c.name} selected={c.recipeIds.includes(r.id)} onPress={() => toggleIn(c.id, r.id)} />)}</Row> : null}
                  </>
                ) : null}
              </View>
            ))}
          </View>
        </>
      )}
      <View style={{ height: 90 }} />
    </Screen>
  );
}
