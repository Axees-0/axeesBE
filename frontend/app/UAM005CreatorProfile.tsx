import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Unlink04 from "../assets/unlink04.svg";
import Download04 from "../assets/download04.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Qrcode from "../assets/qrcode.svg";
import Arrowleft02 from "../assets/arrowleft02.svg";
import Linksquare01 from "../assets/linksquare01.svg";
import Linksquare011 from "../assets/linksquare011.svg";
import Linksquare016 from "../assets/linksquare016.svg";
import Linksquare017 from "../assets/linksquare017.svg";
import Discoveryiconlypro from "../assets/discovery--iconly-pro.svg";
import Hotprice from "../assets/hotprice.svg";
import Message01 from "../assets/message01.svg";
import Notification02 from "../assets/notification02.svg";
import User from "../assets/user.svg";
import {
  Color,
  FontFamily,
  Border,
  Padding,
  FontSize,
  Gap,
} from "../GlobalStyles";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
const UAM005CreatorProfile = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { user } = useAuth();

  if (!user?._id) {
    return <Redirect href="/UAM001Login" />;
  }

  return (
    <View style={styles.uam005creatorprofile}>
      <View style={styles.frameParent}>
        <View style={styles.frameWrapper}>
          <View style={styles.profileDataParent}>
            <View style={styles.profileData}>
              <View style={styles.profileHeader}>
                <Image
                  style={[styles.coverIcon, styles.framePosition]}
                  contentFit="cover"
                  source={require("../assets/cover.png")}
                />
                <View style={[styles.profileImage, styles.framePosition]}>
                  <View style={[styles.frame, styles.frameSpaceBlock]}>
                    <View style={styles.profile}>
                      <Image
                        style={styles.profileChild}
                        contentFit="cover"
                        source={require("../assets/empty-image.png")}
                        placeholder={require("../assets/empty-image.png")}
                      />
                      <View style={styles.profileNameParent}>
                        <View style={styles.profileName}>
                          <Text style={[styles.ashleyVaughn, styles.kTypo]}>
                            Ashley Vaughn
                          </Text>
                          <Text
                            style={[
                              styles.theAshleyVaughan,
                              styles.totalFollowersClr,
                            ]}
                          >
                            @the_ashley_vaughan
                          </Text>
                        </View>
                        <View style={styles.info}>
                          <Text style={styles.macro}>Macro</Text>
                          <View style={styles.link}>
                            <Unlink04
                              style={styles.unlink04Icon}
                              width={20}
                              height={20}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.frameGroup, styles.frameSpaceBlock]}>
                <View style={[styles.entertainmentWrapper, styles.qrFlexBox]}>
                  <Text style={styles.entertainment}>Entertainment</Text>
                </View>
                <View style={[styles.entertainmentWrapper, styles.qrFlexBox]}>
                  <Text style={styles.entertainment}>Car Enthusiast</Text>
                </View>
                <View style={[styles.entertainmentWrapper, styles.qrFlexBox]}>
                  <Text style={styles.entertainment}>Molder</Text>
                </View>
                <View style={[styles.entertainmentWrapper, styles.qrFlexBox]}>
                  <Text style={styles.entertainment}>Merch</Text>
                </View>
              </View>
              <View style={[styles.numbers, styles.frameSpaceBlock]}>
                <View style={styles.socialMedia}>
                  <Image
                    style={styles.socialMediaChild}
                    contentFit="cover"
                    source={require("../assets/frame-1000000910.png")}
                  />
                  <View
                    style={[
                      styles.socialMediaItem,
                      styles.labelInfoChildBorder,
                    ]}
                  />
                  <Image
                    style={styles.pngClipartYoutubePlayButtoIcon}
                    contentFit="cover"
                    source={require("../assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png")}
                  />
                  <View
                    style={[
                      styles.socialMediaItem,
                      styles.labelInfoChildBorder,
                    ]}
                  />
                  <Image
                    style={styles.transparentTiktokLogoBlackIcon}
                    contentFit="cover"
                    source={require("../assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-1.png")}
                  />
                  <View
                    style={[
                      styles.socialMediaItem,
                      styles.labelInfoChildBorder,
                    ]}
                  />
                  <Image
                    style={styles.bcb3e9408cfa1747d2d6e4c8c4526Icon}
                    contentFit="cover"
                    source={require("../assets/660bcb3e9408cfa1747d2d6e4c8c4526-1.png")}
                  />
                </View>
                <View style={styles.labelInfo}>
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.totalFollowersClr]}
                    >
                      Total Followers
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>343K</Text>
                  </View>
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.totalFollowersClr]}
                    >
                      Listed Events
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>43</Text>
                  </View>
                  <View
                    style={[styles.labelInfoChild, styles.labelInfoChildBorder]}
                  />
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.totalFollowersClr]}
                    >
                      Combined Views
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>4M+</Text>
                  </View>
                  <View
                    style={[styles.labelInfoChild, styles.labelInfoChildBorder]}
                  />
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.totalFollowersClr]}
                    >
                      Offers
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>123</Text>
                  </View>
                  <View
                    style={[styles.labelInfoChild, styles.labelInfoChildBorder]}
                  />
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.totalFollowersClr]}
                    >
                      Deals
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>87</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.aVideoCreator, styles.time1Clr]}>
                A video creator, a car lover and enthusiast in Reels, Memes,
                Merch, Fine Arts, and Prints. 20B FC RX7, BMW E46, LS WRX...
              </Text>
            </View>
            <View style={[styles.frameContainer, styles.frameContainerFlexBox]}>
              <View
                style={[
                  styles.download04Parent,
                  styles.download04ParentFlexBox,
                ]}
              >
                <Download04 style={styles.iconLayout} width={24} height={24} />
                <Text style={styles.mediaPackage}>Media Package</Text>
              </View>
              <Pressable
                style={[
                  styles.editProfileWrapper,
                  styles.download04ParentFlexBox,
                ]}
                onPress={() => navigation.navigate("UAM02EditCreatorProfile")}
              >
                <Text style={[styles.editProfile, styles.homeTypo]}>
                  Edit Profile
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.qrParent}>
          <View style={[styles.qr, styles.qrFlexBox]}>
            <Qrcode width={24} height={24} />
          </View>
          <View style={styles.link1}>
            <Unlink04 width={20} height={20} />
            <Text style={[styles.buythis, styles.viewTypo]}>buythis</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.myProfile, styles.myProfileTypo]}>My Profile</Text>
      <CustomBackButton />

      <View style={[styles.frameView, styles.frameSpaceBlock]}>
        <View style={styles.socialStatsParent}>
          <Text style={[styles.socialStats, styles.myProfileTypo]}>
            Social Links
          </Text>
          <View style={styles.frameWrapper1}>
            <View style={styles.otherPlatformsParent}>
              <Text style={[styles.otherPlatforms, styles.viewTypo]}>
                Other Platforms
              </Text>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper2}>
                  <View style={styles.pngClipartInstagramLogoIcoParent}>
                    <Image
                      style={styles.pngClipartInstagramLogoIcoIcon}
                      contentFit="cover"
                      source={require("../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-1.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>132K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare01
                    style={styles.bcb3e9408cfa1747d2d6e4c8c4526Icon}
                    width={18}
                    height={18}
                  />
                </View>
              </View>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper3}>
                  <View style={styles.pngClipartInstagramLogoIcoParent}>
                    <Image
                      style={styles.transparentTiktokLogoBlackIcon1}
                      contentFit="cover"
                      source={require("../assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-11.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>123K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare011 width={18} height={18} />
                </View>
              </View>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper3}>
                  <View style={styles.pngClipartInstagramLogoIcoParent}>
                    <Image
                      style={styles.pngClipartYoutubePlayButtoIcon1}
                      contentFit="cover"
                      source={require("../assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>11K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare016 width={18} height={18} />
                </View>
              </View>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper3}>
                  <View style={styles.pngClipartInstagramLogoIcoParent}>
                    <Image
                      style={styles.pngClipartInstagramLogoIcoIcon}
                      contentFit="cover"
                      source={require("../assets/660bcb3e9408cfa1747d2d6e4c8c4526-12.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>81K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare017 width={18} height={18} />
                </View>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.frameWrapper1}>
          <View style={styles.frameParent5}>
            <View style={styles.frameContainerFlexBox}>
              <Text style={[styles.achievements, styles.k1Typo]}>
                Achievements
              </Text>
              <Text
                style={styles.bFcRx7Typo}
              >{`Most followed individual as a Car Enthusiast on Instagram
Creative youtube videos `}</Text>
            </View>
            <View style={styles.frameContainerFlexBox}>
              <Text style={[styles.achievements, styles.k1Typo]}>
                Business Ventures
              </Text>
              <Text style={[styles.bFcRx7, styles.bFcRx7Typo]}>{`20B FC RX7
BMW E46
LS WRX
CORVETTE C7 Z06
LB7 D-MAX`}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.homeIndicatorParent}>
        <View style={[styles.homeIndicator2, styles.homePosition1]}></View>
        <View style={[styles.navbar, styles.framePosition]}>
          <View style={[styles.discoveryIconlyProParent, styles.parentFlexBox]}>
            <Discoveryiconlypro
              style={[styles.discoveryIconlyPro, styles.iconLayout]}
              width={24}
              height={24}
            />
            <Text style={[styles.home, styles.homeTypo]}>Explore</Text>
          </View>
          <View style={[styles.hotPriceParent, styles.parentFlexBox]}>
            <Hotprice width={24} height={24} />
            <Text style={[styles.home, styles.homeTypo]}>Deals/Offers</Text>
          </View>
          <View style={[styles.hotPriceParent, styles.parentFlexBox]}>
            <Message01 width={24} height={24} />
            <Text style={[styles.home, styles.homeTypo]}>Messages</Text>
          </View>
          <View style={[styles.hotPriceParent, styles.parentFlexBox]}>
            <Notification02 width={24} height={24} />
            <Text style={[styles.home, styles.homeTypo]}>Notifications</Text>
          </View>
          <View style={[styles.userParent, styles.parentFlexBox]}>
            <User width={24} height={24} />
            <Text style={[styles.home, styles.homeTypo]}>profile</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timePosition: {
    top: "50%",
    width: "35.75%",
    marginTop: -25.8,
    height: 52,
    position: "absolute",
  },
  time1Clr: {
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  batteryPosition: {
    left: "50%",
    position: "absolute",
  },
  iconPosition: {
    maxHeight: "100%",
    left: "50%",
    position: "absolute",
  },
  homePosition1: {
    height: 34,
    bottom: 0,
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  homePosition: {
    transform: [
      {
        rotate: "180deg",
      },
    ],
    height: 5,
    width: 144,
    bottom: 8,
    marginLeft: 72,
    borderRadius: Border.br_81xl,
    left: "50%",
    position: "absolute",
  },
  framePosition: {
    width: 440,
    left: 0,
    position: "absolute",
  },
  frameSpaceBlock: {
    paddingVertical: 0,
    paddingHorizontal: Padding.p_xl,
  },
  kTypo: {
    fontSize: FontSize.size_xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  totalFollowersClr: {
    opacity: 0.5,
    color: Color.cSK430B92950,
  },
  qrFlexBox: {
    backgroundColor: Color.cSK430B9250,
    alignItems: "center",
    flexDirection: "row",
  },
  labelInfoChildBorder: {
    width: 0,
    borderRightWidth: 0.3,
    borderColor: Color.cSK430B92500,
    borderStyle: "solid",
  },
  frameContainerFlexBox: {
    gap: Gap.gap_3xs,
    alignSelf: "stretch",
  },
  download04ParentFlexBox: {
    height: 58,
    borderRadius: Border.br_xs,
    paddingHorizontal: Padding.p_xs,
    paddingVertical: Padding.p_5xs,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
  },
  homeTypo: {
    color: Color.backgroundsPrimary,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  viewTypo: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.inter,
  },
  myProfileTypo: {
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92950,
    fontWeight: "600",
  },
  iconLayout: {},
  k1Typo: {
    fontSize: FontSize.size_lg,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  bFcRx7Typo: {
    fontWeight: "300",
    fontSize: FontSize.size_sm,
    textAlign: "left",
    alignSelf: "stretch",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  parentFlexBox: {
    height: 83,
    paddingVertical: Padding.p_xs,
    gap: Gap.gap_6xs,
    paddingHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  time1: {
    top: "33.98%",
    left: "38.84%",
    fontSize: FontSize.size_base_2,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
    position: "absolute",
  },
  time: {
    right: "64.25%",
    left: "0%",
  },
  border: {
    height: "100%",
    top: "0%",
    bottom: "0%",
    borderRadius: Border.br_8xs_1,
    borderColor: Color.cSK430B92950,
    opacity: 0.35,
    width: 24,
    borderWidth: 1,
    borderStyle: "solid",
    marginLeft: -13.05,
    left: "50%",
    position: "absolute",
  },
  capIcon: {
    marginLeft: 11.75,
    top: "37.1%",
    bottom: "31.45%",
  },
  capacity: {
    height: "69.35%",
    marginLeft: -11.15,
    top: "15.32%",
    bottom: "15.32%",
    borderRadius: Border.br_10xs_4,
    width: 20,
    backgroundColor: Color.cSK430B92950,
  },
  battery: {
    height: "24.08%",
    marginLeft: 10.05,
    top: "42.52%",
    bottom: "33.4%",
    width: 26,
  },
  wifiIcon: {
    top: "43.88%",
    bottom: "33.2%",
    marginLeft: -13.05,
    maxHeight: "100%",
  },
  cellularConnectionIcon: {
    marginLeft: -38.55,
    top: "43.69%",
    bottom: "33.59%",
  },
  levels: {
    right: "0%",
    left: "64.25%",
  },
  statusBarIphone: {
    height: 52,
    width: 440,
    left: 0,
    top: 0,
    position: "absolute",
    backgroundColor: Color.backgroundsPrimary,
  },
  homeIndicator1: {
    backgroundColor: Color.cSK430B92950,
  },
  homeIndicator: {
    backgroundColor: Color.backgroundsPrimary,
  },
  coverIcon: {
    height: 151,
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  profileChild: {
    borderRadius: Border.br_xs_5,
    width: 131,
    height: 126,
  },
  ashleyVaughn: {
    fontWeight: "500",
    textAlign: "center",
  },
  theAshleyVaughan: {
    textAlign: "left",
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.inter,
  },
  profileName: {
    gap: Gap.gap_4xs,
  },
  macro: {
    fontFamily: FontFamily.rOGLyonsType,
    color: Color.colorOrange,
    textAlign: "left",
    fontSize: FontSize.size_base,
  },
  unlink04Icon: {},
  link: {
    paddingVertical: Padding.p_11xs,
    paddingHorizontal: Padding.p_xs,
    backgroundColor: Color.cSK430B9250,
    flexDirection: "row",
    borderRadius: Border.br_81xl,
  },
  info: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  profileNameParent: {
    justifyContent: "space-between",
    flexDirection: "row",
    flex: 1,
  },
  profile: {
    alignItems: "flex-end",
    gap: Gap.gap_4xs,
    flexDirection: "row",
    flex: 1,
  },
  frame: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    width: 440,
    left: 0,
    position: "absolute",
    top: 0,
    overflow: "hidden",
  },
  profileImage: {
    top: 97,
    height: 126,
  },
  profileHeader: {
    height: 223,
    alignSelf: "stretch",
  },
  entertainment: {
    color: Color.cSK430B92500,
    fontSize: FontSize.size_xs,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  entertainmentWrapper: {
    borderRadius: Border.br_9xs,
    paddingHorizontal: Padding.p_7xs,
    paddingVertical: Padding.p_10xs,
    justifyContent: "center",
  },
  frameGroup: {
    gap: Gap.gap_2xs,
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
  },
  socialMediaChild: {
    height: 28,
    width: 24,
  },
  socialMediaItem: {
    height: 15,
  },
  pngClipartYoutubePlayButtoIcon: {
    height: 14,
    width: 18,
  },
  transparentTiktokLogoBlackIcon: {
    height: 19,
    width: 18,
  },
  bcb3e9408cfa1747d2d6e4c8c4526Icon: {},
  socialMedia: {
    gap: Gap.gap_5xs,
    alignItems: "center",
    flexDirection: "row",
  },
  totalFollowers: {
    fontSize: FontSize.size_xs,
    textAlign: "left",
    fontFamily: FontFamily.inter,
  },
  k: {
    textAlign: "left",
    fontWeight: "600",
  },
  label1: {
    gap: Gap.gap_xs,
    justifyContent: "center",
  },
  labelInfoChild: {
    height: 43,
  },
  labelInfo: {
    justifyContent: "space-between",
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
  },
  numbers: {
    gap: Gap.gap_xs,
    alignSelf: "stretch",
  },
  aVideoCreator: {
    opacity: 0.6,
    width: 414,
    fontSize: FontSize.size_xs,
    textAlign: "left",
  },
  profileData: {
    justifyContent: "flex-end",
    gap: Gap.gap_lg,
    alignSelf: "stretch",
    alignItems: "center",
  },
  mediaPackage: {
    color: Color.cSK430B92500,
    fontSize: FontSize.size_base,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  download04Parent: {
    borderColor: Color.cSK430B92500,
    height: 58,
    borderRadius: Border.br_xs,
    gap: Gap.gap_4xs,
    borderWidth: 1,
    borderStyle: "solid",
  },
  editProfile: {
    fontSize: FontSize.size_base,
    fontWeight: "500",
  },
  editProfileWrapper: {
    backgroundColor: Color.cSK430B92500,
  },
  frameContainer: {
    paddingVertical: 0,
    paddingHorizontal: Padding.p_xl,
    flexDirection: "row",
  },
  profileDataParent: {
    gap: Gap.gap_2xl,
    alignSelf: "stretch",
    alignItems: "center",
  },
  frameWrapper: {
    zIndex: 0,
    alignItems: "center",
    flex: 1,
  },
  qr: {
    padding: Padding.p_5xs,
    borderRadius: Border.br_81xl,
  },
  buythis: {
    width: 50,
    color: Color.cSK430B92500,
    textAlign: "left",
  },
  link1: {
    paddingVertical: Padding.p_9xs,
    gap: Gap.gap_6xs,
    paddingHorizontal: Padding.p_xs,
    backgroundColor: Color.cSK430B9250,
    flexDirection: "row",
    borderRadius: Border.br_81xl,
  },
  qrParent: {
    top: 15,
    left: 13,
    zIndex: 1,
    width: 414,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    position: "absolute",
  },
  frameParent: {
    top: 135,
    gap: Gap.gap_4xs,
    paddingVertical: Padding.p_5xs,
    paddingHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  myProfile: {
    marginLeft: -58,
    top: 79,
    left: "50%",
    position: "absolute",
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
    position: "absolute",
  },
  socialStats: {
    fontFamily: FontFamily.degular,
    textAlign: "left",
    alignSelf: "stretch",
  },
  otherPlatforms: {
    opacity: 0.5,
    color: Color.cSK430B92950,
    textAlign: "center",
  },
  pngClipartInstagramLogoIcoIcon: {
    height: 37,
    width: 37,
  },
  k1: {
    textAlign: "center",
  },
  pngClipartInstagramLogoIcoParent: {
    backgroundColor: Color.lightBg,
    paddingRight: Padding.p_xs,
    alignSelf: "stretch",
    gap: Gap.gap_4xs,
    alignItems: "center",
    flexDirection: "row",
    borderRadius: Border.br_81xl,
  },
  frameWrapper2: {
    width: 99,
    justifyContent: "center",
  },
  view: {
    color: Color.cSK430B92500,
    fontWeight: "500",
    textAlign: "center",
  },
  viewParent: {
    gap: Gap.gap_4xs,
    alignItems: "center",
    flexDirection: "row",
  },
  transparentTiktokLogoBlackIcon1: {
    height: 38,
    width: 37,
  },
  frameWrapper3: {
    width: 103,
    justifyContent: "center",
  },
  pngClipartYoutubePlayButtoIcon1: {
    width: 46,
    height: 37,
  },
  otherPlatformsParent: {    elevation: 30,    paddingHorizontal: Padding.p_lg,
    gap: Gap.gap_3xl,
    paddingVertical: Padding.p_xs,
    borderRadius: Border.br_xs,
    alignSelf: "stretch",
    backgroundColor: Color.backgroundsPrimary,
  },
  frameWrapper1: {
    alignSelf: "stretch",
  },
  socialStatsParent: {
    gap: Gap.gap_sm,
    alignSelf: "stretch",
  },
  achievements: {
    textAlign: "left",
    alignSelf: "stretch",
    fontWeight: "600",
  },
  bFcRx7: {
    lineHeight: 21,
  },
  frameParent5: {
    width: 359,
    gap: Gap.gap_xl,
  },
  frameView: {
    top: 708,
    gap: Gap.gap_5xl,
    marginLeft: -220,
    paddingHorizontal: Padding.p_xl,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  homeIndicator3: {
    backgroundColor: Color.backgroundsPrimary,
  },
  homeIndicator2: {
    backgroundColor: Color.cSK430B92500,
  },
  discoveryIconlyPro: {
    overflow: "hidden",
  },
  home: {
    textTransform: "capitalize",
    fontSize: FontSize.size_xs,
  },
  discoveryIconlyProParent: {
    opacity: 0.6,
    overflow: "hidden",
  },
  hotPriceParent: {
    opacity: 0.6,
  },
  userParent: {
    borderColor: Color.backgroundsPrimary,
    borderBottomWidth: 3,
    borderStyle: "solid",
    height: 83,
  },
  navbar: {
    backgroundColor: Color.cSK430B92500,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    top: 0,
    left: 0,
  },
  homeIndicatorParent: {
    height: 117,
    bottom: 0,
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  uam005creatorprofile: {
    width: "100%",
    height: 956,
    overflow: "hidden",
    flex: 1,
    backgroundColor: Color.backgroundsPrimary,
  },
});

export default UAM005CreatorProfile;
