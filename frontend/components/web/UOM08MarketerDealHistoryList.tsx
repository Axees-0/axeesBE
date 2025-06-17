"use client";

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
import { format } from "date-fns";

import Arrowdown01 from "../../assets/arrowdown01.svg";
import CustomBackButton from "@/components/CustomBackButton";
import { FontFamily } from "../../GlobalStyles";
import ProfileInfo from "../ProfileInfo";

// For web layout breakpoints
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

// Adjust if your endpoint is different
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/deals";

// Deals can have these statuses, for filtering
const possibleStatuses = [
  "", // means "All"
  "Accepted",
  "In-Process",
  "Cancellation",
  "Content for Approval Submitted",
  "Content Approved",
  "Final Content Posted",
  "Completion Payment Issued",
];

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return require("../../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png");
    case "youtube":
      return require("../../assets/pngclipartyoutubeplaybuttoncomputericonsyoutubeyoutubelogoanglerectanglethumbnail-13.png");
    case "tiktok":
      return require("../../assets/tiktok-icon.png");
    case "facebook":
      return require("../../assets/facebook-icon.png");
    case "twitter":
      return require("../../assets/1707226109newtwitterlogopng-1.png");
    case "twitch":
      return require("../../assets/twitchlogotwitchlogotransparenttwitchicontransparentfreefreepng-1.png");
    default:
      // Fallback if unknown platform
      return require("@/assets/letter-s.png");
  }
}

export default function MarketerDealHistoryList() {
  const { user } = useAuth();
  const windowSize = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = windowSize.width >= BREAKPOINTS.TABLET;

  const [filterStatus, setFilterStatus] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [sortBy, setSortBy] = React.useState("-createdAt");

  // Fetch deals via React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["marketerDeals", user?._id, filterStatus],
    queryFn: async () => {
      if (!user) return { deals: [] };
      const resp = await axios.get(API_URL, {
        params: {
          userId: user._id,
          role: user.userType, // or "Marketer"
          status: filterStatus,
        },
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      return resp.data; // { deals: [...], count: N }
    },
    enabled: !!user?._id, // only fetch if user is logged in
  });

  // If isLoading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  // If error
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red" }}>
          Error loading deals: {(error as Error)?.message}
        </Text>
      </View>
    );
  }

  // Deals from server
const deals = data?.deals || [];

// Sort deals locally
const sortedDeals = [...deals].sort((a, b) => {
  const dateA = new Date(a.createdAt).getTime();
  const dateB = new Date(b.createdAt).getTime();
  return sortBy === "-createdAt" ? dateB - dateA : dateA - dateB;
});

// RENDER A SINGLE DEAL CARD
const renderDeal = (deal: any) => {
  // figure out the "other party" userName
  const otherPartyUsername =
    user?.userType === "Creator"
      ? deal.marketerId?.userName
      : deal.creatorId?.userName;

  const otherPartyAvatarUrl =
    user?.userType === "Creator"
      ? deal.marketerId?.avatarUrl
      : deal.creatorId?.avatarUrl;

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
        <Text style={styles.dealName}>
          {deal.dealName || "Untitled Deal"}
        </Text>
        <View style={styles.dealDetails}>
          <Text style={styles.dealAmount}>
            {deal.paymentInfo?.paymentAmount?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              currency: "USD",
              style: "currency",
            }) || 0}
          </Text>

          {/* Show the date */}
          <Text style={styles.dealDate}>Desired Post Date: {dateStr}</Text>
        </View>

        {/* Platforms */}
        <View style={styles.platformIcons}>
          {(deal.offerDeliverables || deal.deliverables || []).map(
            (platform: string, index: number) => (
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

      {/* Other user & Status */}
      <View style={styles.creatorInfo}>
        <View style={styles.creatorProfile}>
          <Image
            source={{
              uri: otherPartyAvatarUrl?.startsWith("http")
                ? otherPartyAvatarUrl
                : process.env.EXPO_PUBLIC_BACKEND_URL + otherPartyAvatarUrl,
            }}
            placeholder={require("@/assets/empty-image.png")}
            style={styles.creatorImage}
          />
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

// Render the deals or an error message if there are no deals
return (
  <View>
    {sortedDeals.length > 0 ? (
      sortedDeals.map(deal => renderDeal(deal))
    ) : (
      <Text style={styles.errorText}>There are no Deals to show.</Text>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  creatorImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  webContainer: {
    // marginHorizontal: "5%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
    // marginHorizontal: "5%",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {},
  placeholderText: { fontSize: 16, fontWeight: "600" },
  content: {},
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 16,
    width: "100%",
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
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#000000",
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
    minWidth: 150,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#000000",
  },
  dealCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    zIndex: -1,
  },
  dealContent: { gap: 8 },
  dealName: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000000",
    textTransform: "capitalize",
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
  },
  dealDate: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  dealNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dealNumber: {
    fontSize: 14,
    color: "#6C6C6C",
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
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
});
