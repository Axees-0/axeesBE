import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalReach: 2456789,
      totalEngagement: 145623,
      totalConversions: 3421,
      roi: 324,
    },
    campaigns: [
      { name: 'Summer Fashion', reach: 450000, engagement: 34000, conversions: 890 },
      { name: 'Tech Launch', reach: 780000, engagement: 56000, conversions: 1200 },
      { name: 'Food Festival', reach: 320000, engagement: 28000, conversions: 650 },
    ],
    topPerformers: [
      { name: 'Alex Chen', platform: 'Instagram', engagement: 8.5 },
      { name: 'Sophia Style', platform: 'TikTok', engagement: 7.2 },
      { name: 'Mike Tech', platform: 'YouTube', engagement: 6.8 },
    ],
    platformBreakdown: [
      { platform: 'Instagram', percentage: 45, color: BrandColors.social.instagram },
      { platform: 'TikTok', percentage: 30, color: BrandColors.social.tiktok },
      { platform: 'YouTube', percentage: 20, color: BrandColors.social.youtube },
      { platform: 'Twitter', percentage: 5, color: BrandColors.social.twitter },
    ],
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <UniversalBackButton fallbackRoute="/" />
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color={BrandColors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['7d', '30d', '90d'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <LinearGradient
              colors={[BrandColors.primary[400], BrandColors.primary[500]]}
              style={styles.overviewGradient}
            >
              <Ionicons name="eye-outline" size={24} color={BrandColors.neutral[0]} />
              <Text style={styles.overviewValue}>{formatNumber(analyticsData.overview.totalReach)}</Text>
              <Text style={styles.overviewLabel}>Total Reach</Text>
            </LinearGradient>
          </View>

          <View style={styles.overviewCard}>
            <LinearGradient
              colors={[BrandColors.primary[500], BrandColors.primary[600]]}
              style={styles.overviewGradient}
            >
              <Ionicons name="heart-outline" size={24} color={BrandColors.neutral[0]} />
              <Text style={styles.overviewValue}>{formatNumber(analyticsData.overview.totalEngagement)}</Text>
              <Text style={styles.overviewLabel}>Engagement</Text>
            </LinearGradient>
          </View>

          <View style={styles.overviewCard}>
            <LinearGradient
              colors={[BrandColors.primary[600], BrandColors.primary[700]]}
              style={styles.overviewGradient}
            >
              <MaterialCommunityIcons name="target" size={24} color={BrandColors.neutral[0]} />
              <Text style={styles.overviewValue}>{formatNumber(analyticsData.overview.totalConversions)}</Text>
              <Text style={styles.overviewLabel}>Conversions</Text>
            </LinearGradient>
          </View>

          <View style={styles.overviewCard}>
            <LinearGradient
              colors={[BrandColors.primary[400], BrandColors.primary[600]]}
              style={styles.overviewGradient}
            >
              <MaterialCommunityIcons name="trending-up" size={24} color={BrandColors.neutral[0]} />
              <Text style={styles.overviewValue}>{analyticsData.overview.roi}%</Text>
              <Text style={styles.overviewLabel}>ROI</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Platform Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Performance</Text>
          <View style={styles.platformBreakdown}>
            {analyticsData.platformBreakdown.map((platform) => (
              <View key={platform.platform} style={styles.platformRow}>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformName}>{platform.platform}</Text>
                  <Text style={styles.platformPercentage}>{platform.percentage}%</Text>
                </View>
                <View style={styles.platformBarContainer}>
                  <View
                    style={[
                      styles.platformBar,
                      {
                        width: `${platform.percentage}%`,
                        backgroundColor: platform.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Campaign Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaign Performance</Text>
          {analyticsData.campaigns.map((campaign, index) => (
            <View key={index} style={styles.campaignCard}>
              <Text style={styles.campaignName}>{campaign.name}</Text>
              <View style={styles.campaignStats}>
                <View style={styles.campaignStat}>
                  <Text style={styles.campaignStatValue}>{formatNumber(campaign.reach)}</Text>
                  <Text style={styles.campaignStatLabel}>Reach</Text>
                </View>
                <View style={styles.campaignStat}>
                  <Text style={styles.campaignStatValue}>{formatNumber(campaign.engagement)}</Text>
                  <Text style={styles.campaignStatLabel}>Engagement</Text>
                </View>
                <View style={styles.campaignStat}>
                  <Text style={styles.campaignStatValue}>{campaign.conversions}</Text>
                  <Text style={styles.campaignStatLabel}>Conversions</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Creators</Text>
          {analyticsData.topPerformers.map((performer, index) => (
            <View key={index} style={styles.performerCard}>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{performer.name}</Text>
                <Text style={styles.performerPlatform}>{performer.platform}</Text>
              </View>
              <View style={styles.performerEngagement}>
                <Text style={styles.engagementValue}>{performer.engagement}%</Text>
                <Text style={styles.engagementLabel}>Engagement</Text>
              </View>
            </View>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    marginLeft: 16,
    fontFamily: DesignSystem.Typography.h2.fontFamily,
  },
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BrandColors.neutral[100],
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: BrandColors.primary[500],
  },
  periodText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  periodTextActive: {
    color: BrandColors.neutral[0],
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  overviewCard: {
    width: (screenWidth - 44) / 2,
  },
  overviewGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.neutral[0],
    marginTop: 12,
    marginBottom: 4,
    fontFamily: DesignSystem.Typography.h1.fontFamily,
  },
  overviewLabel: {
    fontSize: 14,
    color: BrandColors.neutral[0],
    opacity: 0.9,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    marginBottom: 16,
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  platformBreakdown: {
    backgroundColor: BrandColors.neutral[50],
    padding: 16,
    borderRadius: 12,
  },
  platformRow: {
    marginBottom: 16,
  },
  platformInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 14,
    color: BrandColors.neutral[700],
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  platformPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  platformBarContainer: {
    height: 8,
    backgroundColor: BrandColors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  platformBar: {
    height: '100%',
    borderRadius: 4,
  },
  campaignCard: {
    backgroundColor: BrandColors.neutral[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    marginBottom: 12,
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  campaignStat: {
    alignItems: 'center',
  },
  campaignStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.neutral[700],
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  campaignStatLabel: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    marginTop: 4,
    fontFamily: DesignSystem.Typography.small.fontFamily,
  },
  performerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BrandColors.neutral[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  performerPlatform: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    marginTop: 2,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  performerEngagement: {
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.primary[500],
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  engagementLabel: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    fontFamily: DesignSystem.Typography.small.fontFamily,
  },
});

export default AnalyticsPage;