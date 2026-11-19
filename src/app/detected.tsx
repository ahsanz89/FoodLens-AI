import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner, Button, Card, Chip, EmptyState, Field, IconButton, Row, Screen, T } from '../components/common/ui';
import { useApp, newId } from '../store/useApp';
import { useFindRecipes } from '../hooks/useFindRecipes';
import { radius, spacing, useColors } from '../theme';
import { track } from '../services/analytics';
import { DISCLAIMERS } from '../constants';
import type { DetectedIngredient } from '../types';

export default function Detected() {
  const c = useColors();
  const router = useRouter();
  const { warnings } = useLocalSearchParams<{ warnings?: string }>();
  const draft = useApp((s) => s.draft);
  const setDraft = useApp((s) => s.setDraft);
  const find = useFindRecipes();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const warn: string[] = (() => { try { return JSON.parse(warnings ?? '[]'); } catch { return []; } })();

  const patch = (id: string, p: Partial<DetectedIngredient>) => setDraft(draft.map((d) => (d.id === id ? { ...d, ...p } : d)));
  const remove = (id: string) => setDraft(draft.filter((d) => d.id !== id));
  const startEdit = (d: DetectedIngredient) => { setEditing(d.id); setName(d.name); setQty(d.quantity != null ? String(d.quantity) : ''); };
  const saveEdit = (id: string) => {
    const n = name.trim();
    if (!n) return;
    const q = qty.trim() === '' ? null : Number(qty);
    patch(id, { name: n, quantity: Number.isFinite(q as number) ? q : null, needsConfirmation: false, confidence: 1 });
    track('ingredient_edited');
    setEditing(null);
  };
  const uncertain = draft.filter((d) => d.needsConfirmation);
  const canFind = draft.length > 0 && uncertain.length === 0;

  return (
    <Screen
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button title={canFind ? `Find Recipes (${draft.length})` : uncertain.length ? `Confirm ${uncertain.length} uncertain item${uncertain.length > 1 ? 's' : ''} first` : 'Add ingredients to continue'} icon="restaurant" disabled={!canFind} onPress={() => find(draft.map((d) => d.name))} />
          <Button variant="secondary" title="Add More Ingredients" icon="add" onPress={() => router.push('/manual?mode=append')} />
        </View>
      }
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <T size="xl" weight="bold" accessibilityRole="header">Here's what we found!</T>
        <IconButton icon="close" label="Discard and go home" onPress={() => { setDraft([]); router.replace('/'); }} />
      </Row>
      <T color="textSecondary" style={{ marginTop: 4 }}>AI can make mistakes. Check the list, fix anything wrong, and confirm items marked “Not sure”.</T>
      {warn.map((w) => <Banner key={w} tone="warn" text={w} />)}
      <Banner tone="info" text={DISCLAIMERS.food} />

      {draft.length === 0 ? (
        <EmptyState icon="basket-outline" title="No ingredients yet" message="Add what you have and we’ll find recipes." actionLabel="Add ingredients" onAction={() => router.push('/manual?mode=append')} />
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {draft.map((d) => (
          <Card key={d.id} style={d.needsConfirmation ? { borderColor: c.warning, borderWidth: 2 } : undefined}>
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              {editing === d.id ? (
                <View>
                  <Field label="Ingredient name" value={name} onChangeText={setName} autoFocus />
                  <Field label="Quantity (optional)" value={qty} onChangeText={setQty} keyboardType="decimal-pad" placeholder="e.g. 2" />
                  <Row style={{ gap: spacing.sm }}>
                    <Button small title="Save" onPress={() => saveEdit(d.id)} style={{ flex: 1 }} />
                    <Button small variant="secondary" title="Cancel" onPress={() => setEditing(null)} style={{ flex: 1 }} />
                  </Row>
                </View>
              ) : (
                <>
                  <Row style={{ gap: spacing.md }}>
                    <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="nutrition" size={22} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T weight="bold" size="md">{d.name}{d.quantity != null ? `  ×${d.quantity}${d.unit ? ' ' + d.unit : ''}` : ''}</T>
                      <T size="sm" color="textSecondary">{d.category} · {d.needsConfirmation ? 'Not sure' : d.confidence >= 0.85 ? 'Looks right' : 'Probably'} ({Math.round(d.confidence * 100)}%)</T>
                    </View>
                    <IconButton icon="pencil" label={`Edit ${d.name}`} onPress={() => startEdit(d)} />
                    <IconButton icon="trash-outline" label={`Remove ${d.name}`} color={c.error} onPress={() => remove(d.id)} />
                  </Row>
                  {d.needsConfirmation ? (
                    <View style={{ gap: spacing.sm }}>
                      <T weight="semibold">Is this {d.name.toLowerCase()}?</T>
                      <Row style={{ gap: spacing.sm }}>
                        <Button small title="Yes" onPress={() => patch(d.id, { needsConfirmation: false, confidence: 1 })} style={{ flex: 1 }} />
                        <Button small variant="secondary" title="No, remove" onPress={() => remove(d.id)} style={{ flex: 1 }} />
                      </Row>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
