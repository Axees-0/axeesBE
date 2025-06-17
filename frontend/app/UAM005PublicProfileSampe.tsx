import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Cap4 from "../assets/cap4.svg";
import Wifi2 from "../assets/wifi2.svg";
import Cellularconnection7 from "../assets/cellular-connection7.svg";
import Unlink041 from "../assets/unlink041.svg";
import Download041 from "../assets/download041.svg";
import Qrcode from "../assets/qrcode.svg";
import Arrowleft021 from "../assets/arrowleft021.svg";
import Linksquare016 from "../assets/linksquare016.svg";
import Linksquare017 from "../assets/linksquare017.svg";
import Linksquare018 from "../assets/linksquare018.svg";
import Linksquare019 from "../assets/linksquare019.svg";
import {
  Color,
  Padding,
  Border,
  FontSize,
  FontFamily,
  Gap,
} from "../GlobalStyles";
import { router } from "expo-router";
import CustomBackButton from "@/components/CustomBackButton";
const UAM005PublicProfileSampe = () => {
  return (
    <View style={styles.uam005publicprofilesampe2}>
      <View style={styles.frameParent}>
        <View style={styles.frameWrapper}>
          <View style={styles.profileDataParent}>
            <View style={styles.profileData}>
              <View style={styles.profileHeader}>
                <Image
                  style={[styles.coverIcon, styles.framePosition]}
                  contentFit="cover"
                  source={require("../assets/cover1.png")}
                />
                <View style={[styles.profileImage, styles.framePosition]}>
                  <View style={[styles.frame, styles.frameSpaceBlock]}>
                    <View style={styles.profile}>
                      <Image
                        style={styles.profileChild}
                        contentFit="cover"
                        source={require("../assets/rectangle-51.png")}
                      />
                      <View style={styles.profileNameParent}>
                        <View style={styles.profileName}>
                          <Text style={[styles.sallyMcnulty, styles.viewTypo1]}>
                            Sally McNulty
                          </Text>
                          <Text
                            style={[
                              styles.sallymcnulty,
                              styles.sallymcnultyClr,
                            ]}
                          >
                            @SallymcNulty
                          </Text>
                        </View>
                        <View style={styles.info}>
                          <Text style={styles.macro}>Macro</Text>
                          <View style={[styles.link, styles.linkSpaceBlock]}>
                            <Unlink041
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
                  <Text
                    style={[styles.entertainment, styles.entertainmentTypo]}
                  >
                    Entertainment
                  </Text>
                </View>
                <View style={[styles.entertainmentWrapper, styles.qrFlexBox]}>
                  <Text
                    style={[styles.entertainment, styles.entertainmentTypo]}
                  >
                    Car Enthusiast
                  </Text>
                </View>
                <View style={[styles.entertainmentWrapper, styles.qrFlexBox]}>
                  <Text
                    style={[styles.entertainment, styles.entertainmentTypo]}
                  >
                    Molder
                  </Text>
                </View>
                <View style={[styles.entertainmentWrapper, styles.qrFlexBox]}>
                  <Text
                    style={[styles.entertainment, styles.entertainmentTypo]}
                  >
                    Merch
                  </Text>
                </View>
              </View>
              <View style={[styles.numbers, styles.frameSpaceBlock]}>
                <View style={styles.socialMedia}>
                  <Image
                    style={styles.youtubeIcon}
                    contentFit="cover"
                    source={require("../assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png")}
                  />
                  <View style={[styles.socialMediaChild, styles.childBorder]} />
                  <Image
                    style={styles.pngClipartInstagramLogoIcoIcon}
                    contentFit="cover"
                    source={require("../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-11.png")}
                  />
                  <View style={[styles.socialMediaChild, styles.childBorder]} />
                  <Image
                    style={styles.transparentTiktokLogoBlackIcon}
                    contentFit="cover"
                    source={require("../assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-12.png")}
                  />
                  <View style={[styles.socialMediaChild, styles.childBorder]} />
                  <Image
                    style={styles.pngClipartInstagramLogoIcoIcon}
                    contentFit="cover"
                    source={require("../assets/660bcb3e9408cfa1747d2d6e4c8c4526-13.png")}
                  />
                </View>
                <View style={styles.labelInfo}>
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.entertainmentTypo]}
                    >
                      Total Followers
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>585K</Text>
                  </View>
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.entertainmentTypo]}
                    >
                      Listed Events
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>43</Text>
                  </View>
                  <View style={[styles.labelInfoChild, styles.childBorder]} />
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.entertainmentTypo]}
                    >
                      Combined Views
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>4M+</Text>
                  </View>
                  <View style={[styles.labelInfoChild, styles.childBorder]} />
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.entertainmentTypo]}
                    >
                      Offers
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>123</Text>
                  </View>
                  <View style={[styles.labelInfoChild, styles.childBorder]} />
                  <View style={styles.label1}>
                    <Text
                      style={[styles.totalFollowers, styles.entertainmentTypo]}
                    >
                      Deals
                    </Text>
                    <Text style={[styles.k, styles.kTypo]}>87</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.aVideoCreator, styles.entertainmentTypo]}>
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
                <Download041 style={styles.iconLayout} width={24} height={24} />
                <Text style={styles.mediaPackage}>Media Package</Text>
              </View>
              <View
                style={[
                  styles.makeOfferWrapper,
                  styles.download04ParentFlexBox,
                ]}
              >
                <Text style={[styles.makeOffer, styles.viewTypo1]}>
                  Make Offer
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.qrParent}>
          <View style={[styles.qr, styles.qrFlexBox]}>
            <Qrcode width={24} height={24} />
          </View>
          <View style={[styles.link1, styles.linkSpaceBlock]}>
            <Unlink041 width={20} height={20} />
            <Text style={[styles.buythis, styles.viewTypo]}>buythis</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.creatorProfile, styles.socialStatsTypo]}>
        Creator Profile
      </Text>
      <CustomBackButton />

      <View style={[styles.frameView, styles.frameSpaceBlock]}>
        <View style={styles.socialStatsParent}>
          <Text style={[styles.socialStats, styles.socialStatsTypo]}>
            Social Links
          </Text>
          <View style={styles.frameWrapper1}>
            <View style={styles.otherPlatformsParent}>
              <Text style={[styles.otherPlatforms, styles.viewTypo]}>
                Other Platforms
              </Text>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper2}>
                  <View style={styles.pngClipartYoutubePlayButtoParent}>
                    <Image
                      style={styles.pngClipartYoutubePlayButtoIcon}
                      contentFit="cover"
                      source={require("../assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>585K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare016
                    style={styles.pngClipartInstagramLogoIcoIcon}
                    width={18}
                    height={18}
                  />
                </View>
              </View>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper3}>
                  <View style={styles.pngClipartYoutubePlayButtoParent}>
                    <Image
                      style={styles.pngClipartInstagramLogoIcoIcon1}
                      contentFit="cover"
                      source={require("../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-12.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>132K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare017 width={18} height={18} />
                </View>
              </View>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper2}>
                  <View style={styles.pngClipartYoutubePlayButtoParent}>
                    <Image
                      style={styles.transparentTiktokLogoBlackIcon1}
                      contentFit="cover"
                      source={require("../assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-13.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>123K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare018 width={18} height={18} />
                </View>
              </View>
              <View style={styles.labelInfo}>
                <View style={styles.frameWrapper2}>
                  <View style={styles.pngClipartYoutubePlayButtoParent}>
                    <Image
                      style={styles.pngClipartInstagramLogoIcoIcon1}
                      contentFit="cover"
                      source={require("../assets/660bcb3e9408cfa1747d2d6e4c8c4526-11.png")}
                    />
                    <Text style={[styles.k1, styles.k1Typo]}>81K</Text>
                  </View>
                </View>
                <View style={styles.viewParent}>
                  <Text style={[styles.view, styles.viewTypo]}>View</Text>
                  <Linksquare019 width={18} height={18} />
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
  batteryPosition: {
    left: "50%",
    position: "absolute",
  },
  iconPosition: {
    maxHeight: "100%",
    left: "50%",
    position: "absolute",
  },
  capacityPosition: {
    backgroundColor: Color.cSK430B92950,
    left: "50%",
    position: "absolute",
  },
  frameViewPosition: {
    marginLeft: -220,
    left: "50%",
    width: 440,
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
  viewTypo1: {
    fontWeight: "500",
    textAlign: "center",
  },
  sallymcnultyClr: {
    opacity: 0.5,
    color: Color.cSK430B92950,
  },
  linkSpaceBlock: {
    paddingHorizontal: Padding.p_xs,
    backgroundColor: Color.cSK430B9250,
    flexDirection: "row",
    borderRadius: Border.br_81xl,
  },
  qrFlexBox: {
    backgroundColor: Color.cSK430B9250,
    alignItems: "center",
    flexDirection: "row",
  },
  entertainmentTypo: {
    fontSize: FontSize.size_xs,
    fontFamily: FontFamily.inter,
  },
  childBorder: {
    width: 0,
    borderRightWidth: 0.3,
    borderColor: Color.cSK430B92500,
    borderStyle: "solid",
  },
  kTypo: {
    fontSize: FontSize.size_xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
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
  viewTypo: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.inter,
  },
  socialStatsTypo: {
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
  time1: {
    top: "33.98%",
    left: "38.84%",
    fontSize: FontSize.size_base_2,
    lineHeight: 21,
    textAlign: "center",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
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
    marginLeft: 72,
    bottom: 8,
    width: 144,
    height: 5,
    transform: [
      {
        rotate: "180deg",
      },
    ],
    borderRadius: Border.br_81xl,
  },
  homeIndicator: {
    bottom: 0,
    height: 34,
    backgroundColor: Color.backgroundsPrimary,
    marginLeft: -220,
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
  sallyMcnulty: {
    fontSize: FontSize.size_xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  sallymcnulty: {
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
    fontWeight: "500",
    textAlign: "center",
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
  youtubeIcon: {
    height: 23,
    width: 24,
  },
  socialMediaChild: {
    height: 15,
  },
  pngClipartInstagramLogoIcoIcon: {},
  transparentTiktokLogoBlackIcon: {
    height: 19,
    width: 18,
  },
  socialMedia: {
    gap: Gap.gap_5xs,
    alignItems: "center",
    flexDirection: "row",
  },
  totalFollowers: {
    opacity: 0.5,
    color: Color.cSK430B92950,
    textAlign: "left",
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
    textAlign: "left",
    color: Color.cSK430B92950,
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
    gap: Gap.gap_4xs,
    borderWidth: 1,
    borderStyle: "solid",
  },
  makeOffer: {
    color: Color.backgroundsPrimary,
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.inter,
  },
  makeOfferWrapper: {
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
    paddingHorizontal: 0,
    gap: Gap.gap_4xs,
    paddingVertical: Padding.p_5xs,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  creatorProfile: {
    marginLeft: -84,
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
  pngClipartYoutubePlayButtoIcon: {
    width: 46,
    height: 37,
  },
  k1: {
    textAlign: "center",
  },
  pngClipartYoutubePlayButtoParent: {
    backgroundColor: Color.lightBg,
    paddingRight: Padding.p_xs,
    alignSelf: "stretch",
    gap: Gap.gap_4xs,
    alignItems: "center",
    flexDirection: "row",
    borderRadius: Border.br_81xl,
  },
  frameWrapper2: {
    width: 103,
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
  pngClipartInstagramLogoIcoIcon1: {
    width: 37,
    height: 37,
  },
  frameWrapper3: {
    width: 99,
    justifyContent: "center",
  },
  transparentTiktokLogoBlackIcon1: {
    height: 38,
    width: 37,
  },
  otherPlatformsParent: {
    shadowColor: "rgba(146, 146, 146, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 30,
    elevation: 30,
    shadowOpacity: 1,
    paddingHorizontal: Padding.p_lg,
    paddingVertical: Padding.p_xs,
    gap: Gap.gap_3xl,
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
    left: "50%",
    width: 440,
    position: "absolute",
  },
  uam005publicprofilesampe2: {
    width: "100%",
    height: 1444,
    overflow: "hidden",
    flex: 1,
    backgroundColor: Color.backgroundsPrimary,
  },
});

export default UAM005PublicProfileSampe;
