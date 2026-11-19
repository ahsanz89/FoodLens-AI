import React, { useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Banner, Button, Card, Chip, Divider, Field, Row, Screen, SectionHeader, T } from '../../components/common/ui';
import { useApp } from '../../store/useApp';
import { ALLERGY_OPTIONS, CUISINE_OPTIONS, DIET_OPTIONS, DISCLAIMERS } from '../../constants';
import { setDailyInspiration, setKitchenReminder, cancelAll } from '../../services/notifications';
import { clearSession, deleteRemoteAccount } from '../../services/api/auth';
import { AdManager } from '../../services/ads/AdManager';
import { useToast } from '../../components/common/toast';
import { spacing, useColors } from '../../theme';

export default function Profile() {
  const c = useColors();
  const router = useRouter();
  const toast = useToast();
  const s = useApp();
  const [name, setName] = useState(s.displayName);
  const [custom, setCustom] = useState('');
  const tog = (key: 'diets' | 'allergies' | 'cuisines', v: string) => s.setPrefs({ [key]: s.prefs[key].includes(v) ? s.prefs[key].filter((x) => x !== v) : [...s.prefs[key], v] });

  const Link = ({ icon, label, to }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; to: string }) => (
    <Pressable accessibilityRole="button" onPress={() => router.push(to as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
      <Ionicons name={icon} size={22} color={c.primary} /><T style={{ flex: 1 }}>{label}</T><Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
    </Pressable>
  );
  const SwitchRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <Row style={{ minHeight: 52, justifyContent: 'space-between' }}><T style={{ flex: 1 }}>{label}</T><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: c.primary, false: c.border }} /></Row>
  );

  return (
    <Screen>
      <T size="xl" weight="bold" accessibilityRole="header">Profile</T>
      <Card style={{ padding: spacing.lg, marginTop: spacing.md }}>
        <Row style={{ gap: spacing.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}><T size="lg" weight="bold" color="primaryOn">{s.displayName.slice(0, 1).toUpperCase()}</T></View>
          <View style={{ flex: 1 }}><T weight="bold" size="md">{s.displayName}</T><T color="textSecondary" size="sm">{s.mode === 'guest' ? 'Guest · data stays on this device' : s.email ?? 'Account'}</T></View>
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <Field label="Display name" value={name} onChangeText={setName} onEndEditing={() => name.trim() && s.setProfile(name.trim(), s.email)} />
        </View>
      </Card>

      <SectionHeader title="Allergies & restrictions" />
      <Banner tone="warn" text="We hide or flag recipes that appear to contain these. " />
      <Row style={{ flexWrap: 'wrap' }}>{ALLERGY_OPTIONS.map((a) => <Chip key={a} label={a} selected={s.prefs.allergies.includes(a)} onPress={() => tog('allergies', a)} />)}</Row>
      <Row style={{ gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field placeholder="Other (e.g. sesame, mustard)" value={custom} onChangeText={setCustom} style={{ marginBottom: 0 }} /></View>
        <Button small title="Add" onPress={() => { const v = custom.trim(); if (v && !s.prefs.customAllergies.includes(v)) s.setPrefs({ customAllergies: [...s.prefs.customAllergies, v] }); setCustom(''); }} />
      </Row>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.sm }}>{s.prefs.customAllergies.map((a) => <Chip key={a} icon="close" selected label={a} onPress={() => s.setPrefs({ customAllergies: s.prefs.customAllergies.filter((x) => x !== a) })} />)}</Row>
      <T size="sm" color="textSecondary">{DISCLAIMERS.allergen}</T>

      <SectionHeader title="Dietary preferences" />
      <Row style={{ flexWrap: 'wrap' }}>{DIET_OPTIONS.map((d) => <Chip key={d} label={d} selected={s.prefs.diets.includes(d)} onPress={() => tog('diets', d)} />)}<Chip label="No preference" selected={s.prefs.diets.length === 0} onPress={() => s.setPrefs({ diets: [] })} /></Row>

      <SectionHeader title="Cooking" />
      <T size="sm" color="textSecondary" weight="semibold">Skill level</T>
      <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>{(['Beginner', 'Intermediate', 'Advanced'] as const).map((k) => <Chip key={k} label={k} selected={s.prefs.skill === k} onPress={() => s.setPrefs({ skill: k })} />)}</Row>
      <T size="sm" color="textSecondary" weight="semibold">Time available</T>
      <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>{([[15, 'Under 15 min'], [30, '15–30 min'], [60, '30–60 min'], [0, 'Flexible']] as const).map(([v, l]) => <Chip key={l} label={l} selected={s.prefs.maxTime === v} onPress={() => s.setPrefs({ maxTime: v })} />)}</Row>
      <T size="sm" color="textSecondary" weight="semibold">Favorite cuisines</T>
      <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>{CUISINE_OPTIONS.map((x) => <Chip key={x} label={x} selected={s.prefs.cuisines.includes(x)} onPress={() => tog('cuisines', x)} />)}</Row>
      <SwitchRow label="Keep screen awake while cooking" value={s.keepAwake} onChange={s.setKeepAwake} />

      <SectionHeader title="Notifications" />
      <SwitchRow label="Daily recipe idea" value={s.notifications.daily} onChange={async (v) => { const ok = await setDailyInspiration(v); if (ok) s.setNotifications({ daily: v }); else toast('Notifications are blocked. Enable them in system settings.'); }} />
      <SwitchRow label="Weekly kitchen reminder" value={s.notifications.reminders} onChange={async (v) => { const ok = await setKitchenReminder(v); if (ok) s.setNotifications({ reminders: v }); else toast('Notifications are blocked. Enable them in system settings.'); }} />

      <SectionHeader title="Language" />
      <Chip label="English" selected /><T size="sm" color="textSecondary">More languages are planned.</T>

      <SectionHeader title="More" />
      <Card style={{ paddingHorizontal: spacing.lg }}>
        <Link icon="cart" label="Shopping list" to="/shopping" />
        <Divider />
        <Link icon="help-circle" label="Help and support" to="/legal?doc=help" />
        <Divider />
        <Link icon="information-circle" label="About" to="/legal?doc=about" />
        <Divider />
        <Link icon="shield-checkmark" label="Privacy policy" to="/legal?doc=privacy" />
        <Divider />
        <Link icon="document-text" label="Terms and conditions" to="/legal?doc=terms" />
      </Card>

      <SectionHeader title="Privacy" />
      <Card style={{ paddingHorizontal: spacing.lg }}>
        <Pressable accessibilityRole="button" onPress={() => AdManager.showPrivacyOptions()} style={{ minHeight: 52, justifyContent: 'center' }}><T>Ad privacy choices</T></Pressable>
      </Card>
      <Button variant="danger" icon="trash" title="Delete all my data" style={{ marginTop: spacing.lg }} onPress={() =>
        Alert.alert('Delete all data?', 'This permanently removes your preferences, favorites, kitchen, shopping list and history from this device. This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => { const ok = await deleteRemoteAccount(); if (!ok) { toast('Could not reach the server to delete your account. Check your connection and try again.'); return; } await cancelAll(); await clearSession(); s.deleteAllData(); router.replace('/onboarding'); } },
        ])} />
      <T size="sm" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.md }}>FoodLens AI v1.0.0</T>
      <View style={{ height: 90 }} />
    </Screen>
  );
}
