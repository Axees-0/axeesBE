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
import { BrandColors } from '@/constants/Colors';

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
      icon: <Feather name="search" size={24} color={BrandColors.primary[500]} />,
      route: '/discover',
      color: BrandColors.primary[500]
    },
    {
      id: 'campaigns',
      title: 'My Campaigns',
      subtitle: 'Manage active collaborations',
      icon: <MaterialCommunityIcons name="rocket-launch" size={24} color={BrandColors.semantic.success} />,
      route: '/campaigns',
      color: BrandColors.semantic.success
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Track performance metrics',
      icon: <Ionicons name="analytics" size={24} color={BrandColors.semantic.warning} />,
      route: '/analytics',
      color: BrandColors.semantic.warning
    },
    {
      id: 'payments',
      title: 'Payments',
      subtitle: 'Manage transactions',
      icon: <MaterialIcons name="payment" size={24} color={BrandColors.semantic.info} />,
      route: '/payments',
      color: BrandColors.semantic.info
    },
    {
      id: 'creative',
      title: 'Creative Tools',
      subtitle: 'Content creation resources',
      icon: <MaterialCommunityIcons name="palette" size={24} color={BrandColors.primary[400]} />,
      route: '/creative',
      color: BrandColors.primary[400]
    },
    {
      id: 'network',
      title: 'My Network',
      subtitle: 'Saved creators & contacts',
      icon: <MaterialCommunityIcons name="account-group" size={24} color={BrandColors.primary[300]} />,
      route: '/network',
      color: BrandColors.primary[300]
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
      icon: <MaterialCommunityIcons name="tshirt-crew" size={20} color={BrandColors.semantic.success} />
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment sent to @alexcreates',
      subtitle: '$2,500 for Tech Review',
      time: '5 hours ago',
      icon: <MaterialIcons name="attach-money" size={20} color={BrandColors.semantic.info} />
    },
    {
      id: '3',
      type: 'message',
      title: 'New message from @sophiastyle',
      subtitle: 'Interested in beauty collab',
      time: '1 day ago',
      icon: <Ionicons name="chatbubble-ellipses" size={20} color={BrandColors.primary[400]} />
    }
  ];

  const handleMenuItemPress = (route: string) => {
    // Navigate to the route
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BrandColors.neutral[0]} />
      
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
              <Ionicons name="notifications-outline" size={24} color={BrandColors.neutral[800]} />
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
            <View style={[styles.statCard, { backgroundColor: BrandColors.neutral[100] }]}>
              <MaterialCommunityIcons name="briefcase-outline" size={20} color={BrandColors.neutral[500]} />
              <Text style={styles.statValue}>{userData.stats.totalCampaigns}</Text>
              <Text style={styles.statLabel}>Campaigns</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: BrandColors.primary[100] }]}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color={BrandColors.primary[400]} />
              <Text style={styles.statValue}>{userData.stats.activeInfluencers}</Text>
              <Text style={styles.statLabel}>Influencers</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: BrandColors.semantic.infoLight }]}>
              <MaterialIcons name="attach-money" size={20} color={BrandColors.semantic.info} />
              <Text style={styles.statValue}>{userData.stats.totalSpend}</Text>
              <Text style={styles.statLabel}>Total Spend</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: BrandColors.semantic.successLight }]}>
              <Ionicons name="trending-up" size={20} color={BrandColors.semantic.success} />
              <Text style={styles.statValue}>{userData.stats.avgEngagement}</Text>
              <Text style={styles.statLabel}>Avg Engagement</Text>
            </View>
          </ScrollView>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Quick Search</Text>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={BrandColors.neutral[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search creators, campaigns, or analytics..."
              placeholderTextColor={BrandColors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={BrandColors.neutral[400]} />
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
              <View style={[styles.activityIcon, { backgroundColor: BrandColors.neutral[100] }]}>
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
              colors={[BrandColors.primary[500], BrandColors.primary[400]]}
              style={styles.quickActionGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color={BrandColors.neutral[0]} />
              <Text style={styles.quickActionText}>New Campaign</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/discover')}
          >
            <LinearGradient
              colors={[BrandColors.semantic.success, BrandColors.semantic.successDark]}
              style={styles.quickActionGradient}
            >
              <MaterialCommunityIcons name="account-search" size={24} color={BrandColors.neutral[0]} />
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
    backgroundColor: BrandColors.neutral[0],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: BrandColors.neutral[0],
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
    color: BrandColors.neutral[900],
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  userRole: {
    fontSize: 14,
    color: BrandColors.neutral[500],
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
    backgroundColor: BrandColors.semantic.error,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: BrandColors.neutral[0],
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
    color: BrandColors.neutral[900],
    marginTop: 8,
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: BrandColors.neutral[500],
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
    color: BrandColors.neutral[900],
    marginBottom: 12,
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: BrandColors.neutral[900],
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
    borderColor: BrandColors.neutral[200],
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
    color: BrandColors.neutral[900],
    marginBottom: 4,
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  menuSubtitle: {
    fontSize: 13,
    color: BrandColors.neutral[500],
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
    color: BrandColors.primary[500],
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
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
    color: BrandColors.neutral[900],
    marginBottom: 2,
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  activitySubtitle: {
    fontSize: 13,
    color: BrandColors.neutral[500],
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  activityTime: {
    fontSize: 12,
    color: BrandColors.neutral[400],
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
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
});

export default Dashboard;