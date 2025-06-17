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
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";

export default function MarketerOfferHistoryList() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Dynamically build possible statuses
  const possibleStatuses = useMemo(() => {
    if (!user) return [];

    const viewedByOtherSide =
      user.userType === "Marketer" ? "Viewed by Creator" : "Viewed by Marketer";

    const offerSent =
      user.userType === "Marketer" ? "Offer Sent" : "Offer Received";

    return [
      "", // Means "All Status"
      "Draft",
      offerSent,
      viewedByOtherSide,
      "Offer in Review",
      "Rejected-Countered",
      "Rejected",
      "Accepted",
      "Cancelled",
    ];
  }, [user]);

  const { data, isLoading, error } = useQuery({
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

    // Add viewed status to the main status
    if (role === "Marketer" && offer.viewedByCreator) {
      return "Viewed by Creator";
    }
    if (role === "Creator" && offer.viewedByMarketer) {
      return "Viewed by Marketer";
    }

    if (role === "Marketer") {
      switch (offer.status) {
        case "Offer Sent":
          return "Offer Sent";
        case "Offer Received":
          return "Offer Sent"; // From marketer's view, it's still "Sent"
        case "Offer in Review":
          return "Offer in Review";
        case "Rejected-Countered":
          return "Rejected-Countered";
        case "Rejected":
          return "Rejected";
        case "Accepted":
          return "Accepted";
        case "Cancelled":
          return "Cancelled";
        default:
          return offer.status;
      }
    } else if (role === "Creator") {
      switch (offer.status) {
        case "Offer Sent":
          return "Offer Received";
        case "Offer Received":
          return "Offer Received";
        case "Offer in Review":
          return "Offer in Review";
        case "Rejected-Countered":
          return "Rejected-Countered";
        case "Rejected":
          return "Rejected";
        case "Accepted":
          return "Accepted";
        case "Cancelled":
          return "Cancelled";
        default:
          return offer.status;
      }
    }
    return offer.status;
  };

  // Render an offer
  const renderOffer = (offer: any) => {
    const dataBasedOnRole =
      user?.userType === "Creator" ? offer.marketerId : offer.creatorId;

    const displayData = {
      ...offer,
      proposedAmount: offer?.currentDraft?.amount || offer?.proposedAmount,
      desiredPostDate: offer?.currentDraft?.postDate || offer?.desiredPostDate,
      status: getStatus(offer, role || ""),
      deliverables: offer?.currentDraft?.deliverables || offer?.deliverables,
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
                currency: "USD",
                style: "currency",
              })}
            </Text>
            <Text style={styles.offerDate}>
              Desired Post Date:{" "}
              {displayData.desiredPostDate
                ? format(new Date(displayData.desiredPostDate), "dd MMM, yyyy")
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

  // Combine offers and drafts, apply sorting and filtering
  const combinedItems = [
    ...(data?.offers || []),
    ...(data?.newDrafts || []).map((draft: any) => ({
      ...draft,
      isDraft: true,
    })),
  ].filter((item) => {
    if (!filterStatus) return true;

    let status;
    if (item.isDraft) {
      status = "Draft";
    } else {
      status = getStatus(item, role || "");
    }

    return status === filterStatus;
  });

  return (
    <>
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
          combinedItems.map((item: any) => renderOffer(item))
        ) : (
          <Text style={styles.errorText}>No offers found.</Text>
        )}
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
  switch (status?.toLowerCase()) {
    case "draft":
      return "#DAF7A6";
    case "offer sent":
    case "offer received":
      return "#3B82F6";
    case "viewed by creator":
    case "viewed by marketer":
      return "#10B981";
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
      return "#F59E0B";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

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
    // alignItems: "center",
    marginBottom: 16,
    marginHorizontal: 3,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#000000",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
});
