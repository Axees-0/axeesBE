import React, { useState } from 'react';
import { 
  Platform, 
  useWindowDimensions, 
  ScrollView, 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from "react-native";
import { router } from 'expo-router';
import { WebSEO } from "../web-seo";
import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import { useAuth } from "@/contexts/AuthContext";
import RoleSwitcher from "@/components/RoleSwitcher";
import { useConfirmModal } from "@/components/ConfirmModal";
import { BrandColors } from '@/constants/Colors';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Feather, 
  MaterialIcons, 
  Ionicons, 
  FontAwesome5, 
  MaterialCommunityIcons,
  AntDesign,
  Entypo
} from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const BREAKPOINTS = {
  mobile: 768,
};

const ProfilePage = () => {
  const window = useWindowDimensions();
  const isWeb = Platform?.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;
  const { user, logout } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();

  const isCreator = user?.userType === 'creator';

  // Demo content based on role
  const profile = isCreator ? {
    fullName: 'Emma Thompson',
    email: 'emma@creativestudio.com',
    username: '@emmastyle',
    bio: 'Fashion & Lifestyle Creator | Helping brands tell their story authentically',
    followers: 45000,
    following: 892,
    posts: 324,
    engagementRate: 5.8,
    completedDeals: 23,
    activeDeals: 2,
    totalEarnings: 12450,
    availableBalance: 3280,
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    joinedDate: new Date('2023-03-15'),
    location: 'Los Angeles, CA',
    verified: true,
    coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
  } : {
    ...DemoData.marketerProfile,
    coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    followers: 156,
    following: 89,
    posts: 42,
  };

  const quickStats = isCreator ? [
    { icon: 'users', label: 'Followers', value: formatNumber(profile.followers), color: BrandColors.primary[500] },
    { icon: 'trending-up', label: 'Engagement', value: `${profile.engagementRate}%`, color: BrandColors.semantic.success },
    { icon: 'briefcase', label: 'Deals', value: profile.completedDeals.toString(), color: BrandColors.semantic.info },
    { icon: 'dollar-sign', label: 'Earnings', value: `$${formatNumber(profile.totalEarnings)}`, color: BrandColors.semantic.warning },
  ] : [
    { icon: 'users', label: 'Network', value: profile.followers.toString(), color: BrandColors.primary[500] },
    { icon: 'briefcase', label: 'Campaigns', value: profile.completedDeals.toString(), color: BrandColors.semantic.success },
    { icon: 'trending-up', label: 'Success', value: `${profile.successRate}%`, color: BrandColors.semantic.info },
    { icon: 'dollar-sign', label: 'Spent', value: `$${formatNumber(profile.balance)}`, color: BrandColors.semantic.warning },
  ];

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  const renderProfileContent = () => {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cover Image Section */}
        <View style={styles.coverSection}>
          <ImageBackground
            source={{ uri: profile.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
              style={styles.coverGradient}
            >
              <View style={styles.coverActions}>
                {DEMO_MODE && (
                  <TouchableOpacity 
                    style={styles.roleSwitchButton}
                    onPress={() => setShowRoleSwitcher(true)}
                  >
                    <Ionicons name="swap-horizontal" size={20} color={BrandColors.neutral[0]} />
                    <Text style={styles.roleSwitchText}>Switch Role</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.editCoverButton}>
                  <Feather name="camera" size={20} color={BrandColors.neutral[0]} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
          
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={24} color={BrandColors.primary[500]} />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Feather name="camera" size={16} color={BrandColors.neutral[0]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoSection}>
          <View style={styles.nameSection}>
            <Text style={styles.fullName}>{profile.fullName}</Text>
            <Text style={styles.username}>{profile.username}</Text>
          </View>
          
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={BrandColors.neutral[500]} />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={BrandColors.neutral[500]} />
              <Text style={styles.metaText}>Joined {profile.joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
            </View>
          </View>

          {/* Social Stats */}
          <View style={styles.socialStats}>
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{formatNumber(profile.posts)}</Text>
              <Text style={styles.socialStatLabel}>Posts</Text>
            </View>
            <View style={styles.socialStatDivider} />
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{formatNumber(profile.followers)}</Text>
              <Text style={styles.socialStatLabel}>Followers</Text>
            </View>
            <View style={styles.socialStatDivider} />
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{formatNumber(profile.following)}</Text>
              <Text style={styles.socialStatLabel}>Following</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.profileActions}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Feather name="edit-2" size={16} color={BrandColors.neutral[0]} />
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/settings')}
            >
              <Feather name="settings" size={16} color={BrandColors.primary[500]} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/profile/share')}
            >
              <Feather name="share-2" size={16} color={BrandColors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <TouchableOpacity key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                  <Feather name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Earnings Card for Creators */}
        {isCreator && (
          <TouchableOpacity 
            style={styles.earningsCard}
            onPress={() => router.push('/earnings')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[BrandColors.primary[500], BrandColors.primary[600]]}
              style={styles.earningsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.earningsContent}>
                <View style={styles.earningsInfo}>
                  <Text style={styles.earningsLabel}>Available Balance</Text>
                  <Text style={styles.earningsAmount}>${profile.availableBalance.toLocaleString()}</Text>
                  <Text style={styles.earningsSubtext}>Total Earned: ${profile.totalEarnings.toLocaleString()}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={40} color={BrandColors.neutral[0]} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {isCreator ? (
              <>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/deals')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialIcons name="local-offer" size={24} color="#1976D2" />
                  </View>
                  <Text style={styles.actionText}>Offers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/earnings')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                    <MaterialIcons name="account-balance-wallet" size={24} color="#F57C00" />
                  </View>
                  <Text style={styles.actionText}>Earnings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/profile/mediakit')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                    <MaterialIcons name="pie-chart" size={24} color="#7B1FA2" />
                  </View>
                  <Text style={styles.actionText}>Media Kit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/payments/creator')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialIcons name="payment" size={24} color="#388E3C" />
                  </View>
                  <Text style={styles.actionText}>Payments</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialIcons name="search" size={24} color="#1976D2" />
                  </View>
                  <Text style={styles.actionText}>Find</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/deals')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                    <MaterialIcons name="send" size={24} color="#F57C00" />
                  </View>
                  <Text style={styles.actionText}>Offers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/campaigns')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                    <MaterialIcons name="campaign" size={24} color="#7B1FA2" />
                  </View>
                  <Text style={styles.actionText}>Campaigns</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/payments/marketer')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialIcons name="payment" size={24} color="#388E3C" />
                  </View>
                  <Text style={styles.actionText}>Payments</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/settings/notifications')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color={BrandColors.neutral[700]} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BrandColors.neutral[400]} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/settings/privacy')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark-outline" size={22} color={BrandColors.neutral[700]} />
                <Text style={styles.settingText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BrandColors.neutral[400]} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/settings/help')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={22} color={BrandColors.neutral[700]} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BrandColors.neutral[400]} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem, styles.lastSettingItem]}
              onPress={() => {
                showConfirm(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Logout', 
                      style: 'destructive',
                      onPress: () => {
                        logout();
                        router.replace('/login');
                      }
                    }
                  ]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={[styles.settingText, { color: '#EF4444' }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  return (
    <>
      <WebSEO 
        title={`${user?.name || 'Profile'} - Axees`}
        description={`Manage your Axees ${isCreator ? 'creator' : 'marketer'} profile, view performance metrics, and configure account settings.`}
        keywords={`profile, account settings, ${isCreator ? 'creator dashboard, earnings' : 'marketer dashboard, campaigns'}`}
      />
      {renderProfileContent()}
      
      {DEMO_MODE && (
        <RoleSwitcher 
          visible={showRoleSwitcher}
          onClose={() => setShowRoleSwitcher(false)}
        />
      )}
      
      <ConfirmModalComponent />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[50],
  },
  coverSection: {
    position: 'relative',
    height: 200,
    backgroundColor: BrandColors.neutral[200],
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    flex: 1,
    padding: 16,
  },
  coverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleSwitchText: {
    color: BrandColors.neutral[0],
    fontSize: 14,
    fontWeight: '500',
  },
  editCoverButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -60,
    left: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: BrandColors.neutral[0],
    backgroundColor: BrandColors.neutral[200],
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 12,
    padding: 2,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: BrandColors.primary[500],
    padding: 8,
    borderRadius: 20,
  },
  profileInfoSection: {
    padding: 24,
    paddingTop: 70,
    backgroundColor: BrandColors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  nameSection: {
    marginBottom: 12,
  },
  fullName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandColors.neutral[900],
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: BrandColors.neutral[500],
  },
  bio: {
    fontSize: 15,
    color: BrandColors.neutral[700],
    lineHeight: 22,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
  },
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BrandColors.neutral[100],
  },
  socialStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  socialStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.neutral[900],
    marginBottom: 4,
  },
  socialStatLabel: {
    fontSize: 13,
    color: BrandColors.neutral[500],
  },
  socialStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: BrandColors.neutral[200],
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
    backgroundColor: BrandColors.neutral[0],
  },
  statsSection: {
    padding: 24,
    backgroundColor: BrandColors.neutral[0],
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.neutral[900],
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: BrandColors.neutral[50],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.neutral[100],
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.neutral[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: BrandColors.neutral[500],
  },
  earningsCard: {
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  earningsGradient: {
    padding: 20,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandColors.neutral[0],
    marginBottom: 4,
  },
  earningsSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  quickActionsSection: {
    padding: 24,
    backgroundColor: BrandColors.neutral[0],
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: BrandColors.neutral[700],
    textAlign: 'center',
  },
  settingsSection: {
    padding: 24,
    paddingTop: 0,
  },
  settingsCard: {
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BrandColors.neutral[100],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: BrandColors.neutral[700],
  },
});

export default ProfilePage;