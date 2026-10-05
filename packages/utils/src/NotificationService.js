/**
 * NotificationService — Expo Push Notifications
 *
 * Handles:
 * - Requesting notification permissions
 * - Registering device push token with Supabase
 * - Listening for incoming notifications
 * - Handling notification taps (deep linking)
 */

import { Platform } from 'react-native';
import { supabase } from '@adera/auth/src/supabase';

// Lazy-load expo-notifications (not available on web)
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // expo-notifications not available (web platform)
}

// Configure notification behavior (only on native)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request notification permissions and return the push token.
 * Returns null on web or if permission is denied.
 */
export async function registerForPushNotifications() {
  // Push notifications not available on web
  if (Platform.OS === 'web' || !Notifications) {
    console.log('[NotificationService] Push notifications not available on web');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Push notification permission denied');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;

    console.log('[NotificationService] Expo push token:', expoPushToken);

    // Android-specific channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    return expoPushToken;
  } catch (error) {
    console.error('[NotificationService] Error registering for notifications:', error);
    return null;
  }
}

/**
 * Save the push token to Supabase user profile.
 * Call this after successfully registering for notifications.
 */
export async function savePushTokenToSupabase(expoPushToken) {
  if (!expoPushToken) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert the push token into the users table
    const { error } = await supabase
      .from('users')
      .update({ push_token: expoPushToken })
      .eq('id', user.id);

    if (error) {
      console.error('[NotificationService] Error saving push token:', error);
    }
  } catch (error) {
    console.error('[NotificationService] Error saving push token:', error);
  }
}

/**
 * Set up notification listeners.
 * Returns an object with cleanup functions.
 *
 * @param {Object} options
 * @param {Function} options.onReceive - Called when a notification is received while app is in foreground
 * @param {Function} options.onTap - Called when a notification is tapped
 */
export function setupNotificationListeners({ onReceive, onTap } = {}) {
  // Listeners not available on web
  if (Platform.OS === 'web' || !Notifications) {
    return { remove: () => {} };
  }

  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[NotificationService] Notification received:', notification.request.content);
    if (onReceive) {
      onReceive(notification);
    }
  });

  const tappedSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[NotificationService] Notification tapped:', response.notification.request.content);
    if (onTap) {
      onTap(response.notification);
    }
  });

  return {
    remove: () => {
      receivedSubscription?.remove();
      tappedSubscription?.remove();
    },
  };
}

/**
 * Schedule a local notification (for testing or offline scenarios).
 */
export async function scheduleLocalNotification({ title, body, data = {}, delay = 0 }) {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: delay > 0 ? { seconds: delay } : null,
    });
  } catch (error) {
    console.error('[NotificationService] Error scheduling notification:', error);
  }
}

/**
 * Clear all notification badges.
 */
export async function clearBadge() {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    // Badge clearing may not be supported on all platforms
  }
}

export default {
  registerForPushNotifications,
  savePushTokenToSupabase,
  setupNotificationListeners,
  scheduleLocalNotification,
  clearBadge,
};
