import * as React from "react";
import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import Search01 from "@/assets/search01.svg";
import Zap from "@/assets/zap.svg";
import Share08 from "@/assets/share08.svg";
import Contracts from "@/assets/contracts.svg";
import Agreement02 from "@/assets/agreement02.svg";
import Arrowleft02 from "@/assets/arrowleft02.svg";
import {
  Gap,
  FontFamily,
  Color,
  Padding,
  Border,
  FontSize,
} from "@/GlobalStyles";
import { router } from "expo-router";
import MakeOfferModal from "@/components/account/ProfileMakeOfferModal";
import { useEffect, useState } from "react";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
  MOBILE: 540,
};

const { width, height } = Dimensions.get("window");

// DEMO PROFILE DATA - MrBeast for Investor Demo
const DEMO_PROFILE = {
  user: {
    name: "Jimmy Donaldson",
    userName: "MrBeast",
    bio: "American YouTuber, internet personality, and entrepreneur. Known for high-production videos, challenges, and philanthropy. Founder of MrBeast Burger, Feastables, and co-founder of Team Trees and Team Seas.",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_mmhGU--UOhkMGKUjLGaNQO-AaDIdnNaTb6GKlUlZEE=s900-c-k-c0x00ffffff-no-rj", // MrBeast avatar
    userType: "Creator",
    creatorData: {
      totalFollowers: 1100000000, // 1.1B+
      combinedViews: 20000000000, // 20B+
      nicheTopics: ["Content Creator"],
      offers: 1200,
      deals: 450,
      platforms: [
        { platform: "youtube", followersCount: 328000000, handle: "MrBeast" },
        { platform: "instagram", followersCount: 60000000, handle: "mrbeast" },
        { platform: "tiktok", followersCount: 104000000, handle: "mrbeast" },
        { platform: "facebook", followersCount: 20000000, handle: "MrBeast" }
      ]
    }
  }
};

