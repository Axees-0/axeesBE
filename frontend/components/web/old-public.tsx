import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, View, Text } from "react-native";
import Search01 from "../assets/search01.svg";
import Zap from "../assets/zap.svg";
import Share08 from "../assets/share08.svg";
import Contracts from "../assets/contracts.svg";
import Agreement02 from "../assets/agreement02.svg";
import {
  Gap,
  FontFamily,
  Color,
  Padding,
  Border,
  FontSize,
} from "../../GlobalStyles";

const AxeesMockup3 = () => {
  return (
    <View style={styles.axeesMockup5}>
      <View style={styles.frameParent}>
        <View style={styles.wrapper}>
          <Image
            style={styles.icon}
            contentFit="cover"
            source={require("../assets/3.png")}
          />
        </View>
        <View style={[styles.search01Parent, styles.parentFlexBox]}>
          <Search01 style={styles.search01Icon} width={24} height={24} />
          <Text style={[styles.searchCategoryTags, styles.kTypo]}>
            Search category tags (Fashion, DIY, Spiritual)
          </Text>
        </View>
        <View style={styles.frameGroup}>
          <View style={[styles.signInWrapper, styles.wrapperBorder]}>
            <Text style={[styles.signIn, styles.kTypo]}>Sign In</Text>
          </View>
          <View style={[styles.joinWrapper, styles.wrapperParentSpaceBlock]}>
            <Text style={[styles.join, styles.joinTypo]}>Join</Text>
          </View>
        </View>
      </View>
      <View style={[styles.frameContainer, styles.ctasPosition]}>
        <View style={styles.rectangleParent}>
          <Image
            style={styles.frameChild}
            contentFit="cover"
            source={require("../assets/rectangle-5.png")}
          />
          <View style={styles.frameView}>
            <View style={styles.frameParent1}>
              <View style={styles.frameWrapper}>
                <View style={styles.foodWrapper}>
                  <Text style={[styles.food, styles.proTypo]}>Food</Text>
                </View>
              </View>
              <View style={styles.frameParent2}>
                <View style={styles.jordanRiversParent}>
                  <Text style={[styles.jordanRivers, styles.kTypo]}>
                    Jordan Rivers
                  </Text>
                  <Text style={[styles.jordanrivers, styles.bioTypo]}>
                    @jordanrivers
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
                    <Text style={[styles.pro, styles.proTypo]}>Available</Text>
                    <Zap width={24} height={24} />
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.shareProfileParent, styles.wrapperBorder]}>
              <Text style={[styles.signIn, styles.kTypo]}>Share Profile</Text>
              <Share08 width={24} height={24} />
            </View>
          </View>
        </View>
        <View style={styles.frameParent4}>
          <View style={styles.frameParent5}>
            <View style={styles.frameWrapper1}>
              <View
                style={[
                  styles.pngClipartInstagramLogoIcoParent,
                  styles.contractsWrapperFlexBox,
                ]}
              >
                <Image
                  style={styles.pngClipartInstagramLogoIcoIcon}
                  contentFit="cover"
                  source={require("../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-1.png")}
                />
                <Text style={[styles.k, styles.kTypo]}>875k</Text>
              </View>
            </View>
            <View style={styles.frameWrapper2}>
              <View
                style={[
                  styles.pngClipartInstagramLogoIcoParent,
                  styles.contractsWrapperFlexBox,
                ]}
              >
                <Image
                  style={styles.transparentTiktokLogoBlackIcon}
                  contentFit="cover"
                  source={require("../assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-1.png")}
                />
                <Text style={[styles.k, styles.kTypo]}>200K</Text>
              </View>
            </View>
            <View style={styles.frameWrapper2}>
              <View
                style={[
                  styles.pngClipartInstagramLogoIcoParent,
                  styles.contractsWrapperFlexBox,
                ]}
              >
                <Image
                  style={styles.pngClipartInstagramLogoIcoIcon}
                  contentFit="cover"
                  source={require("../assets/1707226109newtwitterlogopng-1.png")}
                />
                <Text style={[styles.k, styles.kTypo]}>689K</Text>
              </View>
            </View>
          </View>
          <View style={styles.frameParent6}>
            <View style={styles.mParent}>
              <Text style={[styles.m, styles.mTypo]}>1.7M</Text>
              <Text style={[styles.totalFollowers, styles.kTypo]}>
                Total Followers
              </Text>
            </View>
            <View style={styles.mParent}>
              <Text style={[styles.m, styles.mTypo]}>600M</Text>
              <Text style={[styles.profileViews, styles.kTypo]}>
                Profile Views
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.bioParent, styles.parentPosition]}>
        <Text style={[styles.bio, styles.bioTypo]}>Bio</Text>
        <Text style={[styles.meetJordanRivers, styles.bioTypo]}>
          Meet Jordan Rivers, a culinary creator and food lover! With a passion
          for exploring flavors, Jordan shares delicious recipes and food
          adventures that tantalize taste buds and inspire home cooks.
        </Text>
      </View>
      <View style={[styles.activityParent, styles.parentPosition]}>
        <Text style={[styles.bio, styles.bioTypo]}>Activity</Text>
        <View style={styles.frameParent7}>
          <View style={[styles.frameParent8, styles.parentBorder]}>
            <View
              style={[styles.contractsWrapper, styles.contractsWrapperFlexBox]}
            >
              <Contracts width={24} height={24} />
            </View>
            <View style={styles.frameParent2}>
              <Text style={[styles.jordanrivers, styles.bioTypo]}>Offers</Text>
              <Text style={styles.mTypo}>24</Text>
            </View>
          </View>
          <View style={[styles.frameParent8, styles.parentBorder]}>
            <View
              style={[styles.contractsWrapper, styles.contractsWrapperFlexBox]}
            >
              <Agreement02 width={24} height={24} />
            </View>
            <View style={styles.frameParent2}>
              <Text style={[styles.jordanrivers, styles.bioTypo]}>
                Completed Deals
              </Text>
              <Text style={styles.mTypo}>432</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.ctas, styles.ctasPosition]}>
        <View style={[styles.addToFavoritesWrapper, styles.wrapperLayout]}>
          <Text style={[styles.addToFavorites, styles.kTypo]}>
            Add to favorites
          </Text>
        </View>
        <View style={[styles.createOfferWrapper, styles.wrapperLayout]}>
          <Text style={[styles.createOffer, styles.joinTypo]}>
            Create Offer
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  parentFlexBox: {
    gap: Gap.gap_md,
    flexDirection: "row",
  },
  kTypo: {
    textAlign: "center",
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
    left: 82,
    position: "absolute",
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
    textAlign: "center",
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
  transparentTiktokLogoBlackIcon: {
    height: 38,
    width: 37,
  },
  frameWrapper2: {
    width: 103,
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
    height: 1066,
    overflow: "hidden",
    flex: 1,
  },
});

export default AxeesMockup3;
