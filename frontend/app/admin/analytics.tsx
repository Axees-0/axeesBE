import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCreators: number;
    totalMarketers: number;
    totalDeals: number;
    totalRevenue: number;
    averageDealValue: number;
    platformFee: number;
    userGrowthRate: number;
    dealGrowthRate: number;
    revenueGrowthRate: number;
  };
  userMetrics: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    userRetentionRate: number;
    averageSessionDuration: number;
    newUsersThisMonth: number;
    churnRate: number;
  };
  dealMetrics: {
    completionRate: number;
    averageCompletionTime: number;
    disputeRate: number;
    cancelationRate: number;
    successfulDealsThisMonth: number;
    averageNegotiationRounds: number;
  };
  revenueMetrics: {
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    totalCommissionsEarned: number;
    payoutSuccessRate: number;
    averagePayoutTime: number;
  };
  platformMetrics: {
    topPerformingCategories: Array<{
      category: string;
      dealCount: number;
      revenue: number;
    }>;
    topCreators: Array<{
      id: string;
      name: string;
      totalEarnings: number;
      dealCount: number;
      rating: number;
    }>;
    topMarketers: Array<{
      id: string;
      name: string;
      company: string;
      totalSpent: number;
      dealCount: number;
      rating: number;
    }>;
  };
  timeSeriesData: {
    userGrowth: Array<{
      date: string;
      users: number;
      creators: number;
      marketers: number;
    }>;
    revenueGrowth: Array<{
      date: string;
      revenue: number;
      deals: number;
    }>;
  };
}