export default function InvestorDemoProfile() {
  const windowSize = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = windowSize.width >= BREAKPOINTS.TABLET;
  const isMobile = windowSize.width < BREAKPOINTS.TABLET;
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);

  // Get the correct data based on user type
  const displayProfile = DEMO_PROFILE.user;
  const dataBasedOnType = DEMO_PROFILE.user.creatorData;

  // Mobile fallback (preserving AxeesMockup3 mobile layout)
  if (!isWideScreen) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/")} style={styles.backButton}>
            <Arrowleft02 width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Demo Profile</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.mobileProfileCard}>
            <Image
              source={{ uri: displayProfile.avatarUrl }}
              style={styles.mobileProfileImage}
              contentFit="cover"
            />
            <Text style={styles.mobileName}>{displayProfile.name}</Text>
            <Text style={styles.mobileUsername}>@{displayProfile.userName}</Text>
            <Text style={styles.mobileBio}>{displayProfile.bio}</Text>
            
            <TouchableOpacity
              style={styles.mobileOfferButton}
              onPress={() => setIsOfferModalVisible(true)}
            >
              <Text style={styles.mobileOfferText}>Create Offer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <MakeOfferModal
          visible={isOfferModalVisible}
          onClose={() => setIsOfferModalVisible(false)}
        />
      </View>
    );
  }

  // EXACT AxeesMockup3 Desktop Layout
  return (
    <View style={styles.axeesMockup5}>
      <ScrollView contentContainerStyle={{ flex: 1 }}>
        
        {/* EXACT Navigation Bar from AxeesMockup3 */}
        <View style={styles.frameParent}>
          <View style={styles.wrapper}>
            <TouchableOpacity onPress={() => router.push("/")}>
              <Image
                style={styles.icon}
                contentFit="cover"
                source={require("@/assets/3.png")}
              />
            </TouchableOpacity>
          </View>
          <View style={[styles.search01Parent, styles.parentFlexBox]}>
            <Search01 style={styles.search01Icon} width={24} height={24} />
            <Text style={[styles.searchCategoryTags, styles.kTypo]}>
              Search category tags (Fashion, DIY, Spiritual)
            </Text>
          </View>
          <View style={styles.frameGroup}>
            <TouchableOpacity
              style={[styles.signInWrapper, styles.wrapperBorder]}
              onPress={() => router.push("/UAM001Login")}
            >
              <Text style={[styles.signIn, styles.kTypo]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.joinWrapper, styles.wrapperParentSpaceBlock]}
              onPress={() => router.push("/URM01CreateAccount")}
            >
              <Text style={[styles.join, styles.joinTypo]}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* EXACT Hero Profile Section from AxeesMockup3 */}
        <View style={[styles.frameContainer, styles.ctasPosition]}>
          <View style={styles.rectangleParent}>
            <Image
              style={styles.frameChild}
              contentFit="cover"
              source={{ uri: displayProfile.avatarUrl }}
            />
            <View style={styles.frameView}>
              <View style={styles.frameParent1}>
                <View style={styles.frameWrapper}>
                  <View style={styles.foodWrapper}>
                    <Text style={[styles.food, styles.proTypo]}>
                      {dataBasedOnType?.nicheTopics?.[0] || "Content Creator"}
                    </Text>
                  </View>
                </View>
                <View style={styles.frameParent2}>
                  <View style={styles.jordanRiversParent}>
                    <Text style={[styles.jordanRivers, styles.kTypo]}>
                      {displayProfile.name}
                    </Text>
                    <Text style={[styles.jordanrivers, styles.bioTypo]}>
                      @{displayProfile.userName}
                    </Text>
                  </View>
                  <View style={[styles.frameParent3, styles.parentFlexBox]}>
                    <View style={styles.proWrapperSpaceBlock}>
                      <Text style={[styles.pro, styles.proTypo]}>Pro</Text>
                    </View>
                    <View
                      style={[
                        styles.availableParent,
                        styles.proWrapperSpaceBlock,
                      ]}
                    >
                      <Text style={[styles.pro, styles.proTypo]}>
                        Available
                      </Text>
                      <Zap width={24} height={24} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.shareProfileParent, styles.wrapperBorder]}>
                <Text style={[styles.signIn, styles.kTypo]}>Share Profile</Text>
                <Image
                  source={require("@/assets/share-08.png")}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>

          {/* EXACT Social Platforms + Metrics from AxeesMockup3 */}
          <View style={styles.frameParent4}>
            <View style={styles.frameParent5}>
              {dataBasedOnType?.platforms?.map((platform) => (
                <View key={platform.platform} style={styles.frameWrapper1}>
                  <View
                    style={[
                      styles.pngClipartInstagramLogoIcoParent,
                      styles.contractsWrapperFlexBox,
                    ]}
                  >
                    <Image
                      style={styles.pngClipartInstagramLogoIcoIcon}
                      contentFit="cover"
                      source={getPlatformIcon(platform.platform)}
                    />
                    <Text style={[styles.k, styles.kTypo]}>
                      {formatNumber(platform.followersCount)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.frameParent6}>
              <View style={styles.mParent}>
                <Text style={[styles.m, styles.mTypo]}>
                  {formatNumber(dataBasedOnType?.totalFollowers)}
                </Text>
                <Text style={[styles.totalFollowers, styles.kTypo]}>
                  Total Followers
                </Text>
              </View>
              <View style={styles.mParent}>
                <Text style={[styles.m, styles.mTypo]}>
                  {formatNumber(dataBasedOnType?.combinedViews)}
                </Text>
                <Text style={[styles.profileViews, styles.kTypo]}>
                  Profile Views
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* EXACT Bio Section from AxeesMockup3 */}
        <View style={[styles.bioParent, styles.parentPosition]}>
          <Text style={[styles.bio, styles.bioTypo]}>Bio</Text>
          <Text style={[styles.meetJordanRivers, styles.bioTypo]}>
            {displayProfile.bio}
          </Text>
        </View>

        {/* EXACT Activity Cards from AxeesMockup3 */}
        <View style={[styles.activityParent, styles.parentPosition]}>
          <Text style={[styles.bio, styles.bioTypo]}>Activity</Text>
          <View style={styles.frameParent7}>
            <View style={[styles.frameParent8, styles.parentBorder]}>
              <View
                style={[
                  styles.contractsWrapper,
                  styles.contractsWrapperFlexBox,
                ]}
              >
                <Contracts width={24} height={24} />
              </View>
              <View style={styles.frameParent2}>
                <Text style={[styles.jordanrivers, styles.bioTypo]}>
                  Offers
                </Text>
                <Text style={styles.mTypo}>
                  {formatNumber(dataBasedOnType?.offers)}
                </Text>
              </View>
            </View>
            <View style={[styles.frameParent8, styles.parentBorder]}>
              <View
                style={[
                  styles.contractsWrapper,
                  styles.contractsWrapperFlexBox,
                ]}
              >
                <Agreement02 width={24} height={24} />
              </View>
              <View style={styles.frameParent2}>
                <Text style={[styles.jordanrivers, styles.bioTypo]}>
                  Completed Deals
                </Text>
                <Text style={styles.mTypo}>
                  {formatNumber(dataBasedOnType?.deals)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* EXACT Bottom Action Buttons from AxeesMockup3 */}
        <View style={[styles.ctas, styles.ctasPosition]}>
          <View style={[styles.addToFavoritesWrapper, styles.wrapperLayout]}>
            <Text style={[styles.addToFavorites, styles.kTypo]}>
              Add to favorites
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.createOfferWrapper, styles.wrapperLayout]}
            onPress={() => setIsOfferModalVisible(true)}
          >
            <Text style={[styles.createOffer, styles.joinTypo]}>
              Create Offer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <MakeOfferModal
        visible={isOfferModalVisible}
        onClose={() => setIsOfferModalVisible(false)}
      />
    </View>
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
      return require("@/assets/pngclipartyoutubeplaybuttoncomputericonsyoutubeyoutubelogoanglerectanglethumbnail-13.png");
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

