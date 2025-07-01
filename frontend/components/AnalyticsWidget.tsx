import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Theme } from '@/constants/Theme';
import { DEMO_MODE } from '@/demo/DemoMode';

interface AnalyticsData {
  earnings: {
    thisWeek: number;
    thisMonth: number;
    total: number;
    currency: string;
  };
  campaigns: {
    active: number;
    completed: number;
    pending: number;
  };
  performance: {
    conversionRate: number;
    avgDealValue: number;
    totalDeals: number;
    successRate: number;
  };
  growth: {
    earningsChange: number; // percentage
    dealsChange: number; // percentage
  };
}

interface AnalyticsWidgetProps {
  defaultExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  defaultExpanded = false,
  onExpandChange,
}) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const animatedHeight = React.useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const rotateAnimation = React.useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  // Demo data
  const demoAnalytics: AnalyticsData = {
    earnings: {
      thisWeek: 2450,
      thisMonth: 12850,
      total: 45230,
      currency: 'USD',
    },
    campaigns: {
      active: 3,
      completed: 12,
      pending: 2,
    },
    performance: {
      conversionRate: 12.5,
      avgDealValue: 850,
      totalDeals: 28,
      successRate: 78.5,
    },
    growth: {
      earningsChange: 15.2,
      dealsChange: 8.7,
    },
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalytics(demoAnalytics);
      } else {
        // TODO: Replace with actual API call
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/analytics/summary`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      setError('Unable to load analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle expand/collapse
  const toggleExpanded = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onExpandChange?.(newExpanded);

    // Animate height and rotation
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: newExpanded ? 1 : 0,
        duration: Theme.animation.normal,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnimation, {
        toValue: newExpanded ? 1 : 0,
        duration: Theme.animation.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, animatedHeight, rotateAnimation, onExpandChange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Format percentage
  const formatPercentage = (value: number, showSign = true) => {
    const formatted = `${Math.abs(value).toFixed(1)}%`;
    if (!showSign) return formatted;
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  // Render metric item
  const renderMetric = (label: string, value: string, trend?: number, icon?: string) => (
    <View style={styles.metricItem}>
      <View style={styles.metricHeader}>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={16} 
            color={Theme.colors.text.secondary} 
            style={styles.metricIcon}
          />
        )}
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend >= 0 ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend >= 0 ? Theme.colors.status.success : Theme.colors.status.error}
          />
          <Text style={[
            styles.trendText,
            { color: trend >= 0 ? Theme.colors.status.success : Theme.colors.status.error }
          ]}>
            {formatPercentage(trend)}
          </Text>
        </View>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={Theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  // Error state
  if (error || !analytics) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error || 'Failed to load analytics'}</Text>
        <TouchableOpacity onPress={fetchAnalytics} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      {/* Summary Section - Always Visible */}
      <TouchableOpacity
        style={styles.summarySection}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>This Week's Earnings</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(analytics.earnings.thisWeek)}
            </Text>
          </View>
          
          <View style={styles.summaryRight}>
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{analytics.campaigns.active}</Text>
                <Text style={styles.quickStatLabel}>Active</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{analytics.performance.conversionRate}%</Text>
                <Text style={styles.quickStatLabel}>Conv. Rate</Text>
              </View>
            </View>
            
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Ionicons
                name="chevron-down"
                size={20}
                color={Theme.colors.text.secondary}
              />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      <Animated.View
        style={[
          styles.detailsSection,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: animatedHeight,
          },
        ]}
      >
        <View style={styles.detailsContent}>
          {/* Earnings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earnings Overview</Text>
            <View style={styles.metricsGrid}>
              {renderMetric(
                'This Month',
                formatCurrency(analytics.earnings.thisMonth),
                analytics.growth.earningsChange,
                'calendar'
              )}
              {renderMetric(
                'Total Earnings',
                formatCurrency(analytics.earnings.total),
                undefined,
                'wallet'
              )}
            </View>
          </View>

          {/* Campaigns Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campaign Status</Text>
            <View style={styles.metricsGrid}>
              {renderMetric('Active', analytics.campaigns.active.toString(), undefined, 'play-circle')}
              {renderMetric('Completed', analytics.campaigns.completed.toString(), undefined, 'checkmark-circle')}
              {renderMetric('Pending', analytics.campaigns.pending.toString(), undefined, 'time')}
            </View>
          </View>

          {/* Performance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              {renderMetric(
                'Avg Deal Value',
                formatCurrency(analytics.performance.avgDealValue),
                undefined,
                'pricetag'
              )}
              {renderMetric(
                'Success Rate',
                formatPercentage(analytics.performance.successRate, false),
                analytics.growth.dealsChange,
                'trophy'
              )}
              {renderMetric(
                'Total Deals',
                analytics.performance.totalDeals.toString(),
                undefined,
                'document-text'
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Detailed Analytics</Text>
              <Ionicons name="arrow-forward" size={16} color={Theme.colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background.paper,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
    overflow: 'hidden',
  },
  
  summarySection: {
    padding: Theme.spacing.md,
  },
  
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  summaryLeft: {
    flex: 1,
  },
  
  summaryLabel: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xxs,
  },
  
  summaryValue: {
    ...Theme.typography.h3,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
  
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  
  quickStats: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  
  quickStat: {
    alignItems: 'center',
  },
  
  quickStatValue: {
    ...Theme.typography.body1,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  
  quickStatLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  
  detailsSection: {
    overflow: 'hidden',
  },
  
  detailsContent: {
    padding: Theme.spacing.md,
    paddingTop: 0,
  },
  
  section: {
    marginBottom: Theme.spacing.lg,
  },
  
  sectionTitle: {
    ...Theme.typography.body1,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.neutral.gray50,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xxs,
  },
  
  metricIcon: {
    marginRight: Theme.spacing.xxs,
  },
  
  metricLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  
  metricValue: {
    ...Theme.typography.body1,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xxs,
  },
  
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xxs,
  },
  
  trendText: {
    ...Theme.typography.caption,
    fontWeight: '500',
  },
  
  actionButtons: {
    marginTop: Theme.spacing.sm,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
    paddingVertical: Theme.spacing.sm,
  },
  
  actionButtonText: {
    ...Theme.typography.body2,
    color: Theme.colors.primary.main,
    fontWeight: '500',
  },
  
  loadingContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.sm,
  },
  
  errorContainer: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  errorText: {
    ...Theme.typography.body2,
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
});