const AdminAnalyticsPage: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }
    
    fetchAnalytics();
  }, [user, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [overviewResponse, userMetricsResponse, dealMetricsResponse, revenueMetricsResponse, platformMetricsResponse] = await Promise.all([
        fetch(`/api/admin/analytics/overview?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        }),
        fetch(`/api/admin/analytics/users?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        }),
        fetch(`/api/admin/analytics/deals?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        }),
        fetch(`/api/admin/analytics/revenue?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        }),
        fetch(`/api/admin/analytics/platform?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        })
      ]);

      const [overviewData, userMetricsData, dealMetricsData, revenueMetricsData, platformMetricsData] = await Promise.all([
        overviewResponse.json(),
        userMetricsResponse.json(),
        dealMetricsResponse.json(),
        revenueMetricsResponse.json(),
        platformMetricsResponse.json()
      ]);

      if (overviewData.success && userMetricsData.success && dealMetricsData.success && revenueMetricsData.success && platformMetricsData.success) {
        setAnalyticsData({
          overview: overviewData.data,
          userMetrics: userMetricsData.data,
          dealMetrics: dealMetricsData.data,
          revenueMetrics: revenueMetricsData.data,
          platformMetrics: platformMetricsData.data,
          timeSeriesData: platformMetricsData.data.timeSeriesData || { userGrowth: [], revenueGrowth: [] }
        });
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${(minutes / 60).toFixed(1)}h`;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? '#10B981' : '#EF4444';
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? '↗️' : '↘️';
  };

  // Loading state
  if (loading && !analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/admin" />
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.cSK430B92500} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <WebSEO 
        title="Analytics | Admin | Axees"
        description="Comprehensive platform analytics and metrics dashboard"
        keywords="admin, analytics, metrics, revenue, user growth"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/admin" />
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['7d', '30d', '90d', '1y'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.periodButton, selectedPeriod === period && styles.activePeriodButton]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[styles.periodText, selectedPeriod === period && styles.activePeriodText]}>
                  {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Color.cSK430B92500]}
            />
          }
        >
          {/* Overview Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsData ? formatNumber(analyticsData.overview.totalUsers) : '0'}</Text>
                <Text style={styles.metricLabel}>Total Users</Text>
                <View style={styles.metricGrowth}>
                  <Text style={[styles.growthText, { color: getGrowthColor(analyticsData?.overview.userGrowthRate || 0) }]}>
                    {getGrowthIcon(analyticsData?.overview.userGrowthRate || 0)} {formatPercentage(analyticsData?.overview.userGrowthRate || 0)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsData ? formatNumber(analyticsData.overview.totalDeals) : '0'}</Text>
                <Text style={styles.metricLabel}>Total Deals</Text>
                <View style={styles.metricGrowth}>
                  <Text style={[styles.growthText, { color: getGrowthColor(analyticsData?.overview.dealGrowthRate || 0) }]}>
                    {getGrowthIcon(analyticsData?.overview.dealGrowthRate || 0)} {formatPercentage(analyticsData?.overview.dealGrowthRate || 0)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsData ? formatCurrency(analyticsData.overview.totalRevenue) : '$0'}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <View style={styles.metricGrowth}>
                  <Text style={[styles.growthText, { color: getGrowthColor(analyticsData?.overview.revenueGrowthRate || 0) }]}>
                    {getGrowthIcon(analyticsData?.overview.revenueGrowthRate || 0)} {formatPercentage(analyticsData?.overview.revenueGrowthRate || 0)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsData ? formatCurrency(analyticsData.overview.averageDealValue) : '$0'}</Text>
                <Text style={styles.metricLabel}>Avg Deal Value</Text>
              </View>
            </View>
          </View>

          {/* User Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Metrics</Text>
            
            <View style={styles.userMetricsGrid}>
              <View style={styles.userBreakdownCard}>
                <Text style={styles.breakdownTitle}>User Breakdown</Text>
                <View style={styles.userBreakdownRow}>
                  <Text style={styles.userTypeLabel}>Creators</Text>
                  <Text style={styles.userTypeValue}>{analyticsData ? formatNumber(analyticsData.overview.totalCreators) : '0'}</Text>
                </View>
                <View style={styles.userBreakdownRow}>
                  <Text style={styles.userTypeLabel}>Marketers</Text>
                  <Text style={styles.userTypeValue}>{analyticsData ? formatNumber(analyticsData.overview.totalMarketers) : '0'}</Text>
                </View>
              </View>
              
              <View style={styles.activityCard}>
                <Text style={styles.breakdownTitle}>Activity</Text>
                <View style={styles.activityRow}>
                  <Text style={styles.activityLabel}>Daily Active</Text>
                  <Text style={styles.activityValue}>{analyticsData ? formatNumber(analyticsData.userMetrics.dailyActiveUsers) : '0'}</Text>
                </View>
                <View style={styles.activityRow}>
                  <Text style={styles.activityLabel}>Monthly Active</Text>
                  <Text style={styles.activityValue}>{analyticsData ? formatNumber(analyticsData.userMetrics.monthlyActiveUsers) : '0'}</Text>
                </View>
                <View style={styles.activityRow}>
                  <Text style={styles.activityLabel}>Avg Session</Text>
                  <Text style={styles.activityValue}>{analyticsData ? formatDuration(analyticsData.userMetrics.averageSessionDuration) : '0m'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.retentionMetrics}>
              <View style={styles.retentionCard}>
                <Text style={styles.retentionValue}>{analyticsData ? formatPercentage(analyticsData.userMetrics.userRetentionRate) : '0%'}</Text>
                <Text style={styles.retentionLabel}>Retention Rate</Text>
              </View>
              
              <View style={styles.retentionCard}>
                <Text style={styles.retentionValue}>{analyticsData ? formatNumber(analyticsData.userMetrics.newUsersThisMonth) : '0'}</Text>
                <Text style={styles.retentionLabel}>New Users</Text>
              </View>
              
              <View style={styles.retentionCard}>
                <Text style={styles.retentionValue}>{analyticsData ? formatPercentage(analyticsData.userMetrics.churnRate) : '0%'}</Text>
                <Text style={styles.retentionLabel}>Churn Rate</Text>
              </View>
            </View>
          </View>

          {/* Deal Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deal Performance</Text>
            
            <View style={styles.dealMetricsGrid}>
              <View style={styles.dealMetricCard}>
                <Text style={styles.dealMetricValue}>{analyticsData ? formatPercentage(analyticsData.dealMetrics.completionRate) : '0%'}</Text>
                <Text style={styles.dealMetricLabel}>Completion Rate</Text>
              </View>
              
              <View style={styles.dealMetricCard}>
                <Text style={styles.dealMetricValue}>{analyticsData ? `${analyticsData.dealMetrics.averageCompletionTime}d` : '0d'}</Text>
                <Text style={styles.dealMetricLabel}>Avg Completion</Text>
              </View>
              
              <View style={styles.dealMetricCard}>
                <Text style={styles.dealMetricValue}>{analyticsData ? formatPercentage(analyticsData.dealMetrics.disputeRate) : '0%'}</Text>
                <Text style={styles.dealMetricLabel}>Dispute Rate</Text>
              </View>
              
              <View style={styles.dealMetricCard}>
                <Text style={styles.dealMetricValue}>{analyticsData ? formatNumber(analyticsData.dealMetrics.successfulDealsThisMonth) : '0'}</Text>
                <Text style={styles.dealMetricLabel}>This Month</Text>
              </View>
            </View>
          </View>

          {/* Revenue Analytics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Analytics</Text>
            
            <View style={styles.revenueGrid}>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueValue}>{analyticsData ? formatCurrency(analyticsData.revenueMetrics.monthlyRecurringRevenue) : '$0'}</Text>
                <Text style={styles.revenueLabel}>Monthly Revenue</Text>
              </View>
              
              <View style={styles.revenueCard}>
                <Text style={styles.revenueValue}>{analyticsData ? formatCurrency(analyticsData.revenueMetrics.averageRevenuePerUser) : '$0'}</Text>
                <Text style={styles.revenueLabel}>ARPU</Text>
              </View>
              
              <View style={styles.revenueCard}>
                <Text style={styles.revenueValue}>{analyticsData ? formatCurrency(analyticsData.revenueMetrics.totalCommissionsEarned) : '$0'}</Text>
                <Text style={styles.revenueLabel}>Platform Fees</Text>
              </View>
              
              <View style={styles.revenueCard}>
                <Text style={styles.revenueValue}>{analyticsData ? formatPercentage(analyticsData.revenueMetrics.payoutSuccessRate) : '0%'}</Text>
                <Text style={styles.revenueLabel}>Payout Success</Text>
              </View>
            </View>
          </View>

          {/* Top Performers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            
            <View style={styles.performersSection}>
              <View style={styles.performerCategory}>
                <Text style={styles.performerCategoryTitle}>Top Creators</Text>
                {analyticsData?.platformMetrics.topCreators.slice(0, 5).map((creator, index) => (
                  <View key={creator.id} style={styles.performerRow}>
                    <Text style={styles.performerRank}>#{index + 1}</Text>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{creator.name}</Text>
                      <Text style={styles.performerDetail}>{formatCurrency(creator.totalEarnings)} • {creator.dealCount} deals</Text>
                    </View>
                    <Text style={styles.performerRating}>⭐ {creator.rating.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.performerCategory}>
                <Text style={styles.performerCategoryTitle}>Top Marketers</Text>
                {analyticsData?.platformMetrics.topMarketers.slice(0, 5).map((marketer, index) => (
                  <View key={marketer.id} style={styles.performerRow}>
                    <Text style={styles.performerRank}>#{index + 1}</Text>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{marketer.name}</Text>
                      <Text style={styles.performerDetail}>{marketer.company} • {formatCurrency(marketer.totalSpent)}</Text>
                    </View>
                    <Text style={styles.performerRating}>⭐ {marketer.rating.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Platform Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            
            <View style={styles.categoriesList}>
              {analyticsData?.platformMetrics.topPerformingCategories.map((category, index) => (
                <View key={category.category} style={styles.categoryRow}>
                  <Text style={styles.categoryRank}>#{index + 1}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <Text style={styles.categoryDetails}>{category.dealCount} deals • {formatCurrency(category.revenue)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={4} />}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  periodSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  activePeriodButton: {
    backgroundColor: Color.cSK430B92500,
    borderColor: Color.cSK430B92500,
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  activePeriodText: {
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricGrowth: {
    alignSelf: 'center',
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  userBreakdownCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  userBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userTypeLabel: {
    fontSize: 12,
    color: '#666',
  },
  userTypeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Color.cSK430B92500,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
  },
  activityValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  retentionMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  retentionCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  retentionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  retentionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dealMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dealMetricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dealMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  dealMetricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  revenueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  performersSection: {
    gap: 20,
  },
  performerCategory: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  performerCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  performerRank: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    width: 24,
  },
  performerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  performerDetail: {
    fontSize: 12,
    color: '#666',
  },
  performerRating: {
    fontSize: 12,
    color: '#666',
  },
  categoriesList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  categoryRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    width: 32,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryDetails: {
    fontSize: 12,
    color: '#666',
  },
});

export default AdminAnalyticsPage;