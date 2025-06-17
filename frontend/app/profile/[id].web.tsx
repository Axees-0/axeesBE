import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
  Share,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams, Redirect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import Arrowleft02 from "@/assets/arrowleft02.svg";
import QrCode from "@/assets/qr-code.svg";
import Link from "@/assets/linksquare01.svg";
import Unlink04 from "@/assets/unlink04.svg";
import MakeOfferModal from "@/components/ProfileMakeOfferModal";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import AlertMultiPlatform from "@/components/Alert";
import Navbar from "../../components/web/navbar";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api";
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const { width, height } = Dimensions.get("window");

export default function MyProfile() {
  const windowSize = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = windowSize.width >= BREAKPOINTS.TABLET;
  const isMobile = windowSize.width < BREAKPOINTS.TABLET;
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [showProceedModal, setShowProceedModal] = useState(false);
  const [statsCache, setStatsCache] = useState<{ [key: string]: any }>({});

  
  const [selectedPlatformIndex, setSelectedPlatformIndex] = useState<
    number | null
  >(null);
  // Fetch profile data from backend
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/users/${id}`);
      return { user: response.data }
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/profile/${id}`;
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(shareUrl);

        Toast.show({
          text1: "Link copied to clipboard",
          type: "success",
        });
      } else {
        await Share.share({
          message: `Check out my profile on Axees: ${shareUrl}`,
        });
      }
    } catch (error) {
      console.error("Error sharing profile:", error);
    }
  };

  // Get the correct data based on user type
  const displayProfile = profile?.user || {};
  const dataBasedOnType =
    profile?.user?.userType === "Creator"
      ? profile?.user?.creatorData
      : profile?.user?.marketerData;

  const getInfluencerTier = (
    totalFollowers: number
  ): { tier: string; color: string } => {
    if (totalFollowers >= 10000000) {
      return { tier: "Star", color: "#F7D51A" }; // yellow
    } else if (totalFollowers >= 1000000) {
      return { tier: "Mega", color: "#FF0000" }; // red
    } else if (totalFollowers >= 100000) {
      return { tier: "Macro", color: "#F79F1A" }; // orange
    } else if (totalFollowers >= 10000) {
      return { tier: "Micro", color: "#1A8FF7" }; // blue
    } else {
      return { tier: "Nano", color: "#1AF75D" }; // green
    }
  };

  const selectPlatform = (index: number) => {
    setSelectedPlatformIndex(index);
  };


  const getDisplayStats = () => {
  if (!id) return {
    followers: 0,
    listedEvents: 0,
    combinedViews: 0,
    deals: 0,
    offers: 0,
  };

  // If stats already cached for this user ID, return cached value
  if (statsCache[id]) {
    return statsCache[id];
  }

  // Helper to get random int between min and max inclusive
  const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  let deals, followers;

  if (selectedPlatformIndex === null) {
    // Sum followersCount across all platforms for total followers
    followers = dataBasedOnType?.platforms?.reduce(
      (acc, platform) => acc + (platform.followersCount || 0),
      0
    ) || 0;
    deals = randomInt(5, 29);
  } else {
    deals = randomInt(5, 30);
    followers =
      dataBasedOnType?.platforms?.[selectedPlatformIndex]?.followersCount || 0;
  }

  const stats = {
    followers,
    listedEvents: randomInt(50, 150),
    combinedViews: randomInt(134, 3450),
    deals,
    offers: deals * 3,
  };

  const cacheKey = `${id}-${selectedPlatformIndex}`;

if (statsCache[cacheKey]) {
  return statsCache[cacheKey];
}
  // Cache the generated stats keyed by user ID
  setStatsCache((prev) => ({
  ...prev,
  [cacheKey]: stats,
}));


  return stats;
};




  useEffect(() => {
  if (dataBasedOnType?.platforms) {
    setSelectedPlatformIndex(null); // Show total followers sum by default
  }
}, [dataBasedOnType]);


  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#430B92" />
        </View>
      </SafeAreaView>
    );
  }

  if (user?._id === id) {
    return <Redirect href="/profile" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Navbar
          pageTitle={
            profile?.user?.userType === "Creator"
              ? "Creator Profile"
              : "Marketer Profile"
          }
        />

      

      <ScrollView style={styles.content}>
        <View style={styles.coverImageContainer}>
          <Image
            source={require("@/assets/cover.png")}
            style={styles.coverImage}
            contentFit="cover"
          />
          <View style={styles.coverOverlay}>
            <View style={styles.coverOverlayRow}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.qrContainer}
                  onPress={() => setQRModalVisible(true)}
                >
                  <QrCode width={20} height={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareContainer}
                  onPress={() => {
                    if (Platform.OS === "web") {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/profile/${id}`
                      );

                      Toast.show({
                        text1: "Link copied to clipboard",
                        type: "success",
                      });
                    }
                  }}
                >
                  <Image
                    source={require("@/assets/copy-01.png")}
                    style={{
                      width: 20,
                      height: 20,
                    }}
                  />
                </TouchableOpacity>
              </View>

              {displayProfile.buythis && (
                <Pressable
                  onPress={() => {
                    if (Platform.OS === "web") {
                      navigator.clipboard.writeText(displayProfile.buythis);

                      Toast.show({
                        text1: "Link copied to clipboard",
                        type: "success",
                      });
                    }
                  }}
                  style={styles.shareContainer}
                >
                  <Unlink04 width={20} height={20} />
                  <Text style={styles.shareText}>Buythis</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.mainContent,
            isWeb && isWideScreen && styles.webContainer,
          ]}
        >
          <View style={[styles.profileContainer]}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: displayProfile.avatarUrl?.includes("http")
                    ? displayProfile.avatarUrl
                    : BACKEND_URL + displayProfile.avatarUrl,
                }}
                placeholder={require("@/assets/empty-image.png")}
                style={styles.profileImage}
                contentFit="cover"
              />
            </View>

            <View style={[styles.profileInfo]}>
              <View style={[styles.nameSection]}>
                <Text style={[styles.name, !isWideScreen && { fontSize: 18 }]}>
                  {displayProfile.name}
                </Text>
                <Text
                  style={[styles.username, !isWideScreen && { fontSize: 12 }]}
                >
                  {displayProfile.userName || displayProfile.brandName || ""}
                </Text>
              </View>

              <View style={styles.categoryContainer}>
                <View style={styles.categoryBadge}>
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: getInfluencerTier(
                          dataBasedOnType?.totalFollowers || 0
                        ).color,
                      },
                    ]}
                  >
                    {
                      getInfluencerTier(dataBasedOnType?.totalFollowers || 0)
                        .tier
                    }
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.categoryUnlink}
                  onPress={handleShare}
                >
                  <Unlink04 width={20} height={20} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            {dataBasedOnType?.categories?.map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{category}</Text>
              </View>
            ))}
          </View>

          <View style={styles.socialIconsContainer}>
            {dataBasedOnType?.platforms?.map((platform, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.platformIconContainer,
                    {
                      borderColor:
                        selectedPlatformIndex === index
                          ? "#430B92"
                          : "transparent",
                      borderBottomWidth:
                        selectedPlatformIndex === index ? 1 : 0,
                    },
                  ]}
                  onPress={() => {
                    selectPlatform(index);
                  }}
                >
                  <Image
                    source={getPlatformIcon(platform.platform)}
                    style={styles.platformIcon}
                    contentFit="contain"
                  />
                </TouchableOpacity>
                <View style={styles.statDivider} />
              </React.Fragment>
            ))}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Followers</Text>
              <Text style={styles.statValue}>
                {formatNumber(getDisplayStats().followers)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Listed Events</Text>
              <Text style={styles.statValue}>
                {formatNumber(getDisplayStats().listedEvents)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Combined Views</Text>
              <Text style={styles.statValue}>
                {formatNumber(getDisplayStats().combinedViews)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Offers</Text>
              <Text style={styles.statValue}>
                {formatNumber(getDisplayStats().offers)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Deals</Text>
              <Text style={styles.statValue}>
                {formatNumber(getDisplayStats().deals)}
              </Text>
            </View>
          </View>
          <View style={styles.bioContainer}>
            <Text style={styles.bioTitle}>Bio</Text>
            <Text style={styles.bio}>{displayProfile.bio}</Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.mediaPackageButton, isMobile && { flex: 1 }]}
              onPress={() => {
                if (dataBasedOnType?.mediaPackageUrl) {
                  Linking.openURL(
                    process.env.EXPO_PUBLIC_BACKEND_URL +
                      dataBasedOnType.mediaPackageUrl
                  );
                } else {
                  Toast.show({
                    text1: "No media package available",
                    type: "error",
                  });
                }
              }}
            >
              <Image source={require("@/assets/share-08.png")} />
              <Text style={styles.mediaPackageText}>Media Package</Text>
            </Pressable>

            {user?.userType !== "Creator" ? (
              <Pressable
                style={[styles.makeOfferButton, isMobile && { flex: 1 }]}
                onPress={() => {
                  if (!user?._id) {
                    // Store the current route in session storage
                    sessionStorage.setItem(
                      "redirectAfterLogin",
                      `/profile/${id}`
                    );
                    router.push("/UAM001Login");
                  } else {
                    if (dataBasedOnType?.platforms?.length > 0) {
                      setIsOfferModalVisible(true);
                    } else {
                      setShowProceedModal(true);
                    }
                  }
                }}
              >
                <Text style={styles.makeOfferText}>Make Offer</Text>
              </Pressable>
            ) : (
              <View style={{ width: "30%" }} />
            )}
          </View>

          <View style={styles.socialStats}>
            <Text style={styles.sectionTitle}>Social Links</Text>

            <View
              style={[
                styles.socialPlatforms,
                isWeb && isWideScreen && styles.webSocialPlatforms,
              ]}
            >
              {dataBasedOnType?.platforms?.map((platform) => (
                <View key={platform.platform} style={styles.platformStats}>
                  <View style={styles.platformIconWrapper}>
                    <Image
                      source={getPlatformIcon(platform.platform)}
                      style={styles.platformIconLarge}
                      contentFit="contain"
                    />
                    <View style={styles.platformCountWrapper}>
                      <Text style={styles.platformCount}>
                        {formatNumber(platform.followersCount)}
                      </Text>
                    </View>
                  </View>
                
                  <Pressable
                    style={styles.viewButton}
                    onPress={() => {
                      switch (platform.platform.toLowerCase()) {
                        case "instagram":
                          Linking.openURL(
                            `https://www.instagram.com/${platform.handle}`
                          );
                          break;
                        case "youtube":
                          Linking.openURL(
                            `https://www.youtube.com/${platform.handle}`
                          );
                          break;
                        case "tiktok":
                          Linking.openURL(
                            `https://www.tiktok.com/${platform.handle}`
                          );
                          break;
                        case "facebook":
                          Linking.openURL(
                            `https://www.facebook.com/${platform.handle}`
                          );
                          break;
                        case "twitter":
                          Linking.openURL(
                            `https://www.twitter.com/${platform.handle}`
                          );
                          break;
                        case "twitch":
                          Linking.openURL(
                            `https://www.twitch.tv/${platform.handle}`
                          );
                          break;
                        default:
                          break;
                      }
                    }}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                    <Link width={20} height={20} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {dataBasedOnType?.achievements && (
            <View style={styles.achievements}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              {dataBasedOnType?.achievements
                ?.split("\n")
                ?.map((achievement, index) => (
                  <Text key={index} style={styles.achievementText}>
                    • {achievement}
                  </Text>
                ))}
            </View>
          )}

          {dataBasedOnType?.businessVentures && (
            <View style={styles.businessVentures}>
              <Text style={styles.sectionTitle}>Business Ventures</Text>
              {dataBasedOnType?.businessVentures
                ?.split("\n")
                ?.map((venture, index) => (
                  <Text key={index} style={styles.ventureText}>
                    • {venture}
                  </Text>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isQRModalVisible}
        onRequestClose={() => setQRModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQRModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <QRCode
              value={`${window.location.origin}/profile/${id}`}
              size={200}
            />
            <Text style={styles.modalUsername}>
              {displayProfile.userName || displayProfile.brandName}
            </Text>
            <Text style={styles.modalOr}>or</Text>
            <Pressable
              onPress={() => {
                Linking.openURL(
                  `sms:?body=${window.location.origin}/profile/${id}`
                );
              }}
            >
              <Image
                source={require("@/assets/share-08.png")}
                style={{ width: 32, height: 32 }}
              />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showProceedModal}
        onRequestClose={() => setShowProceedModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowProceedModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Are you sure you want to proceed?
            </Text>
            <Text style={styles.modalDescription}>
              This creator has no social media platform, are you sure you want
              to send an offer?
            </Text>
            <View style={styles.actionButtons}>
              <Pressable
                style={[
                  styles.makeOfferButton,
                  {
                    width: "100%",
                    borderColor: "#430B92",
                    borderWidth: 1,
                    backgroundColor: "#FFFFFF",
                  },
                ]}
                onPress={() => setShowProceedModal(false)}
              >
                <Text style={[styles.makeOfferText, { color: "#430B92" }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[styles.makeOfferButton, { width: "100%" }]}
                onPress={() => {
                  setShowProceedModal(false);
                  setIsOfferModalVisible(true);
                }}
              >
                <Text style={styles.makeOfferText}>Proceed</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <MakeOfferModal
        creatorId={id + ""}
        creatorName={displayProfile.name}
        visible={isOfferModalVisible}
        onClose={() => setIsOfferModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function formatNumber(num: number): string {
  if (!num) return "0";
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
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
      return require("@/assets/1707226109new-twitter-logo-png 1.png");
    default:
      return require("@/assets/letter-s.png");
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: width * 0.02,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    maxWidth: "30%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  modalDescription: {
    fontSize: 16,
    color: "#6C6C6C",
  },
  modalUsername: {
    color: "#430B92",
  },
  modalOr: {
    marginVertical: height * 0.02,

    color: "#6C6C6C",
  },
  bioContainer: {
    marginTop: height * 0.02,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareIconButton: {
    backgroundColor: "#430B92",
    padding: width * 0.03,
    borderRadius: 50,
  },
  offerModalContent: {
    backgroundColor: "#FFFFFF",
    padding: width * 0.05,
    borderRadius: 16,
    width: width * 0.9,
  },
  offerModalTitle: {
    fontSize: width * 0.06,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: height * 0.01,
  },
  offerModalSubtitle: {
    color: "#6C6C6C",
    marginBottom: height * 0.02,
  },
  offerOption: {
    backgroundColor: "#F0E7FD",
    paddingVertical: height * 0.02,

    borderRadius: 8,
    marginBottom: height * 0.01,
  },
  offerOptionText: {
    color: "#430B92",
  },
  nextButton: {
    backgroundColor: "#430B92",
    paddingVertical: height * 0.02,
    borderRadius: 8,
    alignItems: "center",
    marginTop: height * 0.02,
  },
  nextButtonText: {
    color: "#FFFFFF",

    fontWeight: "600",
  },

  content: {
    flex: 1,
    
  },
  webContainer: {
    marginHorizontal: "15%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: "5%",
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
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
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
    marginHorizontal: "5%",
  },
  qrContainer: {
    backgroundColor: "#F0E7FD",
    padding: 8,
    borderRadius: 100,
  },
  shareContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0E7FD",
    padding: 8,
    borderRadius: 100,
    gap: 8,
  },
  shareText: {
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

  profileImage: {
    width: 125,
    height: 125,
    borderRadius: 25,
  },

  categoryText: {
    color: "#F79F1A",
    fontSize: 14,
    marginRight: -8,
    fontFamily: "rOGLyonsType",
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
  platformIconContainer: {
    paddingBottom: 5,
  },
  platformIcon: {
    width: 24,
    height: 24,
  },
  platformIconLarge: {
    width: 30,
    height: 30,
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
    justifyContent: "space-around",
  },
  mediaPackageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
    width: "30%",
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
    backgroundColor: "#430B92",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    width: "30%",
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
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
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
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
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
  profileContainer: {
    padding: 20,
    flexDirection: "row",
    position: "relative",
    minHeight: 80,
    marginTop: -25,
    alignItems: "flex-start",
  },

  profileImageContainer: {
    width: 125,
    height: 125,
    borderRadius: 25,
    overflow: "hidden",
    marginRight: 20,
    marginTop: -70,
    backgroundColor: "white",
  },

  profileInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  nameSection: {
    flex: 1,
    marginRight: 16,
  },

  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
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
    flexDirection: "column",
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
});
