import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import { Fragment } from "react";
import { Platform, useWindowDimensions, ScrollView, View, Text, StyleSheet } from "react-native";
import { WebSEO } from "../web-seo";
import { Color } from "@/GlobalStyles";

const BREAKPOINTS = {
  mobile: 768,
};

const ProfilePage = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  // Demo content for profile
  const renderDemoProfile = () => {
    const profile = DemoData.marketerProfile;
    
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.fullName.split(' ').map(n => n[0]).join('')}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.company}>{profile.company}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{profile.tier} Member</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${profile.balance.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Account Balance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.completedDeals}</Text>
            <Text style={styles.statLabel}>Completed Deals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.activeDeals}</Text>
            <Text style={styles.statLabel}>Active Campaigns</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.successRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average Deal Value</Text>
            <Text style={styles.metricValue}>${profile.avgDealValue.toLocaleString()}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Spent</Text>
            <Text style={styles.metricValue}>${profile.totalSpent.toLocaleString()}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Member Since</Text>
            <Text style={styles.metricValue}>{profile.joinedDate.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingValue}>Enabled</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-Approve Applications</Text>
            <Text style={styles.settingValue}>Disabled</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Payment Method</Text>
            <Text style={styles.settingValue}>•••• 4567</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      <WebSEO 
        title="Profile - Axees"
        description="Manage your Axees profile, view performance metrics, and configure account settings."
        keywords="profile, account settings, performance metrics, user dashboard"
      />
      {renderDemoProfile()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 24,
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
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  tierBadge: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  tierText: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default ProfilePage;