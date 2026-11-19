import React, { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, EmptyState, Field, IconButton, Row, Screen, T } from '../components/common/ui';
import { useApp } from '../store/useApp';
import { formatQuantity } from '../services/recipes/matching';
import { spacing, useColors } from '../theme';

export default function Shopping() {
  const c = useColors();
  const router = useRouter();
  const items = useApp((s) => s.shopping);
  const toggle = useApp((s) => s.toggleShopping);
  const remove = useApp((s) => s.removeShopping);
  const clear = useApp((s) => s.clearDoneShopping);
  const add = useApp((s) => s.addShopping);
  const addKitchen = useApp((s) => s.addKitchen);
  const [name, setName] = useState('');
  const done = items.filter((i) => i.done);
  return (
    <Screen footer={done.length ? <Row style={{ gap: spacing.sm }}>
      <Button style={{ flex: 1 }} title="Move bought to My Kitchen" icon="basket" onPress={() => { addKitchen(done.map((d) => ({ name: d.name, category: 'Other', quantity: d.quantity, unit: d.unit }))); clear(); }} />
      <Button variant="secondary" title="Clear" onPress={clear} /></Row> : undefined}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T size="xl" weight="bold" accessibilityRole="header">Shopping list</T>
        <Row>
          {items.length ? <IconButton icon="share-outline" label="Share list" onPress={() => Share.share({ message: items.filter((i) => !i.done).map((i) => `• ${formatQuantity(i.quantity, i.unit)} ${i.name}`.trim()).join('\n') })} /> : null}
          <IconButton icon="close" label="Close" onPress={() => router.back()} />
        </Row>
      </Row>
      <Row style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}><Field placeholder="Add item" value={name} onChangeText={setName} onSubmitEditing={() => { if (name.trim()) { add([{ name: name.trim(), quantity: null, unit: null }]); setName(''); } }} style={{ marginBottom: 0 }} /></View>
        <Button small title="Add" onPress={() => { if (name.trim()) { add([{ name: name.trim(), quantity: null, unit: null }]); setName(''); } }} />
      </Row>
      {items.length === 0 ? <EmptyState icon="cart-outline" title="Your list is empty" message="Missing ingredients you add from a recipe show up here." /> : null}
      <View style={{ marginTop: spacing.md }}>
        {items.map((i) => (
          <Row key={i.id} style={{ paddingVertical: 6, gap: 10 }}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: i.done }} accessibilityLabel={i.name} onPress={() => toggle(i.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
              <Ionicons name={i.done ? 'checkbox' : 'square-outline'} size={26} color={i.done ? c.primary : c.textSecondary} />
              <T style={{ textDecorationLine: i.done ? 'line-through' : 'none', opacity: i.done ? 0.5 : 1, flex: 1 }}>{i.name}</T>
              <T color="textSecondary" size="sm">{formatQuantity(i.quantity, i.unit)}</T>
            </Pressable>
            <IconButton icon="trash-outline" label={`Remove ${i.name}`} color={c.error} onPress={() => remove(i.id)} />
          </Row>
        ))}
      </View>
    </Screen>
  );
}
