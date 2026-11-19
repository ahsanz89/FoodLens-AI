import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Chip, T } from '../components/common/ui';
import { spacing, useColors } from '../theme';
import { useApp } from '../store/useApp';
import { track } from '../services/analytics';
import { DIET_OPTIONS, ALLERGY_OPTIONS } from '../constants';

const { width } = Dimensions.get('window');
const SLIDES = [
  { icon: 'camera' as const, title: "What's in Your Kitchen?", body: 'Take a picture of your ingredients and discover what you can cook.' },
  { icon: 'options' as const, title: 'Recipes That Match Your Taste', body: 'Find recipes based on your preferences, available ingredients, and cooking time.' },
  { icon: 'heart' as const, title: 'Build Your Personal Recipe Collection', body: 'Save your favorite meals and organize your cooking ideas.' },
];

export default function Onboarding() {
  const c = useColors();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const ref = useRef<FlatList>(null);
  const complete = useApp((s) => s.completeOnboarding);
  const prefs = useApp((s) => s.prefs);
  const setPrefs = useApp((s) => s.setPrefs);
  const last = page === SLIDES.length; // 4th page = get started

  const go = (n: number) => { ref.current?.scrollToIndex({ index: n, animated: true }); setPage(n); };
  const finish = (mode: 'guest' | 'account') => {
    complete(mode);
    track('onboarding_completed');
    track(mode === 'guest' ? 'guest_started' : 'account_created');
    router.replace('/');
  };
  const toggle = (key: 'diets' | 'allergies', v: string) =>
    setPrefs({ [key]: prefs[key].includes(v) ? prefs[key].filter((x) => x !== v) : [...prefs[key], v] });

  const data = [...SLIDES, { icon: 'restaurant' as const, title: 'Get Started', body: '' }];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        ref={ref} data={data} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled
        keyExtractor={(i) => i.title} onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index }) => (
          <View style={{ width, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.lg }}>
            <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={item.icon} size={72} color={c.primary} />
            </View>
            <T size="xl" weight="bold" accessibilityRole="header" style={{ textAlign: 'center' }}>{item.title}</T>
            {index < SLIDES.length ? (
              <T color="textSecondary" size="md" style={{ textAlign: 'center' }}>{item.body}</T>
            ) : (
              <View style={{ width: '100%', gap: spacing.sm }}>
                <T color="textSecondary" style={{ textAlign: 'center' }}>Optional: tell us how you eat so recipes fit you. You can change this any time.</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                  {DIET_OPTIONS.slice(0, 3).map((d) => <Chip key={d} label={d} selected={prefs.diets.includes(d)} onPress={() => toggle('diets', d)} />)}
                  {ALLERGY_OPTIONS.map((a) => <Chip key={a} label={`No ${a.toLowerCase()}`} selected={prefs.allergies.includes(a)} onPress={() => toggle('allergies', a)} />)}
                </View>
              </View>
            )}
          </View>
        )}
      />
      <View style={{ padding: spacing.xl, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {data.map((_, i) => <View key={i} style={{ width: i === page ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? c.primary : c.border }} />)}
        </View>
        {last ? (
          <>
            <Button title="Continue as Guest" onPress={() => finish('guest')} />
            <Button title="Sign in with Google" variant="secondary" icon="logo-google" onPress={() => finish('account')} />
            <Button title="Create Account" variant="ghost" onPress={() => finish('account')} />
            <T size="sm" color="textSecondary" style={{ textAlign: 'center' }}>Accounts sync once your backend is configured; guest data stays on this device.</T>
          </>
        ) : (
          <>
            <Button title="Next" onPress={() => go(page + 1)} />
            <Button title="Skip" variant="ghost" onPress={() => go(SLIDES.length)} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
