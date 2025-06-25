import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import Mobile from "@/components/mobile/UOM08MarketerDealHistoryList";
import Web from "@/components/web/UOM08MarketerDealHistoryList";
import CuratedDeals from "@/demo/CuratedDeals";
import { DEMO_MODE, demoLog } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import { useAuth } from "@/contexts/AuthContext";
import CreatorDealsView from "@/components/CreatorDealsView";
import Navbar from "@/components/web/navbar";
import { BREAKPOINTS, isMobile, isWideScreen, isTablet, isDesktop, isUltraWide } from "@/constants/breakpoints";
import { PerformanceUtils, DemoPerformance, LayoutStability } from "@/utils/performance";
import { WebSEO } from "../web-seo";
import { DealSkeleton, DealMetricsSkeleton, DealActivitySkeleton } from "@/components/DealSkeleton";
import DesignSystem from "@/styles/DesignSystem";

const UOM08MarketerDealHistoryList = () => {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const router = useRouter();
  const isWeb = Platform?.OS === "web";
  const isWide = isWideScreen(width);
  const isUltraWideScreen = isUltraWide(width);
  const isMobileDevice = isMobile(width);
  const isMobileScreen = width <= 768;
  const isVeryNarrow = width <= 380; // Very narrow screens need special handling
  
  // const [activeTab, setActiveTab] = useState('deals');
  const [isLoading, setIsLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  
  // Navbar search state
  const [searchText, setSearchText] = useState('');
  const handleSubmitSearch = () => {
    if (searchText.trim()) {
      router.push(`/?search=${encodeURIComponent(searchText.trim())}`);
    }
  };

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

  // Demo counter-offers for marketers
  const [counterOffers, setCounterOffers] = useState([
    {
      id: 'counter-001',
      creatorName: 'Emma Thompson',
      offerType: 'Instagram Post Campaign',
      originalAmount: 1500,
      counterAmount: 1800,
      status: 'pending',
      submittedDate: new Date(Date.now() - 7200000), // 2 hours ago
    }
  ]);
  
  // Track accepted offer IDs to hide their banners
  const [acceptedOfferIds, setAcceptedOfferIds] = useState<string[]>(
    // Check localStorage for previously accepted offers
    typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('acceptedOfferIds') || '[]')
      : []
  );
  
  // Filter out accepted offers
  const pendingCounterOffers = counterOffers.filter(
    offer => offer.status === 'pending' && !acceptedOfferIds.includes(offer.id)
  );
  
  // Listen for offer acceptance events
  useEffect(() => {
    const handleOfferAccepted = (event: any) => {
      const offerId = event.detail?.offerId;
      if (offerId) {
        const newAcceptedIds = [...acceptedOfferIds, offerId];
        setAcceptedOfferIds(newAcceptedIds);
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('acceptedOfferIds', JSON.stringify(newAcceptedIds));
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('offerAccepted', handleOfferAccepted);
      return () => {
        window.removeEventListener('offerAccepted', handleOfferAccepted);
      };
    }
  }, [acceptedOfferIds]);

  // Responsive styles for metric cards
  const getMetricsRowStyles = () => {
    if (isMobileDevice || isVeryNarrow) {
      return styles.metricsColumn;
    } else if (isTablet(width)) {
      return [
        styles.metricsRow,
        {
          gap: 20,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }
      ];
    } else {
      return styles.metricsRow;
    }
  };

  // Responsive styles for offer cards
  const getOfferCardStyles = () => {
    if (Platform.OS !== 'web') {
      return styles.offerCard;
    }

    if (isMobile(width)) {
      return [
        styles.offerCard,
        {
          width: '100%',
          marginHorizontal: 0,
        }
      ];
    } else if (isTablet(width)) {
      return [
        styles.offerCard,
        {
          width: '100%',
          maxWidth: '100%', // Fluid width on tablet
          marginHorizontal: 0,
          padding: 18, // Slightly more padding for tablet
        }
      ];
    } else {
      return [
        styles.offerCard,
        {
          width: '100%',
          maxWidth: 800, // Max width for desktop
          marginHorizontal: 0,
        }
      ];
    }
  };

  useEffect(() => {
    if (DEMO_MODE) {
      demoLog('Loading deals & analytics dashboard with impressive demo data');
      
      // Start performance measurement
      const flowTimer = DemoPerformance.measureDemoFlow('deals-analytics-dashboard');
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

  const renderDealsTab = () => {
    if (!DEMO_MODE) {
      return isMobileScreen ? <Mobile /> : <Web />;
    }
    
    // Show skeleton loading for demo mode
    if (isLoading) {
      return (
        <View style={[styles.content, isWide && styles.wideContent]}>
          {/* Summary skeleton */}
          <DealMetricsSkeleton count={4} />
          
          {/* Main content skeleton */}
          <View style={styles.section}>
            <DealSkeleton variant="card" count={3} />
          </View>
          
          {/* Activity skeleton */}
          <View style={styles.section}>
            <DealActivitySkeleton count={3} />
          </View>
        </View>
      );
    }
    
    // Check user role to determine which view to show
    const userRole = user?.role || 'marketer'; // Default to marketer for backward compatibility
    
    // If user is a creator, show the creator deals view
    if (userRole === 'creator') {
      return (
        <View style={[styles.content, isWide && styles.wideContent]}>
          <CreatorDealsView userRole="creator" isLoading={isLoading} />
        </View>
      );
    }
    
    // Marketer view (existing demo offers data)
    const demoOffers = [
      {
        id: 'OFF-123456',
        creator: 'Emma Thompson',
        creatorHandle: '@emmastyle',
        offerType: 'Social Media Post',
        amount: 500,
        status: 'Pending Response',
        submittedDate: '2024-06-18',
        platform: 'Instagram',
        deliveryDays: 3,
      },
      {
        id: 'OFF-789012',
        creator: 'Marcus Johnson',
        creatorHandle: '@techmarc',
        offerType: 'Product Review Video',
        amount: 1200,
        status: 'Accepted',
        submittedDate: '2024-06-17',
        platform: 'YouTube',
        deliveryDays: 7,
      },
      {
        id: 'OFF-345678',
        creator: 'Sofia Rodriguez',
        creatorHandle: '@sofiafit',
        offerType: 'Custom Campaign',
        amount: 800,
        status: 'In Progress',
        submittedDate: '2024-06-15',
        platform: 'Instagram',
        deliveryDays: 5,
      },
      {
        id: 'OFF-901234',
        creator: 'Jake Miller',
        creatorHandle: '@jakeeats',
        offerType: 'Instagram Story Series',
        amount: 750,
        status: 'Completed',
        submittedDate: '2024-06-10',
        platform: 'Instagram',
        deliveryDays: 5,
      },
    ];

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Pending Response': return '#FFA726';
        case 'Accepted': return '#66BB6A';
        case 'In Progress': return '#42A5F5';
        case 'Completed': return '#4CAF50';
        case 'Declined': return '#EF5350';
        default: return '#757575';
      }
    };

    const getStatusTextColor = (status: string) => {
      switch (status) {
        case 'Pending Response': return '#FF8F00';
        case 'Accepted': return '#388E3C';
        case 'In Progress': return '#1976D2';
        case 'Completed': return '#2E7D32';
        case 'Declined': return '#C62828';
        default: return '#424242';
      }
    };

    return (
      <View style={[styles.content, isWide && styles.wideContent]}>
        {/* Summary Cards */}
        <View style={getMetricsRowStyles()}>
          <MetricCard
            title="Total Offers"
            value={demoOffers.length}
            subtitle="All time"
          />
          <MetricCard
            title="Pending"
            value={demoOffers.filter(o => o.status === 'Pending Response').length}
            subtitle="Awaiting response"
          />
          <MetricCard
            title="Active"
            value={demoOffers.filter(o => ['Accepted', 'In Progress'].includes(o.status)).length}
            subtitle="In progress"
          />
          <MetricCard
            title="Success Rate"
            value="85%"
            subtitle="Acceptance rate"
            trend={12}
          />
        </View>

        {/* Counter Offers Alert */}
        {pendingCounterOffers.length > 0 && (
          <TouchableOpacity 
            style={styles.counterOfferAlert}
            onPress={() => {
              router.push({
                pathname: '/offers/handle-counter',
                params: { 
                  counterId: pendingCounterOffers[0].id,
                  from: 'deals'
                }
              });
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Review counter offer from ${pendingCounterOffers[0].creatorName}`}
            accessibilityHint={`Opens counter offer details for ${pendingCounterOffers[0].offerType}`}
          >
            <View style={styles.counterOfferContent}>
              <Text style={styles.counterOfferIcon}>🔔</Text>
              <View style={styles.counterOfferInfo}>
                <Text style={styles.counterOfferTitle} numberOfLines={undefined}>Counter Offer Received</Text>
                <Text style={styles.counterOfferText} numberOfLines={undefined}>
                  {pendingCounterOffers[0].creatorName} sent a counter offer for {pendingCounterOffers[0].offerType}
                </Text>
                <Text style={styles.counterOfferAmount} numberOfLines={undefined}>
                  ${pendingCounterOffers[0].originalAmount} → ${pendingCounterOffers[0].counterAmount}
                </Text>
              </View>
            </View>
            <Text style={styles.counterOfferAction}>Review →</Text>
          </TouchableOpacity>
        )}

        {/* Offers List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Offers</Text>
          <View style={styles.offersContainer}>
            {demoOffers.map((offer, index) => (
              <TouchableOpacity 
                key={offer.id} 
                style={({ pressed }) => [
                  ...Array.isArray(getOfferCardStyles()) ? getOfferCardStyles() : [getOfferCardStyles()],
                  pressed && styles.offerCardPressed
                ]} 
                data-testid="deal-card"
                onPress={() => router.push(`/deals/${offer.id}`)}
              >
                <View style={styles.offerHeader}>
                  <View style={styles.offerMainInfo}>
                    <Text style={styles.offerTitle}>{offer.offerType}</Text>
                    <Text style={styles.offerCreator}>to {offer.creator} ({offer.creatorHandle})</Text>
                    <Text style={styles.offerPlatform}>{offer.platform} • {offer.deliveryDays} days delivery</Text>
                  </View>
                  <View style={styles.offerActions}>
                    <Text style={styles.offerAmount}>${offer.amount.toLocaleString()}</Text>
                    <View style={[styles.offerStatus, { backgroundColor: getStatusColor(offer.status) + '20' }]}>
                      <Text style={[styles.offerStatusText, { color: getStatusTextColor(offer.status) }]}>
                        {offer.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.offerFooter}>
                  <Text style={styles.offerDate}>
                    Submitted: {new Date(offer.submittedDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.offerNumber}>#{offer.id}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>✅</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Offer Accepted</Text>
                <Text style={styles.activityDescription}>Marcus Johnson accepted your product review offer</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>📄</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New Offer Submitted</Text>
                <Text style={styles.activityDescription}>Sent Instagram post offer to Emma Thompson</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>🎉</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Campaign Completed</Text>
                <Text style={styles.activityDescription}>Jake Miller completed Instagram story series</Text>
                <Text style={styles.activityTime}>3 days ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => {
              router.push('/(tabs)/');
            }}
          >
            <Text style={styles.exploreButtonText}>Explore More Creators</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalyticsTab = () => (
    <View style={[styles.content, isWide && styles.wideContent]}>
      {/* Key Metrics Row */}
      <View style={getMetricsRowStyles()}>
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
      <View style={getMetricsRowStyles()}>
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
  );

  if (DEMO_MODE) {
    return (
      <>
        <WebSEO 
          title="Deals & Offers - Axees"
          description="Manage your deals and offers. High-value creator opportunities and brand partnerships."
          keywords="creator deals, brand partnerships, influencer opportunities, offers"
        />
        <Navbar 
          searchText={searchText}
          setSearchText={setSearchText}
          onSubmitSearch={handleSubmitSearch}
        />
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Content */}
            {renderDealsTab()}
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  // Non-demo mode behavior
  if (isMobileScreen) {
    return (
      <>
        <WebSEO 
          title="Deals & Offers"
          description="Browse active deals and offers between creators and brands. Manage your campaigns and partnerships on Axees."
          keywords="deals, offers, brand deals, influencer marketing, partnerships"
        />
        <Mobile />
      </>
    );
  }

  return (
    <>
      <WebSEO 
        title="Deals & Offers"
        description="Browse active deals and offers between creators and brands. Manage your campaigns and partnerships on Axees."
        keywords="deals, offers, brand deals, influencer marketing, partnerships"
      />
      <Web />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  counterOfferAlert: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: DesignSystem.ResponsiveSpacing.cardPadding.paddingHorizontal,
    paddingVertical: DesignSystem.ResponsiveSpacing.cardPadding.paddingVertical + 4, // Extra vertical padding
    marginHorizontal: DesignSystem.ResponsiveSpacing.containerHorizontal,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80, // Consistent height for banner
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        ':focus': {
          borderColor: '#EA580C',
          borderWidth: 2,
          shadowColor: '#EA580C',
          shadowOpacity: 0.3,
          shadowRadius: 4,
          backgroundColor: '#FFF7ED',
        },
        ':hover': {
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E0B',
        }
      }
    }),
  },
  counterOfferContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  counterOfferIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  counterOfferInfo: {
    flex: 1,
    minWidth: 0, // Prevent text from pushing beyond container
    paddingRight: 16, // Increased space before action button
    justifyContent: 'center', // Center content vertically
  },
  counterOfferTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EA580C',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  counterOfferText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  counterOfferAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    flexWrap: 'wrap',
  },
  counterOfferAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
    paddingLeft: 16,
    paddingVertical: 12, // Increased for better vertical centering
    textAlign: 'center',
    minWidth: 90,
    alignSelf: 'center', // Center arrow vertically
  },
  tabHeader: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2D0FB",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FD",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#430B92",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C6C6C",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    padding: 20,
  },
  wideContent: {
    marginHorizontal: "10%",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap", // Allow wrapping on very narrow screens
  },
  metricsColumn: {
    flexDirection: "column",
    gap: 16,
    alignItems: "stretch", // Ensure cards take full width when stacked
  },
  metricCard: {
    ...DesignSystem.StatCardStyles.container,
    flex: 1,
    marginHorizontal: 4, // Equal spacing between stat cards
    minWidth: 140, // Prevent cards from becoming too narrow
    maxWidth: '100%', // Ensure cards don't overflow their container
  },
  metricCardWide: {
    ...DesignSystem.StatCardStyles.container,
    flex: 1,
    marginHorizontal: 4,
    minWidth: 160, // Slightly wider on wide screens
  },
  metricCardMobile: {
    ...DesignSystem.StatCardStyles.container,
    flex: 0, // Don't flex when stacked vertically
    width: '100%', // Take full width when stacked
    marginHorizontal: 0,
  },
  metricTitle: {
    ...DesignSystem.StatCardStyles.label,
  },
  metricValue: {
    ...DesignSystem.StatCardStyles.value,
    fontSize: Platform?.OS === "web" ? 24 : 20, // Responsive sizing
  },
  metricSubtitle: {
    ...DesignSystem.StatCardStyles.label,
    fontSize: 11, // Slightly smaller for subtitle
    opacity: 0.8,
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
    padding: Platform?.OS === "web" ? 20 : 16,
    height: Platform?.OS === "web" ? 200 : 180,
    overflow: "hidden",
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    backgroundColor: "#430B92",
    width: Platform?.OS === "web" ? 30 : 24,
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
    minWidth: 100, // Consistent column width
    paddingRight: DesignSystem.ResponsiveSpacing.containerHorizontal, // Consistent right gutter
  },
  dealPrice: {
    ...DesignSystem.Typography.bodyMedium,
    fontSize: 16,
    fontWeight: "700",
    color: "#430B92",
    marginBottom: 6,
    textAlign: 'right', // Right-align prices
  },
  dealStatus: {
    ...DesignSystem.PillStyles.status,
    alignSelf: 'flex-end', // Align pills to right edge
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
    width: Platform?.OS === "web" ? 30 : 24,
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
  
  // Offers Management Styles
  offersContainer: {
    gap: 12,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D0FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform?.OS === 'web' && { cursor: 'pointer' as any }),
  },
  offerCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F8F4FF',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerMainInfo: {
    flex: 1,
    marginRight: 16,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#430B92',
    marginBottom: 4,
  },
  offerCreator: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  offerPlatform: {
    fontSize: 12,
    color: '#999',
  },
  offerActions: {
    alignItems: 'flex-end',
    paddingRight: DesignSystem.ResponsiveSpacing.containerHorizontal, // Consistent right gutter
    minWidth: 120, // Consistent column width for price alignment
  },
  offerAmount: {
    ...DesignSystem.Typography.h4,
    color: '#430B92',
    marginBottom: 8,
    textAlign: 'right', // Right-align all prices to consistent gutter
  },
  offerStatus: {
    ...DesignSystem.PillStyles.status,
    alignSelf: 'flex-end', // Align status pills to right edge
  },
  offerStatusText: {
    ...DesignSystem.PillTextStyles.status,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  offerDate: {
    fontSize: 12,
    color: '#666',
  },
  offerNumber: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  
  // Activity Styles
  activityContainer: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#430B92',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  
  // Action Button Styles
  actionSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  exploreButton: {
    backgroundColor: '#430B92',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UOM08MarketerDealHistoryList;
