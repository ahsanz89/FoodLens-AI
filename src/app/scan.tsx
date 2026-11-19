import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Banner, Button, ErrorState, IconButton, T } from '../components/common/ui';
import { useToast } from '../components/common/toast';
import { spacing, useColors } from '../theme';
import { DISCLAIMERS, CONFIG } from '../constants';
import { useApp } from '../store/useApp';
import { track } from '../services/analytics';
import { AdManager } from '../services/ads/AdManager';
import { AIError, getRecognitionService } from '../services/ai';
import { prepareImage } from '../services/ai/imagePrep';
import { ensureSession } from '../services/api/auth';
import { reportRewardedBonus } from '../services/ai/remoteProvider';

type Phase = 'camera' | 'review' | 'processing' | 'error' | 'limit';
const STAGES = ['Uploading image', 'Analyzing ingredients', 'Identifying ingredients', 'Preparing your kitchen list'];

export default function Scan() {
  const c = useColors();
  const router = useRouter();
  const toast = useToast();
  const cam = useRef<CameraView>(null);
  const [perm, requestPerm] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('camera');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [uri, setUri] = useState<string | null>(null);
  const [err, setErr] = useState<{ title: string; message: string; retry: boolean } | null>(null);
  const [stage, setStage] = useState(0);
  const [adBusy, setAdBusy] = useState(false);
  const [cameraBroken, setCameraBroken] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const scansLeft = useApp((s) => s.scansLeft());
  const consumeScan = useApp((s) => s.consumeScan);
  const grantBonus = useApp((s) => s.grantBonusScan);
  const setDraft = useApp((s) => s.setDraft);
  const addScan = useApp((s) => s.addScan);

  useEffect(() => { AdManager.setScanning(true); return () => { AdManager.setScanning(false); abort.current?.abort(); }; }, []);
  useEffect(() => { track('scan_started'); }, []);

  const capture = async () => {
    try {
      const pic = await cam.current?.takePictureAsync({ quality: 0.8, skipProcessing: false });
      if (pic?.uri) { setUri(pic.uri); setPhase('review'); }
    } catch { setCameraBroken(true); }
  };
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!res.canceled && res.assets[0]) { setUri(res.assets[0].uri); setPhase('review'); }
  };

  const analyze = async () => {
    if (!uri) return;
    if (scansLeft <= 0) { setPhase('limit'); return; }
    setPhase('processing'); setStage(0);
    const ctrl = new AbortController(); abort.current = ctrl;
    try {
      const { base64, mime } = await prepareImage(uri);
      if (ctrl.signal.aborted) return;
      setStage(1);
      if (CONFIG.AI_PROVIDER === 'remote' && !(await ensureSession())) throw new AIError('offline', 'Could not start a session.');
      const svc = getRecognitionService();
      const stageTimer = setInterval(() => setStage((s) => Math.min(s + 1, 2)), 2500); // real states of a single request; no fake percentages
      let result;
      try { result = await svc.detect(base64, mime, ctrl.signal); } finally { clearInterval(stageTimer); }
      setStage(3);
      if (result.status === 'no_food' || result.ingredients.length === 0) {
        track('scan_failed', { reason: 'no_ingredients' });
        setErr({ title: 'No ingredients found', message: result.imageQuality === 'good' ? "We couldn't spot any food in this photo. Try a closer, brighter shot, or add ingredients manually." : 'The photo is too dark or blurry. Try better lighting on a clear surface.', retry: true });
        setPhase('error'); return;
      }
      consumeScan();
      setDraft(result.ingredients);
      addScan({ ingredients: result.ingredients.map((i) => i.name), provider: result.provider });
      track('scan_completed', { count: result.ingredients.length });
      router.replace({ pathname: '/detected', params: { warnings: JSON.stringify(result.warnings) } });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const code = e instanceof AIError ? e.code : 'provider';
      track('scan_failed', { reason: code });
      const map: Record<string, { title: string; message: string; retry: boolean }> = {
        offline: { title: 'No internet connection', message: 'Connect to the internet to scan, or add ingredients manually.', retry: true },
        timeout: { title: 'That took too long', message: 'The analysis timed out. Please try again.', retry: true },
        limit: { title: 'Daily scan limit reached', message: 'You can unlock one more scan by watching a short ad, or add ingredients manually.', retry: false },
        invalid: { title: 'Unreadable result', message: 'The AI answer could not be understood. Please retry or use a different photo.', retry: true },
        auth: { title: 'Please reopen the app', message: 'Your session expired.', retry: false },
        provider: { title: 'Service unavailable', message: 'Our recognition service is having trouble. Try again in a moment or add ingredients manually.', retry: true },
      };
      if (code === 'limit') { setPhase('limit'); return; }
      setErr(map[code] ?? map.provider); setPhase('error');
    }
  };

  const watchAd = async () => {
    setAdBusy(true);
    const r = await AdManager.showRewarded();
    setAdBusy(false);
    if (r === 'earned') { if (CONFIG.AI_PROVIDER === 'remote') await reportRewardedBonus(); grantBonus(); toast('Scan unlocked!'); setPhase('review'); }
    else if (r === 'dismissed') toast('Watch the full ad to unlock a scan.');
    else toast('No ad available right now. Try manual entry — it’s unlimited.');
  };

  const Close = <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 5 }}><IconButton icon="close" label="Close" color="#fff" bg="rgba(0,0,0,0.4)" onPress={() => router.back()} /></View>;

  // ---------- permission gate ----------
  if (!perm && phase === 'camera') return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}><ActivityIndicator color="#fff" /></View>;

  if (phase === 'processing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: spacing.xl, justifyContent: 'center', gap: spacing.xl }}>
        {uri ? <Image source={{ uri }} style={{ width: '100%', height: 220, borderRadius: 20 }} /> : null}
        <View accessibilityLiveRegion="polite" style={{ gap: spacing.md }}>
          {STAGES.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: i > stage ? 0.35 : 1 }}>
              {i < stage ? <Ionicons name="checkmark-circle" size={24} color={c.primary} /> : i === stage ? <ActivityIndicator color={c.primary} /> : <Ionicons name="ellipse-outline" size={24} color={c.textSecondary} />}
              <T weight={i === stage ? 'semibold' : 'regular'}>{s}…</T>
            </View>
          ))}
        </View>
        <Button variant="ghost" title="Cancel" onPress={() => { abort.current?.abort(); setPhase('review'); }} />
      </SafeAreaView>
    );
  }

  if (phase === 'limit') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: spacing.xl, justifyContent: 'center' }}>
        {Close}
        <ErrorState title="You've used today's free scans" message={`Free accounts get ${CONFIG.FREE_SCANS_PER_DAY} scans a day. Manual entry is always unlimited.`} />
        <Button title="Watch a short ad to unlock one additional ingredient scan" icon="play-circle" loading={adBusy} onPress={watchAd} />
        <View style={{ height: spacing.md }} />
        <Button variant="secondary" title="Add ingredients manually" onPress={() => router.replace('/manual')} />
      </SafeAreaView>
    );
  }

  if (phase === 'error' && err) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: spacing.xl, justifyContent: 'center' }}>
        {Close}
        <ErrorState title={err.title} message={err.message} onRetry={err.retry ? analyze : undefined} secondary={{ label: 'Add ingredients manually', onPress: () => router.replace('/manual') }} />
        <Button variant="ghost" title="Retake photo" onPress={() => { setUri(null); setPhase('camera'); }} />
      </SafeAreaView>
    );
  }

  if (phase === 'review' && uri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        {Close}
        <Image source={{ uri }} resizeMode="contain" accessibilityLabel="Selected photo" style={{ flex: 1 }} />
        <View style={{ backgroundColor: c.background, padding: spacing.lg, gap: spacing.md }}>
          <Banner tone="info" text={DISCLAIMERS.imageUpload} />
          <Button title="Use this photo" icon="sparkles" onPress={analyze} />
          <Button variant="secondary" title="Retake" onPress={() => { setUri(null); setPhase('camera'); }} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- camera ----------
  if (perm && !perm.granted) {
    const blocked = !perm.canAskAgain;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: spacing.xl, justifyContent: 'center' }}>
        {Close}
        <ErrorState title="Camera access needed" message={blocked ? 'Camera permission is turned off. Enable it in Settings, or pick a photo from your gallery.' : 'FoodLens uses your camera only when you tap the shutter, to identify ingredients.'}
          onRetry={blocked ? () => Linking.openSettings() : () => requestPerm()} retryLabel={blocked ? 'Open Settings' : 'Allow camera'} secondary={{ label: 'Choose from gallery', onPress: pick }} />
        <Button variant="ghost" title="Add ingredients manually" onPress={() => router.replace('/manual')} />
      </SafeAreaView>
    );
  }
  if (cameraBroken) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: spacing.xl, justifyContent: 'center' }}>
        {Close}
        <ErrorState title="Camera unavailable" message="We couldn't use the camera. You can upload a photo instead." onRetry={pick} retryLabel="Choose from gallery" />
      </SafeAreaView>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={{ flex: 1 }} facing="back" flash={flash} onMountError={() => setCameraBroken(true)} />
      <SafeAreaView edges={['top', 'bottom']} pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8 }}>
          <IconButton icon="close" label="Close" color="#fff" bg="rgba(0,0,0,0.4)" onPress={() => router.back()} />
          <IconButton icon={flash === 'on' ? 'flash' : 'flash-off'} label={flash === 'on' ? 'Turn flash off' : 'Turn flash on'} color="#fff" bg="rgba(0,0,0,0.4)" onPress={() => setFlash(flash === 'on' ? 'off' : 'on')} />
        </View>
        <View pointerEvents="none" style={{ alignSelf: 'center', width: '82%', aspectRatio: 1, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderStyle: 'dashed' }} />
        <View style={{ padding: spacing.lg, gap: spacing.lg, backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <T style={{ color: '#fff', textAlign: 'center' }}>Place your ingredients on a clear surface for better results.</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <IconButton icon="images" label="Choose from gallery" color="#fff" size={30} onPress={pick} />
            <Pressable accessibilityRole="button" accessibilityLabel="Take photo" onPress={capture}
              style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' }} />
            </Pressable>
            <T style={{ color: '#fff', width: MIN_W, textAlign: 'center' }} size="sm">{scansLeft} scan{scansLeft === 1 ? '' : 's'} left today</T>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
const MIN_W = 72;
