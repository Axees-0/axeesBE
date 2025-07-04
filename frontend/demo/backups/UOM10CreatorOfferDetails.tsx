import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import CustomBackButton from "@/components/CustomBackButton";
import Fileuploadicon from "@/assets/-file-upload-icon.svg";
import { useAuth } from "@/contexts/AuthContext";
import FilePreviewModal from "@/components/FilePreview";
import { usePayment } from "@/contexts/PaymentContext";
import { format } from "date-fns";
import ProfileInfo from "@/components/ProfileInfo";
import Navbar from "@/components/web/navbar";
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1024,
};

export default function CreatorOfferDetails() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobile = window.width < BREAKPOINTS.TABLET;
  const { offerId } = useLocalSearchParams();
  const { user } = useAuth();
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const { setShowPaymentModal, setPaymentDetails } = usePayment();

  // Mark as viewed mutation
  const markAsViewedMutation = useMutation({
    mutationFn: async () => {
      const role = user?.userType === "Creator" ? "creator" : "marketer";
      await axios.post(`${API_URL}/${offerId}/viewed/${role}`);
    },
  });

  // Fetch offer details
  const { data, isLoading } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/${offerId}`, {
        params: {
          userId: user?._id,
          userType: user?.userType,
        },
      });

      // check if he didn't see viewedByCreator
      if (user?.userType === "Creator") {
        if (!response.data.offer.viewedByCreator) {
          markAsViewedMutation.mutate();
        }
      }

      return response.data;
    },
  });

  // Extract the offer from data
  const offer = data?.offer;
  // Merge draft + original fields for display
  const displayData = {
    ...offer,
    proposedAmount: offer?.currentDraft?.amount || offer?.proposedAmount,
    description: offer?.currentDraft?.notes || offer?.description,
    desiredReviewDate:
      offer?.currentDraft?.reviewDate || offer?.desiredReviewDate,
    desiredPostDate: offer?.currentDraft?.postDate || offer?.desiredPostDate,
    notes: offer?.currentDraft?.notes || offer?.notes,
    status: offer?.currentDraft?.status || offer?.status,
  };

  // Figure out if user is the marketer who created the offer
  const isMarketerOwner = user?.userType === "Marketer";

  // Use the relevant user record for the "profile card"
  // If user is Creator, we show the Marketer's info (and vice versa).
  const dataBasedOnRole =
    user?.userType === "Creator" ? offer?.marketerId : offer?.creatorId;

  // Accept Offer
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_URL}/${offerId}/accept`, {
        userId: user?._id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      router.push("/UOM08MarketerDealHistoryList");

      if (data.paymentNeeded && user?._id === data.deal.payer) {
        setPaymentDetails({
          amount: data.requiredPayment,
          offerId: data.offer._id,
          marketerId: data.offer.marketerId?._id,
          creatorId: data.offer.creatorId?._id,
          type: "escrowPayment",
        });
        setShowPaymentModal(true);
      }
    },
  });

  // Reject Offer
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_URL}/${offerId}/reject`, {
        userId: user?._id,
      });
      return response.data;
    },
    onSuccess: () => {
      router.back();
    },
  });

  // Counter Offer
  const handleCounter = () => {
    router.push({
      pathname: "/UOM11CreatorOfferCounterEdit",
      params: { offerId: offerId },
    });
  };

  // Accept
  const handleAccept = async () => {
    try {
      const result = await acceptMutation.mutateAsync();
      router.push({
        pathname: "/UOM14OfferAcceptSuccess",
        params: {
          offerName: result.offer.offerName,
          dealNumber: result.deal.dealNumber,
        },
      });
      // setPaymentDetails({
      //   amount: result.offer.proposedAmount, // The amount to charge
      //   offerId: offerId as string,
      //   creatorId: result.offer.creatorId,
      //   marketerId: result.offer.marketerId,
      // });
      // setShowPaymentModal(true);
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  // Reject
  const handleReject = async () => {
    try {
      const result = await rejectMutation.mutateAsync();
      router.push({
        pathname: "/UOM15OfferRejectMessage",
        params: {
          offerName: result.offer.offerName,
          reason: result.offer.rejectionReason,
        },
      });
    } catch (error) {
      console.error("Error rejecting offer:", error);
    }
  };

  // ========== NEW DELETE MUTATION ==========
  const deleteOfferMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`${API_URL}/${offerId}`);
    },
    onSuccess: () => {
      router.back();
    },
    onError: (error) => {
      console.error("Error deleting offer:", error);
    },
  });

  // If user is the marketer who created the offer, we let them delete
  const handleDelete = async () => {
    try {
      await deleteOfferMutation.mutateAsync();
    } catch (error) {
      console.error("Error deleting offer:", error);
    }
  };

  const getStatus = (offer, role) => {
    if (offer?.draft) {
      return "Draft";
    }

    if (role === "Marketer") {
      switch (offer?.status) {
        case "Sent":
          return "Offer Sent";
        case "Offer Received":
          return "Offer Sent"; // From marketer's view, it's still "Sent"
        case "Offer in Review":
          return "Offer in Review";
        case "Viewed by Creator":
          return "Viewed by Creator";
        case "Viewed by Marketer":
          return "Offer in Review"; // Marketer sees it as still in review
        case "Rejected-Countered":
          return "Counter Offered"; // More descriptive for counter offers
        case "Rejected":
          return "Rejected by Creator"; // Clarify who rejected it
        case "Accepted":
          return "Accepted by Creator"; // Clarify who accepted it
        case "Cancelled":
          return "Cancelled";
        default:
          return offer.status; // Fallback
      }
    } else if (role === "Creator") {
      switch (offer?.status) {
        case "Sent":
          return "Offer Received";
        case "Offer Received":
          return "Offer Received";
        case "Offer in Review":
          return "Viewed by Marketer";
        case "Viewed by Creator":
          return "Offer Received"; // Creator still sees as received
        case "Viewed by Marketer":
          return "Viewed by Marketer";
        case "Rejected-Countered":
          return "Counter Offered"; // More descriptive for counter offers
        case "Rejected":
          return "Rejected"; // If creator is viewing, they know they rejected it
        case "Accepted":
          return "Accepted"; // If creator is viewing, they know they accepted it
        case "Cancelled":
          return "Cancelled";
        default:
          return offer?.status;
      }
    }
    return offer?.status; // default
  };

  // If no offer yet, loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  return (
    <>
      <Navbar pageTitle="Offer Details" />
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />

        <ScrollView style={styles.scrollView}>
          <View style={{ marginHorizontal: "5%" }}>
            <View style={styles.header}>
              {/* <CustomBackButton />
            <Text style={styles.headerTitle}>Offer Details</Text>
            <TouchableOpacity
              style={styles.placeholder}
              onPress={() => router.push("/profile")}
            >
              <ProfileInfo />
            </TouchableOpacity> */}
            </View>
            {/* Offer Card */}
            <View style={styles.offerCard}>
              <Text style={styles.offerName}>{displayData?.offerName}</Text>
              <Text style={styles.offerAmount}>
                {displayData?.proposedAmount?.toLocaleString("en-US", {
                  currency: "USD",
                  style: "currency",
                })}
              </Text>

              <View style={styles.marketerInfo}>
                <View style={styles.marketerProfile}>
                  <Image
                    source={{
                      uri: dataBasedOnRole?.avatarUrl?.startsWith("http")
                        ? dataBasedOnRole?.avatarUrl
                        : process.env.EXPO_PUBLIC_BACKEND_URL +
                          dataBasedOnRole?.avatarUrl,
                    }}
                    placeholder={require("@/assets/empty-image.png")}
                    style={styles.marketerAvatar}
                  />
                  <Text style={styles.marketerUsername}>
                    {dataBasedOnRole?.userName?.startsWith("@")
                      ? dataBasedOnRole?.userName
                      : `@${dataBasedOnRole?.userName}`}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {getStatus(offer, user?.userType)}
                  </Text>
                </View>
              </View>
            </View>
            {/* Platforms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platforms</Text>
              <View style={styles.platformsContainer}>
                {displayData?.deliverables?.map(
                  (platform: string, index: number) => (
                    <View key={index} style={styles.platformIcon}>
                      <Image
                        source={getPlatformIcon(platform)}
                        style={styles.platformIconImage}
                      />
                    </View>
                  )
                )}
              </View>
            </View>
            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {displayData?.description}
              </Text>
            </View>
            {/* Review Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Desired Content Review Date
              </Text>
              <Text style={styles.dateText}>
                {displayData?.desiredReviewDate
                  ? format(
                      new Date(displayData.desiredReviewDate),
                      "dd MMM, yyyy"
                    )
                  : "N/A"}
              </Text>
            </View>
            {/* Post Date */}
            <View style={styles.section}>
              {/* <Text style={styles.sectionTitle}>Desired Post Date</Text> */}
              <Text style={styles.dateText}>
                {displayData?.desiredPostDate
                  ? format(
                      new Date(displayData.desiredPostDate),
                      "dd MMM, yyyy"
                    )
                  : "N/A"}
              </Text>
            </View>
            {/* Proposed Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offer</Text>
              <Text style={styles.offerAmountText}>
                {displayData?.proposedAmount?.toLocaleString("en-US", {
                  currency: "USD",
                  style: "currency",
                })}
              </Text>
            </View>
            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>
                {displayData?.notes || "Skipped"}
              </Text>
            </View>
            {/* Files */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Files</Text>
              <View style={styles.filesList}>
                {displayData?.attachments?.map((file: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.fileItem}
                    onPress={() => {
                      setSelectedAttachment(file);
                      setIsAttachmentModalVisible(true);
                    }}
                  >
                    <Fileuploadicon width={28} height={28} />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.fileName}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Action Buttons */}
            {displayData?.status !== "Rejected" &&
              displayData?.status !== "Accepted" &&
              displayData?.status !== "Cancelled" && (
                <View
                  style={[
                    styles.actionButtons,
                    isMobile && { flexDirection: "column" },
                  ]}
                >
                  {isMarketerOwner ? (
                    // If user is a marketer, they can only see action buttons if the creator countered
                    displayData?.status === "Rejected-Countered" ? (
                      <>
                        <Pressable
                          style={[
                            styles.acceptButton,
                            isMobile && { maxWidth: "100%" },
                          ]}
                          onPress={handleAccept}
                          disabled={acceptMutation.isPending}
                        >
                          {acceptMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.acceptButtonText}>Accept</Text>
                          )}
                        </Pressable>

                        <Pressable
                          style={[
                            styles.counterButton,
                            isMobile && { maxWidth: "100%" },
                          ]}
                          onPress={handleCounter}
                        >
                          <Text style={styles.counterButtonText}>
                            {/* Reject and Counter Offer */}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.rejectButton,
                            isMobile && { maxWidth: "100%" },
                          ]}
                          onPress={handleReject}
                          disabled={rejectMutation.isPending}
                        >
                          {rejectMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FF0000" />
                          ) : (
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          )}
                        </Pressable>
                      </>
                    ) : (
                      // If marketer created the offer and it's not countered, they can only delete it
                      <Pressable
                        style={[
                          styles.rejectButton,
                          isMobile && { maxWidth: "100%" },
                        ]}
                        onPress={handleDelete}
                        disabled={deleteOfferMutation.isPending}
                      >
                        <Text style={styles.rejectButtonText}>
                          {deleteOfferMutation.isPending
                            ? "Deleting..."
                            : "Delete Offer"}
                        </Text>
                      </Pressable>
                    )
                  ) : (
                    // If user is a creator viewing an offer from a marketer
                    <>
                      <Pressable
                        style={[
                          styles.acceptButton,
                          isMobile && { maxWidth: "100%" },
                        ]}
                        onPress={handleAccept}
                        disabled={acceptMutation.isPending}
                      >
                        {acceptMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={[
                          styles.counterButton,
                          isMobile && { maxWidth: "100%" },
                        ]}
                        onPress={handleCounter}
                      >
                        <Text style={styles.counterButtonText}>
                          Reject and Counter Offer
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.rejectButton,
                          isMobile && { maxWidth: "100%" },
                        ]}
                        onPress={handleReject}
                        disabled={rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              )}
          </View>
        </ScrollView>

        {/* Attachment Modal */}
        {selectedAttachment && (
          <FilePreviewModal
            visible={isAttachmentModalVisible}
            onClose={() => setIsAttachmentModalVisible(false)}
            file={selectedAttachment}
          />
        )}
      </SafeAreaView>
    </>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginHorizontal: "15%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
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
  },
  placeholder: {},
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  offerCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    width: "100%",
  },
  offerName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  offerAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  marketerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marketerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  marketerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  marketerUsername: {
    fontSize: 16,
    color: "#430B92",
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
  },
  section: {
    marginBottom: 24,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  platformsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  platformIconImage: {
    width: 20,
    height: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
  },
  dateText: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  offerAmountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  notesText: {
    fontSize: 14,
    color: "#6C6C6C",
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
  },
  fileSize: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  acceptButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: "30%",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  counterButton: {
    borderWidth: 1,
    borderColor: "#6C6C6C",
    borderRadius: 8,
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: "30%",
  },
  counterButtonText: {
    color: "#6C6C6C",
    fontSize: 16,
    fontWeight: "500",
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: "#ED0006",
    borderRadius: 8,
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: "30%",
  },
  rejectButtonText: {
    color: "#ED0006",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#ED0006",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: "30%",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

// Helper function
function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return require("@/assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png");
    case "youtube":
      return require("@/assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png");
    case "tiktok":
      return require("@/assets/tiktok-icon.png");
    case "facebook":
      return require("@/assets/facebook-icon.png");
    case "twitter":
      return require("@/assets/1707226109newtwitterlogopng-1.png");
    case "twitch":
      return require("@/assets/twitchlogotwitchlogotransparenttwitchicontransparentfreefreepng-1.png");
    default:
      return require("@/assets/letter-s.png");
  }
}
