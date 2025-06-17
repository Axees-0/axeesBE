"use client";

import React, { useEffect, useState } from "react";
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { 
  Calendar, 
  Send, 
  Users, 
  Clock, 
  Eye, 
  AlertTriangle,
  RefreshCw,
  History,
  CheckCircle,
  XCircle
} from "lucide-react-native";

import Search01 from "../../assets/search01.svg";
import Checkmarksquare012 from "../../assets/checkmarksquare012.svg";
import YoutubeIcon from "../../assets/youtube-icon.svg";
import FacebookIcon from "../../assets/facebook-icon.svg";
import { Image } from "expo-image";
import { Border } from "@/GlobalStyles";
import { Gap, Color, FontSize, Padding, FontFamily } from "@/GlobalStyles";
import Arrowleft021 from "../../assets/arrowleft021.svg";
import CustomBackButton from "@/components/CustomBackButton";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import ProfileInfo from "../ProfileInfo";
import { format } from "date-fns";
import TermsModal from "../TermsModal";
import { 
  useOfferCollaboration, 
  EditingSession, 
  EditHistoryEntry 
} from "@/utils/realTimeCollaborationService";
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const OfferField = ({
  label,
  value,
  isChanged,
  originalValue,
  children,
}: {
  label: string;
  value: string;
  isChanged: boolean;
  originalValue: string;
  children?: React.ReactNode;
}) => (
  <View style={[styles.field, isChanged && styles.changedField]}>
    {isChanged && (
      <View style={styles.changeRequestedWrapper}>
        <Text style={styles.changeRequested}>Change Requested</Text>
      </View>
    )}
    <Text style={styles.fieldLabel}>{label}</Text>
    {children || (
      <Text
        style={[styles.fieldValue, label === "Offer Name" && styles.offerValue]}
      >
        {value}
      </Text>
    )}
    {isChanged && originalValue && (
      <Text style={styles.originalValue}>{originalValue}</Text>
    )}
  </View>
);

