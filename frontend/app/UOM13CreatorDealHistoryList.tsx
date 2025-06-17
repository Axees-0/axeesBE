import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Cap from "../assets/cap.svg";
import Wifi from "../assets/wifi.svg";
import Cellularconnection1 from "../assets/cellular-connection1.svg";
import Arrowleft021 from "../assets/arrowleft021.svg";
import Arrowdown01 from "../assets/arrowdown01.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Discoveryiconlypro from "../assets/discovery--iconly-pro.svg";
import Hotprice from "../assets/hotprice.svg";
import Message01 from "../assets/message01.svg";
import Notification02 from "../assets/notification02.svg";
import User from "../assets/user.svg";
import {
  Color,
  FontFamily,
  Padding,
  FontSize,
  Border,
  Gap,
} from "../GlobalStyles";

const UOM13CreatorDealHistoryList = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.uom13creatordealhistorylist}>
      <Arrowleft021
        style={[styles.arrowLeft02Icon, styles.iconLayout]}
        width={24}
        height={24}
      />
      <Text style={[styles.history, styles.batteryPosition]}>History</Text>
      <View style={styles.listContainer}>
        <View style={[styles.offersStatusTab, styles.parentFlexBox1]}>
          <View style={[styles.dealsWrapper, styles.wrapperFlexBox]}>
            <Text style={[styles.deals, styles.dealsTypo]}>Deals</Text>
          </View>
          <View style={styles.wrapperFlexBox}>
            <Text style={[styles.offers, styles.dealsTypo]}>Offers</Text>
          </View>
        </View>
        <View style={[styles.sortByParent, styles.parentFlexBox1]}>
          <Text style={[styles.sortBy, styles.sortByTypo]}>Sort by:</Text>
          <View style={[styles.sortByParent, styles.parentFlexBox1]}>
            <Text style={[styles.brand, styles.brandTypo]}>Brand</Text>
            <Arrowdown01
              style={styles.arrowDown01Icon}
              width={16}
              height={16}
            />
          </View>
        </View>
        <Pressable
          style={styles.listContainerInner}
          onPress={() => navigation.navigate("UOM12CreatorDealDetails")}
        >
          <View style={styles.frameParent}>
            <View style={styles.frameGroup}>
              <View style={styles.dealNameParent}>
                <Text style={[styles.dealName, styles.textTypo]}>
                  Deal Name
                </Text>
                <View style={styles.frameContainer}>
                  <View style={[styles.parent, styles.parentFlexBox1]}>
                    <Text style={[styles.text, styles.textTypo]}>
                      $1,300.00
                    </Text>
                    <Text style={[styles.desiredPostDate, styles.brandTypo]}>
                      Desired Post Date : Jan 11, 2025
                    </Text>
                  </View>
                  <View style={[styles.parent, styles.parentFlexBox1]}>
                    <Text
                      style={[styles.dealNo, styles.sortByTypo]}
                    >{`Deal No : #4763 `}</Text>
                    <Text style={[styles.dealNo, styles.sortByTypo]}>
                      Transaction No : #234763762
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.frameWrapper}>
                <View style={styles.frameView}>
                  <View
                    style={[
                      styles.pngClipartYoutubePlayButtoWrapper,
                      styles.wrapperSpaceBlock,
                    ]}
                  >
                    <Image
                      style={styles.pngClipartYoutubePlayButtoIcon}
                      contentFit="cover"
                      source={require("../assets/pngclipartyoutubeplaybuttoncomputericonsyoutubeyoutubelogoanglerectanglethumbnail-1.png")}
                    />
                  </View>
                  <View
                    style={[
                      styles.pngClipartYoutubePlayButtoWrapper,
                      styles.wrapperSpaceBlock,
                    ]}
                  >
                    <Image
                      style={styles.bcb3e9408cfa1747d2d6e4c8c4526Icon}
                      contentFit="cover"
                      source={require("../assets/660bcb3e9408cfa1747d2d6e4c8c4526-11.png")}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.frameChild} />
            <View style={[styles.parent, styles.parentFlexBox1]}>
              <View style={[styles.ellipseParent, styles.parentFlexBox1]}>
                <Image
                  style={styles.frameItem}
                  contentFit="cover"
                  source={require("../assets/ellipse-2.png")}
                />
                <Text style={[styles.timbaio, styles.brandTypo]}>@TimBaio</Text>
              </View>
              <View style={[styles.inReviewWrapper, styles.wrapperSpaceBlock]}>
                <Text style={[styles.inReview, styles.brandTypo]}>
                  In Review
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
      <View style={styles.homeIndicatorParent}>
        <View style={styles.homeIndicator}></View>
        <View style={styles.navbar}>
          <View style={[styles.discoveryIconlyProParent, styles.parentFlexBox]}>
            <Discoveryiconlypro
              style={[styles.discoveryIconlyPro, styles.iconLayout]}
              width={24}
              height={24}
            />
            <Text style={styles.home}>Explore</Text>
          </View>
          <View style={styles.hotPriceParent}>
            <Hotprice style={styles.iconLayout} width={24} height={24} />
            <Text style={styles.home}>Deals/Offers</Text>
          </View>
          <View style={styles.parentFlexBox}>
            <Message01 width={24} height={24} />
            <Text style={styles.home}>Messages</Text>
          </View>
          <View style={styles.parentFlexBox}>
            <Notification02 width={24} height={24} />
            <Text style={styles.home}>Notifications</Text>
          </View>
          <View style={styles.parentFlexBox}>
            <User width={24} height={24} />
            <Text style={styles.home}>profile</Text>
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
  time1Typo: {
    fontWeight: "600",
    textAlign: "center",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
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
  iconLayout: {},
  parentFlexBox1: {
    alignItems: "center",
    flexDirection: "row",
  },
  wrapperFlexBox: {
    padding: Padding.p_xs,
    alignItems: "center",
    flexDirection: "row",
  },
  dealsTypo: {
    fontSize: FontSize.size_base,
    textAlign: "center",
    fontFamily: FontFamily.textSmNormal,
  },
  sortByTypo: {
    opacity: 0.5,
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
  },
  brandTypo: {
    fontSize: FontSize.textSmNormal_size,
    fontFamily: FontFamily.textSmNormal,
  },
  textTypo: {
    fontSize: FontSize.size_xl,
    textAlign: "left",
    color: Color.cSK430B92950,
  },
  wrapperSpaceBlock: {
    paddingVertical: Padding.p_5xs,
    paddingHorizontal: Padding.p_base,
    borderRadius: Border.br_7xs,
    alignItems: "center",
    flexDirection: "row",
  },
  parentFlexBox: {
    opacity: 0.6,
    gap: Gap.gap_2xs,
    paddingHorizontal: 0,
    height: 83,
    justifyContent: "center",
    paddingVertical: Padding.p_xs,
    alignItems: "center",
    flex: 1,
  },
  time1: {
    top: "33.98%",
    left: "38.84%",
    fontSize: FontSize.size_base_2,
    lineHeight: 21,
    textAlign: "center",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
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
    opacity: 0.35,
    width: 24,
    borderWidth: 1,
    borderColor: Color.cSK430B92950,
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
    backgroundColor: Color.cSK430B92950,
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
    backgroundColor: Color.white,
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
    position: "absolute",
  },
  history: {
    marginLeft: -42,
    top: 79,
    fontSize: FontSize.size_5xl,
    textAlign: "center",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
    fontWeight: "600",
  },
  deals: {
    fontWeight: "500",
    color: Color.cSK430B92500,
  },
  dealsWrapper: {
    borderColor: Color.cSK430B92500,
    borderBottomWidth: 3,
    padding: Padding.p_xs,
    borderStyle: "solid",
  },
  offers: {
    color: Color.cSK430B92950,
  },
  offersStatusTab: {
    height: 43,
    gap: Gap.gap_sm,
    alignSelf: "stretch",
  },
  sortBy: {
    textAlign: "center",
  },
  brand: {
    textAlign: "center",
    color: Color.cSK430B92950,
  },
  arrowDown01Icon: {},
  sortByParent: {
    gap: Gap.gap_xs,
  },
  dealName: {
    fontFamily: FontFamily.degular,
    textAlign: "left",
    alignSelf: "stretch",
  },
  text: {
    fontWeight: "700",
    textAlign: "left",
    fontFamily: FontFamily.textSmNormal,
  },
  desiredPostDate: {
    textAlign: "left",
    color: Color.cSK430B92950,
  },
  parent: {
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  dealNo: {
    textAlign: "left",
  },
  frameContainer: {
    gap: Gap.gap_xs,
    alignSelf: "stretch",
  },
  dealNameParent: {
    gap: Gap.gap_sm,
    alignSelf: "stretch",
  },
  pngClipartYoutubePlayButtoIcon: {
    height: 14,
    width: 18,
  },
  pngClipartYoutubePlayButtoWrapper: {
    borderColor: Color.cSK430B9250,
    height: 35,
    borderWidth: 1,
    paddingHorizontal: Padding.p_base,
    borderRadius: Border.br_7xs,
    borderStyle: "solid",
    backgroundColor: Color.white,
  },
  bcb3e9408cfa1747d2d6e4c8c4526Icon: {
    height: 18,
    width: 18,
  },
  frameView: {
    gap: Gap.gap_sm,
    flexDirection: "row",
  },
  frameWrapper: {
    flexDirection: "row",
  },
  frameGroup: {
    paddingBottom: Padding.p_9xs,
    gap: Gap.gap_sm,
    alignSelf: "stretch",
  },
  frameChild: {
    borderTopWidth: 1,
    height: 1,
    opacity: 0.2,
    alignSelf: "stretch",
    borderColor: Color.cSK430B92950,
    borderStyle: "solid",
  },
  frameItem: {
    width: 30,
    height: 30,
  },
  timbaio: {
    textAlign: "left",
    color: Color.cSK430B92500,
  },
  ellipseParent: {
    gap: Gap.gap_sm,
  },
  inReview: {
    color: "#fd6900",
    textAlign: "center",
  },
  inReviewWrapper: {
    backgroundColor: "#ffe5be",
  },
  frameParent: {
    borderRadius: Border.br_xl,
    backgroundColor: Color.lightBg,
    paddingVertical: Padding.p_xs,
    gap: Gap.gap_sm,
    alignSelf: "stretch",
    paddingHorizontal: Padding.p_xl,
  },
  listContainerInner: {
    alignSelf: "stretch",
  },
  listContainer: {
    top: 135,
    paddingVertical: 0,
    gap: Gap.gap_lg,
    paddingHorizontal: Padding.p_xl,
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  homeIndicator1: {
    marginLeft: 72,
    bottom: 8,
    borderRadius: Border.br_81xl,
    width: 144,
    height: 5,
    transform: [
      {
        rotate: "180deg",
      },
    ],
    backgroundColor: Color.white,
    left: "50%",
  },
  homeIndicator: {
    height: 34,
    backgroundColor: Color.cSK430B92500,
    bottom: 0,
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  discoveryIconlyPro: {
    overflow: "hidden",
  },
  home: {
    fontSize: FontSize.size_xs,
    textTransform: "capitalize",
    color: Color.white,
    textAlign: "center",
    fontFamily: FontFamily.textSmNormal,
  },
  discoveryIconlyProParent: {
    overflow: "hidden",
  },
  hotPriceParent: {
    borderColor: Color.white,
    gap: Gap.gap_2xs,
    paddingHorizontal: 0,
    height: 83,
    justifyContent: "center",
    paddingVertical: Padding.p_xs,
    borderBottomWidth: 3,
    alignItems: "center",
    borderStyle: "solid",
    flex: 1,
  },
  navbar: {
    justifyContent: "center",
    backgroundColor: Color.cSK430B92500,
    alignItems: "center",
    flexDirection: "row",
    width: 440,
    left: 0,
    top: 0,
    position: "absolute",
  },
  homeIndicatorParent: {
    height: 117,
    bottom: 0,
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  uom13creatordealhistorylist: {
    width: "100%",
    height: 956,
    overflow: "hidden",
    flex: 1,
    backgroundColor: Color.white,
  },
});

export default UOM13CreatorDealHistoryList;
