import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useColors } from '../../theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
const tab = (name: string, title: string, on: Icon, off: Icon) => (
  <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? on : off} color={color as string} size={size} /> }} />
);

export default function TabsLayout() {
  const c = useColors();
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 64, paddingBottom: 8, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' } }}>
        {tab('index', 'Home', 'home', 'home-outline')}
        {tab('discover', 'Discover', 'compass', 'compass-outline')}
        {tab('kitchen', 'My Kitchen', 'basket', 'basket-outline')}
        {tab('favorites', 'Favorites', 'heart', 'heart-outline')}
        {tab('profile', 'Profile', 'person', 'person-outline')}
      </Tabs>
      <Pressable accessibilityRole="button" accessibilityLabel="Scan ingredients" onPress={() => router.push('/scan')}
        style={{ position: 'absolute', right: 18, bottom: 84, width: 60, height: 60, borderRadius: 30, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, borderWidth: 3, borderColor: c.background }}>
        <Ionicons name="camera" size={28} color="#202522" />
      </Pressable>
    </View>
  );
}
