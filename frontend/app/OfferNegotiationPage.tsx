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
  MessageSquare,
  ArrowLeft,
  MoreHorizontal,
  Bell,
  Share2,
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  FileText
} from "lucide-react-native";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import OfferNegotiation from "@/components/OfferNegotiation";
import { useOfferNegotiation } from "@/utils/offerNegotiationService";
import Toast from "react-native-toast-message";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function OfferNegotiationPage() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const { 
    offerId, 
    dealId,
    userType = user?.userType || 'creator',
    title = 'Offer Negotiation'
  } = useLocalSearchParams();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const {
    currentOffer,
    history,
    isLoading,
    error,
    service
  } = useOfferNegotiation({
    offerId: offerId as string,
    currentUserId: user?._id || '',
    currentUserType: userType as 'creator' | 'marketer'
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh negotiation data
      await Promise.all([
        service.fetchCurrentOffer({
          offerId: offerId as string,
          currentUserId: user?._id || '',
          currentUserType: userType as 'creator' | 'marketer'
        }),
        service.fetchNegotiationHistory(offerId as string)
      ]);
      
      Toast.show({
        type: 'success',
        text1: 'Refreshed',
        text2: 'Negotiation data updated',
        visibilityTime: 2000
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Failed to refresh negotiation data',
        visibilityTime: 3000
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleOfferAccepted = () => {
    Alert.alert(
      'Offer Accepted',
      'Congratulations! The offer has been accepted. You can now proceed with the project.',
      [
        {
          text: 'View Deal',
          onPress: () => {
            if (dealId) {
              router.push(`/DealDetails?dealId=${dealId}`);
            } else {
              router.back();
            }
          }
        },
        { text: 'Stay Here', style: 'cancel' }
      ]
    );
  };

  const handleOfferRejected = () => {
    Alert.alert(
      'Offer Rejected',
      'The offer has been rejected. You can make adjustments and send a new offer.',
      [
        { text: 'OK', onPress: () => router.back() }
      ]
    );
  };

  const handleNegotiationComplete = () => {
    // Navigate to deal creation or deal details
    Toast.show({
      type: 'success',
      text1: 'Negotiation Complete',
      text2: 'Moving to deal creation...',
      visibilityTime: 2000
    });
    
    setTimeout(() => {
      if (dealId) {
        router.push(`/DealDetails?dealId=${dealId}`);
      } else {
        router.back();
      }
    }, 2000);
  };

  const handleShareNegotiation = () => {
    Alert.alert(
      'Share Negotiation',
      'Share this negotiation progress with team members?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => {
          // TODO: Implement sharing functionality
          Toast.show({
            type: 'info',
            text1: 'Share Feature',
            text2: 'Sharing feature coming soon',
            visibilityTime: 3000
          });
        }}
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Report a problem with this negotiation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: () => {
          // TODO: Implement reporting functionality
          Toast.show({
            type: 'info',
            text1: 'Report Feature',
            text2: 'Reporting feature coming soon',
            visibilityTime: 3000
          });
        }}
      ]
    );
  };

  const renderNegotiationStatus = () => {
    if (!currentOffer) return null;

    const getStatusColor = () => {
      switch (currentOffer.status) {
        case 'accepted': return '#10B981';
        case 'rejected': return '#EF4444';
        case 'pending': return '#F59E0B';
        case 'countered': return '#3B82F6';
        default: return '#6B7280';
      }
    };

    const getStatusIcon = () => {
      switch (currentOffer.status) {
        case 'accepted':
          return <CheckCircle width={20} height={20} color="#10B981" />;
        case 'rejected':
          return <XCircle width={20} height={20} color="#EF4444" />;
        case 'pending':
          return <Clock width={20} height={20} color="#F59E0B" />;
        default:
          return <MessageSquare width={20} height={20} color="#3B82F6" />;
      }
    };

    return (
      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {currentOffer.status.charAt(0).toUpperCase() + currentOffer.status.slice(1)}
          </Text>
        </View>
        
        <View style={styles.statusMeta}>
          <Text style={styles.statusMetaText}>
            Created {currentOffer.createdAt.toLocaleDateString()}
          </Text>
          {currentOffer.expiresAt && (
            <Text style={styles.statusMetaText}>
              Expires {currentOffer.expiresAt.toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderNegotiationSummary = () => {
    if (!currentOffer) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Negotiation Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <TrendingUp width={16} height={16} color="#430B92" />
            <Text style={styles.summaryLabel}>Current Offer</Text>
            <Text style={styles.summaryValue}>
              ${service.formatCurrency(currentOffer.terms.amount)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Clock width={16} height={16} color="#430B92" />
            <Text style={styles.summaryLabel}>Timeline</Text>
            <Text style={styles.summaryValue}>
              {currentOffer.terms.timeline} days
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <FileText width={16} height={16} color="#430B92" />
            <Text style={styles.summaryLabel}>Deliverables</Text>
            <Text style={styles.summaryValue}>
              {currentOffer.terms.deliverables.length} items
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Users width={16} height={16} color="#430B92" />
            <Text style={styles.summaryLabel}>Revisions</Text>
            <Text style={styles.summaryValue}>
              {currentOffer.terms.revisions} included
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMoreOptionsMenu = () => {
    if (!showMoreOptions) return null;

    return (
      <View style={styles.moreOptionsMenu}>
        <TouchableOpacity
          style={styles.menuOption}
          onPress={() => {
            setShowMoreOptions(false);
            handleShareNegotiation();
          }}
        >
          <Share2 width={16} height={16} color="#374151" />
          <Text style={styles.menuOptionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuOption}
          onPress={() => {
            setShowMoreOptions(false);
            // TODO: Enable notifications
            Toast.show({
              type: 'success',
              text1: 'Notifications Enabled',
              text2: 'You will receive updates about this negotiation',
              visibilityTime: 3000
            });
          }}
        >
          <Bell width={16} height={16} color="#374151" />
          <Text style={styles.menuOptionText}>Enable Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuOption}
          onPress={() => {
            setShowMoreOptions(false);
            handleReportIssue();
          }}
        >
          <Flag width={16} height={16} color="#EF4444" />
          <Text style={[styles.menuOptionText, { color: '#EF4444' }]}>Report Issue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <CustomBackButton />
        <View style={styles.headerContent}>
          <MessageSquare width={20} height={20} color="#430B92" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowMoreOptions(!showMoreOptions)}
          >
            <MoreHorizontal width={20} height={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.placeholder}
            onPress={() => router.push("/profile")}
          >
            <ProfileInfo />
          </TouchableOpacity>
        </View>
      </View>

      {/* More Options Menu */}
      {renderMoreOptionsMenu()}

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
          {/* Status Section */}
          {renderNegotiationStatus()}

          {/* Summary Section */}
          {renderNegotiationSummary()}

          {/* Main Negotiation Component */}
          <View style={styles.negotiationContainer}>
            <OfferNegotiation
              offerId={offerId as string}
              currentUserId={user?._id || ''}
              currentUserType={userType as 'creator' | 'marketer'}
              onOfferAccepted={handleOfferAccepted}
              onOfferRejected={handleOfferRejected}
              onNegotiationComplete={handleNegotiationComplete}
              readonly={false}
              compact={false}
            />
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Negotiation Tips</Text>
            <View style={styles.helpContent}>
              <Text style={styles.helpText}>
                • Be clear and specific about your requirements
              </Text>
              <Text style={styles.helpText}>
                • Consider the full value beyond just price
              </Text>
              <Text style={styles.helpText}>
                • Respond promptly to keep negotiations moving
              </Text>
              <Text style={styles.helpText}>
                • Ask questions if anything is unclear
              </Text>
            </View>
          </View>
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
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moreButton: {
    padding: 8,
  },
  placeholder: {},
  moreOptionsMenu: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    minWidth: 180,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuOptionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  statusContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusMetaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: 120,
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  negotiationContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  helpSection: {
    backgroundColor: "#F0E7FD",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#430B92",
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: 12,
  },
  helpContent: {
    gap: 8,
  },
  helpText: {
    fontSize: 12,
    color: "#430B92",
    lineHeight: 18,
  },
});