// EXACT STYLES from AxeesMockup3 - PRESERVED WITHOUT MODIFICATION
const styles = StyleSheet.create({
  // Mobile fallback styles
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  mobileProfileCard: {
    padding: 20,
    alignItems: "center",
  },
  mobileProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  mobileName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  mobileUsername: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 16,
  },
  mobileBio: {
    fontSize: 14,
    color: "#6C6C6C",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  mobileOfferButton: {
    backgroundColor: "#430B92",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  mobileOfferText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },

  // EXACT AxeesMockup3 styles - DO NOT MODIFY
  parentFlexBox: {
    gap: Gap.gap_md,
    flexDirection: "row",
  },
  kTypo: {
    fontFamily: FontFamily.inter,
  },
  wrapperBorder: {
    borderColor: Color.cSK430B92500,
    borderWidth: 1,
    borderStyle: "solid",
  },
  wrapperParentSpaceBlock: {
    paddingVertical: Padding.p_xs,
    paddingHorizontal: Padding.p_5xl,
    borderRadius: Border.br_xs,
  },
  joinTypo: {
    color: Color.white,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  ctasPosition: {
    width: 1116,
    marginLeft: -558,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    left: "50%",
    position: "absolute",
  },
  proTypo: {
    fontWeight: "600",
    fontSize: FontSize.size_base,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  bioTypo: {
    textAlign: "left",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  proWrapperSpaceBlock: {
    backgroundColor: Color.cSK430B9250,
    paddingVertical: Padding.p_7xs,
    paddingHorizontal: Padding.p_xs,
    borderRadius: Border.br_5xs,
    alignItems: "center",
    flexDirection: "row",
  },
  contractsWrapperFlexBox: {
    borderRadius: Border.br_81xl,
    backgroundColor: Color.cSK430B9250,
    alignItems: "center",
    flexDirection: "row",
  },
  mTypo: {
    fontWeight: "700",
    textAlign: "left",
    fontSize: FontSize.size_13xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  parentPosition: {
    marginLeft: -558,
    position: "absolute",
    left: "50%",
  },
  parentBorder: {
    borderWidth: 1,
    borderStyle: "solid",
  },
  wrapperLayout: {
    paddingVertical: Padding.p_base,
    paddingHorizontal: Padding.p_29xl,
    height: 79,
    width: 350,
    justifyContent: "center",
    borderRadius: Border.br_xs,
    alignItems: "center",
    marginBottom: 100,
    flexDirection: "row",
  },
  icon: {
    top: 0,
    left: 0,
    width: 139,
    height: 60,
    position: "absolute",
  },
  wrapper: {
    width: 162,
    height: 60,
  },
  search01Icon: {},
  searchCategoryTags: {
    opacity: 0.5,
    color: Color.cSK430B92950,
    textAlign: "center",
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_lg,
  },
  search01Parent: {
    backgroundColor: Color.buttonSelectable,
    borderColor: Color.colorPlum,
    paddingVertical: Padding.p_xs,
    paddingHorizontal: Padding.p_5xl,
    borderRadius: Border.br_xs,
    borderWidth: 1,
    borderStyle: "solid",
    flex: 1,
  },
  signIn: {
    color: Color.cSK430B92500,
    textAlign: "center",
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_lg,
  },
  signInWrapper: {
    paddingVertical: Padding.p_xs,
    paddingHorizontal: Padding.p_5xl,
    borderRadius: Border.br_xs,
    flexDirection: "row",
  },
  join: {
    fontSize: FontSize.size_lg,
  },
  joinWrapper: {
    backgroundColor: Color.cSK430B92500,
    flexDirection: "row",
  },
  frameGroup: {
    paddingLeft: Padding.p_5xl,
    gap: Gap.gap_3xs,
    alignItems: "center",
    flexDirection: "row",
  },
  frameParent: {
    marginLeft: -640,
    top: 20,
    width: 1280,
    paddingVertical: 0,
    paddingHorizontal: Padding.p_13xl,
    justifyContent: "space-between",
    left: "50%",
    alignItems: "center",
    flexDirection: "row",
    position: "absolute",
  },
  frameChild: {
    borderRadius: Border.br_6xl_2,
    width: 248,
    height: 248,
  },
  food: {
    color: Color.colorLimegreen_100,
  },
  foodWrapper: {
    backgroundColor: Color.colorLimegreen_200,
    paddingVertical: Padding.p_7xs,
    paddingHorizontal: Padding.p_xs,
    borderRadius: Border.br_5xs,
    alignItems: "center",
    flexDirection: "row",
  },
  frameWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
  },
  jordanRivers: {
    fontSize: FontSize.size_13xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  jordanrivers: {
    fontSize: FontSize.size_5xl,
    opacity: 0.5,
  },
  jordanRiversParent: {
    gap: Gap.gap_4xs,
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
  },
  pro: {
    color: Color.cSK430B92500,
  },
  availableParent: {
    gap: Gap.gap_4xs,
  },
  frameParent3: {
    alignItems: "center",
  },
  frameParent2: {
    gap: Gap.gap_2xs,
    alignSelf: "stretch",
  },
  frameParent1: {
    gap: Gap.gap_2xl,
    alignSelf: "stretch",
  },
  shareProfileParent: {
    gap: Gap.gap_md,
    flexDirection: "row",
    paddingVertical: Padding.p_xs,
    paddingHorizontal: Padding.p_5xl,
    borderRadius: Border.br_xs,
    width: "fit-content",
  },
  frameView: {
    width: 415,
    gap: Gap.gap_5xl,
  },
  rectangleParent: {
    gap: Gap.gap_4xl,
    alignItems: "center",
    flexDirection: "row",
  },
  pngClipartInstagramLogoIcoIcon: {
    height: 37,
    width: 37,
  },
  k: {
    color: Color.cSK430B92950,
    textAlign: "center",
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_lg,
  },
  pngClipartInstagramLogoIcoParent: {
    paddingRight: Padding.p_xs,
    gap: Gap.gap_4xs,
    alignSelf: "stretch",
  },
  frameWrapper1: {
    width: 99,
    justifyContent: "center",
  },
  frameParent5: {
    justifyContent: "flex-end",
    gap: Gap.gap_6xl,
  },
  m: {
    alignSelf: "stretch",
  },
  totalFollowers: {
    fontSize: FontSize.size_5xl,
    opacity: 0.5,
    color: Color.cSK430B92950,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  mParent: {
    gap: Gap.gap_4xs,
  },
  profileViews: {
    fontSize: FontSize.size_5xl,
    alignSelf: "stretch",
    opacity: 0.5,
    color: Color.cSK430B92950,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  frameParent6: {
    gap: Gap.gap_3xl,
    justifyContent: "center",
  },
  frameParent4: {
    gap: Gap.gap_5xl,
    alignItems: "center",
    flexDirection: "row",
  },
  frameContainer: {
    top: 165,
  },
  bio: {
    fontSize: FontSize.size_13xl,
    alignSelf: "stretch",
  },
  meetJordanRivers: {
    alignSelf: "stretch",
    opacity: 0.5,
    fontSize: FontSize.size_lg,
  },
  bioParent: {
    top: 435,
    width: 962,
    gap: Gap.gap_2xl,
  },
  contractsWrapper: {
    padding: Padding.p_base,
    width: "fit-content",
  },
  frameParent8: {
    borderRadius: Border.br_5xl,
    borderColor: Color.cSK430B92100,
    width: 274,
    paddingVertical: Padding.p_5xl,
    gap: Gap.gap_3xl,
    paddingHorizontal: Padding.p_13xl,
  },
  frameParent7: {
    gap: Gap.gap_sm,
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
  },
  activityParent: {
    top: 577,
    width: 563,
    gap: Gap.gap_3xl,
  },
  addToFavorites: {
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92500,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  addToFavoritesWrapper: {
    borderColor: Color.cSK430B92500,
    borderWidth: 1,
    borderStyle: "solid",
  },
  createOffer: {
    fontWeight: "500",
    fontSize: FontSize.size_5xl,
  },
  createOfferWrapper: {
    backgroundColor: Color.cSK430B92500,
  },
  ctas: {
    top: 931,
  },
  axeesMockup5: {
    backgroundColor: Color.white,
    width: "100%",
    flex: 1,
  },
});