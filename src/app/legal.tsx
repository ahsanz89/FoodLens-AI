import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner, IconButton, Row, Screen, T } from '../components/common/ui';
import { DISCLAIMERS } from '../constants';

const SUPPORT_EMAIL = 'support@example.com'; // TODO(owner): replace before release

const DOCS: Record<string, { title: string; sections: [string, string][] }> = {
  about: { title: 'About FoodLens AI', sections: [
    ['What it does', 'FoodLens AI helps you work out what to cook from the ingredients you already have. Take a photo or add ingredients by hand, check the list, and browse recipes matched to what you have.'],
    ['AI and accuracy', DISCLAIMERS.ai + ' ' + DISCLAIMERS.food],
    ['Recipe sources', 'Some recipes are written for the app. Others come from TheMealDB, a community recipe database, and link back to it.'],
  ] },
  help: { title: 'Help and support', sections: [
    ['A scan got the wrong ingredients', 'Tap the pencil to rename an item or the bin to remove it. Add anything missing with “Add More Ingredients”.'],
    ['I ran out of scans', 'Free scans reset every day. You can watch a short ad to unlock one more, or add ingredients manually with no limit.'],
    ['Allergies', 'Set allergies in Profile. Recipes that appear to contain them are hidden or flagged. This is an automatic estimate only, so always read the real labels.'],
    ['Contact', `Email ${SUPPORT_EMAIL}.`],
  ] },
  privacy: { title: 'Privacy policy', sections: [
    ['Draft notice', 'This is a plain-language template. Have it reviewed by a qualified professional and host the final version at a public URL for the Google Play listing.'],
    ['What we collect', 'Preferences, favorites, kitchen items, shopping list and history are stored on your device. If a backend account is enabled, they sync to your account.'],
    ['Photos', DISCLAIMERS.imageUpload + ' Photos are only sent after you tap “Use this photo”.'],
    ['Allergy and diet information', 'Used only to filter recipes. It is never used to target ads.'],
    ['Advertising', 'The app shows ads through Google AdMob. Where required, you will be asked for consent. You can change your choice under Profile → Ad privacy choices.'],
    ['Your rights', 'Profile → Delete all my data removes everything stored on your device. Email us to delete server-side data.'],
  ] },
  terms: { title: 'Terms and conditions', sections: [
    ['Draft notice', 'Template only. Have it reviewed before release.'],
    ['Use at your own risk', 'Recipes and AI suggestions are for general inspiration. You are responsible for food safety, allergies, and cooking temperatures. ' + DISCLAIMERS.allergen],
    ['No medical advice', 'Nothing in the app is medical or dietary advice for any health condition.'],
  ] },
};

export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const router = useRouter();
  const d = DOCS[doc ?? 'about'] ?? DOCS.about;
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}><T size="xl" weight="bold" accessibilityRole="header" style={{ flex: 1 }}>{d.title}</T><IconButton icon="close" label="Close" onPress={() => router.back()} /></Row>
      {d.sections.map(([h, b]) => (
        <View key={h} style={{ marginTop: 16 }}>
          {h === 'Draft notice' ? <Banner tone="warn" text={b} /> : (<><T weight="bold" size="md">{h}</T><T color="textSecondary" style={{ marginTop: 4, lineHeight: 22 }}>{b}</T></>)}
        </View>
      ))}
    </Screen>
  );
}
