import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useApp } from '../store/useApp';
import { ToastProvider } from '../components/common/toast';
import { useColors } from '../theme';
import { track } from '../services/analytics';
import { AdManager } from '../services/ads/AdManager';
import { syncCatalog } from '../services/recipes/mealdb';
import { useColorScheme } from 'react-native';
import { ensureSession } from '../services/api/auth';
import { CONFIG } from '../constants';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hydrated = useApp((s) => s.hydrated);
  const onboarded = useApp((s) => s.onboarded);
  const segments = useSegments();
  const router = useRouter();
  const c = useColors();
  const scheme = useColorScheme();

  useEffect(() => { track('app_open'); }, []);

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync().catch(() => {});
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !inOnboarding) router.replace('/onboarding');
    else if (onboarded && inOnboarding) router.replace('/');
  }, [hydrated, onboarded, segments, router]);

  useEffect(() => {
    if (!hydrated || !onboarded) return;
    if (CONFIG.AI_PROVIDER === 'remote') ensureSession();
    AdManager.init(); // consent flow + SDK init; no-ops without native module
    syncCatalog().catch(() => {}); // background: resumes where it stopped, fails silently offline
  }, [hydrated, onboarded]);

  if (!hydrated) return null;
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="cook/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
