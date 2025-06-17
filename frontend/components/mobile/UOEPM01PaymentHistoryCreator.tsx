import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Cap3 from "../../assets/cap3.svg";
import Wifi2 from "../../assets/wifi2.svg";
import Cellularconnection4 from "../../assets/cellular-connection4.svg";
import Arrowleft023 from "../../assets/arrowleft023.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import {
  Color,
  Padding,
  FontSize,
  FontFamily,
  Border,
  Gap,
} from "../../GlobalStyles";
import { router } from "expo-router";
import CustomBackButton from "@/components/CustomBackButton";
import Navbar from "../web/navbar";
const UOEPM01PaymentHistoryCreator = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.uoepm01paymenthistorycreator}>
      {/* <Navbar pageTitle="Payment History"/> */}
      <Text style={styles.paymentHistory}>Payment History</Text>
      <CustomBackButton />

      <View style={[styles.offersStatusTab, styles.groupParentFlexBox]}>
        <View style={[styles.earningsWrapper, styles.wrapperFlexBox]}>
          <Text style={[styles.earnings, styles.text3Typo]}>Earnings</Text>
        </View>
        <Pressable
          style={styles.wrapperFlexBox}
          onPress={() => {
            router.push("/UOEPM05PaymentHistoryMarketer");
          }}
        >
          <Text style={styles.payouts}>Payouts</Text>
        </Pressable>
      </View>
      <View
        style={[
          styles.uoepm01paymenthistorycreatorInner,
          styles.homeIndicatorPosition,
        ]}
      >
        <View style={styles.frameFlexBox}>
          <View style={[styles.frameGroup, styles.frameGroupSpaceBlock]}>
            <Pressable
              style={styles.availableBalanceParent}
              onPress={() => navigation.navigate("UOEPM02WithdrawMoneyCreator")}
            >
              <Text style={[styles.availableBalance, styles.historyTypo]}>
                Available Balance
              </Text>
              <View style={styles.parentFlexBox}>
                <Text style={[styles.text, styles.textTypo]}>$24.00</Text>
              </View>
            </Pressable>
            <View style={styles.availableBalanceParent}>
              <Text
                style={[styles.availableBalance, styles.historyTypo]}
              >{`Current Week Earnings `}</Text>
              <View style={styles.parentFlexBox}>
                <Text style={[styles.text1, styles.textTypo]}>$37,545.00</Text>
              </View>
            </View>
          </View>
          <View style={styles.frameFlexBox}>
            <View style={[styles.historyParent, styles.parentFlexBox]}>
              <Text style={styles.historyTypo}>History</Text>
              <View style={styles.groupParentFlexBox}>
                <Text style={[styles.seeAll, styles.text2Typo]}>See All</Text>
              </View>
            </View>
            <View style={styles.frameView}>
              <View style={[styles.frameParent1, styles.parentFlexBox]}>
                <View style={[styles.groupParent, styles.groupParentFlexBox]}>
                  <Image
                    style={styles.frameChild}
                    contentFit="cover"
                    source={require("../../assets/group-271.png")}
                  />
                  <View style={styles.pepsiPromoJanuaryParent}>
                    <Text
                      style={[styles.pepsiPromoJanuary, styles.specialTypo]}
                    >
                      Pepsi Promo January
                    </Text>
                    <Text style={[styles.text2, styles.text2Typo]}>
                      #237362623
                    </Text>
                  </View>
                </View>
                <Text style={[styles.text3, styles.text3Typo]}>
                  + $35,000.00
                </Text>
              </View>
              <View style={[styles.frameParent1, styles.parentFlexBox]}>
                <View style={[styles.groupParent, styles.groupParentFlexBox]}>
                  <Image
                    style={styles.frameChild}
                    contentFit="cover"
                    source={require("../../assets/group-272.png")}
                  />
                  <View style={styles.specialOfferParent}>
                    <Text
                      style={[styles.specialOffer, styles.specialTypo]}
                    >{`Special Offer `}</Text>
                    <Text style={[styles.text2, styles.text2Typo]}>
                      #237362623
                    </Text>
                  </View>
                </View>
                <Text style={[styles.text3, styles.text3Typo]}>+ $413.00</Text>
              </View>
              <View style={[styles.frameParent1, styles.parentFlexBox]}>
                <View style={[styles.groupParent, styles.groupParentFlexBox]}>
                  <Image
                    style={styles.frameChild}
                    contentFit="cover"
                    source={require("../../assets/group-273.png")}
                  />
                  <View style={styles.januaryOffer2Parent}>
                    <Text style={styles.specialTypo}>January Offer 2</Text>
                    <Text style={[styles.text2, styles.text2Typo]}>
                      #237362623
                    </Text>
                  </View>
                </View>
                <Text style={[styles.text3, styles.text3Typo]}>+ $500.00</Text>
              </View>
              <View style={[styles.frameParent1, styles.parentFlexBox]}>
                <View style={[styles.groupParent, styles.groupParentFlexBox]}>
                  <Image
                    style={styles.frameChild}
                    contentFit="cover"
                    source={require("../../assets/group-274.png")}
                  />
                  <View style={styles.specialOffer4Parent}>
                    <Text style={[styles.specialOffer4, styles.specialTypo]}>
                      Special Offer 4
                    </Text>
                    <Text style={[styles.text2, styles.text2Typo]}>
                      #237362623
                    </Text>
                  </View>
                </View>
                <Text style={[styles.text3, styles.text3Typo]}>
                  + $4,000.00
                </Text>
              </View>
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
  borderLayout: {
    width: 24,
    position: "absolute",
  },
  iconPosition: {
    maxHeight: "100%",
    left: "50%",
    position: "absolute",
  },
  capacityPosition: {
    backgroundColor: Color.labelsPrimary,
    left: "50%",
    position: "absolute",
  },
  homeIndicatorPosition: {
    marginLeft: -220,
    left: "50%",
    width: 440,
    position: "absolute",
  },
  groupParentFlexBox: {
    alignItems: "center",
    flexDirection: "row",
  },
  wrapperFlexBox: {
    padding: Padding.p_xs,
    alignItems: "center",
    flexDirection: "row",
  },
  text3Typo: {
    fontWeight: "500",
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.textSmNormal,
  },
  frameGroupSpaceBlock: {
    paddingVertical: 0,
    paddingHorizontal: Padding.p_xl,
  },
  historyTypo: {
    opacity: 0.5,
    textAlign: "left",
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
  },
  textTypo: {
    fontSize: FontSize.size_xl,
    textAlign: "left",
    fontFamily: FontFamily.textSmNormal,
    fontWeight: "600",
  },
  parentFlexBox: {
    justifyContent: "space-between",
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
  },
  text2Typo: {
    textAlign: "left",
    fontFamily: FontFamily.textSmNormal,
  },
  specialTypo: {
    fontFamily: FontFamily.degular,
    lineHeight: 18,
    textAlign: "left",
    fontWeight: "500",
    fontSize: FontSize.size_base,
    color: Color.cSK430B92950,
    left: 0,
    top: 0,
    position: "absolute",
  },
  time1: {
    top: "34.95%",
    left: "32.36%",
    fontSize: FontSize.size_base_2,
    lineHeight: 21,
    fontFamily: FontFamily.sFPro,
    color: Color.labelsPrimary,
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
    borderColor: Color.labelsPrimary,
    borderWidth: 1,
    opacity: 0.35,
    borderStyle: "solid",
    marginLeft: -13.05,
    left: "50%",
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
    left: "50%",
    position: "absolute",
  },
  wifiIcon: {
    top: "43.88%",
    bottom: "33.2%",
    marginLeft: -13.05,
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
    top: 0,
    left: 0,
    position: "absolute",
    backgroundColor: Color.white,
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
  },
  homeIndicator: {
    bottom: 0,
    height: 34,
    backgroundColor: Color.white,
  },
  paymentHistory: {
    marginLeft: -96,
    top: 79,
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
    left: "50%",
    textAlign: "center",
    fontWeight: "600",
    position: "absolute",
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
  },
  earnings: {
    color: Color.cSK430B92500,
    textAlign: "center",
  },
  earningsWrapper: {
    borderColor: Color.cSK430B92500,
    borderBottomWidth: 3,
    borderStyle: "solid",
  },
  payouts: {
    fontSize: FontSize.size_base,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
    textAlign: "center",
  },
  offersStatusTab: {
    top: 135,
    left: 24,
    width: 400,
    height: 43,
    gap: Gap.gap_xs,
    position: "absolute",
  },
  availableBalance: {
    alignSelf: "stretch",
  },
  text: {
    color: Color.cSK430B92500,
  },
  availableBalanceParent: {
    gap: Gap.gap_sm,
    flex: 1,
  },
  text1: {
    color: Color.cSK430B92950,
  },
  frameGroup: {
    gap: Gap.gap_2xl,
    alignSelf: "stretch",
    flexDirection: "row",
    paddingVertical: 0,
  },
  seeAll: {
    fontSize: FontSize.textSmNormal_size,
    textAlign: "left",
    color: Color.cSK430B92500,
    fontWeight: "500",
  },
  historyParent: {
    paddingVertical: 0,
    paddingHorizontal: Padding.p_xl,
  },
  frameChild: {
    width: 44,
    height: 42,
  },
  pepsiPromoJanuary: {
    width: 170,
  },
  text2: {
    top: 22,
    fontSize: FontSize.size_xs,
    lineHeight: 12,
    color: Color.grey,
    width: 96,
    textAlign: "left",
    left: 0,
    position: "absolute",
  },
  pepsiPromoJanuaryParent: {
    width: 170,
    height: 34,
  },
  groupParent: {
    gap: Gap.gap_xs,
  },
  text3: {
    lineHeight: 16,
    textAlign: "right",
    width: 110,
    color: Color.cSK430B92950,
  },
  frameParent1: {
    backgroundColor: Color.lightBg,
    paddingVertical: Padding.p_xs,
    paddingHorizontal: Padding.p_xl,
    justifyContent: "space-between",
  },
  specialOffer: {
    width: 105,
  },
  specialOfferParent: {
    width: 105,
    height: 34,
  },
  januaryOffer2Parent: {
    width: 101,
    height: 34,
  },
  specialOffer4: {
    width: 121,
  },
  specialOffer4Parent: {
    width: 121,
    height: 34,
  },
  frameView: {
    alignSelf: "stretch",
    gap: Gap.gap_xs,
  },
  frameFlexBox: {
    gap: Gap.gap_2xl,
    alignSelf: "stretch",
  },
  uoepm01paymenthistorycreatorInner: {
    // top: 200,
    paddingHorizontal: 0,
    paddingVertical: Padding.p_5xs,
  },
  uoepm01paymenthistorycreator: {
    width: "100%",
    height: 956,
    overflow: "hidden",
    flex: 1,
    backgroundColor: Color.white,
  },
});

export default UOEPM01PaymentHistoryCreator;
