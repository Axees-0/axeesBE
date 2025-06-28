"use client";

import React from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { getPlatformIcon } from "@/constants/platforms";

import Arrowleft022 from "../../assets/arrowleft022.svg";
import Fileuploadicon from "../../assets/-file-upload-icon.svg";
import YoutubeIcon from "../../assets/youtube-icon.svg";
import InstagramIcon from "../../assets/instagram-icon.svg";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const fetchOffer = async (offerId: string, role: string, userId: string) => {
  const response = await axios.get(
    `${API_URL}/api/marketer/offers/${offerId}?role=${role}&userId=${userId}`
  );
  return response.data.offer;
};

export default function MarketerOfferDetail() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;

  const { offerId } = useLocalSearchParams();
  const { user } = useAuth();

  const {
    data: offer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["offer", offerId, user?.userType, user?._id],
    queryFn: () => {
      if (user?.userType && user?._id) {
        return fetchOffer(offerId as string, user?.userType, user?._id);
      }
      return null;
    },
    enabled: !!offerId && !!user?.userType && !!user?._id,
    retry: 2,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Error: {(error as Error).message}</Text>
      </SafeAreaView>
    );
  }

  if (!offer && user?.userType && user?._id) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No offer data found.</Text>
      </SafeAreaView>
    );
  }

  if (!user?.userType || !user?._id) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Authenticating...</Text>
      </SafeAreaView>
    );
  }

  // Determine the other party's information
  const otherParty =
    user?.userType === "Marketer" ? offer.creatorId : offer.marketerId;

  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />

        <Text style={styles.headerTitle}>Offer Details</Text>
        <ProfileInfo />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.offerCard}>
          <Text style={styles.offerName}>{offer.offerName}</Text>
          <Text style={styles.offerAmount}>
            ${offer.proposedAmount.toFixed(2)}
          </Text>

          <View style={styles.userInfo}>
            <View style={styles.userProfile}>
              <Text style={styles.username}>
                {otherParty ? `${otherParty.name}` : "N/A"}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{offer.status}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Platforms</Text>
            <View style={styles.platformIcons}>
              {offer.deliverables.map((platform: string, index: number) => (
                <Image
                  key={index}
                  source={getPlatformIcon(platform)}
                  style={styles.platformIcon}
                />
              ))}
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>
              {offer.description || "No description provided."}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Desired Post Date</Text>
            <Text style={styles.detailText}>
              {offer.desiredPostDate
                ? new Date(offer.desiredPostDate).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Desired Content Review Date</Text>
            <Text style={styles.detailText}>
              {offer.desiredReviewDate
                ? new Date(offer.desiredReviewDate).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.detailText}>{offer.notes || "N/A"}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Files</Text>
            <View style={styles.filesList}>
              {offer.attachments?.map((file: any, index: number) => (
                <View key={index} style={styles.fileItem}>
                  <Fileuploadicon width={28} height={28} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>
                      {file.name || `File ${index + 1}`}
                    </Text>
                    <Text style={styles.fileSize}>
                      {file.size
                        ? `${(file.size / 1024).toFixed(2)} KB`
                        : "N/A"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          style={[
            styles.messageButton,
            isWeb && isWideScreen && styles.webButton,
          ]}
          onPress={() => router.push("/messages")}
        >
          <Text style={styles.messageButtonText}>Message Creator</Text>
        </Pressable>
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholder: {},
  offerCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  offerName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  offerAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  username: {
    fontSize: 16,
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  statusBadge: {
    backgroundColor: "#430B92",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  detailsContainer: {
    gap: 24,
  },
  detailSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 20,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  platformIcons: {
    flexDirection: "row",
    gap: 8,
  },
  platformIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  detailText: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  filesList: {
    gap: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    padding: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  fileSize: {
    fontSize: 12,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  messageButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  webButton: {
    alignSelf: "center",
    width: "100%",
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
