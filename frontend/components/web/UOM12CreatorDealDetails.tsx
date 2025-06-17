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
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import Arrowleft02 from "../../assets/arrowleft02.svg";
import Fileuploadicon from "../../assets/-file-upload-icon.svg";
import YoutubeIcon from "../../assets/youtube-icon.svg";
import InstagramIcon from "../../assets/instagram-icon.svg";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
import Navbar from "./navbar";
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/creator/deals";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

function getPlatformIcon(deliverable: string) {
  switch (deliverable.toLowerCase()) {
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

export default function CreatorDealDetails({ dealId }: { dealId: string }) {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;

  // Fetch deal details
  const { data: deal, isLoading } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/${dealId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
    <Navbar pageTitle="Deal Details"/>
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        {/* <View style={styles.header}>
          <CustomBackButton />
          <Text style={styles.headerTitle}>Deal Details</Text>
          <TouchableOpacity
            style={styles.placeholder}
            onPress={() => {
              router.push("/profile");
            }}
          >
            <ProfileInfo />
          </TouchableOpacity>
        </View> */}

        <View style={styles.dealCard}>
          <Text style={styles.dealName}>{deal?.offerName}</Text>
          <Text style={styles.dealAmount}>
            ${deal?.amount.toLocaleString()}
          </Text>

          <View style={styles.userInfo}>
            <View style={styles.userProfile}>
              <Text style={styles.username}>@{deal?.marketerUsername}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{deal?.status}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Platforms</Text>
            <View style={styles.platformIcons}>
              {deal?.deliverables.map((deliverable: string, index: number) => (
                <View key={index} style={styles.platformIcon}>
                  {getPlatformIcon(deliverable)}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{deal?.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Desired Post Date</Text>
            <Text style={styles.detailText}>
              {new Date(deal?.desiredPostDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Desired Content Review Date</Text>
            <Text style={styles.detailText}>
              {new Date(deal?.desiredReviewDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Deal No</Text>
            <Text style={styles.detailText}>#{deal?.dealId}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Transaction No</Text>
            <Text style={styles.detailText}>#{deal?.transactionId}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Files</Text>
            <View style={styles.filesList}>
              {deal?.files.map((file: any, index: number) => (
                <View key={index} style={styles.fileItem}>
                  <Fileuploadicon width={28} height={28} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileSize}>{file.size}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          style={[
            styles.uploadButton,
            isWeb && isWideScreen && styles.webButton,
          ]}
          onPress={() => router.push("/UOM13CreatorUploadProof")}
        >
          <Text style={styles.uploadButtonText}>Upload Proof</Text>
        </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "5%",    
    //width: "100%",
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
  },
  placeholder: {},
  dealCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  dealName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  dealAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
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
  },
  platformIcons: {
    flexDirection: "row",
    gap: 8,
  },
  platformIcon: {
    width: 35,
    height: 35,
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#6C6C6C",
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
  },
  fileSize: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  uploadButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  webButton: {
    maxWidth: 400,
    alignSelf: "center",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
