"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

// Import SVG components
import Arrowleft02 from "../assets/arrowleft02.svg";

import Unlink04 from "../assets/unlink04.svg";
import Qrcode from "../assets/qr-code.svg";
import Link01 from "../assets/linksquare01.svg";
import { Gap } from "@/GlobalStyles";
import MakeOfferModal from "@/components/ProfileMakeOfferModal";
import ProfileInfo from "@/components/ProfileInfo";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function PublicProfile() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const mockProfile = {
    name: "Ashley Vaughn",
    username: "@the_ashley_vaughan",
    category: "Macro",
    bio: "A video creator, a car lover and enthusiast in Reels, Memes, Merch, Fine Arts, and Prints. 20B FC RX7, BMW E46, LS WRX...",
    categories: ["Entertainment", "Car Enthusiast", "Molder", "Merch"],
    stats: {
      totalFollowers: "343K",
      listedEvents: "43",
      combinedViews: "4M+",
      offers: "123",
      deals: "87",
      socialPlatforms: {
        instagram: "132K",
        tiktok: "123K",
        youtube: "11K",
        facebook: "81K",
      },
    },
    achievements: [
      "Most followed individual as a Car Enthusiast on Instagram",
      "Creative youtube videos",
    ],
    businessVentures: [
      "20B FC RX7",
      "BMW E46",
      "LS WRX",
      "CORVETTE C7 Z06",
      "LB7 D-MAX",
    ],
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar style="dark" />
      <Navbar pageTitle="Payouts Detail" />

      <ScrollView style={styles.content}>
        <View style={styles.coverImageContainer}>
          <Image
            source={require("../assets/cover.png")}
            style={styles.coverImage}
            contentFit="cover"
          />
          <View style={styles.coverOverlay}>
            <View style={styles.coverOverlayRow}>
              <View style={styles.qrContainer}>
                <Qrcode width={24} height={24} />
              </View>
              <View style={styles.buythisContainer}>
                <Unlink04 width={20} height={20} />
                <Text style={styles.buythisText}>buythis</Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.mainContent,
            isWeb && isWideScreen && styles.webContainer,
          ]}
        >
          <View
            style={[
              styles.profileContainer,
              !isWideScreen && {
                width: "80%",
              },
              isWideScreen && {
                width: "85%",
              },
            ]}
          >
            <View style={styles.profileImageContainer}>
              <Image
                source={require("../assets/rectangle-52.png")}
                style={styles.profileImage}
                contentFit="cover"
              />
            </View>

            <View
              style={[
                styles.profileInfo,
                isWideScreen && {
                  left: "15%",
                  width: "100%",
                },

                !isWideScreen && {
                  left: "45%",
                },
              ]}
            >
              <View style={styles.nameSection}>
                <Text style={styles.name}>{mockProfile.name}</Text>
                <Text style={styles.username}>{mockProfile.username}</Text>
              </View>

              <View style={styles.categoryContainer}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {mockProfile.category}
                  </Text>
                </View>
                <View style={styles.categoryUnlink}>
                  <Unlink04 width={20} height={20} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            {mockProfile.categories.map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{category}</Text>
              </View>
            ))}
          </View>

          <View style={styles.socialIconsContainer}>
            <View
              style={{
                borderBottomWidth: 1,
                borderColor: "#430B92",
                paddingBottom: 5,
              }}
            >
              <Image
                source={require("../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png")}
                style={{
                  width: 24,
                  height: 24,
                }}
                contentFit="contain"
              />
            </View>
            <View style={styles.statDivider} />
            <Image
              source={require("../assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
            <View style={styles.statDivider} />
            <Image
              source={require("../assets/tiktok-icon.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
            <View style={styles.statDivider} />
            <Image
              source={require("../assets/facebook-icon.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Followers</Text>
              <Text style={styles.statValue}>
                {mockProfile.stats.totalFollowers}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Listed Events</Text>
              <Text style={styles.statValue}>
                {mockProfile.stats.listedEvents}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Combined Views</Text>
              <Text style={styles.statValue}>
                {mockProfile.stats.combinedViews}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Offers</Text>
              <Text style={styles.statValue}>{mockProfile.stats.offers}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Deals</Text>
              <Text style={styles.statValue}>{mockProfile.stats.deals}</Text>
            </View>
          </View>

          <Text style={styles.bio}>{mockProfile.bio}</Text>

          <View style={styles.actionButtons}>
            <Pressable style={styles.mediaPackageButton}>
              <Image
                source={require("../assets/share-icon.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
              />
              <Text style={styles.mediaPackageText}>Media Package</Text>
            </Pressable>
            <Pressable
              style={styles.makeOfferButton}
              onPress={() => setIsOfferModalVisible(true)}
            >
              <Text style={styles.makeOfferText}>Make Offer</Text>
            </Pressable>
          </View>

          <View style={styles.socialStats}>
            <Text style={styles.sectionTitle}>Social Links</Text>

            <View
              style={[
                styles.socialPlatforms,
                isWeb && isWideScreen && styles.webSocialPlatforms,
              ]}
            >
              {Object.entries(mockProfile.stats.socialPlatforms).map(
                ([platform, count], index) => (
                  <View key={platform} style={[styles.platformStats]}>
                    {platform === "instagram" && (
                      <View style={styles.platformIconWrapper}>
                        <Image
                          source={require("../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png")}
                          style={{ width: 30, height: 30 }}
                          contentFit="contain"
                        />
                        <View style={styles.platformCountWrapper}>
                          <Text style={styles.platformCount}>{count}</Text>
                        </View>
                      </View>
                    )}

                    {platform === "tiktok" && (
                      <View style={styles.platformIconWrapper}>
                        <Image
                          source={require("../assets/tiktok-icon.png")}
                          style={{ width: 30, height: 30 }}
                          contentFit="contain"
                        />
                        <View style={styles.platformCountWrapper}>
                          <Text style={styles.platformCount}>{count}</Text>
                        </View>
                      </View>
                    )}
                    {platform === "youtube" && (
                      <View style={styles.platformIconWrapper}>
                        <Image
                          source={require("../assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png")}
                          style={{ width: 30, height: 30 }}
                          contentFit="contain"
                        />
                        <View style={styles.platformCountWrapper}>
                          <Text style={styles.platformCount}>{count}</Text>
                        </View>
                      </View>
                    )}
                    {platform === "facebook" && (
                      <View style={styles.platformIconWrapper}>
                        <Image
                          source={require("../assets/facebook-icon.png")}
                          style={{ width: 30, height: 30 }}
                          contentFit="contain"
                        />
                        <View style={styles.platformCountWrapper}>
                          <Text style={styles.platformCount}>{count}</Text>
                        </View>
                      </View>
                    )}

                    <Pressable style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>View</Text>
                      <Link01 width={24} height={24} />
                    </Pressable>
                    {index !==
                      Object.entries(mockProfile.stats.socialPlatforms).length -
                        1 &&
                      isWideScreen && <View style={styles.statDivider} />}
                  </View>
                )
              )}
            </View>
          </View>

          <View style={styles.achievements}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {mockProfile.achievements.map((achievement, index) => (
              <Text key={index} style={styles.achievementText}>
                • {achievement}
              </Text>
            ))}
          </View>

          <View style={styles.businessVentures}>
            <Text style={styles.sectionTitle}>Business Ventures</Text>
            {mockProfile.businessVentures.map((venture, index) => (
              <Text key={index} style={styles.ventureText}>
                • {venture}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <MakeOfferModal
        visible={isOfferModalVisible}
        onClose={() => setIsOfferModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
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
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholder: {},
  coverImageContainer: {
    position: "relative",
    height: 200,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
  },
  coverOverlayRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  qrContainer: {
    backgroundColor: "#F0E7FD",
    padding: 8,
    borderRadius: 100,
  },
  buythisContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0E7FD",
    padding: 8,
    borderRadius: 100,
    gap: 8,
  },
  buythisText: {
    color: "#430B92",
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  mainContent: {
    padding: 20,
  },
  profileImageContainer: {
    position: "absolute",
    top: -70,
    left: 0,
    borderRadius: 25,
    overflow: "hidden",
    width: 140,
  },
  profileContainer: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    minHeight: 80,
  },
  profileImage: {
    width: 125,
    height: 125,
    borderRadius: 25,
  },
  profileInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
  },
  nameSection: {
    gap: 4,
    marginRight: 20,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  username: {
    fontSize: 16,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  categoryContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryText: {
    color: "#F79F1A",
    fontSize: 14,
    marginRight: -8,
    fontFamily: Platform.select({
      ios: "rOGLyonsType",
      android: "rOGLyonsType",
      default: "rOGLyonsType",
    }),
  },
  categoryUnlink: {
    backgroundColor: "#F0E7FD",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 100,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    backgroundColor: "#F0E7FD",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryTagText: {
    color: "#430B92",
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  socialIconsContainer: {
    flexDirection: "row",
    gap: 4,
    marginTop: 16,
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E2E2",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6C6C6C",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E2E2",
  },
  bio: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
    marginTop: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  mediaPackageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
  },
  mediaPackageText: {
    color: "#430B92",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  makeOfferButton: {
    flex: 1,
    backgroundColor: "#430B92",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  makeOfferText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  socialStats: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  socialPlatforms: {
    gap: 12,    elevation: 6,
    borderRadius: 12,
  },
  webSocialPlatforms: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  platformStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    gap: Gap.gap_sm,
  },
  platformCount: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  platformIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  platformCountWrapper: {
    backgroundColor: "#F6F5F9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    marginLeft: -8,
    zIndex: -1,
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewButtonText: {
    color: "#430B92",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  achievements: {
    marginTop: 32,
  },
  achievementText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  businessVentures: {
    marginTop: 32,
    marginBottom: 32,
  },
  ventureText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 24,
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
