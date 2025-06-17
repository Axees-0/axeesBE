import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Cap3 from "../../assets/cap3.svg";
import Wifi1 from "../../assets/wifi1.svg";
import Cellularconnection3 from "../../assets/cellular-connection3.svg";
import Arrowleft021 from "../../assets/arrowleft021.svg";
import Bank from "../../assets/bank.svg";
import Vector105 from "../../assets/vector-105.svg";
import Useruserprofile from "../../assets/useruserprofile.svg";
import Vector106 from "../../assets/vector-106.svg";
import Vector107 from "../../assets/vector-107.svg";
import Group2 from "../../assets/group-2.svg";
import Paymentsfinancecreditcards from "../../assets/payments-financecreditcards.svg";
import {
  Color,
  FontSize,
  FontFamily,
  Gap,
  Border,
  Padding,
} from "../../GlobalStyles";
import { router } from "expo-router";
import CustomBackButton from "@/components/CustomBackButton";
const UOEPM04AddNewMethodCreator = () => {
  return (
    <View style={styles.uoepm04addnewmethodcreator}>
      <Text style={styles.addNew}>Add New</Text>
      <CustomBackButton />

      <View style={[styles.frameParent, styles.frameParentFlexBox]}>
        <View style={styles.debitCardDetailsParent}>
          <Text style={styles.debitCardDetails}>Debit Card Details</Text>
          <View style={styles.frameFlexBox}>
            <View style={styles.bankNameParent}>
              <Text style={[styles.bankName, styles.textTypo]}>Bank Name</Text>
              <View style={styles.groupParent}>
                <View style={[styles.bankNameGroup, styles.bankPosition]}>
                  <Text style={[styles.bankName1, styles.textTypo]}>
                    Bank Name
                  </Text>
                  <Bank
                    style={[styles.bankIcon, styles.bankPosition]}
                    width={22}
                    height={22}
                  />
                </View>
                <Vector105
                  style={[styles.groupChild, styles.groupChildPosition]}
                  width={335}
                />
              </View>
            </View>
            <View style={styles.bankNameParent}>
              <Text style={[styles.bankName, styles.textTypo]}>
                Cardholder Name
              </Text>
              <View style={styles.groupContainer}>
                <View style={[styles.timBaioParent, styles.bankPosition]}>
                  <Text style={[styles.bankName1, styles.textTypo]}>
                    Tim Baio
                  </Text>
                  <Useruserprofile
                    style={[styles.useruserprofileIcon, styles.iconLayout]}
                    width={23}
                    height={100}
                  />
                </View>
                <Vector105
                  style={[styles.groupItem, styles.groupPosition]}
                  width={335}
                />
              </View>
            </View>
            <View style={[styles.frameContainer, styles.frameFlexBox]}>
              <View style={styles.expiryDateParent}>
                <Text style={[styles.bankName, styles.textTypo]}>
                  Expiry Date
                </Text>
                <View style={styles.vectorParent}>
                  <Vector106
                    style={[styles.groupInner, styles.iconLayout1]}
                    width={120}
                  />
                  <Text style={[styles.text, styles.textTypo]}>09/06/2024</Text>
                </View>
              </View>
              <View style={styles.expiryDateParent}>
                <Text style={[styles.bankName, styles.textTypo]}>
                  4-digit CVV
                </Text>
                <View style={styles.vectorParent}>
                  <Vector106
                    style={[styles.groupInner, styles.iconLayout1]}
                    width={120}
                  />
                  <Text style={[styles.text1, styles.textTypo]}>2374</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardNumberParent}>
              <Text style={[styles.bankName, styles.textTypo]}>
                Card Number
              </Text>
              <View style={styles.vectorContainer}>
                <Vector107
                  style={[styles.groupChild1, styles.groupPosition]}
                  width={400}
                />
                <View style={[styles.parent, styles.text5Position]}>
                  <Text style={[styles.text2, styles.textTypo]}>
                    4562 3653 4595 7852
                  </Text>
                  <Group2
                    style={[styles.groupIcon, styles.iconLayout]}
                    width={25}
                    height={25}
                  />
                  <Paymentsfinancecreditcards
                    style={[
                      styles.paymentsFinancecreditCardsIcon,
                      styles.iconLayout,
                    ]}
                    width={30}
                    height={30}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.debitCardDetailsParent}>
          <Text style={styles.debitCardDetails}>Bank Details</Text>
          <View style={styles.frameFlexBox}>
            <View style={styles.bankNameParent}>
              <Text style={[styles.bankName, styles.textTypo]}>Bank Name</Text>
              <View style={styles.groupParent}>
                <View style={[styles.bankNameGroup, styles.bankPosition]}>
                  <Text style={[styles.bankName1, styles.textTypo]}>
                    Bank Name
                  </Text>
                  <Bank width={22} height={22} />
                </View>
                <Vector105 width={335} />
              </View>
            </View>
            <View style={styles.bankNameParent}>
              <Text style={[styles.bankName, styles.textTypo]}>
                Account holder Name
              </Text>
              <View style={styles.groupContainer}>
                <View style={[styles.timBaioParent, styles.bankPosition]}>
                  <Text style={[styles.bankName1, styles.textTypo]}>
                    Tim Baio
                  </Text>
                  <Useruserprofile
                    style={[styles.useruserprofileIcon, styles.iconLayout]}
                    width={23}
                    height={100}
                  />
                </View>
                <Vector105 width={335} />
              </View>
            </View>
            <View style={[styles.frameContainer, styles.frameFlexBox]}>
              <View style={styles.expiryDateParent}>
                <Text style={[styles.bankName, styles.textTypo]}>
                  Routing Number
                </Text>
                <View style={styles.vectorParent}>
                  <Vector106
                    style={[styles.groupInner, styles.iconLayout1]}
                    width={120}
                  />
                  <Text style={[styles.text, styles.textTypo]}>1232654347</Text>
                </View>
              </View>
              <View style={styles.expiryDateParent}>
                <Text style={[styles.bankName, styles.textTypo]}>
                  Account Number
                </Text>
                <View style={styles.vectorParent2}>
                  <Vector106
                    style={[styles.groupInner, styles.iconLayout1]}
                    width={120}
                  />
                  <Text style={[styles.text4, styles.textTypo]}>
                    32487327463274637
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardNumberParent}>
              <Text style={[styles.bankName, styles.textTypo]}>
                Postal Code
              </Text>
              <View style={styles.vectorParent3}>
                <Vector107
                  style={[styles.groupChild6, styles.groupChildPosition]}
                  width={400}
                />
                <View style={[styles.wrapper, styles.text5Position]}>
                  <Text style={[styles.text5, styles.textTypo]}>2345</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.addPaymentMethodWrapper, styles.frameParentFlexBox]}>
        <Text style={styles.addPaymentMethod}>Add Payment Method</Text>
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
  iconLayout1: {
    maxHeight: "100%",
    position: "absolute",
  },
  capacityPosition: {
    backgroundColor: Color.labelsPrimary,
    left: "50%",
    position: "absolute",
  },
  frameParentPosition: {
    marginLeft: -220,
    left: "50%",
  },
  frameParentFlexBox: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  textTypo: {
    fontSize: FontSize.size_sm,
    textAlign: "left",
    lineHeight: 14,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  bankPosition: {
    height: 22,
    left: 0,
    top: 0,
    position: "absolute",
  },
  groupChildPosition: {
    top: 31,
    maxHeight: "100%",
    left: 0,
    position: "absolute",
  },
  iconLayout: {
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  groupPosition: {
    top: 32,
    maxHeight: "100%",
    left: 0,
    position: "absolute",
  },
  frameFlexBox: {
    gap: Gap.gap_md,
    alignSelf: "stretch",
  },
  text5Position: {
    top: "0%",
    left: "0%",
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
    borderRadius: Border.br_8xs_1,
    borderStyle: "solid",
    borderColor: Color.labelsPrimary,
    borderWidth: 1,
    opacity: 0.35,
    bottom: "0%",
    height: "100%",
    top: "0%",
    marginLeft: -13.05,
    left: "50%",
  },
  capIcon: {
    marginLeft: 11.75,
    top: "37.1%",
    bottom: "31.45%",
    left: "50%",
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
    left: "50%",
  },
  cellularConnectionIcon: {
    marginLeft: -38.55,
    top: "43.69%",
    bottom: "33.59%",
    left: "50%",
  },
  levels: {
    left: "64.25%",
    right: "0%",
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
    bottom: 0,
    height: 34,
    width: 440,
    marginLeft: -220,
    position: "absolute",
    backgroundColor: Color.white,
  },
  addNew: {
    marginLeft: -53,
    top: 79,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_5xl,
    left: "50%",
    textAlign: "center",
    fontWeight: "600",
    position: "absolute",
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
  },
  debitCardDetails: {
    fontFamily: FontFamily.degular,
    width: 400,
    textAlign: "left",
    lineHeight: 24,
    fontWeight: "500",
    color: Color.cSK430B92950,
    fontSize: FontSize.size_5xl,
  },
  bankName: {
    opacity: 0.5,
  },
  bankName1: {
    top: 4,
    left: 38,
    position: "absolute",
  },
  bankIcon: {},
  bankNameGroup: {
    width: 114,
  },
  groupChild: {},
  groupParent: {
    height: 31,
    width: 335,
  },
  bankNameParent: {
    gap: Gap.gap_sm,
    alignSelf: "stretch",
  },
  useruserprofileIcon: {
    right: "77.08%",
    bottom: "0%",
    top: "0%",
    left: "0%",
  },
  timBaioParent: {
    width: 96,
  },
  groupItem: {},
  groupContainer: {
    height: 32,
    width: 335,
  },
  groupInner: {
    top: 24,
    left: 0,
  },
  text: {
    left: 0,
    top: 0,
    fontSize: FontSize.size_sm,
    position: "absolute",
  },
  vectorParent: {
    width: 120,
    height: 24,
  },
  expiryDateParent: {
    height: 54,
    justifyContent: "space-between",
    flex: 1,
  },
  text1: {
    width: 36,
    left: 0,
    top: 0,
    fontSize: FontSize.size_sm,
    position: "absolute",
  },
  frameContainer: {
    flexDirection: "row",
  },
  groupChild1: {},
  text2: {
    width: "45.32%",
    top: "18.18%",
    left: "10.27%",
    position: "absolute",
  },
  groupIcon: {
    top: "9.09%",
    bottom: "9.09%",
    left: "92.61%",
    right: "0%",
  },
  paymentsFinancecreditCardsIcon: {
    right: "93.35%",
    bottom: "0%",
    top: "0%",
    left: "0%",
  },
  parent: {
    height: "68.75%",
    width: "98.8%",
    right: "1.2%",
    bottom: "31.25%",
  },
  vectorContainer: {
    height: 32,
    alignSelf: "stretch",
  },
  cardNumberParent: {
    height: 62,
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  debitCardDetailsParent: {
    alignSelf: "stretch",
    gap: Gap.gap_2xl,
  },
  text4: {
    width: 156,
    left: 0,
    top: 0,
    fontSize: FontSize.size_sm,
    position: "absolute",
  },
  vectorParent2: {
    width: 156,
    height: 24,
  },
  groupChild6: {},
  text5: {
    top: "0%",
    left: "0%",
    position: "absolute",
    width: "100%",
    fontSize: FontSize.size_sm,
  },
  wrapper: {
    height: "45.16%",
    width: "44.78%",
    right: "55.23%",
    bottom: "54.84%",
  },
  vectorParent3: {
    height: 31,
    alignSelf: "stretch",
  },
  frameParent: {
    top: 158,
    paddingHorizontal: Padding.p_xl,
    paddingVertical: 0,
    gap: Gap.gap_2xl,
    marginLeft: -220,
    left: "50%",
  },
  addPaymentMethod: {
    fontSize: FontSize.size_lg,
    color: Color.white,
    fontWeight: "500",
    fontFamily: FontFamily.inter,
    textAlign: "center",
  },
  addPaymentMethodWrapper: {
    top: 988,
    borderRadius: Border.br_xs,
    backgroundColor: Color.cSK430B92500,
    height: 58,
    paddingHorizontal: Padding.p_5xl,
    paddingVertical: Padding.p_5xs,
    flexDirection: "row",
    width: 400,
    left: 20,
  },
  uoepm04addnewmethodcreator: {
    height: 1154,
    overflow: "hidden",
    backgroundColor: Color.white,
    width: "100%",
    flex: 1,
  },
});

export default UOEPM04AddNewMethodCreator;
