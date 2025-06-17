import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Cap1 from "../../assets/cap1.svg";
import Wifi1 from "../../assets/wifi1.svg";
import Cellularconnection1 from "../../assets/cellular-connection1.svg";
import Arrowleft02 from "../../assets/arrowleft02.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Group27 from "../../assets/group-27.svg";
import {
  Color,
  FontFamily,
  Border,
  FontSize,
  Padding,
  Gap,
} from "../../GlobalStyles";
import CustomBackButton from "@/components/CustomBackButton";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};
const UOEPM02WithdrawMoneyCreator = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.uoepm02withdrawmoneycreator}>
      <Text style={[styles.withdrawMoney, styles.withdrawTypo]}>
        Withdraw Money
      </Text>
      <CustomBackButton />

      <View style={[styles.frameParent, styles.batteryPosition]}>
        <View style={[styles.amountParent, styles.parentFlexBox]}>
          <Text style={[styles.amount, styles.text1Typo]}>Amount</Text>
          <Text style={[styles.text, styles.withdrawTypo]}>$0.00</Text>
        </View>
        <View style={[styles.parent, styles.parentFlexBox]}>
          <Text style={[styles.text1, styles.text1Typo]}>$24.00</Text>
          <Text style={[styles.availableBalance, styles.text1Typo]}>
            Available Balance
          </Text>
        </View>
      </View>
      <View style={[styles.frameGroup, styles.frameGroupPosition]}>
        <View style={[styles.withdrawMoneyToParent, styles.frameViewFlexBox1]}>
          <Text style={[styles.withdrawMoneyTo, styles.withdrawTypo]}>
            Withdraw money to
          </Text>
          <Pressable
            style={styles.addNewAccountWrapper}
            onPress={() => navigation.navigate("UOEPM04AddNewMethodCreator")}
          >
            <Text style={[styles.addNewAccount, styles.text2Typo]}>
              + Add new account
            </Text>
          </Pressable>
        </View>
        <View style={[styles.frameContainer, styles.parentFlexBox]}>
          <View style={[styles.frameView, styles.frameViewFlexBox]}>
            <View style={[styles.groupParent, styles.groupParentFlexBox]}>
              <Group27 style={styles.frameChild} width={44} height={42} />
              <View style={styles.universalDebitCardParent}>
                <Text
                  style={[styles.universalDebitCard, styles.instantPayTypo]}
                >
                  Universal Debit Card
                </Text>
                <Text style={[styles.expiry0327, styles.expiry0327Clr]}>
                  Expiry 03/27
                </Text>
              </View>
            </View>
            <View style={[styles.group, styles.groupParentFlexBox]}>
              <Text style={[styles.text2, styles.text2Typo]}>*****</Text>
              <Text style={[styles.text2, styles.text2Typo]}>8367</Text>
            </View>
          </View>
          <View style={styles.selectOnePayoutMethodToCoParent}>
            <Text style={[styles.availableBalance, styles.text1Typo]}>
              Select one payout method to continue
            </Text>
            <View style={[styles.frameParent1, styles.groupParentFlexBox]}>
              <View style={[styles.instantPayParent, styles.parentBorder]}>
                <Text style={[styles.instantPay, styles.instantPayTypo]}>
                  Instant Pay
                </Text>
                <Text style={[styles.cashOutAtThe, styles.expiry0327Clr]}>
                  Cash-out at the end of the a day. This operation has a 1% fee.
                </Text>
              </View>
              <View style={[styles.hCashOutParent, styles.parentBorder]}>
                <Text style={[styles.instantPay, styles.instantPayTypo]}>
                  48h Cash-Out
                </Text>
                <Text style={[styles.cashOutAtThe, styles.expiry0327Clr]}>
                  Payout request is released within 48h with no deductions.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <Pressable
        style={[styles.withdrawWrapper, styles.frameViewFlexBox]}
        onPress={() => navigation.navigate("UOEPM03TransactionDetailsCreator")}
      >
        <Text style={[styles.withdraw, styles.text2Typo]}>Withdraw</Text>
      </Pressable>
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
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
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
    backgroundColor: Color.labelsPrimary,
    left: "50%",
    position: "absolute",
  },
  withdrawTypo: {
    fontFamily: FontFamily.inter,
    color: Color.cSK430B92950,
  },
  parentFlexBox: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  text1Typo: {
    opacity: 0.5,
    textAlign: "left",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  frameGroupPosition: {
    width: 400,
    left: 20,
    position: "absolute",
  },
  frameViewFlexBox1: {
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  text2Typo: {
    fontWeight: "500",
    fontFamily: FontFamily.inter,
  },
  frameViewFlexBox: {
    borderRadius: Border.br_xs,
    flexDirection: "row",
    alignItems: "center",
  },
  groupParentFlexBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  instantPayTypo: {
    lineHeight: 18,
    fontWeight: "500",
    fontSize: FontSize.size_base,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  expiry0327Clr: {
    color: Color.grey,
    lineHeight: 14,
    fontFamily: FontFamily.inter,
  },
  parentBorder: {
    paddingVertical: Padding.p_5xl,
    gap: Gap.gap_xs,
    borderRadius: Border.br_xs,
    paddingHorizontal: Padding.p_xs,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "solid",
    flex: 1,
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
    marginLeft: -220,
    bottom: 0,
    height: 34,
    width: 440,
    left: "50%",
    backgroundColor: Color.white,
  },
  withdrawMoney: {
    marginLeft: -99,
    top: 79,
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92950,
    left: "50%",
    position: "absolute",
    textAlign: "center",
    fontWeight: "600",
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
    position: "absolute",
  },
  amount: {
    fontSize: FontSize.size_xl,
    opacity: 0.5,
  },
  text: {
    fontSize: 54,
    textAlign: "left",
    color: Color.cSK430B92950,
    fontWeight: "600",
  },
  amountParent: {
    height: 105,
    gap: Gap.gap_sm,
    justifyContent: "center",
  },
  text1: {
    fontSize: FontSize.size_xl,
    opacity: 0.5,
    fontWeight: "600",
  },
  availableBalance: {
    fontSize: FontSize.size_sm,
  },
  parent: {
    height: 49,
    gap: Gap.gap_2xs,
    justifyContent: "center",
  },
  frameParent: {
    marginLeft: -92,
    top: 156,
    width: 184,
    gap: 56,
  },
  withdrawMoneyTo: {
    fontSize: FontSize.size_base,
    textAlign: "left",
    color: Color.cSK430B92950,
  },
  addNewAccount: {
    color: Color.cSK430B92500,
    fontSize: FontSize.size_base,
    textAlign: "left",
  },
  addNewAccountWrapper: {
    borderRadius: Border.br_9xs,
    backgroundColor: Color.cSK430B9250,
    paddingVertical: Padding.p_7xs,
    paddingHorizontal: Padding.p_xs,
    flexDirection: "row",
    alignItems: "center",
  },
  withdrawMoneyToParent: {
    flexDirection: "row",
    alignItems: "center",
  },
  frameChild: {},
  universalDebitCard: {
    width: 170,
    textAlign: "left",
    left: 0,
    position: "absolute",
    top: 0,
    lineHeight: 14,
  },
  expiry0327: {
    top: 22,
    fontSize: FontSize.size_xs,
    width: 96,
    textAlign: "left",
    left: 0,
    position: "absolute",
  },
  universalDebitCardParent: {
    width: 170,
    height: 34,
  },
  groupParent: {
    gap: Gap.gap_xs,
  },
  text2: {
    lineHeight: 16,
    textAlign: "right",
    fontSize: FontSize.size_base,
    color: Color.cSK430B92950,
  },
  group: {
    gap: Gap.gap_3xs,
  },
  frameView: {
    backgroundColor: Color.lightBg,
    padding: Padding.p_xs,
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  instantPay: {
    textAlign: "center",
  },
  cashOutAtThe: {
    fontSize: FontSize.size_3xs,
    width: 143,
    textAlign: "center",
  },
  instantPayParent: {
    borderColor: Color.cSK430B92500,
  },
  hCashOutParent: {
    borderColor: "#e2d0fb",
  },
  frameParent1: {
    gap: 11,
    alignSelf: "stretch",
  },
  selectOnePayoutMethodToCoParent: {
    gap: Gap.gap_xs,
    alignSelf: "stretch",
  },
  frameContainer: {
    gap: Gap.gap_2xl,
  },
  frameGroup: {
    top: 416,
    gap: 48,
  },
  withdraw: {
    fontSize: FontSize.size_lg,
    color: Color.white,
    textAlign: "center",
  },
  withdrawWrapper: {
    top: 832,
    backgroundColor: Color.cSK430B92500,
    height: 58,
    paddingHorizontal: Padding.p_5xl,
    paddingVertical: Padding.p_5xs,
    width: 400,
    left: 20,
    position: "absolute",
    justifyContent: "center",
  },
  uoepm02withdrawmoneycreator: {
    width: "100%",
    height: 956,
    overflow: "hidden",
    flex: 1,
    backgroundColor: Color.white,
  },
});

export default UOEPM02WithdrawMoneyCreator;
