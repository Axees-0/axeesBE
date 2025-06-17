"use client";

import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Filter,
  Download,
  Settings
} from "lucide-react-native";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import { useSocialMediaLinks } from "@/utils/socialMediaLinksService";
import Toast from "react-native-toast-message";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function SocialMediaManager() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const { dealId, proofId, milestoneId } = useLocalSearchParams();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  const {
    links,
    isLoading,
    error,
    refreshLinks,
    service
  } = useSocialMediaLinks({
    dealId: dealId as string,
    proofId: proofId as string,
    milestoneId: milestoneId as string,
    userId: user?._id
  });

  const [analytics, setAnalytics] = useState({
    totalLinks: 0,
    publishedLinks: 0,
    draftLinks: 0,
    scheduledLinks: 0,
    platformBreakdown: [] as { platform: string; count: number }[]
  });

  // Load analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!dealId) return;
      
      try {
        const analyticsData = await service.getLinksAnalytics({
          dealId: dealId as string,
          proofId: proofId as string,
          milestoneId: milestoneId as string,
          userId: user?._id
        });
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };

    loadAnalytics();
  }, [links, dealId, proofId, milestoneId, user?._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLinks();
      Toast.show({
        type: 'success',
        text1: 'Refreshed',
        text2: 'Social media links updated',
        visibilityTime: 2000
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Failed to refresh social media links',
        visibilityTime: 3000
      });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredLinks = links.filter(link => {
    if (selectedFilter === 'all') return true;
    return link.status === selectedFilter;
  });

  const renderAnalyticsCard = () => (
    <View style={styles.analyticsCard}>
      <View style={styles.analyticsHeader}>
        <BarChart3 width={20} height={20} color="#430B92" />
        <Text style={styles.analyticsTitle}>Content Analytics</Text>
      </View>
      
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsNumber}>{analytics.totalLinks}</Text>
          <Text style={styles.analyticsLabel}>Total Posts</Text>
        </View>
        
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsNumber}>{analytics.publishedLinks}</Text>
          <Text style={styles.analyticsLabel}>Published</Text>
        </View>
        
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsNumber}>{analytics.draftLinks}</Text>
          <Text style={styles.analyticsLabel}>Drafts</Text>
        </View>
        
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsNumber}>{analytics.scheduledLinks}</Text>
          <Text style={styles.analyticsLabel}>Scheduled</Text>
        </View>
      </View>

      {analytics.platformBreakdown.length > 0 && (
        <View style={styles.platformBreakdown}>
          <Text style={styles.platformTitle}>Platform Breakdown</Text>
          {analytics.platformBreakdown.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.platformItem}>
              <Text style={styles.platformName}>{item.platform}</Text>
              <Text style={styles.platformCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['all', 'published', 'draft', 'scheduled'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter && styles.filterButtonTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
        <Download width={16} height={16} color="#430B92" />
        <Text style={styles.actionButtonText}>Refresh</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <Settings width={16} height={16} color="#430B92" />
        <Text style={styles.actionButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && links.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#430B92" />
          <Text style={styles.loadingText}>Loading social media posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Social Media Manager</Text>
        <TouchableOpacity
          style={styles.placeholder}
          onPress={() => router.push("/profile")}
        >
          <ProfileInfo />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={[
            styles.content,
            isWeb && isWideScreen && styles.webContainer,
          ]}
        >
          {/* Analytics Card */}
          {renderAnalyticsCard()}

          {/* Action Buttons */}
          {renderActionButtons()}

          {/* Filter Bar */}
          {renderFilterBar()}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Social Media Links Manager */}
          <View style={styles.linksSection}>
            <SocialMediaLinks
              dealId={dealId as string}
              proofId={proofId as string}
              milestoneId={milestoneId as string}
              links={filteredLinks}
              onLinksChange={() => {
                // Refresh analytics when links change
                setTimeout(() => {
                  const loadAnalytics = async () => {
                    try {
                      const analyticsData = await service.getLinksAnalytics({
                        dealId: dealId as string,
                        proofId: proofId as string,
                        milestoneId: milestoneId as string,
                        userId: user?._id
                      });
                      setAnalytics(analyticsData);
                    } catch (error) {
                      console.error('Failed to reload analytics:', error);
                    }
                  };
                  loadAnalytics();
                }, 1000);
              }}
              compact={false}
              allowEdit={true}
              title={`${selectedFilter === 'all' ? 'All' : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Posts`}
            />
          </View>

          {/* Empty State for Filtered Results */}
          {filteredLinks.length === 0 && links.length > 0 && (
            <View style={styles.emptyFilterState}>
              <Text style={styles.emptyFilterText}>
                No {selectedFilter} posts found
              </Text>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={styles.clearFilterText}>Show All Posts</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6C6C6C",
  },
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholder: {},
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  analyticsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  analyticsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  analyticsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  analyticsItem: {
    alignItems: "center",
  },
  analyticsNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#430B92",
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  platformBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  platformTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  platformItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  platformName: {
    fontSize: 12,
    color: "#6B7280",
  },
  platformCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#430B92",
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#430B92",
  },
  filterBar: {
    marginVertical: 8,
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterButtonActive: {
    backgroundColor: "#430B92",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
  },
  linksSection: {
    flex: 1,
  },
  emptyFilterState: {
    alignItems: "center",
    padding: 32,
  },
  emptyFilterText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  clearFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#430B92",
    borderRadius: 6,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});