import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Chip, EmptyState, Field, IconButton, Row, Screen, SearchField, T } from '../../components/common/ui';
import { AdBanner } from '../../components/ads/Ads';
import { useApp } from '../../store/useApp';
import { useFindRecipes } from '../../hooks/useFindRecipes';
import { INGREDIENT_CATEGORIES } from '../../constants';
import { spacing, useColors } from '../../theme';

export default function Kitchen() {
  const c = useColors();
  const router = useRouter();
  const kitchen = useApp((s) => s.kitchen);
  const update = useApp((s) => s.updateKitchen);
  const remove = useApp((s) => s.removeKitchen);
  const add = useApp((s) => s.addKitchen);
  const find = useFindRecipes();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [expiry, setExpiry] = useState('');
  const list = useMemo(() => kitchen.filter((k) => (cat === 'All' || k.category === cat) && k.name.toLowerCase().includes(q.toLowerCase())), [kitchen, q, cat]);
  const soon = (d?: string | null) => { if (!d) return false; const t = new Date(d).getTime(); return Number.isFinite(t) && t - Date.now() < 3 * 86_400_000; };

  return (
    <Screen footer={kitchen.length ? <Button title={`Generate recipes from my kitchen (${kitchen.length})`} icon="restaurant" onPress={() => find(kitchen.map((k) => k.name))} /> : undefined}>
      <T size="xl" weight="bold" accessibilityRole="header">My Kitchen</T>
      <T color="textSecondary">Keep a list of what you have. Updates when you cook or shop.</T>
      <Row style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}><Field placeholder="Add an ingredient" value={name} onChangeText={setName} onSubmitEditing={() => { if (name.trim()) { add([{ name: name.trim(), category: 'Other', quantity: null, unit: null }]); setName(''); } }} style={{ marginBottom: 0 }} /></View>
        <Button small title="Add" onPress={() => { if (name.trim()) { add([{ name: name.trim(), category: 'Other', quantity: null, unit: null }]); setName(''); } }} />
      </Row>
      {kitchen.length === 0 ? (
        <EmptyState icon="basket-outline" title="Your kitchen is empty" message="Add what you have at home and we'll suggest what to cook." actionLabel="Add Ingredients" onAction={() => router.push('/manual?mode=kitchen')} />
      ) : (
        <>
          <View style={{ marginVertical: spacing.md }}><SearchField value={q} onChangeText={setQ} placeholder="Search my kitchen" /></View>
          <Row style={{ flexWrap: 'wrap' }}>{['All', ...INGREDIENT_CATEGORIES].map((x) => <Chip key={x} label={x} selected={cat === x} onPress={() => setCat(x)} />)}</Row>
          <View style={{ gap: spacing.sm }}>
            {list.map((k) => (
              <Card key={k.id} style={{ padding: spacing.md }}>
                <Row style={{ gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <T weight="bold" size="md">{k.name}</T>
                    <T size="sm" color="textSecondary">{k.category}{k.quantity != null ? ` · ${k.quantity}${k.unit ? ' ' + k.unit : ''}` : ''}{k.expiry ? ` · use by ${k.expiry}` : ''}</T>
                    {soon(k.expiry) ? <T size="sm" style={{ color: '#B26B00' }}>⚠ Check this soon. Judge freshness by look and smell, not just dates.</T> : null}
                  </View>
                  <IconButton icon="create-outline" label={`Edit ${k.name}`} onPress={() => { setEditing(editing === k.id ? null : k.id); setExpiry(k.expiry ?? ''); }} />
                  <IconButton icon="trash-outline" label={`Remove ${k.name}`} color={c.error} onPress={() => remove(k.id)} />
                </Row>
                {editing === k.id ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <Row style={{ gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><Field label="Quantity" keyboardType="decimal-pad" defaultValue={k.quantity != null ? String(k.quantity) : ''} onChangeText={(v) => update(k.id, { quantity: v.trim() && Number.isFinite(Number(v)) ? Number(v) : null })} /></View>
                      <View style={{ flex: 1 }}><Field label="Unit" defaultValue={k.unit ?? ''} onChangeText={(v) => update(k.id, { unit: v.trim() || null })} placeholder="g, pcs…" /></View>
                    </Row>
                    <Field label="Use by (optional, YYYY-MM-DD)" value={expiry} onChangeText={(v) => { setExpiry(v); if (/^\d{4}-\d{2}-\d{2}$/.test(v)) update(k.id, { expiry: v }); else if (!v) update(k.id, { expiry: null }); }} placeholder="2026-12-31" />
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
          <Button variant="secondary" icon="add" title="Add more from catalogue" style={{ marginTop: spacing.lg }} onPress={() => router.push('/manual?mode=kitchen')} />
          <AdBanner placement="kitchen_banner" />
        </>
      )}
      <View style={{ height: 80 }} />
    </Screen>
  );
}
