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
import { Theme } from '@/constants/Theme';
import { ActivityFeed } from '@/components/ActivityFeed';
import { AnalyticsWidget } from '@/components/AnalyticsWidget';
import { Button } from '@/components/ui/Button';

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
      route: '/',
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

          {/* Analytics Widget */}
          <AnalyticsWidget defaultExpanded={false} />
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

        {/* Activity Feed */}
        <View style={styles.activitySection}>
          <ActivityFeed 
            maxItems={5} 
            showViewAll={true}
            onViewAll={() => router.push('/notifications')}
            onActivityPress={(activity) => {
              // Navigate based on activity type
              if (activity.relatedType === 'deal') {
                router.push(`/deals/${activity.relatedId}`);
              } else if (activity.relatedType === 'campaign') {
                router.push(`/campaigns/${activity.relatedId}`);
              } else if (activity.relatedType === 'message') {
                router.push('/messages');
              }
            }}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            variant="primary"
            size="medium"
            icon="add-circle-outline"
            onPress={() => router.push('/campaigns/create')}
            style={styles.quickActionButton}
          >
            New Campaign
          </Button>
          
          <Button
            variant="secondary"
            size="medium"
            icon="search"
            onPress={() => router.push('/discover')}
            style={styles.quickActionButton}
          >
            Find Creators
          </Button>
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
});

export default Dashboard;