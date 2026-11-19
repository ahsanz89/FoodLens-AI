import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Chip, Field, IconButton, Row, Screen, SearchField, SectionHeader, T } from '../components/common/ui';
import { ALL_INGREDIENTS, CATALOG, categoryOf } from '../data/ingredientCatalog';
import { useApp, newId } from '../store/useApp';
import { useFindRecipes } from '../hooks/useFindRecipes';
import { spacing } from '../theme';
import type { IngredientCategory } from '../types';
import { INGREDIENT_CATEGORIES } from '../constants';

export default function Manual() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const append = mode === 'append';
  const toKitchen = mode === 'kitchen';
  const addKitchen = useApp((s) => s.addKitchen);
  const draft = useApp((s) => s.draft);
  const setDraft = useApp((s) => s.setDraft);
  const recent = useApp((s) => s.recentIngredients);
  const kitchen = useApp((s) => s.kitchen);
  const find = useFindRecipes();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<IngredientCategory | 'All'>('All');
  const [sel, setSel] = useState<Record<string, string>>({}); // name -> qty text

  const toggle = (n: string) => setSel((s) => { const x = { ...s }; if (n in x) delete x[n]; else x[n] = ''; return x; });
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ALL_INGREDIENTS.filter((i) => (cat === 'All' || i.category === cat) && (!t || i.name.toLowerCase().includes(t)));
  }, [q, cat]);
  const custom = q.trim() && !ALL_INGREDIENTS.some((i) => i.name.toLowerCase() === q.trim().toLowerCase()) ? q.trim() : null;
  const names = Object.keys(sel);

  const submit = () => {
    const items = names.map((name) => {
      const n = Number(sel[name]);
      return { id: newId(), name, category: categoryOf(name), quantity: sel[name] && Number.isFinite(n) ? n : null, unit: null, confidence: 1, needsConfirmation: false };
    });
    if (toKitchen) {
      addKitchen(items.map((i) => ({ name: i.name, category: i.category, quantity: i.quantity, unit: null })));
      router.back();
    } else if (append) {
      const merged = [...draft];
      for (const i of items) if (!merged.some((m) => m.name.toLowerCase() === i.name.toLowerCase())) merged.push(i);
      setDraft(merged);
      router.back();
    } else {
      setDraft(items);
      find(names);
    }
  };

  return (
    <Screen footer={
      <Button title={names.length ? (toKitchen ? `Save ${names.length} to My Kitchen` : append ? `Add ${names.length} to list` : `Find Recipes (${names.length})`) : 'Select ingredients'} disabled={!names.length} onPress={submit} icon={append ? 'add' : 'restaurant'} />
    }>
      <Row style={{ justifyContent: 'space-between', marginBottom: spacing.md }}>
        <T size="xl" weight="bold" accessibilityRole="header">Add ingredients</T>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
      </Row>
      <SearchField value={q} onChangeText={setQ} placeholder="Search ingredients" />
      {custom ? <View style={{ marginTop: spacing.sm }}><Chip icon="add" label={`Add “${custom}”`} onPress={() => { toggle(custom); setQ(''); }} /></View> : null}

      {names.length ? (
        <>
          <SectionHeader title={`Selected (${names.length})`} />
          {names.map((n) => (
            <Row key={n} style={{ gap: spacing.sm, marginBottom: 4 }}>
              <T style={{ flex: 1 }} weight="semibold">{n}</T>
              <View style={{ width: 90 }}><Field value={sel[n]} onChangeText={(v) => setSel((s) => ({ ...s, [n]: v }))} placeholder="Qty" keyboardType="decimal-pad" style={{ minHeight: 40 }} /></View>
              <IconButton icon="close-circle" label={`Remove ${n}`} onPress={() => toggle(n)} />
            </Row>
          ))}
        </>
      ) : null}

      {!q && recent.length ? (
        <>
          <SectionHeader title="Recently used" />
          <Row style={{ flexWrap: 'wrap' }}>{recent.slice(0, 10).map((n) => <Chip key={n} label={n} selected={n in sel} onPress={() => toggle(n)} />)}</Row>
        </>
      ) : null}
      {!q && kitchen.length ? (
        <>
          <SectionHeader title="From My Kitchen" action="Select all" onAction={() => setSel((s) => ({ ...s, ...Object.fromEntries(kitchen.map((k) => [k.name, s[k.name] ?? ''])) }))} />
          <Row style={{ flexWrap: 'wrap' }}>{kitchen.slice(0, 20).map((k) => <Chip key={k.id} label={k.name} selected={k.name in sel} onPress={() => toggle(k.name)} />)}</Row>
        </>
      ) : null}

      <SectionHeader title="Categories" />
      <Row style={{ flexWrap: 'wrap' }}>
        {(['All', ...INGREDIENT_CATEGORIES] as const).map((c) => <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c as any)} />)}
      </Row>
      <SectionHeader title={q ? 'Results' : 'Suggested'} />
      {list.length === 0 && !custom ? <T color="textSecondary">No matches. Type the name and add it as a custom ingredient.</T> : null}
      <Row style={{ flexWrap: 'wrap' }}>{list.map((i) => <Chip key={i.name} label={i.name} selected={i.name in sel} onPress={() => toggle(i.name)} />)}</Row>
    </Screen>
  );
}
