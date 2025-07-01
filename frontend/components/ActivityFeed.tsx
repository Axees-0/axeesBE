import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Theme } from '@/constants/Theme';
import { DEMO_MODE } from '@/demo/DemoMode';
import { formatDistanceToNow } from 'date-fns';

// Activity types enum
export enum ActivityType {
  DEAL_CREATED = 'deal_created',
  DEAL_ACCEPTED = 'deal_accepted',
  DEAL_COMPLETED = 'deal_completed',
  PAYMENT_SENT = 'payment_sent',
  PAYMENT_RECEIVED = 'payment_received',
  MESSAGE_RECEIVED = 'message_received',
  CAMPAIGN_STARTED = 'campaign_started',
  CAMPAIGN_COMPLETED = 'campaign_completed',
}

// Activity item interface
interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  amount?: number;
  timestamp: Date;
  read: boolean;
  relatedId?: string;
  relatedType?: 'deal' | 'campaign' | 'payment' | 'message';
}

interface ActivityFeedProps {
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onActivityPress?: (activity: ActivityItem) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  maxItems = 5,
  showViewAll = true,
  onViewAll,
  onActivityPress,
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo data for development
  const demoActivities: ActivityItem[] = [
    {
      id: '1',
      type: ActivityType.DEAL_ACCEPTED,
      title: 'Offer Accepted',
      description: 'Nike accepted your offer for Summer Campaign',
      amount: 500,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      relatedId: 'deal123',
      relatedType: 'deal',
    },
    {
      id: '2',
      type: ActivityType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      description: 'Payment for Adidas Fall Collection',
      amount: 1200,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      relatedId: 'payment456',
      relatedType: 'payment',
    },
    {
      id: '3',
      type: ActivityType.CAMPAIGN_COMPLETED,
      title: 'Campaign Completed',
      description: 'Summer Fitness campaign has ended',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      relatedId: 'campaign789',
      relatedType: 'campaign',
    },
    {
      id: '4',
      type: ActivityType.MESSAGE_RECEIVED,
      title: 'New Message',
      description: 'You have a new message from @creator_jane',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: false,
      relatedId: 'msg012',
      relatedType: 'message',
    },
    {
      id: '5',
      type: ActivityType.DEAL_CREATED,
      title: 'New Offer',
      description: 'Puma sent you a new collaboration offer',
      amount: 750,
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      read: false,
      relatedId: 'deal345',
      relatedType: 'deal',
    },
  ];

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setError(null);
      
      if (DEMO_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setActivities(demoActivities);
      } else {
        // TODO: Replace with actual API call
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/activities`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (err) {
      setError('Unable to load activities');
      console.error('Activity fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
  }, [fetchActivities]);

  // Get icon for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.DEAL_CREATED:
      case ActivityType.DEAL_ACCEPTED:
        return { name: 'document-text', color: Theme.colors.primary.main };
      case ActivityType.DEAL_COMPLETED:
        return { name: 'checkmark-circle', color: Theme.colors.status.success };
      case ActivityType.PAYMENT_SENT:
      case ActivityType.PAYMENT_RECEIVED:
        return { name: 'cash', color: Theme.colors.status.success };
      case ActivityType.MESSAGE_RECEIVED:
        return { name: 'chatbubble', color: Theme.colors.status.info };
      case ActivityType.CAMPAIGN_STARTED:
      case ActivityType.CAMPAIGN_COMPLETED:
        return { name: 'megaphone', color: Theme.colors.primary.light };
      default:
        return { name: 'information-circle', color: Theme.colors.neutral.gray600 };
    }
  };

  // Format activity time
  const formatTime = (timestamp: Date) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Render activity item
  const renderActivityItem = (activity: ActivityItem) => {
    const icon = getActivityIcon(activity.type);
    
    return (
      <TouchableOpacity
        key={activity.id}
        style={[styles.activityItem, !activity.read && styles.unreadItem]}
        onPress={() => onActivityPress?.(activity)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !activity.read && styles.unreadText]}>
              {activity.title}
            </Text>
            <Text style={styles.time}>{formatTime(activity.timestamp)}</Text>
          </View>
          
          <Text style={styles.description} numberOfLines={1}>
            {activity.description}
          </Text>
          
          {activity.amount && (
            <Text style={styles.amount}>${activity.amount.toLocaleString()}</Text>
          )}
        </View>
        
        {!activity.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Theme.colors.primary.main} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchActivities} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off" size={32} color={Theme.colors.neutral.gray400} />
        <Text style={styles.emptyText}>No recent activity</Text>
      </View>
    );
  }

  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Activity</Text>
        {showViewAll && activities.length > maxItems && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Theme.colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayActivities.map(renderActivityItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background.paper,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  
  headerTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
  },
  
  viewAllText: {
    ...Theme.typography.body2,
    color: Theme.colors.primary.main,
  },
  
  scrollView: {
    maxHeight: 300,
  },
  
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.neutral.gray100,
  },
  
  unreadItem: {
    backgroundColor: Theme.colors.primary.lightest,
    marginHorizontal: -Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.xs,
  },
  
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  
  contentContainer: {
    flex: 1,
  },
  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xxs,
  },
  
  title: {
    ...Theme.typography.body1,
    fontWeight: '500',
    color: Theme.colors.text.primary,
    flex: 1,
  },
  
  unreadText: {
    fontWeight: '600',
  },
  
  time: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.xs,
  },
  
  description: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xxs,
  },
  
  amount: {
    ...Theme.typography.body1,
    fontWeight: '600',
    color: Theme.colors.status.success,
  },
  
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary.main,
    marginLeft: Theme.spacing.xs,
    alignSelf: 'center',
  },
  
  loadingContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  errorContainer: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  errorText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  
  retryButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
  },
  
  retryText: {
    ...Theme.typography.body2,
    color: Theme.colors.primary.main,
    fontWeight: '500',
  },
  
  emptyContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  emptyText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.sm,
  },
});