export default function OfferCounter() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const isMobile = window.width < BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const { offerId, marketerId, creatorId, role } = useLocalSearchParams();
  const { setShowPaymentModal, setPaymentDetails } = usePayment();
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [showEditHistory, setShowEditHistory] = useState(false);
  const [showActiveEditors, setShowActiveEditors] = useState(false);

  // Real-time collaboration hook
  const {
    collaborationState,
    updateOffer,
    refreshCollaboration,
    resolveConflict,
    isLoading: collaborationLoading
  } = useOfferCollaboration(offerId as string, user?._id || '');

  // Fetch offer details including counter history
  const { data, isLoading } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/marketer/offers/${offerId}`);
      return response.data;
    },
  });

  const offer = data?.offer;
  // Define latestCounter at the top level where we can access it throughout the component
  const latestCounter = offer?.counters?.[offer.counters.length - 1];

  // Accept offer mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/marketer/offers/${offerId}/accept`,
        {
          userId: user?._id,
        }
      );
      return response.data;
    },
    onSuccess: (result) => {
      router.push({
        pathname: "/UOM14OfferAcceptSuccess",
        params: {
          offerName: result.offer.offerName,
          dealNumber: result.deal.dealNumber,
        },
      });

      if (result.paymentNeeded && user?._id === result.deal.payer) {
        setPaymentDetails({
          amount: result.requiredPayment,
          offerId: result.offer._id,
          marketerId: result.offer.marketerId?._id,
          creatorId: result.offer.creatorId?._id,
          type: "escrowPayment",
        });
        setShowPaymentModal(true);
      }
    },
  });

  // Offer in review mutation
  const offerInReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/marketer/offers/${offerId}/in-review`
      );
      return response.data;
    },
  });
  // Reject offer mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/marketer/offers/${offerId}/reject`
      );
      return response.data;
    },
    onSuccess: () => {
      router.back();
    },
  });

  // Counter offer mutation
  const counterMutation = useMutation({
    mutationFn: async (counterData: any) => {
      const response = await axios.post(
        `${API_URL}/marketer/offers/${offerId}/counter`,
        counterData
      );
      return response.data;
    },
    onSuccess: () => {
      router.back();
    },
  });

  // Update the markAsViewed mutation and useEffect
  const markAsViewedMutation = useMutation({
    mutationFn: async () => {
      // Only mark as viewed if the current user is the receiver
      const isReceiver = latestCounter
        ? latestCounter.counterBy !== user?.userType
        : user?.userType === "Creator"; // For initial offer, creator is receiver

      if (isReceiver) {
        const response = await axios.post(
          `${API_URL}/marketer/offers/${offerId}/viewed/${user?.userType.toLowerCase()}`
        );
        return response.data;
      }
      return null;
    },
  });

  useEffect(() => {
    if (offer && user && latestCounter) {
      // Check if the current user is the receiver and hasn't viewed the offer yet
      const isReceiver = latestCounter.counterBy !== user.userType;
      const hasViewed =
        user.userType === "Creator"
          ? offer.viewedByCreator
          : offer.viewedByMarketer;

      if (isReceiver && !hasViewed) {
        markAsViewedMutation.mutate();
      }
    }
  }, [offer, user, latestCounter]);

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync();
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync();
    } catch (error) {
      console.error("Error rejecting offer:", error);
    }
  };

  const handleCounter = () => {
    router.push({
      pathname: "/UOM05MarketerOfferCounter",
      params: { offerId: offerId, role: role },
    });
  };

  const handleOfferInReview = async () => {
    try {
      await offerInReviewMutation.mutateAsync();
      // Navigate back or to a specific page after successful status change
      router.back();
    } catch (error) {
      console.error("Error marking offer in review:", error);
    }
  };
  // Helper function to determine who can take action
  const getActionPermissions = () => {
    // If no offer exists yet
    if (!offer) {
      return { canAct: false, isReviewing: true };
    }

    // If this is the original offer with no counters
    if (!latestCounter) {
      // Only Creator can act on original offer from marketer
      const canAct = user?.userType === "Creator";
      return { canAct, isReviewing: !canAct };
    }

    // For counter offers, check who created the last counter using 'counterBy'
    const isCreatorCounter = latestCounter.counterBy === "Creator";

    // If Creator made the last counter, Marketer can act
    // If Marketer made the last counter, Creator can act
    const canAct = isCreatorCounter
      ? user?.userType === "Marketer"
      : user?.userType === "Creator";

    return { canAct, isReviewing: !canAct };
  };

  const renderActionButtons = () => {
    const { canAct, isReviewing } = getActionPermissions();

    const isRejected = offer.status === "Rejected";
    const isAccepted = offer.status === "Accepted";

    if (isRejected || isAccepted) {
      return null;
    }

    return (
      <>
        <Pressable
          style={[
            styles.acceptButton,
            {
              maxWidth: isMobile ? "100%" : "30%",
            },
          ]}
          onPress={handleAccept}
          disabled={acceptMutation.isPending}
        >
          {acceptMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>
              Accept {latestCounter && canAct ? "Counter " : ""}Offer
            </Text>
          )}
        </Pressable>

        {user?.userType === "Marketer" && (
          <Pressable
            style={[
              styles.offerInReviewButton,
              offer.status === "Offer in Review" && styles.disabledButton,
              {
                maxWidth: isMobile ? "100%" : "30%",
              },
            ]}
            onPress={handleOfferInReview}
            disabled={
              offerInReviewMutation.isPending ||
              offer.status === "Offer in Review"
            }
          >
            {offerInReviewMutation.isPending ? (
              <ActivityIndicator color="#430B92" />
            ) : (
              <Text style={styles.offerInReviewButtonText}>
                Offer in Review
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          style={[
            styles.counterButton,
            !canAct && styles.disabledButton,
            {
              maxWidth: isMobile ? "100%" : "30%",
            },
          ]}
          disabled={!canAct}
          onPress={() =>
            router.push({
              pathname: "/UOM11CreatorOfferCounterEdit",
              params: { offerId: offerId },
            })
          }
        >
          <Text style={styles.counterButtonText}>Reject and Counter Offer</Text>
        </Pressable>

        <Pressable
          style={[
            styles.rejectButton,
            {
              maxWidth: isMobile ? "100%" : "30%",
            },
          ]}
          onPress={handleReject}
          disabled={rejectMutation.isPending}
        >
          {rejectMutation.isPending ? (
            <ActivityIndicator color="#ED0006" />
          ) : (
            <Text style={styles.rejectButtonText}>Reject Offer</Text>
          )}
        </Pressable>
      </>
    );
  };

  if (isLoading || collaborationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text>Loading offer details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar style="auto" />

      <View
        style={[styles.header, isWeb && isWideScreen && styles.webContainer]}
      >
        <CustomBackButton />
        <Text style={styles.headerTitle}>Counter Offer</Text>
        <ProfileInfo />
      </View>

      {/* Real-time Collaboration Status */}
      <View style={[styles.collaborationBar, isWeb && isWideScreen && styles.webContainer]}>
        <View style={styles.collaborationLeft}>
          <View style={styles.collaborationStatus}>
            {collaborationState.hasConflict ? (
              <AlertTriangle width={16} height={16} color="#FF9800" />
            ) : (
              <CheckCircle width={16} height={16} color="#4CAF50" />
            )}
            <Text style={[
              styles.collaborationText,
              { color: collaborationState.hasConflict ? "#FF9800" : "#4CAF50" }
            ]}>
              {collaborationState.hasConflict 
                ? "Version conflict detected" 
                : "Up to date"
              }
            </Text>
          </View>

          {collaborationState.activeEditors.length > 0 && (
            <TouchableOpacity 
              style={styles.activeEditorsButton}
              onPress={() => setShowActiveEditors(!showActiveEditors)}
            >
              <Users width={16} height={16} color="#430B92" />
              <Text style={styles.activeEditorsText}>
                {collaborationState.activeEditors.length} editing
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.collaborationRight}>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => setShowEditHistory(!showEditHistory)}
          >
            <History width={16} height={16} color="#430B92" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshCollaboration}
          >
            <RefreshCw width={16} height={16} color="#430B92" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Editors Panel */}
      {showActiveEditors && collaborationState.activeEditors.length > 0 && (
        <View style={[styles.activeEditorsPanel, isWeb && isWideScreen && styles.webContainer]}>
          <Text style={styles.panelTitle}>Currently Editing</Text>
          {collaborationState.activeEditors.map((editor, index) => (
            <View key={index} style={styles.editorItem}>
              <View style={styles.editorInfo}>
                <Text style={styles.editorName}>{editor.name}</Text>
                <Text style={styles.editorRole}>({editor.role})</Text>
              </View>
              <Text style={styles.editorActivity}>
                {new Date(editor.lastActivity).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Edit History Panel */}
      {showEditHistory && (
        <View style={[styles.editHistoryPanel, isWeb && isWideScreen && styles.webContainer]}>
          <Text style={styles.panelTitle}>Recent Changes</Text>
          {collaborationState.editHistory.slice(0, 5).map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyUser}>{entry.userName}</Text>
                <Text style={styles.historyTime}>
                  {new Date(entry.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyChanges}>
                {entry.changes.map((change, changeIndex) => (
                  <Text key={changeIndex} style={styles.historyChange}>
                    • {change.field}: {change.oldValue} → {change.newValue}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <View
          style={[styles.content, isWeb && isWideScreen && styles.webContainer]}
        >
          <OfferField
            isChanged={false}
            originalValue={offer?.offerName}
            label="Offer Name"
            value={offer?.offerName}
          />

          <OfferField
            label="Platforms"
            value=""
            isChanged={false}
            originalValue=""
          >
            <View style={styles.platformIcons}>
              {offer?.deliverables?.map((platform: string, index: number) => (
                <View key={index} style={styles.platformIconWrapper}>
                  <Image
                    source={getPlatformIcon(platform)}
                    style={styles.platformIcon}
                  />
                </View>
              ))}
            </View>
          </OfferField>

          <OfferField
            isChanged={
              !!latestCounter?.description &&
              latestCounter?.description !== offer?.description
            }
            originalValue={offer?.description}
            label="Description"
            value={latestCounter?.description || offer?.description}
          />

          <OfferField
            label="Desired Content Review Date"
            value={
              latestCounter?.counterReviewDate || offer?.counterReviewDate
                ? format(
                    new Date(
                      latestCounter?.counterReviewDate ||
                        offer?.counterReviewDate
                    ),
                    "dd MMM, yyyy"
                  )
                : ""
            }
            isChanged={
              !!latestCounter?.counterReviewDate &&
              new Date(latestCounter.counterReviewDate).getTime() !==
                new Date(offer?.desiredReviewDate).getTime()
            }
            originalValue={
              offer?.desiredReviewDate
                ? `Original review date was ${new Date(
                    offer.desiredReviewDate
                  )}`
                : ""
            }
          />

          <OfferField
            label="Desired Post Date"
            value={
              latestCounter?.counterPostDate || offer?.counterPostDate
                ? format(
                    new Date(
                      latestCounter?.counterPostDate || offer?.counterPostDate
                    ),
                    "dd MMM, yyyy"
                  )
                : ""
            }
            isChanged={
              !!latestCounter?.counterPostDate &&
              new Date(latestCounter.counterPostDate).getTime() !==
                new Date(offer?.desiredPostDate).getTime()
            }
            originalValue={
              offer?.desiredPostDate
                ? `Original post date was ${new Date(offer.desiredPostDate)}`
                : ""
            }
          />

          <OfferField
            label="Offer"
            value={`$${(
              latestCounter?.counterAmount || offer?.counterAmount
            )?.toLocaleString()}`}
            isChanged={
              !!latestCounter?.counterAmount &&
              latestCounter.counterAmount !== offer?.counterAmount
            }
            originalValue={
              offer?.proposedAmount
                ? `Original Offer was $${offer.proposedAmount.toLocaleString()}`
                : ""
            }
          />

          <OfferField
            label="Notes"
            value={latestCounter?.notes || offer?.notes || "skipped"}
            isChanged={
              !!latestCounter?.notes && latestCounter.notes !== offer?.notes
            }
            originalValue={offer?.notes || "skipped"}
          />

          <OfferField
            label="Uploaded Files"
            value={
              offer?.attachments?.length
                ? `${offer.attachments.length} files`
                : "skipped"
            }
            isChanged={false}
            originalValue="skipped"
          />

          <View style={styles.termsContainer}>
            <Checkmarksquare012 width={32} height={32} color="#430b92" />
            <Text style={styles.termsText}>
              By agreeing, we assume you have read the{" "}
              <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                <Text style={styles.termsLink}>Transaction Terms</Text>
              </TouchableOpacity>
            </Text>
          </View>

          <View
            style={[
              styles.buttonContainer,
              {
                flexDirection: isMobile ? "column" : "row",
              },
            ]}
          >
            {renderActionButtons()}
          </View>
        </View>
      </ScrollView>
      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webContainer: {
    // marginHorizontal: "5%",
  },
  scrollView: {
    flex: 1,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
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
  content: {
    gap: 24,
  },
  field: {
    marginBottom: 16,
  },
  changedField: {
    backgroundColor: "#FCFAFF",
    borderRadius: 8,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  fieldValue: {
    fontSize: 16,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  offerValue: {
    fontWeight: "700",
    textTransform: "capitalize",
  },
  changeRequestedWrapper: {
    backgroundColor: "#FFE4E4",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  changeRequested: {
    color: "#ED0006",
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  disabledButton: {
    opacity: 0.6,
  },
  originalValue: {
    fontSize: 14,
    color: "#6C6C6C",
    marginTop: 8,
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
  platformIcon: {
    width: 20,
    height: 20,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
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
    color: "#430B92",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-around",
  },
  acceptButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: "30%",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  reviewButton: {
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "30%",
    flex: 1,
  },
  reviewButtonText: {
    color: "#430B92",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  counterButton: {
    borderWidth: 1,
    borderColor: "#6C6C6C",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "30%",
    flex: 1,
  },
  counterButtonText: {
    color: "#6C6C6C",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  offerInReviewButton: {
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "30%",
    flex: 1,
  },
  offerInReviewButtonText: {
    color: "#430B92",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },

  rejectButton: {
    borderWidth: 1,
    borderColor: "#ED0006",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "30%",
    flex: 1,
  },
  rejectButtonText: {
    color: "#ED0006",
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
  collaborationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  collaborationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  collaborationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  collaborationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeEditorsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F0E7FD",
    borderRadius: 12,
  },
  activeEditorsText: {
    fontSize: 12,
    color: "#430B92",
    fontWeight: "500",
  },
  collaborationRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyButton: {
    padding: 6,
  },
  refreshButton: {
    padding: 6,
  },
  activeEditorsPanel: {
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  editHistoryPanel: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  editorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  editorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  editorRole: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  editorActivity: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  historyItem: {
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyUser: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  historyTime: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  historyChanges: {
    gap: 2,
  },
  historyChange: {
    fontSize: 12,
    color: "#6C6C6C",
  },
});

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
