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
import { useAuth } from "@/contexts/AuthContext";
import Arrowleft02 from "../../assets/arrowleft02.svg";
import Helpcircle from "../../assets/helpcircle.svg";
import Calendar03 from "../../assets/calendar03.svg";
import Cloudupload from "../../assets/cloudupload.svg";
import Checkmarksquare01 from "../../assets/checkmarksquare01.svg";
import YoutubeIcon from "../../assets/youtube-icon.svg";
import InstagramIcon from "../../assets/instagram-icon.svg";
import FacebookIcon from "../../assets/facebook-icon.svg";
import TiktokIcon from "../../assets/tiktok-icon.svg";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function MarketerOfferDetail() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const { user } = useAuth();
  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar style="auto" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <CustomBackButton />

          <Text style={styles.headerTitle}>Pre-made Offer Reel</Text>
          <TouchableOpacity
            style={styles.placeholder}
            onPress={() => {
              router.push("/profile");
            }}
          >
            <ProfileInfo />
          </TouchableOpacity>
        </View>

        <Text style={styles.backLink}>Back to offers list</Text>

        <View style={styles.offerHeader}>
          <Text style={styles.offerTitle}>Pre-made Reel Offer</Text>
          <Text style={styles.offerId}>#HJDF7843T</Text>
        </View>

        <View style={styles.offerDetails}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Offer Details</Text>
            <Helpcircle width={24} height={24} color="#430b92" />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Platforms</Text>
            <View style={styles.platformIcons}>
              {[
                { icon: YoutubeIcon, name: "youtube" },
                { icon: InstagramIcon, name: "instagram" },
                { icon: FacebookIcon, name: "facebook" },
                { icon: TiktokIcon, name: "tiktok" },
              ].map(({ icon: Icon }, index) => (
                <View key={index} style={styles.platformIconWrapper}>
                  <Icon width={20} height={20} />
                </View>
              ))}
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

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Desired Content Review Date</Text>
            <Pressable style={styles.dateInput}>
              <Text style={styles.inputText}>Date Range</Text>
              <Calendar03 width={24} height={24} color="#430b92" />
            </Pressable>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Desired Post Date</Text>
            <Pressable style={styles.dateInput}>
              <Text style={styles.inputText}>Date Range</Text>
              <Calendar03 width={24} height={24} color="#430b92" />
            </Pressable>
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
          <Pressable
            style={styles.sendButton}
            onPress={() => router.push("/UOM03MarketerPreviewAndPay")}
          >
            <Text style={styles.sendButtonText}>Send for $1</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  offerTitle: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  offerId: {
    fontSize: 14,
    color: "#6C6C6C",
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformIconWrapper: {
    width: 35,
    height: 35,
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
