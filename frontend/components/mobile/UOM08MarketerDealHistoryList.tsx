import React, { useState, useEffect, useMemo } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import Arrowdown01 from "@/assets/arrowdown01.svg";
import { FontFamily } from "@/GlobalStyles";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
import { format } from "date-fns";
import { DealListSkeleton } from "@/components/DealSkeleton";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/deals";

export default function MarketerDealHistoryList() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Add status handling logic
  const possibleStatuses = useMemo(
    () => [
      "", // All Status
      "Accepted",
      "In Process",
      "Cancellation",
      "Content for Approval Submitted",
      "Content Approved",
      "Final Content Posted",
      "Completion Payment Issued",
    ],
    []
  );

  const getDealStatus = (deal: any) => {
    return deal.status;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["marketerDeals", user?._id],
    queryFn: async () => {
      if (!user) return [];
      const response = await axios.get(API_URL, {
        params: {
          userId: user._id,
          role: user.userType,
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return response.data;
    },
  });

  // Update deals filtering
  const filteredDeals = (data?.deals || []).filter((deal) => {
    if (!filterStatus) return true;
    const status = getDealStatus(deal);
    return status === filterStatus;
  });

  const renderDeal = (deal: any) => {
    // figure out the "other party" userName
    const otherPartyUsername =
      user?.userType === "Creator"
        ? deal.marketerId?.userName
        : deal.creatorId?.userName;

    // transactionNumber if Marketer
    let transactionNumber = "";
    const { transactions } = deal.paymentInfo || {};
    if (user?.userType === "Marketer" && transactions?.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      if (lastTx.transactionId) {
        if (lastTx.transactionId.includes("ch_")) {
          transactionNumber = lastTx.transactionId.split("ch_")[1];
        } else if (lastTx.transactionId.includes("pi_")) {
          transactionNumber = lastTx.transactionId.split("pi_")[1];
        }
      }
    }

    // For the displayed date
    // If you prefer to show "offerDesiredPostDate" if it exists, fallback to "desiredPostDate"
    const useDate = deal.offerDesiredPostDate || deal.desiredPostDate || null;
    const dateStr = useDate
      ? format(new Date(useDate), "dd MMM yyyy")
      : "No date";

    return (
      <Pressable
        key={deal._id}
        style={styles.dealCard}
        onPress={() =>
          router.push({
            pathname: "/UOM09MarketerDealDetail",
            params: { dealId: deal._id },
          })
        }
      >
        <View style={styles.dealContent}>
          <Text style={styles.dealName}>{deal.dealName}</Text>
          <View style={styles.dealDetails}>
            <Text style={styles.dealAmount}>
              ${deal.paymentInfo?.paymentAmount}
            </Text>
            <Text style={styles.dealDate}>Desired Post Date: {dateStr}</Text>
          </View>
          <View style={styles.dealNumbers}>
            <Text style={styles.dealNumber}>Deal No : #{deal.dealNumber}</Text>
            {transactionNumber && (
              <Text style={styles.dealNumber}>
                Transaction No : #{transactionNumber}
              </Text>
            )}
          </View>

          <View style={styles.platformIcons}>
            {(deal.offerDeliverables || deal.deliverables).map(
              (platform: any, index: any) => (
                <View key={index} style={styles.platformIcon}>
                  <Image
                    source={getPlatformIcon(platform)}
                    style={{ width: 20, height: 20 }}
                  />
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.creatorInfo}>
          <View style={styles.creatorProfile}>
            <Text style={styles.creatorUsername}>
              {otherPartyUsername?.includes("@")
                ? otherPartyUsername
                : "@" + otherPartyUsername}
            </Text>
          </View>

          <View style={[styles.statusBadge]}>
            <Text style={styles.statusText}>{deal.status}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>Deals</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.filterBar}>
            <View style={styles.sortBy}>
              <Text style={styles.sortByLabel}>Sort by:</Text>
              <View style={styles.sortButton}>
                <Text style={styles.sortButtonText}>Brand</Text>
              </View>
            </View>
            <View style={styles.filterButton}>
              <Text style={styles.filterButtonText}>All Status</Text>
            </View>
          </View>
          <View style={styles.content}>
            <DealListSkeleton count={5} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error loading deals.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.filterBar}>
        <View style={styles.sortBy}>
          <Text style={styles.sortByLabel}>Sort by:</Text>
          <Pressable style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Brand</Text>
            <Arrowdown01 width={16} height={16} />
          </Pressable>
        </View>

        <View style={{ position: "relative" }}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <Text style={styles.filterButtonText}>
              {filterStatus || "All Status"}
            </Text>
            <Arrowdown01 width={16} height={16} />
          </Pressable>

          {showStatusDropdown && (
            <View style={styles.dropdown}>
              {possibleStatuses.map((statusOption) => (
                <Pressable
                  key={statusOption}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFilterStatus(statusOption);
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {statusOption || "All Status"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredDeals.map(renderDeal)}
      </ScrollView>
    </>
  );
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return require("@/assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png");
    case "youtube":
      return require("@/assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png");
    case "tiktok":
      return require("@/assets/tiktok-icon.png");
    case "facebook":
      return require("@/assets/facebook-icon.png");
    case "twitter":
      return require("@/assets/1707226109newtwitterlogopng-1.png");
    case "twitch":
      return require("@/assets/twitchlogotwitchlogotransparenttwitchicontransparentfreefreepng-1.png");
    default:
      return require("@/assets/letter-s.png");
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Accepted":
      return "#3B82F6";
    case "In Process":
      return "#F59E0B";
    case "Cancellation":
      return "#EF4444";
    case "Content for Approval Submitted":
      return "#10B981";
    case "Content Approved":
      return "#3B82F6";
    case "Final Content Posted":
      return "#10B981";
    case "Completion Payment Issued":
      return "#10B981";
    default:
      return "#6C6C6C";
  }
};
function getStatusText(status: string) {
  switch (status) {
    case "pending":
      return "Pending Funding";
    case "active":
      return "Active";
    case "in_review":
      return "In Review";
    case "paid":
      return "Funded";
    case "revision_required":
      return "Revision Required";
    case "completed":
      return "Approved"; // or "Completed" if you prefer
    case "proposed":
      return "Proposed";
    case "Accepted": // newly added case for Accepted
      return "Accepted";
    default:
      return "Pending";
  }
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  placeholder: {},
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#430B92",
  },
  tabText: {
    fontSize: 16,
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  activeTabText: {
    color: "#430B92",
    fontWeight: "500",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sortBy: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortByLabel: {
    fontSize: 14,
    color: "#6C6C6C",
    marginRight: 8,
    fontFamily: FontFamily.inter,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2D0FB",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  content: {
    flex: 1,

    zIndex: -1,
  },
  dealCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
  },
  dealContent: {
    gap: 8,
  },
  dealName: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000000",
    fontFamily: FontFamily.degular,
  },
  dealDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dealAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  dealDate: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: FontFamily.inter,
  },
  dealNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dealNumber: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: FontFamily.inter,
  },
  platformIcons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  platformIcon: {
    width: 35,
    height: 35,
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(11, 2, 24, 0.2)",
    marginVertical: 12,
  },
  creatorInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creatorProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorUsername: {
    fontSize: 14,
    color: "#430B92",
    fontFamily: FontFamily.inter,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    backgroundColor: "#430B92",
  },
  statusText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: FontFamily.inter,
  },
  dropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 4,
    zIndex: 999,
    minWidth: 200,    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#000000",
  },
  // Add missing styles for skeleton loading
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2D0FB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#430B92',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
});
