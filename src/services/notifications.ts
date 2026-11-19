import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DAILY_ID = 'foodlens.daily';
const REMIND_ID = 'foodlens.kitchen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Asked contextually (when the user flips a switch), never on launch. */
export async function ensurePermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Recipe ideas', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    if (!cur.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch { return false; }
}

export async function setDailyInspiration(on: boolean): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  if (!on) return true;
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: { title: 'FoodLens AI', body: "Today's recipe idea is ready. What will you cook?" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 17, minute: 30, channelId: 'default' },
  });
  return true;
}

/** At most one reminder per week, and only if the user opted in. */
export async function setKitchenReminder(on: boolean): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(REMIND_ID).catch(() => {});
  if (!on) return true;
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: REMIND_ID,
    content: { title: 'FoodLens AI', body: 'You have ingredients in your kitchen. Discover a new recipe.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 7, hour: 11, minute: 0, channelId: 'default' },
  });
  return true;
}

export async function cancelAll() { await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {}); }
