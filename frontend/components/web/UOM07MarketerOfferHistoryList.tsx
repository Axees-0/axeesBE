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
import Arrowleft021 from "../../assets/arrowleft021.svg";
import Arrowdown01 from "../../assets/arrowdown01.svg";
import { FontFamily } from "../../GlobalStyles";
import CustomBackButton from "@/components/CustomBackButton";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import ProfileInfo from "../ProfileInfo";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";

export default function MarketerOfferHistoryList() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Dynamically build possible statuses (without Draft)
  const possibleStatuses = useMemo(() => {
    if (!user) return [];

    const viewedByOtherSide =
      user.userType === "Marketer" ? "Viewed by Creator" : "Viewed by Marketer";

    const offerSent =
      user.userType === "Marketer" ? "Offer Sent" : "Offer Received";

    return [
      "", // All Status
      offerSent,
      viewedByOtherSide,
      "Offer in Review",
      "Rejected-Countered",
      "Rejected",
      "Accepted",
      "Cancelled",
    ];
  }, [user]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["marketerOffers", user?._id],
    queryFn: async () => {
      if (!user) return { offers: [], newDrafts: [] };
      const response = await axios.get(API_URL, {
        params: {
          userId: user._id,
          role: user.userType,
        },
      });
      return response.data;
    },
  });

  const role = user?.userType;

  const getStatus = (offer: any, role: string) => {
    if (offer.draft) {
      return "Draft";
    }

    // Check for deleted status
    if (offer.status === "Deleted") {
      return "Offer Deleted";
    }

    // Check for terminal statuses first that should override viewed status
    if (offer.status === "Rejected") {
      return "Offer Rejected";
    }

    if (offer.status === "Accepted") {
      return "Offer Accepted";
    }

    if (offer.status === "Rejected-Countered") {
      return "Offer Rejected-Countered";
    }

    // Make sure Offer in Review is displayed correctly
    if (offer.status === "Offer in Review") {
      return "Offer in Review";
    }

    // Check for viewed status based on the role, but don't override Offer in Review
    if (
      role === "Marketer" &&
      offer.viewedByCreator &&
      offer.status !== "Offer in Review"
    ) {
      return "Viewed by Creator";
    }

    if (
      role === "Creator" &&
      offer.viewedByMarketer &&
      offer.status !== "Offer in Review"
    ) {
      return "Viewed by Marketer";
    }

    // For Sent status
    if (
      offer.status === "Sent" ||
      offer.status === "Offer Sent" ||
      offer.status === "Offer Received"
    ) {
      return "Offer Sent";
    }

    // Default fallback to the original status
    return offer.status;
  };

  // Render an offer (with or without a draft)
  const renderOffer = (offer: any) => {
    const dataBasedOnRole =
      user?.userType === "Creator" ? offer.marketerId : offer.creatorId;

    const draft = offer.draft;

    const displayData = {
      ...offer,
      proposedAmount: draft?.amount || offer.proposedAmount,
      desiredPostDate: draft?.postDate || offer.desiredPostDate,
      status: getStatus(offer, role),
      deliverables: draft?.deliverables || offer.deliverables,
    };

    return (
      <Pressable
        key={offer._id}
        style={styles.offerCard}
        onPress={() => {
          if (
            offer.counters?.length > 0 &&
            offer.status !== "Rejected" &&
            offer.status !== "Accepted" &&
            offer.status !== "Cancelled"
          ) {
            router.push({
              pathname: "/UOM05MarketerOfferCounter",
              params: { offerId: offer._id, role: user?.userType },
            });
          } else {
            router.push({
              pathname: "/UOM10CreatorOfferDetails",
              params: {
                offerId: offer._id,
                marketerId: offer.marketerId?._id,
                role: user?.userType,
              },
            });
          }
        }}
      >
        <View style={styles.offerContent}>
          <Text style={styles.offerName}>
            {offer.offerName || "Untitled Offer"}
          </Text>
          <View style={styles.offerDetails}>
            <Text style={styles.offerAmount}>
              {displayData.proposedAmount?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                currency: "USD",
                style: "currency",
              }) || 0}
            </Text>
            <Text style={styles.offerDate}>
              Desired Post Date:{" "}
              {displayData.desiredPostDate
                ? format(new Date(displayData.desiredPostDate), "dd MMM yyyy")
                : "N/A"}
            </Text>
          </View>

          <View style={styles.platformIcons}>
            {displayData.deliverables?.map(
              (deliverable: any, index: number) => (
                <View key={index} style={styles.platformIcon}>
                  <Image
                    source={getPlatformIcon(deliverable)}
                    style={{ width: 20, height: 20 }}
                    contentFit="contain"
                  />
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.creatorInfo}>
          <View style={styles.creatorProfile}>
            <Image
              source={{
                uri: dataBasedOnRole?.avatarUrl?.startsWith("http")
                  ? dataBasedOnRole?.avatarUrl
                  : process.env.EXPO_PUBLIC_BACKEND_URL +
                    dataBasedOnRole?.avatarUrl,
              }}
              placeholder={require("@/assets/empty-image.png")}
              style={styles.creatorImage}
            />
            <Text style={styles.creatorUsername}>
              {dataBasedOnRole?.userName?.startsWith("@")
                ? dataBasedOnRole?.userName
                : `@${dataBasedOnRole?.userName || "Unknown"}`}
            </Text>
          </View>
          <View style={[styles.statusBadge]}>
            <Text style={styles.statusText}>{displayData.status}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  // Render a new draft (without an offerId)
  const renderDraft = (draft: any) => {
    const dataBasedOnRole = draft.userId;

    return (
      <Pressable
        key={draft._id}
        style={styles.offerCard}
        onPress={() => {
          if (user?.userType === "Marketer") {
            router.push({
              pathname: "/UOM02MarketerOfferDetail",
              params: { draftId: draft._id }, // Pass draftId instead of offerId
            });
          }
        }}
      >
        <View style={styles.offerContent}>
          <Text style={styles.offerName}>{draft.offerName || "New Draft"}</Text>
          <View style={styles.offerDetails}>
            <Text style={styles.offerAmount}>
              {draft.amount?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                currency: "USD",
                style: "currency",
              }) || 0}
            </Text>
            <Text style={styles.offerDate}>
              Desired Post Date:{" "}
              {draft.postDate
                ? format(new Date(draft.postDate), "dd MMM yyyy")
                : "N/A"}
            </Text>
          </View>

          <View style={styles.platformIcons}>
            {draft.deliverables?.map((deliverable: any, index: number) => (
              <View key={index} style={styles.platformIcon}>
                <Image
                  source={getPlatformIcon(deliverable)}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.creatorInfo}>
          <View style={styles.creatorProfile}>
            <Image
              source={{
                uri: dataBasedOnRole?.avatarUrl?.startsWith("http")
                  ? dataBasedOnRole?.avatarUrl
                  : process.env.EXPO_PUBLIC_BACKEND_URL +
                    dataBasedOnRole?.avatarUrl,
              }}
              placeholder={require("@/assets/empty-image.png")}
              style={styles.creatorImage}
            />
            <Text style={styles.creatorUsername}>
              {dataBasedOnRole.userName?.startsWith("@")
                ? dataBasedOnRole.userName
                : `@${dataBasedOnRole.userName}`}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor("Draft") },
            ]}
          >
            <Text style={[styles.statusText, { color: "#6C6C6C" }]}>Draft</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  // Combine offers (exclude drafts) and apply filtering & sorting
  const combinedItems = [...(data?.offers || [])]
    .filter((item) => {
      if (!filterStatus) return true;
      let status = getStatus(item, role || "");
      return status === filterStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "-createdAt" ? dateB - dateA : dateA - dateB;
    });

  return (
    <View
      style={[isWeb && isWideScreen && styles.webContainer, styles.container]}
    >
      <View style={styles.filterBar}>
        <View style={styles.sortBy}>
          <Text style={styles.sortByLabel}>Sort by:</Text>
          <Pressable
            style={styles.sortButton}
            onPress={() =>
              setSortBy(sortBy === "createdAt" ? "-createdAt" : "createdAt")
            }
          >
            <Text style={styles.sortButtonText}>
              {sortBy === "createdAt" ? "Newest First" : "Oldest First"}
            </Text>
            <Arrowdown01 width={16} height={16} />
          </Pressable>
        </View>

        {/* Filter by Status (Dropdown) */}
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
        {isLoading ? (
          <ActivityIndicator size="large" color="#430B92" />
        ) : error ? (
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "An error occurred"}
          </Text>
        ) : combinedItems.length > 0 ? (
          combinedItems.map((item: any) =>
            item.isDraft ? renderDraft(item) : renderOffer(item)
          )
        ) : (
          <Text style={styles.errorText}>No offers found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// Helper function to get platform icon
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
      return null;
  }
}

// Helper function to get status color
const getStatusColor = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case "draft":
      return "#DAF7A6"; // yellow color for draft
    case "offer sent":
    case "offer received":
      return "#3B82F6";
    case "viewed by creator":
    case "viewed by marketer":
      return "#10B981"; // Green color for viewed status
    case "offer in review":
      return "#F59E0B";
    case "rejected-countered":
      return "#F59E0B";
    case "rejected":
      return "#EF4444";
    case "accepted":
      return "#10B981";
    case "cancelled":
      return "#6C6C6C";
    default:
      return "#F59E0B"; // fallback color
  }
};

const styles = StyleSheet.create({
  container: {
    paddingHorozontal: 30,
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  webContainer: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  placeholder: {},
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
  offerCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
  },
  offerContent: {
    gap: 8,
  },
  offerName: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000000",
    fontFamily: FontFamily.inter,
    textTransform: "capitalize",
  },
  offerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  offerDate: {
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
  creatorImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
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
    minWidth: 160,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#000000",
  },
});