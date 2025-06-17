"use client";

import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Search01 from "../../assets/search01.svg";
import Arrowleft021 from "../../assets/arrowleft021.svg";
import Calendar03 from "../../assets/calendar03.svg";
import Cloudupload from "../../assets/cloudupload.svg";
import Checkmarksquare01 from "../../assets/checkmarksquare01.svg";
import YoutubeIcon from "../../assets/youtube-icon.svg";
import InstagramIcon from "../../assets/instagram-icon.svg";
import FacebookIcon from "../../assets/facebook-icon.svg";
import TiktokIcon from "../../assets/tiktok-icon.svg";
import { Path } from "react-native-svg";
import Svg from "react-native-svg";
import { Image } from "expo-image";
import { FontFamily, Gap, Border, Padding } from "@/GlobalStyles";
import { FontSize } from "@/GlobalStyles";
import { Color } from "@/GlobalStyles";
import PaymentModal from "@/components/PaymentModal";
import CustomBackButton from "@/components/CustomBackButton";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "../ProfileInfo";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function UOM06MarketerOfferCounterEdit() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    name: "",
    expiry: "",
    number: "",
    cvv: "",
  });
  const { user } = useAuth();

  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar style="auto" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <CustomBackButton />

          <Text style={styles.headerTitle}>Counter Offer</Text>
          <TouchableOpacity
            style={styles.placeholder}
            onPress={() => {
              router.push("/profile");
            }}
          >
            <ProfileInfo />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 20, gap: 8 }}>
          <Text style={{ fontSize: 16, color: "#6C6C6C" }}>Offer Name</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#E2D0FB",
              borderRadius: 8,
              padding: 16,
              width: "50%",
            }}
            maxLength={100}
            placeholder="Enter offer name"
            placeholderTextColor="#6C6C6C"
          />
        </View>

        <View style={styles.offerDetails}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Platforms</Text>

            <View style={styles.platformIcons}>
              <Text style={styles.text}>Select your social platforms</Text>
              <View style={styles.svgWrapper}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                    stroke="#0B0218"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Descriptions/Instructions</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Write more instructions"
              multiline
              placeholderTextColor="#6C6C6C"
            />
          </View>

          <View style={styles.dateContainer}>
            <View style={[styles.detailSection, { width: "50%" }]}>
              <Text style={styles.sectionLabel}>
                Desired Content Review Date
              </Text>
              <Pressable style={styles.dateInput}>
                <Text style={styles.inputText}>Date Range</Text>
                <Calendar03 width={24} height={24} color="#430b92" />
              </Pressable>
            </View>

            <View style={[styles.detailSection, { width: "50%" }]}>
              <Text style={styles.sectionLabel}>Desired Post Date</Text>
              <Pressable style={styles.dateInput}>
                <Text style={styles.inputText}>Date Range</Text>
                <Calendar03 width={24} height={24} color="#430b92" />
              </Pressable>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Your Offer</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="$"
              keyboardType="numeric"
              placeholderTextColor="#6C6C6C"
            />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any notes here"
              multiline
              placeholderTextColor="#6C6C6C"
            />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Upload Files</Text>
            <View style={styles.uploadSection}>
              <Cloudupload width={24} height={24} color="#430b92" />
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>Attach Content</Text>
                <Text style={styles.uploadSubtext}>
                  pdf, gif, jpeg, sng, png, photoshop, adobe
                </Text>
              </View>
              <Pressable style={styles.browseButton}>
                <Text style={styles.browseText}>Browse Files</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.termsContainer}
          onPress={() => setIsTermsAgreed(!isTermsAgreed)}
        >
          <Checkmarksquare01
            width={32}
            height={32}
            color={isTermsAgreed ? "#430b92" : "#e2d0fb"}
          />
          <Text style={styles.termsText}>
            By agreeing, we assume you have read the{" "}
            <Text style={styles.termsLink}>Transaction Terms</Text>
          </Text>
        </Pressable>

        <View style={styles.actionButtons}>
          <Pressable style={styles.draftButton}>
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </Pressable>

          <Pressable style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
          <Pressable
            style={styles.sendButton}
            onPress={() => setIsPaymentModalVisible(true)}
          >
            <Text style={styles.sendButtonText}>Send for $1</Text>
          </Pressable>
        </View>
      </ScrollView>

      <PaymentModal
        isPaymentModalVisible={isPaymentModalVisible}
        setPaymentModalVisible={setIsPaymentModalVisible}
        cardDetails={cardDetails}
        setCardDetails={setCardDetails}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  icon: {
    width: 139,
    left: 0,
    top: 0,
    height: 60,
    position: "absolute",
  },
  wrapper: {
    width: 162,
    height: 60,
  },
  searchCategoryTags: {
    opacity: 0.5,
    color: Color.cSK430B92950,
    fontSize: FontSize.size_lg,
  },
  search01Parent: {
    borderColor: Color.colorPlum,
    gap: Gap.gap_md,
    borderWidth: 1,
    borderStyle: "solid",
    paddingVertical: Padding.p_xs,
    backgroundColor: Color.buttonSelectable,
    flex: 1,
  },
  signIn: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_lg,
  },
  join: {
    color: Color.white,
    fontSize: FontSize.size_lg,
  },
  joinWrapper: {
    backgroundColor: Color.cSK430B92500,
  },
  frameGroup: {
    paddingLeft: Padding.p_5xl,
  },
  frameParentSpaceBlock: {
    paddingVertical: 0,
    paddingHorizontal: Padding.p_10xs,
    width: 1280,
    marginLeft: -640,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    left: "50%",
    marginBottom: 20,
  },
  parentSpaceBlock: {
    paddingVertical: Padding.p_xs,
    paddingHorizontal: Padding.p_5xl,
    borderRadius: Border.br_xs,
    flexDirection: "row",
  },
  categoryTypo: {
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  frameFlexBox: {
    gap: Gap.gap_3xs,
    alignItems: "center",
    flexDirection: "row",
  },
  signInClr: {
    color: Color.cSK430B92500,
    textAlign: "center",
  },
  parentFlexBox2: {
    alignItems: "center",
    flexDirection: "row",
  },
  shareParentBorder: {
    borderColor: Color.cSK430B92500,
    paddingVertical: Padding.p_xs,
    paddingHorizontal: Padding.p_5xl,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: Border.br_xs,
    flexDirection: "row",
  },
  parentFlexBox1: {
    gap: Gap.gap_lg,
    alignItems: "center",
  },
  parentFlexBox: {
    width: 340,
    alignItems: "center",
    flexDirection: "row",
  },
  frameParent: {},
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholder: {},
  backLink: {
    fontSize: 16,
    color: "#430b92",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 5,
  },
  offerTitle: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  offerId: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  offerDetails: {
    gap: 24,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  detailSection: {
    gap: 8,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  platformIcons: {
    width: "50%",
    height: 54,
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C5A0F8",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexDirection: "row",
    display: "flex",
  },
  platformIconWrapper: {
    width: 35,
    height: 35,
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    textAlign: "center",
    color: "#430B92",
    fontSize: 18,
    fontFamily: "Inter",
    fontWeight: "400",
  },
  svgWrapper: {
    position: "relative",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 16,
    height: 127,
    fontSize: 14,
    color: "#000000",
    textAlignVertical: "top",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  dateInput: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  priceInput: {
    height: 58,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  uploadSection: {
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  uploadContent: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#6C6C6C",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#430b92",
    borderRadius: 4,
  },
  browseText: {
    fontSize: 14,
    color: "#430b92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  termsLink: {
    color: "#430b92",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 40,
  },
  draftButton: {
    height: 58,
    borderWidth: 1,
    borderColor: "#430b92",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: "30%",
  },
  draftButtonText: {
    color: "#430b92",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  sendButton: {
    height: 58,
    backgroundColor: "#430b92",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: "30%",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  deleteButton: {
    height: 58,
    borderWidth: 1,
    borderColor: "#6C6C6C",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: "30%",
  },
  deleteButtonText: {
    color: "#6C6C6C",
    fontSize: 16,
    fontWeight: "500",
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
