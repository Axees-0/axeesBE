import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPayload {
  type: 'offer' | 'deal' | 'payment' | 'message' | 'system';
  title: string;
  message: string;
  actionType?: 'view_offer' | 'view_deal' | 'view_payment' | 'view_message';
  actionParams?: any;
  recipientId: string;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationPayload[] = [];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Notify Creator (NOTIFY_C)
  async notifyCreator(creatorId: string, notification: Omit<NotificationPayload, 'recipientId'>) {
    const payload: NotificationPayload = {
      ...notification,
      recipientId: creatorId,
    };
    
    await this.sendNotification(payload);
  }

  // Notify Marketer (NOTIFY_M)
  async notifyMarketer(marketerId: string, notification: Omit<NotificationPayload, 'recipientId'>) {
    const payload: NotificationPayload = {
      ...notification,
      recipientId: marketerId,
    };
    
    await this.sendNotification(payload);
  }

  // Send notification (handles NotificationReceived)
  private async sendNotification(payload: NotificationPayload) {
    // In a real app, this would send to a server
    // For demo, we'll store locally
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      const newNotification = {
        id: `notif-${Date.now()}`,
        ...payload,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      notifications.unshift(newNotification);
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      
      // In a real app, this would trigger a push notification
      console.log('Notification sent:', newNotification);
      
      return newNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Get notifications for a user
  async getNotifications(userId: string) {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      // Filter notifications for this user
      return notifications.filter((n: any) => n.recipientId === userId);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      const updatedNotifications = notifications.map((n: any) => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all as read for a user
  async markAllAsRead(userId: string) {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      const updatedNotifications = notifications.map((n: any) => 
        n.recipientId === userId ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    const notifications = await this.getNotifications(userId);
    return notifications.filter((n: any) => !n.read).length;
  }
}

export const notificationService = NotificationService.getInstance();