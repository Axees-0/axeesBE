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
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Settings,
  Download,
  Share2,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  Target,
  DollarSign
} from "lucide-react-native";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import DealDashboard from "@/components/DealDashboard";
import { useDealDashboard } from "@/utils/dealDashboardService";
import Toast from "react-native-toast-message";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function DealDashboardPage() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const { dealId, userType = 'creator' } = useLocalSearchParams();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  
  const {
    metrics,
    projections,
    isLoading,
    error,
    refreshData,
    service
  } = useDealDashboard({
    dealId: dealId as string,
    userType: userType as 'creator' | 'marketer',
    timeframe: selectedTimeframe,
    userId: user?._id
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      Toast.show({
        type: 'success',
        text1: 'Dashboard Updated',
        text2: 'Latest data has been loaded',
        visibilityTime: 2000
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Failed to update dashboard data',
        visibilityTime: 3000
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Dashboard Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF Report', onPress: () => exportToPDF() },
        { text: 'CSV Data', onPress: () => exportToCSV() }
      ]
    );
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    Toast.show({
      type: 'info',
      text1: 'PDF Export',
      text2: 'PDF export feature coming soon',
      visibilityTime: 3000
    });
  };

  const exportToCSV = () => {
    // TODO: Implement CSV export
    Toast.show({
      type: 'info',
      text1: 'CSV Export',
      text2: 'CSV export feature coming soon',
      visibilityTime: 3000
    });
  };

  const handleShareDashboard = () => {
    Alert.alert(
      'Share Dashboard',
      'Generate a shareable link to this dashboard?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate Link', onPress: () => generateShareLink() }
      ]
    );
  };

  const generateShareLink = () => {
    // TODO: Implement share link generation
    Toast.show({
      type: 'info',
      text1: 'Share Link',
      text2: 'Share link feature coming soon',
      visibilityTime: 3000
    });
  };

  const renderQuickStats = () => {
    if (!metrics) return null;

    return (
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <DollarSign width={20} height={20} color="#10B981" />
            <Text style={styles.quickStatValue}>
              ${service.formatNumber(metrics.totalRevenue)}
            </Text>
            <Text style={styles.quickStatLabel}>Revenue</Text>
          </View>

          <View style={styles.quickStatItem}>
            <Target width={20} height={20} color="#3B82F6" />
            <Text style={styles.quickStatValue}>
              {metrics.completionRate.toFixed(0)}%
            </Text>
            <Text style={styles.quickStatLabel}>Progress</Text>
          </View>

          <View style={styles.quickStatItem}>
            <TrendingUp width={20} height={20} color="#8B5CF6" />
            <Text style={styles.quickStatValue}>
              {metrics.averageEngagement.toFixed(1)}%
            </Text>
            <Text style={styles.quickStatLabel}>Engagement</Text>
          </View>

          <View style={styles.quickStatItem}>
            <Users width={20} height={20} color="#F59E0B" />
            <Text style={styles.quickStatValue}>
              {service.formatNumber(metrics.totalReach)}
            </Text>
            <Text style={styles.quickStatLabel}>Reach</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      <Text style={styles.timeframeLabel}>Timeframe:</Text>
      <View style={styles.timeframeButtons}>
        {(['week', 'month', 'quarter'] as const).map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.timeframeButtonActive
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <Text style={[
              styles.timeframeButtonText,
              selectedTimeframe === timeframe && styles.timeframeButtonTextActive
            ]}>
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
        <Download width={16} height={16} color="#430B92" />
        <Text style={styles.actionButtonText}>Export</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleShareDashboard}>
        <Share2 width={16} height={16} color="#430B92" />
        <Text style={styles.actionButtonText}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => {
        // Navigate to settings or preferences
        Toast.show({
          type: 'info',
          text1: 'Settings',
          text2: 'Dashboard settings coming soon',
          visibilityTime: 3000
        });
      }}>
        <Settings width={16} height={16} color="#430B92" />
        <Text style={styles.actionButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <CustomBackButton />
        <View style={styles.headerContent}>
          <BarChart3 width={20} height={20} color="#430B92" />
          <Text style={styles.headerTitle}>Deal Dashboard</Text>
        </View>
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
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.content,
            isWeb && isWideScreen && styles.webContainer,
          ]}
        >
          {/* Quick Stats */}
          {renderQuickStats()}

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {renderTimeframeSelector()}
            {renderActionButtons()}
          </View>

          {/* Main Dashboard */}
          <View style={styles.dashboardContainer}>
            <DealDashboard
              dealId={dealId as string}
              userType={userType as 'creator' | 'marketer'}
              compact={false}
              showProjections={true}
              timeframe={selectedTimeframe}
            />
          </View>

          {/* Additional Info */}
          {metrics && (
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoTitle}>Deal Information</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Days Remaining</Text>
                  <Text style={styles.infoValue}>{metrics.daysRemaining}</Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Milestones</Text>
                  <Text style={styles.infoValue}>
                    {metrics.milestonesCompleted}/{metrics.milestonesTotal}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Projected Revenue</Text>
                  <Text style={styles.infoValue}>
                    ${service.formatNumber(metrics.projectedRevenue)}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Client Satisfaction</Text>
                  <Text style={styles.infoValue}>
                    {metrics.performance.clientSatisfaction}%
                  </Text>
                </View>
              </View>
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
    backgroundColor: "#FFFFFF",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
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
  quickStatsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickStatItem: {
    alignItems: "center",
    gap: 6,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  timeframeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeframeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  timeframeButtons: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: "#430B92",
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  timeframeButtonTextActive: {
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#430B92",
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#430B92",
  },
  dashboardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  additionalInfo: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 120,
    alignItems: "center",
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});