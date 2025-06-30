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

interface AdminStats {
  totalUsers: number;
  totalCreators: number;
  totalMarketers: number;
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageDealValue: number;
  userGrowth: number;
  dealGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'deal_created' | 'deal_completed' | 'payment_processed';
  description: string;
  timestamp: string;
  userId?: string;
  dealId?: string;
}

const AdminDashboard: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access the admin dashboard.');
      router.replace('/');
      return;
    }
    
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/analytics/overview', {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        }),
        fetch('/api/admin/analytics/recent-activity?limit=10', {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        })
      ]);

      const [statsData, activityData] = await Promise.all([
        statsResponse.json(),
        activityResponse.json()
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (activityData.success) {
        setRecentActivity(activityData.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return '👤';
      case 'deal_created': return '🤝';
      case 'deal_completed': return '✅';
      case 'payment_processed': return '💰';
      default: return '📊';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Loading state
  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/" />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.cSK430B92500} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <WebSEO 
        title="Admin Dashboard | Axees"
        description="Administrative dashboard for managing users, deals, and platform analytics"
        keywords="admin, dashboard, analytics, user management"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/" />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.headerSpacer} />
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
          {/* Quick Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats ? formatNumber(stats.totalUsers) : '0'}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
                {stats && stats.userGrowth !== 0 && (
                  <Text style={[styles.statGrowth, stats.userGrowth > 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
                    {stats.userGrowth > 0 ? '+' : ''}{stats.userGrowth}%
                  </Text>
                )}
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats ? formatNumber(stats.totalDeals) : '0'}</Text>
                <Text style={styles.statLabel}>Total Deals</Text>
                {stats && stats.dealGrowth !== 0 && (
                  <Text style={[styles.statGrowth, stats.dealGrowth > 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
                    {stats.dealGrowth > 0 ? '+' : ''}{stats.dealGrowth}%
                  </Text>
                )}
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${stats ? formatNumber(stats.totalRevenue) : '0'}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${stats ? formatNumber(stats.averageDealValue) : '0'}</Text>
                <Text style={styles.statLabel}>Avg Deal Value</Text>
              </View>
            </View>
          </View>

          {/* User Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Breakdown</Text>
            
            <View style={styles.userBreakdown}>
              <View style={styles.userTypeCard}>
                <Text style={styles.userTypeValue}>{stats ? formatNumber(stats.totalCreators) : '0'}</Text>
                <Text style={styles.userTypeLabel}>Creators</Text>
                <View style={[styles.userTypeIndicator, { backgroundColor: Color.cSK430B92500 }]} />
              </View>
              
              <View style={styles.userTypeCard}>
                <Text style={styles.userTypeValue}>{stats ? formatNumber(stats.totalMarketers) : '0'}</Text>
                <Text style={styles.userTypeLabel}>Marketers</Text>
                <View style={[styles.userTypeIndicator, { backgroundColor: '#10B981' }]} />
              </View>
            </View>
          </View>

          {/* Deal Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deal Status</Text>
            
            <View style={styles.dealStatusGrid}>
              <View style={styles.dealStatusCard}>
                <Text style={styles.dealStatusValue}>{stats ? formatNumber(stats.activeDeals) : '0'}</Text>
                <Text style={styles.dealStatusLabel}>Active</Text>
                <View style={[styles.dealStatusIndicator, { backgroundColor: '#F59E0B' }]} />
              </View>
              
              <View style={styles.dealStatusCard}>
                <Text style={styles.dealStatusValue}>{stats ? formatNumber(stats.completedDeals) : '0'}</Text>
                <Text style={styles.dealStatusLabel}>Completed</Text>
                <View style={[styles.dealStatusIndicator, { backgroundColor: '#10B981' }]} />
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/admin/users')}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionText}>Manage Users</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/admin/deals')}
              >
                <Text style={styles.actionIcon}>🤝</Text>
                <Text style={styles.actionText}>Manage Deals</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/admin/analytics')}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            
            <View style={styles.activityList}>
              {recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityEmoji}>{getActivityIcon(activity.type)}</Text>
                  </View>
                  
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
              
              {recentActivity.length === 0 && (
                <Text style={styles.noActivityText}>No recent activity</Text>
              )}
            </View>
          </View>

          {/* Revenue Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Metrics</Text>
            
            <View style={styles.revenueCard}>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Monthly Revenue</Text>
                <Text style={styles.revenueValue}>${stats ? stats.monthlyRevenue.toLocaleString() : '0'}</Text>
              </View>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Total Revenue</Text>
                <Text style={styles.revenueValue}>${stats ? stats.totalRevenue.toLocaleString() : '0'}</Text>
              </View>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Average Deal Value</Text>
                <Text style={styles.revenueValue}>${stats ? stats.averageDealValue.toLocaleString() : '0'}</Text>
              </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statGrowth: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  positiveGrowth: {
    color: '#10B981',
  },
  negativeGrowth: {
    color: '#EF4444',
  },
  userBreakdown: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  userTypeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userTypeLabel: {
    fontSize: 14,
    color: '#666',
  },
  userTypeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    position: 'absolute',
    left: 16,
    top: 16,
  },
  dealStatusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  dealStatusCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  dealStatusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dealStatusLabel: {
    fontSize: 14,
    color: '#666',
  },
  dealStatusIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    position: 'absolute',
    left: 16,
    top: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  noActivityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  revenueCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
  },
});

export default AdminDashboard;