import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE, demoLog } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import Navbar from "@/components/web/navbar";
import { BREAKPOINTS, isMobile, isWideScreen } from "@/constants/breakpoints";
import { PerformanceUtils, DemoPerformance, LayoutStability } from "@/utils/performance";

export default function Analytics() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isWide = isWideScreen(width);
  const isMobileDevice = isMobile(width);
  const [isLoading, setIsLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);

  // Demo analytics data
  const [analyticsData] = useState({
    totalEarnings: 45600,
    thisMonth: 12800,
    totalDeals: 47,
    activeDeals: 12,
    successRate: 89,
    avgDealValue: 2710,
    topPerformingPlatform: "Instagram",
    platformBreakdown: {
      instagram: 65,
      tiktok: 25,
      youtube: 10,
    },
    monthlyGrowth: [
      { month: "Jan", earnings: 8900 },
      { month: "Feb", earnings: 12400 },
      { month: "Mar", earnings: 15800 },
      { month: "Apr", earnings: 18200 },
      { month: "May", earnings: 22600 },
      { month: "Jun", earnings: 12800 },
    ],
    recentDeals: [
      { brand: "Fashion Nova", amount: 5000, status: "Completed", platform: "Instagram" },
      { brand: "Nike", amount: 8500, status: "In Progress", platform: "TikTok" },
      { brand: "Samsung", amount: 3200, status: "Completed", platform: "YouTube" },
    ]
  });

  useEffect(() => {
    if (DEMO_MODE) {
      demoLog('Loading analytics dashboard with impressive demo data');
      
      // Start performance measurement
      const flowTimer = DemoPerformance.measureDemoFlow('analytics-dashboard');
      flowTimer.start();
      
      // Initialize demo optimizations
      DemoPerformance.initializeDemo();
      
      // Simulate fast loading for demo
      setTimeout(() => {
        setIsLoading(false);
        
        // Defer chart rendering for smooth experience
        DemoPerformance.optimizeAnalyticsDashboard().then(() => {
          setChartsReady(true);
          flowTimer.end();
        });
      }, 800); // Fast load for demo
    }
  }, []);

  const MetricCard = ({ title, value, subtitle, trend }: any) => (
    <View style={[styles.metricCard, isWide && styles.metricCardWide]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendText, trend > 0 ? styles.trendPositive : styles.trendNegative]}>
            {trend > 0 ? '↗️' : '↘️'} {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );

  const PlatformBar = ({ platform, percentage }: any) => (
    <View style={styles.platformRow}>
      <Text style={styles.platformName}>{platform}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.platformPercentage}>{percentage}%</Text>
    </View>
  );

  return (
    <>
      <Navbar pageTitle="Analytics Dashboard" />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.content, isWide && styles.wideContent]}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.pageTitle}>Analytics Dashboard</Text>
              <Text style={styles.pageSubtitle}>Track your business performance and earnings</Text>
            </View>

            {/* Key Metrics Row */}
            <View style={[styles.metricsRow, isMobileDevice && styles.metricsColumn]}>
              <MetricCard
                title="Total Earnings"
                value={`$${analyticsData.totalEarnings.toLocaleString()}`}
                subtitle="All time"
                trend={24}
              />
              <MetricCard
                title="This Month"
                value={`$${analyticsData.thisMonth.toLocaleString()}`}
                subtitle="June 2024"
                trend={18}
              />
              <MetricCard
                title="Success Rate"
                value={`${analyticsData.successRate}%`}
                subtitle="Deal completion"
                trend={5}
              />
            </View>

            {/* Secondary Metrics */}
            <View style={[styles.metricsRow, isMobileDevice && styles.metricsColumn]}>
              <MetricCard
                title="Total Deals"
                value={analyticsData.totalDeals}
                subtitle="Completed campaigns"
              />
              <MetricCard
                title="Active Deals"
                value={analyticsData.activeDeals}
                subtitle="In progress"
              />
              <MetricCard
                title="Avg Deal Value"
                value={`$${analyticsData.avgDealValue}`}
                subtitle="Per campaign"
              />
            </View>

            {/* Monthly Growth Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Monthly Earnings Growth</Text>
              <View style={[styles.chartContainer, LayoutStability.createStableContainer(200)]}>
                {isLoading ? (
                  // Loading placeholder
                  <View style={styles.chartLoadingContainer}>
                    <View style={styles.loadingShimmer} />
                    <Text style={styles.loadingText}>Loading growth data...</Text>
                  </View>
                ) : chartsReady ? (
                  analyticsData.monthlyGrowth.map((month, index) => {
                    const maxEarnings = Math.max(...analyticsData.monthlyGrowth.map(m => m.earnings));
                    const height = (month.earnings / maxEarnings) * 120;
                    
                    return (
                      <View key={month.month} style={styles.chartBar}>
                        <View style={[styles.bar, { height }]} />
                        <Text style={styles.barLabel}>{month.month}</Text>
                        <Text style={styles.barValue}>${(month.earnings / 1000).toFixed(1)}K</Text>
                      </View>
                    );
                  })
                ) : (
                  // Chart skeleton while preparing
                  <View style={styles.chartSkeletonContainer}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <View key={index} style={styles.chartBarSkeleton}>
                        <View style={styles.barSkeleton} />
                        <View style={styles.barLabelSkeleton} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Platform Performance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platform Performance</Text>
              <View style={styles.platformBreakdown}>
                <PlatformBar platform="Instagram" percentage={analyticsData.platformBreakdown.instagram} />
                <PlatformBar platform="TikTok" percentage={analyticsData.platformBreakdown.tiktok} />
                <PlatformBar platform="YouTube" percentage={analyticsData.platformBreakdown.youtube} />
              </View>
            </View>

            {/* Recent Deals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Deals</Text>
              <View style={styles.dealsContainer}>
                {analyticsData.recentDeals.map((deal, index) => (
                  <View key={index} style={styles.dealCard}>
                    <View style={styles.dealInfo}>
                      <Text style={styles.dealBrand}>{deal.brand}</Text>
                      <Text style={styles.dealPlatform}>{deal.platform}</Text>
                    </View>
                    <View style={styles.dealAmount}>
                      <Text style={styles.dealPrice}>${deal.amount.toLocaleString()}</Text>
                      <View style={[
                        styles.dealStatus,
                        deal.status === 'Completed' ? styles.statusCompleted : styles.statusProgress
                      ]}>
                        <Text style={[
                          styles.statusText,
                          deal.status === 'Completed' ? styles.statusTextCompleted : styles.statusTextProgress
                        ]}>
                          {deal.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Footer Highlight */}
            <View style={styles.highlightSection}>
              <Text style={styles.highlightTitle}>🚀 Growing Fast!</Text>
              <Text style={styles.highlightText}>
                You're in the top 5% of creators on Axees with a 89% success rate and $45.6K total earnings!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  wideContent: {
    marginHorizontal: "10%",
  },
  header: {
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#6C6C6C",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metricsColumn: {
    flexDirection: "column",
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    minHeight: 100,
  },
  metricCardWide: {
    minHeight: 120,
  },
  metricTitle: {
    fontSize: 14,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: Platform.OS === "web" ? 24 : 20,
    fontWeight: "700",
    color: "#430B92",
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  trendContainer: {
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trendPositive: {
    color: "#22C55E",
  },
  trendNegative: {
    color: "#EF4444",
  },
  chartSection: {
    marginVertical: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    padding: Platform.OS === "web" ? 20 : 16,
    height: Platform.OS === "web" ? 200 : 180,
    overflow: "hidden",
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    backgroundColor: "#430B92",
    width: Platform.OS === "web" ? 30 : 24,
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 20,
  },
  barLabel: {
    fontSize: 12,
    color: "#6C6C6C",
    marginBottom: 4,
  },
  barValue: {
    fontSize: 11,
    color: "#430B92",
    fontWeight: "600",
  },
  section: {
    marginBottom: 30,
  },
  platformBreakdown: {
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    padding: 20,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  platformName: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E2D0FB",
    borderRadius: 4,
    marginHorizontal: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#430B92",
    borderRadius: 4,
  },
  platformPercentage: {
    fontSize: 14,
    color: "#430B92",
    fontWeight: "600",
    width: 40,
    textAlign: "right",
  },
  dealsContainer: {
    gap: 12,
  },
  dealCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: 12,
    padding: 16,
  },
  dealInfo: {
    flex: 1,
  },
  dealBrand: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  dealPlatform: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  dealAmount: {
    alignItems: "flex-end",
  },
  dealPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#430B92",
    marginBottom: 4,
  },
  dealStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: "#DCFCE7",
  },
  statusProgress: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusTextCompleted: {
    color: "#15803D",
  },
  statusTextProgress: {
    color: "#B45309",
  },
  highlightSection: {
    backgroundColor: "#430B92",
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: "center",
  },
  highlightTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
  },
  // Loading and skeleton styles
  chartLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingShimmer: {
    width: "80%",
    height: 80,
    backgroundColor: "#E2D0FB",
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#6C6C6C",
    fontStyle: "italic",
  },
  chartSkeletonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flex: 1,
    paddingHorizontal: 10,
  },
  chartBarSkeleton: {
    alignItems: "center",
    flex: 1,
  },
  barSkeleton: {
    backgroundColor: "#E2D0FB",
    width: Platform.OS === "web" ? 30 : 24,
    height: 60,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabelSkeleton: {
    backgroundColor: "#E2D0FB",
    width: 20,
    height: 12,
    borderRadius: 2,
    marginTop: 4,
  },
});