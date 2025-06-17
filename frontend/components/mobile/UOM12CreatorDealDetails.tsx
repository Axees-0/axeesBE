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
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Arrowleft02 from "../../assets/arrowleft02.svg";
import Fileuploadicon from "../../assets/-file-upload-icon.svg";
import YoutubeIcon from "../../assets/youtube-icon.svg";
import InstagramIcon from "../../assets/instagram-icon.svg";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
import ProofSubmission from "../ProofSubmission";
import SocialMediaLinks from "../SocialMediaLinks";
import DealDashboard from "../DealDashboard";
import OfferNegotiation from "../OfferNegotiation";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function CreatorDealDetails() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const [showProofSubmission, setShowProofSubmission] = useState(false);
  const [showNegotiation, setShowNegotiation] = useState(false);
  
  // Mock deal ID and offer ID - in real app this would come from route params or props
  const dealId = "deal_123456789";
  const offerId = "offer_987654321";
  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar style="auto" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <CustomBackButton />

          <Text style={styles.headerTitle}>Deal Details</Text>
          <TouchableOpacity
            style={styles.placeholder}
            onPress={() => {
              router.push("/profile");
            }}
          >
            <ProfileInfo />
          </TouchableOpacity>
        </View>

        <View
          style={[
            { width: "100%" },
            isWeb && isWideScreen && styles.webContainer,
          ]}
        >
          <View style={styles.dealCard}>
            <Text style={styles.dealName}>Pepsi Promo January</Text>
            <Text style={styles.dealAmount}>$35,000.00</Text>

            <View style={styles.userInfo}>
              <View style={styles.userProfile}>
                <Text style={styles.username}>@the_ashley_vaughan</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Offer Accepted</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.negotiateButton}
                onPress={() => router.push(`/OfferNegotiationPage?offerId=${offerId}&dealId=${dealId}&userType=creator`)}
              >
                <Text style={styles.negotiateButtonText}>Negotiate</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Deal Dashboard Section */}
          <View style={styles.dashboardSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Performance Dashboard</Text>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => router.push(`/DealDashboardPage?dealId=${dealId}&userType=creator`)}
              >
                <Text style={styles.manageButtonText}>View Full</Text>
              </TouchableOpacity>
            </View>
            <DealDashboard
              dealId={dealId}
              userType="creator"
              compact={true}
              showProjections={false}
              timeframe="month"
            />
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Platforms</Text>
              <View style={styles.platformIcons}>
                <View style={styles.platformIcon}>
                  <YoutubeIcon width={20} height={20} />
                </View>
                <View style={styles.platformIcon}>
                  <InstagramIcon width={20} height={20} />
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.descriptionText}>
                Lorem ipsum dolor sit amet consectetur. Vulputate eu enim sit
                nisl cras ut leo. Suspendisse pellentesque nibh vel adipiscing
                ipsum.
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Desired Post Date</Text>
              <Text style={styles.detailText}>December 12, 2024</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>
                Desired Content Review Date
              </Text>
              <Text style={styles.detailText}>December 15, 2024</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Deal No</Text>
              <Text style={styles.detailText}>#2134135624</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Transaction No</Text>
              <Text style={styles.detailText}>#5843678564</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Files</Text>
              <View style={styles.filesList}>
                <View style={styles.fileItem}>
                  <Fileuploadicon width={28} height={28} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>File 1.png</Text>
                    <Text style={styles.fileSize}>200 KB</Text>
                  </View>
                </View>
                <View style={styles.fileItem}>
                  <Fileuploadicon width={28} height={28} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>File 2.png</Text>
                    <Text style={styles.fileSize}>200 KB</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Social Media Links Section */}
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Social Media Posts</Text>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => router.push(`/SocialMediaManager?dealId=${dealId}`)}
                >
                  <Text style={styles.manageButtonText}>Manage All</Text>
                </TouchableOpacity>
              </View>
              <SocialMediaLinks
                dealId={dealId}
                onLinksChange={(links) => {
                  // Handle links change if needed
                  console.log('Social media links updated:', links);
                }}
                compact={isWeb && isWideScreen ? false : true}
                allowEdit={true}
                title="Published Content Links"
              />
            </View>

            {/* Negotiation Section */}
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Current Negotiation</Text>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => router.push(`/OfferNegotiationPage?offerId=${offerId}&dealId=${dealId}&userType=creator`)}
                >
                  <Text style={styles.manageButtonText}>View Full</Text>
                </TouchableOpacity>
              </View>
              <OfferNegotiation
                offerId={offerId}
                currentUserId={user?._id || ''}
                currentUserType="creator"
                onOfferAccepted={(offer) => {
                  console.log('Offer accepted:', offer);
                  // Handle offer acceptance
                }}
                onOfferRejected={(offer) => {
                  console.log('Offer rejected:', offer);
                  // Handle offer rejection
                }}
                onNegotiationComplete={(finalOffer) => {
                  console.log('Negotiation complete:', finalOffer);
                  // Handle negotiation completion
                }}
                readonly={false}
                compact={true}
              />
            </View>
          </View>

          <Pressable
            style={[
              styles.uploadButton,
              isWeb && isWideScreen && styles.webButton,
            ]}
            onPress={() => setShowProofSubmission(true)}
          >
            <Text style={styles.uploadButtonText}>Upload Proof</Text>
          </Pressable>
        </View>
      </ScrollView>
      
      {/* Proof Submission Modal */}
      <Modal
        visible={showProofSubmission}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProofSubmission(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ProofSubmission
            dealId={dealId}
            onSubmissionComplete={(proofId) => {
              setShowProofSubmission(false);
              // Could show success message or navigate
            }}
            onCancel={() => setShowProofSubmission(false)}
            compact={false}
          />
        </SafeAreaView>
      </Modal>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholder: {},
  dealCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  dealName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  dealAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  negotiateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
  },
  negotiateButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  username: {
    fontSize: 16,
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  statusBadge: {
    backgroundColor: "#430B92",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  detailsContainer: {
    gap: 24,
  },
  detailSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 20,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  platformIcons: {
    flexDirection: "row",
    gap: 8,
  },
  platformIcon: {
    width: 35,
    height: 35,
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  detailText: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  filesList: {
    gap: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    padding: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  fileSize: {
    fontSize: 12,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  uploadButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  webButton: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#430B92",
    borderRadius: 6,
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  dashboardSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});
