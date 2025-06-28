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
import { isTablet, isDesktop, isMobile } from "@/constants/breakpoints";
import { WebSEO } from "./web-seo";

// Demo Mode Imports
import { DEMO_MODE, DemoConfig, demoLog } from "@/demo/DemoMode";
import { DemoAPI } from "@/demo/DemoAPI";
import { DemoData } from "@/demo/DemoData";
import { getPlatformIcon, PLATFORMS } from "@/constants/platforms";
import { DemoPolish } from "@/utils/demoPolish";

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

  // Fetch offer details - Use demo data in demo mode
  const { data, isLoading } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      if (DEMO_MODE) {
        demoLog('Using demo offer data for creator');
        // Return demo offer data that matches what marketers create
        return {
          offer: {
            _id: offerId || 'demo-offer-1',
            offerName: 'Summer Collection Launch 2024',
            proposedAmount: 5000,
            description: 'Showcase our vibrant summer collection with authentic lifestyle content. Looking for creators who embody confidence and style. Create 3-5 posts featuring our latest designs in natural, everyday settings.',
            deliverables: ['instagram', 'tiktok'],
            desiredReviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            desiredPostDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Please ensure all content aligns with our brand guidelines. We\'re looking for high-quality, authentic content that resonates with our target audience.',
            status: 'Sent',
            attachments: [
              { fileName: 'summer-collection-brief.pdf', fileUrl: '#' },
              { fileName: 'brand-guidelines.pdf', fileUrl: '#' },
              { fileName: 'product-images.zip', fileUrl: '#' }
            ],
            marketerId: {
              _id: 'demo-marketer-1',
              userName: '@fashionnova',
              avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
            },
            viewedByCreator: false
          }
        };
      }
      
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

  // Accept Offer - Enhanced for demo with polish
  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (DEMO_MODE) {
        demoLog('Accepting offer in demo mode with enhanced polish');
        
        // Show progressive loading with polish
        const loadingState = DemoPolish.createLoadingState('Accepting $5,000 offer', 1200);
        
        // Simulate instant acceptance with enhanced feedback
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        loadingState.clear();
        
        return {
          offer: {
            _id: offerId,
            offerName: 'Summer Collection Launch 2024',
            proposedAmount: 5000
          },
          deal: {
            dealNumber: 'DL-2024-001',
            _id: 'demo-deal-1'
          },
          paymentNeeded: false // Skip payment in demo
        };
      }
      
      const response = await axios.post(`${API_URL}/${offerId}/accept`, {
        userId: user?._id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (DEMO_MODE) {
        // Enhanced success feedback with polish
        DemoPolish.showConfetti();
        
        // Enhanced success toast
        const enhancedToast = DemoPolish.showEnhancedToast(
          'success',
          'Deal Accepted! 🎉',
          '$5,000 secured! Payment guaranteed within 24 hours.',
          4000
        );
        
        // Show success animation on accept button
        DemoPolish.showSuccessAnimation('accept-offer-button');
        
        // Brief delay before navigation for polish
        setTimeout(() => {
          // Enhanced page transition
          DemoPolish.enhancePageTransition('offer-details', 'accept-success');
          
          router.push({
            pathname: "/UOM14OfferAcceptSuccess",
            params: {
              offerName: data.offer.offerName,
              dealNumber: data.deal.dealNumber,
            },
          });
        }, 1500);
        
        return;
      }
      
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
      router.push('/offers');
    },
  });

  // Counter Offer
  const handleCounter = () => {
    router.push({
      pathname: "/UOM11CreatorOfferCounterEdit",
      params: { offerId: offerId },
    });
  };

  // Accept - Simplified for demo
  const handleAccept = async () => {
    try {
      if (DEMO_MODE) {
        demoLog('Handling offer acceptance in demo mode');
      }
      
      // Add confirmation dialog
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          `Accept the offer "${displayData?.offerName}" for ${displayData?.proposedAmount?.toLocaleString("en-US", { currency: "USD", style: "currency" })}?`
        );
        if (!confirmed) return;
      } else {
        // For mobile, use Alert.alert
        const { Alert } = require('react-native');
        await new Promise((resolve, reject) => {
          Alert.alert(
            'Accept Offer',
            `Accept the offer "${displayData?.offerName}" for ${displayData?.proposedAmount?.toLocaleString("en-US", { currency: "USD", style: "currency" })}?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('User cancelled')) },
              { text: 'Accept', onPress: () => resolve(true) }
            ]
          );
        });
      }
      
      const result = await acceptMutation.mutateAsync();
      
      if (!DEMO_MODE) {
        router.push({
          pathname: "/UOM14OfferAcceptSuccess",
          params: {
            offerName: result.offer.offerName,
            dealNumber: result.deal.dealNumber,
          },
        });
      }
      // Demo mode navigation handled in mutation onSuccess
    } catch (error) {
      if (error.message === 'User cancelled') {
        return; // User cancelled, do nothing
      }
      console.error("Error accepting offer:", error);
      if (DEMO_MODE) {
        // Even if there's an error in demo, show success
        router.push({
          pathname: "/UOM14OfferAcceptSuccess",
          params: {
            offerName: 'Summer Collection Launch 2024',
            dealNumber: 'DL-2024-001',
          },
        });
      }
    }
  };

  // Reject
  const handleReject = async () => {
    try {
      // Add confirmation dialog
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          `Are you sure you want to reject the offer "${displayData?.offerName}"?`
        );
        if (!confirmed) return;
      } else {
        // For mobile, use Alert.alert
        const { Alert } = require('react-native');
        await new Promise((resolve, reject) => {
          Alert.alert(
            'Reject Offer',
            `Are you sure you want to reject the offer "${displayData?.offerName}"?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('User cancelled')) },
              { text: 'Reject', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });
      }
      
      const result = await rejectMutation.mutateAsync();
      router.push({
        pathname: "/UOM15OfferRejectMessage",
        params: {
          offerName: result.offer.offerName,
          reason: result.offer.rejectionReason,
        },
      });
    } catch (error) {
      if (error.message === 'User cancelled') {
        return; // User cancelled, do nothing
      }
      console.error("Error rejecting offer:", error);
    }
  };

  // ========== NEW DELETE MUTATION ==========
  const deleteOfferMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`${API_URL}/${offerId}`);
    },
    onSuccess: () => {
      router.push('/offers');
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

  // Get responsive styles for the offer card
  const getOfferCardStyles = () => {
    if (Platform.OS !== 'web') {
      return styles.offerCard;
    }

    if (isMobile(window.width)) {
      return [
        styles.offerCard,
        {
          width: '100%',
          padding: 16,
        }
      ];
    } else if (isTablet(window.width)) {
      return [
        styles.offerCard,
        {
          width: '100%',
          maxWidth: '100%', // Fluid width on tablet
          padding: 20, // More padding for better readability
        }
      ];
    } else {
      return [
        styles.offerCard,
        {
          width: '100%',
          maxWidth: 800, // Max width for desktop
        }
      ];
    }
  };

  // Get responsive styles for action buttons
  const getActionButtonsStyles = () => {
    if (Platform.OS !== 'web') {
      return styles.actionButtons;
    }

    if (isMobile(window.width)) {
      return [
        styles.actionButtons,
        {
          flexDirection: 'column',
          gap: 12,
        }
      ];
    } else if (isTablet(window.width)) {
      return [
        styles.actionButtons,
        {
          flexDirection: 'row',
          gap: 16,
          flexWrap: 'wrap',
        }
      ];
    } else {
      return styles.actionButtons;
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
      <WebSEO 
        title="Offer Details | Axees"
        description="Review offer details and manage collaboration opportunities"
        keywords="offer details, creator collaboration, brand partnership, counter offer"
      />
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
            <View style={getOfferCardStyles()}>
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
                  style={getActionButtonsStyles()}
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
                        onPress={DEMO_MODE 
                          ? DemoPolish.enhanceButtonPress(handleAccept, 'accept-offer-button')
                          : handleAccept
                        }
                        disabled={acceptMutation.isPending}
                        nativeID="accept-offer-button"
                      >
                        {acceptMutation.isPending ? (
                          <>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            {DEMO_MODE && (
                              <Text style={[styles.acceptButtonText, { marginLeft: 8 }]}>
                                Securing your $5,000...
                              </Text>
                            )}
                          </>
                        ) : (
                          <Text style={styles.acceptButtonText}>
                            {DEMO_MODE ? "Accept $5,000 Offer" : "Accept"}
                          </Text>
                        )}
                      </Pressable>

                      {!DEMO_MODE && (
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
                      )}

                      {!DEMO_MODE && (
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
                      )}
                      
                      {DEMO_MODE && (
                        <View style={styles.demoNoteContainer}>
                          <Text style={styles.demoNoteText}>
                            💰 Great rate! This brand has 98% payment success
                          </Text>
                        </View>
                      )}
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
    marginHorizontal: Platform.OS === 'web' ? "10%" : "5%", // More responsive margins
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
    justifyContent: "space-between",
  },
  acceptButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
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
  demoNoteContainer: {
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    maxWidth: "60%",
    alignItems: "center",
    justifyContent: "center",
  },
  demoNoteText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
    textAlign: "center",
  },
});

// Removed duplicate getPlatformIcon function - now using centralized version from @/constants/platforms
