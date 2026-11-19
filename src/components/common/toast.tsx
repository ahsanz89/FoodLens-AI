import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, spacing } from '../../theme';

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const show = useCallback((m: string) => {
    setMsg(m);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setMsg(null));
  }, [opacity]);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: insets.bottom + 90, opacity }}>
          <View style={{ backgroundColor: '#202522', borderRadius: radius.md, padding: spacing.md }}>
            <Text style={{ color: '#fff', fontSize: font.base, textAlign: 'center' }}>{msg}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}
