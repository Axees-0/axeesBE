import notifee from '@notifee/react-native';
import { Platform } from 'react-native';

export async function showNotification(remoteMessage: any) {
  if (Platform.OS === 'web') {
    console.log('Web notification:', remoteMessage);
    return;
  }

  const { notification, data } = remoteMessage;
  
  if (!notification) return;

  await notifee.displayNotification({
    title: notification.title || 'Axees',
    body: notification.body || '',
    data: data || {},
    android: {
      channelId: 'default',
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
    ios: {
      sound: 'default',
    },
  });
}

export async function createNotificationChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: 4, // HIGH
    });
  }
}