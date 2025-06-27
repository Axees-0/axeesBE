import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform, 
  useWindowDimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { DemoData } from '@/demo/DemoData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Feather, 
  MaterialIcons, 
  Ionicons, 
  FontAwesome5, 
  MaterialCommunityIcons,
  AntDesign,
  Octicons
} from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';

const Dashboard = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock user data - in production, this would come from useAuth
  const userData = {
    name: user?.fullName || 'Sarah Martinez',
    role: user?.userType || 'Marketing Manager',
    avatar: user?.avatarUrl || require('@/assets/empty-image.png'),
    stats: {
      totalCampaigns: 24,
      activeInfluencers: 156,
      totalSpend: '$125,400',
      avgEngagement: '8.7%'
    }
  };

  // Navigation items matching the design
  const menuItems = [
    {
      id: 'discover',
      title: 'Discover Creators',
      subtitle: 'Find perfect matches for your brand',
      icon: <Feather name="search" size={24} color="#430B92" />,
      route: '/discover',
      color: '#430B92'
    },
    {
      id: 'campaigns',
      title: 'My Campaigns',
      subtitle: 'Manage active collaborations',
      icon: <MaterialCommunityIcons name="rocket-launch" size={24} color="#10B981" />,
      route: '/campaigns',
      color: '#10B981'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Track performance metrics',
      icon: <Ionicons name="analytics" size={24} color="#F59E0B" />,
      route: '/analytics',
      color: '#F59E0B'
    },
    {
      id: 'payments',
      title: 'Payments',
      subtitle: 'Manage transactions',
      icon: <MaterialIcons name="payment" size={24} color="#3B82F6" />,
      route: '/payments',
      color: '#3B82F6'
    },
    {
      id: 'creative',
      title: 'Creative Tools',
      subtitle: 'Content creation resources',
      icon: <MaterialCommunityIcons name="palette" size={24} color="#8B5CF6" />,
      route: '/creative',
      color: '#8B5CF6'
    },
    {
      id: 'network',
      title: 'My Network',
      subtitle: 'Saved creators & contacts',
      icon: <MaterialCommunityIcons name="account-group" size={24} color="#EC4899" />,
      route: '/network',
      color: '#EC4899'
    }
  ];

  // Recent activity data
  const recentActivity = [
    {
      id: '1',
      type: 'campaign',
      title: 'Summer Fashion Campaign',
      subtitle: '12 creators responded',
      time: '2 hours ago',
      icon: <MaterialCommunityIcons name="tshirt-crew" size={20} color="#10B981" />
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment sent to @alexcreates',
      subtitle: '$2,500 for Tech Review',
      time: '5 hours ago',
      icon: <MaterialIcons name="attach-money" size={20} color="#3B82F6" />
    },
    {
      id: '3',
      type: 'message',
      title: 'New message from @sophiastyle',
      subtitle: 'Interested in beauty collab',
      time: '1 day ago',
      icon: <Ionicons name="chatbubble-ellipses" size={20} color="#8B5CF6" />
    }
  ];

  const handleMenuItemPress = (route: string) => {
    // Navigate to the route
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={userData.avatar}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userRole}>{userData.role}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statsContainer}
            contentContainerStyle={styles.statsContent}
          >
            <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
              <MaterialCommunityIcons name="briefcase-outline" size={20} color="#6B7280" />
              <Text style={styles.statValue}>{userData.stats.totalCampaigns}</Text>
              <Text style={styles.statLabel}>Campaigns</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#EDE9FE' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="#8B5CF6" />
              <Text style={styles.statValue}>{userData.stats.activeInfluencers}</Text>
              <Text style={styles.statLabel}>Influencers</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
              <MaterialIcons name="attach-money" size={20} color="#3B82F6" />
              <Text style={styles.statValue}>{userData.stats.totalSpend}</Text>
              <Text style={styles.statLabel}>Total Spend</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.statValue}>{userData.stats.avgEngagement}</Text>
              <Text style={styles.statLabel}>Avg Engagement</Text>
            </View>
          </ScrollView>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Quick Search</Text>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search creators, campaigns, or analytics..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Main Menu</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => handleMenuItemPress(item.route)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[`${item.color}10`, `${item.color}05`]}
                  style={styles.menuCardGradient}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
                    {item.icon}
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivity.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#F3F4F6' }]}>
                {activity.icon}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/campaigns/create')}
          >
            <LinearGradient
              colors={['#430B92', '#6B3AAC']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>New Campaign</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/discover')}
          >
            <LinearGradient
              colors={['#10B981', '#34D399']}
              style={styles.quickActionGradient}
            >
              <MaterialCommunityIcons name="account-search" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Find Creators</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  statsContainer: {
    marginHorizontal: -20,
  },
  statsContent: {
    paddingHorizontal: 20,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  menuCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  menuCardGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#430B92',
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: DesignSystem.Typography.small.fontFamily,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
});

export default Dashboard;