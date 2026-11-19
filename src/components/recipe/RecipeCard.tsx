import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useColors } from '../../theme';
import type { Recipe, RecipeMatch } from '../../types';
import { Card, Chip, Row, T } from '../common/ui';
import { useApp } from '../../store/useApp';

const EMOJI: Record<string, string> = { Breakfast: '🍳', Lunch: '🥗', Dinner: '🍲', Snack: '🥨', Dessert: '🍰' };

export function RecipeImage({ recipe, height = 140, round }: { recipe: Recipe; height?: number; round?: boolean }) {
  const c = useColors();
  if (recipe.imageUrl) {
    return <Image source={{ uri: recipe.imageUrl }} accessibilityIgnoresInvertColors accessibilityLabel={`Photo of ${recipe.title}`} style={{ width: '100%', height, backgroundColor: c.surfaceAlt, borderRadius: round ? radius.lg : 0 }} />;
  }
  return (
    <View accessibilityElementsHidden style={{ width: '100%', height, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderRadius: round ? radius.lg : 0 }}>
      <T style={{ fontSize: height * 0.4 }}>{EMOJI[recipe.category] ?? '🍽️'}</T>
    </View>
  );
}

export function FavButton({ recipe }: { recipe: Recipe }) {
  const fav = useApp((s) => s.favorites.includes(recipe.id));
  const toggle = useApp((s) => s.toggleFavorite);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={fav ? 'Remove from favorites' : 'Save to favorites'} onPress={() => toggle(recipe)} hitSlop={8}
      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? '#D9534F' : '#202522'} />
    </Pressable>
  );
}

export function RecipeCard({ recipe, match, onPress, width }: { recipe: Recipe; match?: RecipeMatch; onPress: () => void; width?: number }) {
  const total = recipe.prepMinutes + recipe.cookMinutes;
  return (
    <Card onPress={onPress} label={`${recipe.title}, ${total} minutes, ${recipe.difficulty}`} style={width ? { width } : undefined}>
      <View>
        <RecipeImage recipe={recipe} />
        <View style={{ position: 'absolute', top: 10, right: 10 }}><FavButton recipe={recipe} /></View>
        {match ? (
          <View style={{ position: 'absolute', left: 10, bottom: 10, backgroundColor: match.matchPercent >= 80 ? '#2E8B57' : '#FF9F43', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
            <T size="sm" weight="bold" color="primaryOn" style={{ color: match.matchPercent >= 80 ? '#fff' : '#202522' }}>{match.matchPercent}% match</T>
          </View>
        ) : null}
      </View>
      <View style={{ padding: spacing.md, gap: 6 }}>
        <T weight="bold" size="md" numberOfLines={2}>{recipe.title}</T>
        <T color="textSecondary" size="sm" numberOfLines={2}>{recipe.description}</T>
        <Row style={{ gap: 12, flexWrap: 'wrap' }}>
          <Meta icon="time-outline" text={`${total} min`} />
          <Meta icon="speedometer-outline" text={recipe.difficulty} />
          <Meta icon="earth-outline" text={recipe.cuisine} />
        </Row>
        {match ? (
          <Row style={{ flexWrap: 'wrap', marginTop: 2 }}>
            <T size="sm" color="textSecondary">{match.missing.length === 0 ? 'You have everything' : `Missing ${match.missing.length} ingredient${match.missing.length > 1 ? 's' : ''}`}</T>
          </Row>
        ) : null}
        {match && match.blockedBy.length > 0 ? <Chip label={`Contains ${match.blockedBy.join(', ')}`} icon="warning" tone="warn" /> : null}
      </View>
    </Card>
  );
}

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  const c = useColors();
  return <Row style={{ gap: 4 }}><Ionicons name={icon} size={14} color={c.textSecondary} /><T size="sm" color="textSecondary">{text}</T></Row>;
}
