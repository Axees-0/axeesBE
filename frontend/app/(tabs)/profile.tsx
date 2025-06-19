import React, { useState } from 'react';
import { 
  Platform, 
  useWindowDimensions, 
  ScrollView, 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from 'expo-router';
import { WebSEO } from "../web-seo";
import { Color } from "@/GlobalStyles";
import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import { useAuth } from "@/contexts/AuthContext";
import RoleSwitcher from "@/components/RoleSwitcher";

const BREAKPOINTS = {
  mobile: 768,
};

const ProfilePage = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;
  const { user, logout } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const isCreator = user?.userType === 'creator';

  // Demo content based on role
  const renderDemoProfile = () => {
    const profile = isCreator ? {
      fullName: 'Emma Thompson',
      email: 'emma@creativestudio.com',
      username: '@emmastyle',
      followers: 45000,
      engagementRate: 5.8,
      completedDeals: 23,
      activeDeals: 2,
      totalEarnings: 12450,
      availableBalance: 3280,
      platforms: ['Instagram', 'TikTok'],
      joinedDate: new Date('2023-03-15'),
    } : DemoData.marketerProfile;
    
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {DEMO_MODE && (
            <TouchableOpacity 
              style={styles.roleSwitchButton}
              onPress={() => setShowRoleSwitcher(true)}
              testID="role-switcher-button"
              accessibilityRole="button"
              accessibilityLabel="Switch Role"
            >
              <Text style={styles.roleSwitchButtonText}>🔄 Switch Role</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.fullName.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            {isCreator ? (
              <>
                <Text style={styles.username}>{profile.username}</Text>
                <View style={styles.platformTags}>
                  {profile.platforms.map((platform, index) => (
                    <View key={index} style={styles.platformTag}>
                      <Text style={styles.platformTagText}>{platform}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.company}>{profile.company}</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{profile.tier} Member</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          {isCreator ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(profile.followers / 1000).toFixed(1)}K</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.engagementRate}%</Text>
                <Text style={styles.statLabel}>Engagement</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.completedDeals}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.activeDeals}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${profile.balance.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Balance</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.completedDeals}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.activeDeals}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.successRate}%</Text>
                <Text style={styles.statLabel}>Success</Text>
              </View>
            </>
          )}
        </View>

        {isCreator && (
          <TouchableOpacity 
            style={styles.earningsCard}
            onPress={() => router.push('/earnings')}
          >
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>Available Balance</Text>
              <Text style={styles.earningsAmount}>${profile.availableBalance.toLocaleString()}</Text>
              <Text style={styles.earningsSubtext}>Total Earned: ${profile.totalEarnings.toLocaleString()}</Text>
            </View>
            <Text style={styles.earningsArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {isCreator ? (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/deals')}
                >
                  <Text style={styles.actionIcon}>📋</Text>
                  <Text style={styles.actionText}>View Offers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/earnings')}
                >
                  <Text style={styles.actionIcon}>💰</Text>
                  <Text style={styles.actionText}>Earnings</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/profile/edit')}
                >
                  <Text style={styles.actionIcon}>✏️</Text>
                  <Text style={styles.actionText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/profile/mediakit')}
                >
                  <Text style={styles.actionIcon}>📊</Text>
                  <Text style={styles.actionText}>Media Kit</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.actionIcon}>🔍</Text>
                  <Text style={styles.actionText}>Find Creators</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/deals')}
                >
                  <Text style={styles.actionIcon}>📤</Text>
                  <Text style={styles.actionText}>Sent Offers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/analytics')}
                >
                  <Text style={styles.actionIcon}>📈</Text>
                  <Text style={styles.actionText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/payments/marketer')}
                >
                  <Text style={styles.actionIcon}>💳</Text>
                  <Text style={styles.actionText}>Payments</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{isCreator ? 'Content Creator' : 'Brand Marketer'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{profile.joinedDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoValue, styles.activeStatus]}>Active</Text>
          </View>
          {isCreator ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg. Response Time</Text>
              <Text style={styles.infoValue}>2 hours</Text>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg. Deal Value</Text>
              <Text style={styles.infoValue}>${profile.avgDealValue.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/settings/notifications')}
          >
            <Text style={styles.settingLabel}>Notification Preferences</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/settings/privacy')}
          >
            <Text style={styles.settingLabel}>Privacy Settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/settings/security')}
          >
            <Text style={styles.settingLabel}>Account Security</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/settings/help')}
          >
            <Text style={styles.settingLabel}>Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
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
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

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
      {renderDemoProfile()}
      
      {DEMO_MODE && (
        <RoleSwitcher 
          visible={showRoleSwitcher}
          onClose={() => setShowRoleSwitcher(false)}
        />
      )}
      
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  roleSwitchButton: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleSwitchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Color.cSK430B92500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '600',
    marginBottom: 8,
  },
  company: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  platformTags: {
    flexDirection: 'row',
    gap: 8,
  },
  platformTag: {
    backgroundColor: '#E8D5FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformTagText: {
    fontSize: 12,
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
  tierBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statItem: {
    backgroundColor: 'white',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  earningsCard: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  earningsSubtext: {
    fontSize: 12,
    color: '#FFFFFF80',
  },
  earningsArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
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
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  activeStatus: {
    color: '#10B981',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 20,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfilePage;