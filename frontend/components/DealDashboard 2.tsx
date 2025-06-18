import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap
} from 'lucide-react-native';
import { useDealDashboard } from '@/utils/dealDashboardService';

const { width } = Dimensions.get('window');

export interface DealMetrics {
  totalRevenue: number;
  projectedRevenue: number;
  completionRate: number;
  averageEngagement: number;
  totalReach: number;
  milestonesCompleted: number;
  milestonesTotal: number;
  daysRemaining: number;
  socialMetrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
  performance: {
    onTimeDeliveries: number;
    clientSatisfaction: number;
    revenueGrowth: number;
    engagementRate: number;
  };
}

export interface ProjectionData {
  timeframe: 'week' | 'month' | 'quarter';
  revenue: Array<{ date: string; actual: number; projected: number }>;
  engagement: Array<{ date: string; rate: number }>;
  milestones: Array<{ date: string; completed: number; total: number }>;
}

interface DealDashboardProps {
  dealId: string;
  userType?: 'creator' | 'marketer';
  compact?: boolean;
  showProjections?: boolean;
  timeframe?: 'week' | 'month' | 'quarter';
}

export default function DealDashboard({
  dealId,
  userType = 'creator',
  compact = false,
  showProjections = true,
  timeframe = 'month'
}: DealDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>(timeframe);
  
  const {
    metrics,
    projections,
    isLoading,
    error,
    refreshData,
    service
  } = useDealDashboard({
    dealId,
    userType,
    timeframe: selectedTimeframe
  });

  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number,
    trend?: number,
    subtitle?: string,
    color: string = '#430B92'
  ) => (
    <View style={[styles.metricCard, compact && styles.metricCardCompact]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            {trend >= 0 ? (
              <TrendingUp width={12} height={12} color="#10B981" />
            ) : (
              <TrendingDown width={12} height={12} color="#EF4444" />
            )}
            <Text style={[
              styles.trendText,
              { color: trend >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderProjectionChart = () => {
    if (!projections || !showProjections) return null;

    const maxRevenue = Math.max(
      ...projections.revenue.map(item => Math.max(item.actual, item.projected))
    );

    return (
      <View style={styles.projectionCard}>
        <View style={styles.projectionHeader}>
          <BarChart3 width={20} height={20} color="#430B92" />
          <Text style={styles.projectionTitle}>Revenue Projections</Text>
          
          <View style={styles.timeframeSelector}>
            {(['week', 'month', 'quarter'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === period && styles.timeframeButtonActive
                ]}
                onPress={() => setSelectedTimeframe(period)}
              >
                <Text style={[
                  styles.timeframeButtonText,
                  selectedTimeframe === period && styles.timeframeButtonTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#430B92' }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#A855F7' }]} />
              <Text style={styles.legendText}>Projected</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chart}>
              {projections.revenue.map((item, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        styles.actualBar,
                        {
                          height: (item.actual / maxRevenue) * 100,
                          backgroundColor: '#430B92'
                        }
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        styles.projectedBar,
                        {
                          height: (item.projected / maxRevenue) * 100,
                          backgroundColor: '#A855F7'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderEngagementMetrics = () => {
    if (!metrics) return null;

    return (
      <View style={styles.engagementCard}>
        <View style={styles.cardHeader}>
          <Activity width={20} height={20} color="#430B92" />
          <Text style={styles.cardTitle}>Social Media Performance</Text>
        </View>

        <View style={styles.engagementGrid}>
          <View style={styles.engagementItem}>
            <Eye width={16} height={16} color="#6B7280" />
            <Text style={styles.engagementValue}>
              {service.formatNumber(metrics.socialMetrics.totalViews)}
            </Text>
            <Text style={styles.engagementLabel}>Views</Text>
          </View>

          <View style={styles.engagementItem}>
            <Heart width={16} height={16} color="#EF4444" />
            <Text style={styles.engagementValue}>
              {service.formatNumber(metrics.socialMetrics.totalLikes)}
            </Text>
            <Text style={styles.engagementLabel}>Likes</Text>
          </View>

          <View style={styles.engagementItem}>
            <MessageCircle width={16} height={16} color="#3B82F6" />
            <Text style={styles.engagementValue}>
              {service.formatNumber(metrics.socialMetrics.totalComments)}
            </Text>
            <Text style={styles.engagementLabel}>Comments</Text>
          </View>

          <View style={styles.engagementItem}>
            <Share2 width={16} height={16} color="#10B981" />
            <Text style={styles.engagementValue}>
              {service.formatNumber(metrics.socialMetrics.totalShares)}
            </Text>
            <Text style={styles.engagementLabel}>Shares</Text>
          </View>
        </View>

        <View style={styles.engagementSummary}>
          <Text style={styles.engagementSummaryText}>
            Average Engagement Rate: {metrics.averageEngagement.toFixed(1)}%
          </Text>
          <Text style={styles.engagementSummarySubtext}>
            Total Reach: {service.formatNumber(metrics.totalReach)} users
          </Text>
        </View>
      </View>
    );
  };

  const renderProgressOverview = () => {
    if (!metrics) return null;

    const progressPercentage = (metrics.milestonesCompleted / metrics.milestonesTotal) * 100;

    return (
      <View style={styles.progressCard}>
        <View style={styles.cardHeader}>
          <Target width={20} height={20} color="#430B92" />
          <Text style={styles.cardTitle}>Progress Overview</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Deal Completion</Text>
            <Text style={styles.progressValue}>{progressPercentage.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>

          <View style={styles.progressDetails}>
            <Text style={styles.progressText}>
              {metrics.milestonesCompleted} of {metrics.milestonesTotal} milestones completed
            </Text>
            <Text style={styles.progressSubtext}>
              {metrics.daysRemaining} days remaining
            </Text>
          </View>
        </View>

        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Clock width={16} height={16} color="#F59E0B" />
            <Text style={styles.performanceValue}>
              {metrics.performance.onTimeDeliveries}%
            </Text>
            <Text style={styles.performanceLabel}>On-time</Text>
          </View>

          <View style={styles.performanceItem}>
            <Award width={16} height={16} color="#10B981" />
            <Text style={styles.performanceValue}>
              {metrics.performance.clientSatisfaction}%
            </Text>
            <Text style={styles.performanceLabel}>Satisfaction</Text>
          </View>

          <View style={styles.performanceItem}>
            <Zap width={16} height={16} color="#8B5CF6" />
            <Text style={styles.performanceValue}>
              {metrics.performance.engagementRate.toFixed(1)}%
            </Text>
            <Text style={styles.performanceLabel}>Engagement</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle width={24} height={24} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Dashboard</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.emptyContainer}>
        <BarChart3 width={48} height={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptyText}>
          Dashboard data will appear once deal activity begins
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Key Metrics Row */}
      <View style={styles.metricsRow}>
        {renderMetricCard(
          <DollarSign width={20} height={20} color="#10B981" />,
          'Revenue',
          `$${service.formatNumber(metrics.totalRevenue)}`,
          metrics.performance.revenueGrowth,
          `$${service.formatNumber(metrics.projectedRevenue)} projected`,
          '#10B981'
        )}

        {renderMetricCard(
          <Target width={20} height={20} color="#3B82F6" />,
          'Completion',
          `${metrics.completionRate.toFixed(0)}%`,
          undefined,
          `${metrics.milestonesCompleted}/${metrics.milestonesTotal} milestones`,
          '#3B82F6'
        )}

        {!compact && renderMetricCard(
          <TrendingUp width={20} height={20} color="#8B5CF6" />,
          'Engagement',
          `${metrics.averageEngagement.toFixed(1)}%`,
          metrics.performance.engagementRate - metrics.averageEngagement,
          'Average rate',
          '#8B5CF6'
        )}
      </View>

      {/* Projections Chart */}
      {showProjections && renderProjectionChart()}

      {/* Progress Overview */}
      {renderProgressOverview()}

      {/* Engagement Metrics */}
      {!compact && renderEngagementMetrics()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
    minHeight: 200,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#430B92',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricCardCompact: {
    padding: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  metricTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  projectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 2,
  },
  timeframeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeframeButtonActive: {
    backgroundColor: '#430B92',
  },
  timeframeButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  timeframeButtonTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    minHeight: 200,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
    paddingHorizontal: 16,
  },
  chartBar: {
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 2,
    minHeight: 4,
  },
  actualBar: {
    backgroundColor: '#430B92',
  },
  projectedBar: {
    backgroundColor: '#A855F7',
    opacity: 0.7,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    color: '#374151',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#430B92',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#430B92',
    borderRadius: 4,
  },
  progressDetails: {
    gap: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  performanceItem: {
    alignItems: 'center',
    gap: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  performanceLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  engagementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  engagementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  engagementItem: {
    alignItems: 'center',
    gap: 4,
  },
  engagementValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  engagementLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  engagementSummary: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 4,
  },
  engagementSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  engagementSummarySubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
});