import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './apiClient';
import type { UserRole } from '@/types';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // If the native notifications module isn't available for any reason, don't take the whole
  // app down over it - this runs at import time, before any screen has a chance to render.
}

export async function registerPushToken(role: UserRole): Promise<void> {
  if (!Device.isDevice) return; // push tokens only work on physical devices

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  const endpoint = role === 'affiliate' ? '/api/affiliate/push-token' : '/api/driver/push-token';
  await api.put(endpoint, { token }).catch(() => {});
}
