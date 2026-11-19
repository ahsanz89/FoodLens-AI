import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextProps, View, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, MIN_TOUCH, radius, spacing, useColors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function T({ style, children, weight = 'regular', size = 'base', color, ...rest }: Omit<TextProps, 'style'> & {
  style?: StyleProp<TextStyle>; weight?: 'regular' | 'semibold' | 'bold'; size?: keyof typeof font; color?: 'text' | 'textSecondary' | 'primary' | 'error' | 'primaryOn';
}) {
  const c = useColors();
  return (
    <Text {...rest} style={[{ color: c[color ?? 'text'], fontSize: font[size], fontWeight: weight === 'bold' ? '700' : weight === 'semibold' ? '600' : '400' }, style]}>
      {children}
    </Text>
  );
}

export function Screen({ children, scroll = true, padded = true, edges = ['top'] as ('top' | 'bottom')[], footer }: {
  children: React.ReactNode; scroll?: boolean; padded?: boolean; edges?: ('top' | 'bottom')[]; footer?: React.ReactNode;
}) {
  const c = useColors();
  const body = scroll
    ? <ScrollView contentContainerStyle={[padded && { padding: spacing.lg }, { paddingBottom: spacing.xxl }]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[{ flex: 1 }, padded && { padding: spacing.lg }]}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.background }}>
      {body}
      {footer ? <View style={{ padding: spacing.lg, backgroundColor: c.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style, small }: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: IconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean;
}) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : variant === 'secondary' ? c.surface : variant === 'danger' ? c.error : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? c.primaryOn : variant === 'ghost' ? c.primary : c.primary;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [{
        minHeight: small ? 40 : MIN_TOUCH + 4, borderRadius: radius.pill, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
        backgroundColor: bg, borderWidth: variant === 'secondary' ? 1.5 : 0, borderColor: c.primary, opacity: off ? 0.5 : pressed ? 0.85 : 1,
      }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: font.md, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, color, size = 24, bg }: { icon: IconName; onPress: () => void; label: string; color?: string; size?: number; bg?: string }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}
      style={{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      <Ionicons name={icon} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon, tone }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; tone?: 'warn' | 'ok' }) {
  const c = useColors();
  const bg = selected ? c.primary : tone === 'warn' ? '#FFF3DC' : c.surface;
  const fg = selected ? c.primaryOn : tone === 'warn' ? '#7A4F00' : c.text;
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : 'text'} accessibilityState={{ selected: !!selected }}
      style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: bg, borderWidth: 1, borderColor: selected ? c.primary : c.border, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginRight: 8, marginBottom: 8 }}>
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: font.sm, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress, label }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string }) {
  const c = useColors();
  const base = [{ backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, overflow: 'hidden' as const }, style];
  return onPress
    ? <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.9 }]}>{children}</Pressable>
    : <View style={base}>{children}</View>;
}

export function Field(props: TextInputProps & { label?: string }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {props.label ? <T size="sm" weight="semibold" color="textSecondary" style={{ marginBottom: 6 }}>{props.label}</T> : null}
      <TextInput
        placeholderTextColor={c.textSecondary} accessibilityLabel={props.label ?? props.placeholder}
        {...props}
        style={[{ minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: spacing.lg, color: c.text, fontSize: font.base }, props.style]}
      />
    </View>
  );
}

export function SearchField({ value, onChangeText, placeholder, onSubmit }: { value: string; onChangeText: (s: string) => void; placeholder: string; onSubmit?: () => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, minHeight: MIN_TOUCH }}>
      <Ionicons name="search" size={20} color={c.textSecondary} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.textSecondary} onSubmitEditing={onSubmit} returnKeyType="search"
        accessibilityLabel={placeholder} style={{ flex: 1, marginLeft: 8, color: c.text, fontSize: font.base }} />
      {value ? <Pressable accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={10}><Ionicons name="close-circle" size={20} color={c.textSecondary} /></Pressable> : null}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md }}>
      <T size="lg" weight="bold" accessibilityRole="header">{title}</T>
      {action ? <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button"><T color="primary" weight="semibold">{action}</T></Pressable> : null}
    </View>
  );
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: { icon: IconName; title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.md }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={40} color={c.primary} />
      </View>
      <T size="lg" weight="bold" style={{ textAlign: 'center' }}>{title}</T>
      <T color="textSecondary" style={{ textAlign: 'center' }}>{message}</T>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.sm }} /> : null}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again', secondary }: {
  title?: string; message: string; onRetry?: () => void; retryLabel?: string; secondary?: { label: string; onPress: () => void };
}) {
  return (
    <View accessibilityRole="alert">
      <EmptyState icon="alert-circle-outline" title={title} message={message} actionLabel={onRetry ? retryLabel : undefined} onAction={onRetry} />
      {secondary ? <View style={{ alignItems: 'center' }}><Button variant="ghost" title={secondary.label} onPress={secondary.onPress} /></View> : null}
    </View>
  );
}

export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View accessibilityElementsHidden style={[{ height, width, borderRadius: radius.sm, backgroundColor: c.surfaceAlt }, style]} />;
}

export function Banner({ tone, text }: { tone: 'warn' | 'info' | 'error'; text: string }) {
  const c = useColors();
  const bg = tone === 'warn' ? '#FFF3DC' : tone === 'error' ? '#FDECEA' : c.surfaceAlt;
  const fg = tone === 'warn' ? '#7A4F00' : tone === 'error' ? '#8A2B27' : c.text;
  const icon: IconName = tone === 'info' ? 'information-circle' : 'warning';
  return (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 8, backgroundColor: bg, borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.sm }}>
      <Ionicons name={icon} size={18} color={fg} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, color: fg, fontSize: font.sm, lineHeight: 19 }}>{text}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginVertical: spacing.md }} />;
}
