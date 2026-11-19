import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AdManager, AD_UNITS, adsSdk } from '../../services/ads/AdManager';
import { radius, spacing, useColors } from '../../theme';
import { T } from '../common/ui';

/** Anchored adaptive banner. Renders nothing (no empty gap) when ads are unavailable or fail. */
export function AdBanner({ placement }: { placement: 'home_banner' | 'kitchen_banner' }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(AdManager.ready);
  useEffect(() => { if (!AdManager.ready) AdManager.init().then(() => setReady(AdManager.ready)); }, []);
  if (!adsSdk || !ready || failed) return null;
  const { BannerAd, BannerAdSize } = adsSdk;
  return (
    <View accessibilityLabel="Advertisement" style={{ alignItems: 'center', marginVertical: spacing.lg }}>
      <BannerAd unitId={AD_UNITS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={AdManager.requestOptions()}
        onAdLoaded={() => AdManager.logImpression(placement)} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  );
}

/** Native ad styled as a clearly-labelled sponsored card. Never looks like a recipe. */
export function NativeAdCard({ placement }: { placement: 'discover_native' | 'results_native' }) {
  const c = useColors();
  const [ad, setAd] = useState<any>(null);
  useEffect(() => {
    let alive = true; let loaded: any = null;
    (async () => {
      if (!adsSdk) return;
      await AdManager.init();
      if (!AdManager.ready) return;
      try {
        loaded = await adsSdk.NativeAd.createForAdRequest(AD_UNITS.native, AdManager.requestOptions());
        if (alive) { setAd(loaded); AdManager.logImpression(placement); }
      } catch { /* no fill: render nothing */ }
    })();
    return () => { alive = false; try { loaded?.destroy?.(); } catch { /* noop */ } };
  }, [placement]);
  if (!adsSdk || !ad) return null;
  const { NativeAdView, NativeAsset, NativeAssetType } = adsSdk;
  return (
    <NativeAdView nativeAd={ad} style={{ backgroundColor: c.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginVertical: spacing.sm, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed' }}>
      <View style={{ alignSelf: 'flex-start', backgroundColor: c.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 }}>
        <T size="sm" weight="bold" style={{ color: '#202522' }}>Ad · Sponsored</T>
      </View>
      <NativeAsset assetType={NativeAssetType.HEADLINE}><T weight="bold" size="md">{ad.headline}</T></NativeAsset>
      {ad.body ? <NativeAsset assetType={NativeAssetType.BODY}><T color="textSecondary" size="sm" numberOfLines={2}>{ad.body}</T></NativeAsset> : null}
      {ad.callToAction ? <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}><T color="primary" weight="bold" style={{ marginTop: 6 }}>{ad.callToAction}</T></NativeAsset> : null}
    </NativeAdView>
  );
}
