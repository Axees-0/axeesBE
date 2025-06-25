import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color, Focus } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import { useAuth } from '@/contexts/AuthContext';
import DesignSystem from '@/styles/DesignSystem';

interface Notification {
  id: string;
  type: 'offer' | 'deal' | 'payment' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionType?: 'view_offer' | 'view_deal' | 'view_payment' | 'view_message';
  actionParams?: any;
  icon?: string;
}

const NotificationsPage: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [markAllHovered, setMarkAllHovered] = useState(false);
  const [markAllFocused, setMarkAllFocused] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      type: 'offer',
      title: 'New Offer Received',
      message: 'Sarah Martinez from TechStyle Brand sent you a new offer for Instagram Post Campaign',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      read: false,
      actionType: 'view_offer',
      actionParams: { offerId: 'offer-001' },
      icon: '💼',
    },
    {
      id: 'notif-2',
      type: 'deal',
      title: 'Deal Milestone Funded',
      message: 'Your milestone "Content Creation" has been funded. You can start working!',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
      actionType: 'view_deal',
      actionParams: { dealId: 'DEAL-001' },
      icon: '💰',
    },
    {
      id: 'notif-3',
      type: 'message',
      title: 'New Message',
      message: 'David Chen: "I love that idea! Let\'s discuss the timeline."',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      read: true,
      actionType: 'view_message',
      actionParams: { chatId: 'chat-2' },
      icon: '💬',
    },
    {
      id: 'notif-4',
      type: 'payment',
      title: 'Payment Released',
      message: 'Payment of $750 has been released for milestone "Content Creation"',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      read: true,
      actionType: 'view_payment',
      actionParams: { paymentId: 'payment-001' },
      icon: '💸',
    },
    {
      id: 'notif-5',
      type: 'system',
      title: 'Welcome to Axees!',
      message: 'Complete your profile to get more visibility and better offers',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      read: true,
      icon: '🎉',
    },
  ]);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'offer': return '#7C3AED';
      case 'deal': return '#3B82F6';
      case 'payment': return '#10B981';
      case 'message': return '#F59E0B';
      case 'system': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDateGroup = (date: Date): string => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    if (date >= startOfToday) {
      return 'Today';
    } else if (date >= startOfYesterday) {
      return 'Yesterday';
    } else if (date >= startOfWeek) {
      return 'This Week';
    } else {
      return 'Earlier';
    }
  };

  const groupNotificationsByDate = (notifs: Notification[]) => {
    const grouped: { [key: string]: Notification[] } = {};
    
    notifs.forEach(notif => {
      const group = getDateGroup(notif.timestamp);
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(notif);
    });

    // Order the groups
    const orderedGroups = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    const result: { group: string; notifications: Notification[] }[] = [];
    
    orderedGroups.forEach(group => {
      if (grouped[group]) {
        result.push({ group, notifications: grouped[group] });
      }
    });

    return result;
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate based on action type
    switch (notification.actionType) {
      case 'view_offer':
        router.push({
          pathname: '/offers/review',
          params: notification.actionParams
        });
        break;
      case 'view_deal':
        router.push({
          pathname: '/deals/[id]',
          params: notification.actionParams
        });
        break;
      case 'view_message':
        router.push({
          pathname: '/chat/[id]',
          params: notification.actionParams
        });
        break;
      case 'view_payment':
        router.push('/earnings');
        break;
      default:
        // No action
        break;
    }
  };

  const markAllAsRead = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount === 0 || markingAllRead) {
      return; // No unread notifications or already processing
    }
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Mark all ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read?`
      );
      if (confirmed) {
        setMarkingAllRead(true);
        setTimeout(() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setMarkingAllRead(false);
        }, 500); // Small delay for visual feedback
      }
    } else {
      // For mobile, use Alert.alert
      const { Alert } = require('react-native');
      Alert.alert(
        'Mark All Read',
        `Mark all ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Mark Read', 
            onPress: () => {
              setMarkingAllRead(true);
              setTimeout(() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setMarkingAllRead(false);
              }, 500); // Small delay for visual feedback
            }
          }
        ]
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <WebSEO 
        title="Notifications | Axees"
        description="Stay updated with your deals, offers, and messages"
        keywords="notifications, updates, alerts"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={[
                styles.markAllButton,
                markAllHovered && isWeb && styles.markAllButtonHovered,
                markAllFocused && styles.markAllButtonFocused,
                markingAllRead && styles.markAllButtonLoading
              ]}
              onPress={markAllAsRead}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Mark all ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read`}
              accessibilityHint="Marks all unread notifications as read"
              onMouseEnter={isWeb ? () => setMarkAllHovered(true) : undefined}
              onMouseLeave={isWeb ? () => setMarkAllHovered(false) : undefined}
              onFocus={() => setMarkAllFocused(true)}
              onBlur={() => setMarkAllFocused(false)}
              {...(Platform.OS === 'web' && { tabIndex: 0 })}
            >
              <Text style={[
                styles.markAllText,
                markAllFocused && styles.markAllTextFocused
              ]}>
                {markingAllRead ? 'Marking...' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Color.cSK430B92500}
            />
          }
        >
          {notifications.length > 0 ? (
            groupNotificationsByDate(notifications).map(({ group, notifications: groupNotifs }) => (
              <View key={group} style={styles.dateSection}>
                <Text style={styles.dateSectionTitle}>{group}</Text>
                {groupNotifs.map(notification => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadItem
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={[
                      styles.iconContainer, 
                      { backgroundColor: notification.read ? '#f3f4f6' : getNotificationColor(notification.type) + '20' }
                    ]}>
                      <Text style={styles.icon}>{notification.icon}</Text>
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationTitle,
                        notification.read && styles.readTitle
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={[
                        styles.notificationMessage,
                        notification.read && styles.readMessage
                      ]} numberOfLines={width <= 375 ? undefined : 2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.timestamp}>{formatTimestamp(notification.timestamp)}</Text>
                    </View>
                    
                    {!notification.read && (
                      <View style={[styles.unreadDot, { backgroundColor: getNotificationColor(notification.type) }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                We'll notify you when something important happens
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  markAllButton: {
    ...DesignSystem.ButtonStyles.secondary,
    paddingHorizontal: DesignSystem.ResponsiveSpacing.buttonMargin.marginHorizontal,
    height: DesignSystem.ButtonStyles.secondary.height,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  markAllText: {
    ...DesignSystem.ButtonTextStyles.secondary,
    fontSize: 14,
    ...Platform.select({
      web: {
        userSelect: 'none',
      },
    }),
  },
  scrollContainer: {
    flex: 1,
  },
  dateSection: {
    paddingTop: 20,
  },
  dateSectionTitle: {
    ...DesignSystem.Typography.h4,
    fontSize: 16, // Increased for better hierarchy
    fontWeight: '700', // Increased weight
    color: DesignSystem.AccessibleColors.textSecondary,
    backgroundColor: DesignSystem.AccessibleColors.backgroundSubtle, // Background for section distinction
    paddingHorizontal: 20,
    paddingVertical: 12, // Added vertical padding
    marginBottom: 0, // Remove bottom margin for cleaner sections
    borderTopWidth: 1,
    borderTopColor: DesignSystem.AccessibleColors.borderLight,
  },
  unreadSection: {
    paddingTop: 20,
  },
  readSection: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingBottom: 12,
    textTransform: 'uppercase',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
    minHeight: 80, // Consistent row height for dot alignment
  },
  unreadItem: {
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
    minWidth: 0, // Allow content to shrink below intrinsic width
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  readTitle: {
    fontWeight: '500',
    color: '#666',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  readMessage: {
    color: '#999',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 10, // Slightly larger for better visibility
    height: 10,
    borderRadius: 5,
    marginLeft: DesignSystem.ResponsiveSpacing.buttonMargin.marginHorizontal, // Consistent right margin
    alignSelf: 'center', // Center vertically within notification item
    position: 'absolute',
    right: 20, // Consistent right positioning
    top: '50%',
    marginTop: -5, // Half height for perfect centering
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  markAllButtonHovered: {
    backgroundColor: Color.cSK430B9250,
    borderColor: Color.cSK430B92500,
  },
  markAllButtonFocused: {
    ...Focus.primary,
    backgroundColor: Color.cSK430B9250,
  },
  markAllButtonLoading: {
    opacity: 0.6,
    backgroundColor: Color.cSK430B92100,
  },
  markAllButtonDisabled: {
    opacity: 0.5,
    borderColor: '#ccc',
    ...Platform.select({
      web: {
        cursor: 'not-allowed' as any,
      },
    }),
  },
  markAllTextDisabled: {
    color: '#999',
  },
  markAllTextFocused: {
    color: Color.cSK430B92950,
  },
});

export default NotificationsPage;