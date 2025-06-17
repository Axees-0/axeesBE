import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import Collapsible from "react-native-collapsible";
import Toast from "react-native-toast-message";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Plus,
  AlertTriangle,
  Edit3,
  Trash2,
  X,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
import Fileuploadicon from "@/assets/-file-upload-icon.svg";
import ProfileInfo from "../ProfileInfo";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const DEAL_STATUSES = {
  ACCEPTED: "Accepted",
  IN_PROCESS: "In-Process",
  CANCELLATION: "Cancellation",
  CONTENT_FOR_APPROVAL: "Content for Approval Submitted",
  CONTENT_APPROVED: "Content Approved",
  FINAL_CONTENT_POSTED: "Final Content Posted",
  COMPLETION_PAYMENT: "Completion Payment Issued",
};

const fetchDeal = async (dealId: string, role: string, userId: string) => {
  const response = await axios.get(
    `${API_URL}/api/marketer/deals/${dealId}?role=${role}&userId=${userId}`
  );
  return response.data.deal;
};

interface Milestone {
  id: string;
  name: string;
  bonus: number;
  amount: number;
  dueDate: Date;
  status:
    | "pending"
    | "paid"
    | "in_review"
    | "completed"
    | "proposed"
    | "revision_required"
    | "active";
  description?: string;
  type: "marketer" | "creator";
  deliverables: Array<{
    id: string;
    deliverables: Array<{
      type: string;
      url?: string;
      content?: string;
      originalName?: string;
      submittedAt?: Date;
    }>;
    submittedAt: Date;
    submittedBy: string;
    status: string;
  }>;
  feedback: Array<{
    id: string;
    feedback: string;
    createdAt: Date;
    createdBy: string;
  }>;
  createdAt: Date;
  createdBy: string;
  fundedAt?: Date;
  completedAt?: Date;
}

interface FilePreviewType {
  fileUrl?: string;
  originalName?: string;
  type?: string;
}

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

function getStatusText(status: string) {
  switch (status) {
    case "pending":
      return "Pending Funding";
    case "active":
      return "Active";
    case "in_review":
      return "In Review";
    case "paid":
      return "Funded";
    case "revision_required":
      return "Revision Required";
    case "completed":
      return "Approved"; // Or "Completed", depending on your design
    case "proposed":
      return "Proposed";
    case "Accepted": // <-- Add this case for "Accepted"
      return "Accepted";
    default:
      return "Pending";
  }
}

function computeMilestoneSummary(deal) {
  if (!deal) {
    return {
      projectPrice: 0,
      inEscrow: 0,
      milestonesPaidCount: 0,
      milestonesPaidAmount: 0,
      milestonesRemainingCount: 0,
      milestonesRemainingAmount: 0,
      totalEarnings: 0,
    };
  }

  // The base amount (full project price from paymentInfo)
  const baseAmount = Number(deal.paymentInfo?.paymentAmount) || 0;
  const projectPrice = baseAmount;

  // Initialize totals
  let totalEarnings = 0;
  let milestonesPaidCount = 0;
  let milestonesPaidAmount = 0;
  let milestonesRemainingCount = 0;
  let milestonesRemainingAmount = 0;

  deal.milestones?.forEach((m) => {
    const amount = Number(m.amount) || 0;
    const bonus = Number(m.bonus) || 0;

    // Consider "approved" or "completed" milestones as paid
    if (m.status === "approved" || m.status === "completed") {
      milestonesPaidCount += 1;
      milestonesPaidAmount += amount + bonus;
      totalEarnings += amount + bonus;
    } else if (
      [
        "pending",
        "proposed",
        "active",
        "paid",
        "in_review",
        "revision_required",
      ].includes(m.status)
    ) {
      milestonesRemainingCount += 1;
      milestonesRemainingAmount += amount + bonus;
    }
  });

  // New logic:
  // When content is approved, set total earnings to the project price.
  // Ensure that the deal status check matches exactly what is stored in the DB.
  if (
    deal.status === "Content Approved" ||
    deal.status === DEAL_STATUSES.CONTENT_APPROVED
  ) {
    totalEarnings = projectPrice;
  }

  // Calculate inEscrow (adjust as needed for your business logic)
  const inEscrow =
    deal.milestones
      ?.filter((m) =>
        ["active", "paid", "in_review", "revision_required"].includes(m.status)
      )
      .reduce((acc, m) => acc + Number(m.amount) + Number(m.bonus), 0) || 0;

  return {
    projectPrice,
    inEscrow: inEscrow < 0 ? 0 : inEscrow,
    milestonesPaidCount,
    milestonesPaidAmount,
    milestonesRemainingCount,
    milestonesRemainingAmount,
    totalEarnings: totalEarnings < 0 ? 0 : totalEarnings,
  };
}

function RenderMilestone({
  milestone,
  index,
  collapsedMilestones,
  toggleCollapse,
  user,
  dealId,
  router,
  setSelectedMilestone,
  setReviewStatus,
  setReviewModalVisible,
  handleResubmitWork,
}: {
  milestone: Milestone;
  index: number;
  collapsedMilestones: string[];
  toggleCollapse: (id: string) => void;
  user: any;
  dealId: string;
  router: any;
  setSelectedMilestone: (m: Milestone | null) => void;
  setReviewStatus: (s: "approved" | "revision_required") => void;
  setReviewModalVisible: (b: boolean) => void;
  handleResubmitWork: (id: string) => void;
}) {
  const isCollapsed = collapsedMilestones.includes(milestone.id);
  const statusText = getStatusText(milestone.status);

  const handleOpenFile = (url: string | undefined) => {
    if (url) {
      const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
      Linking.openURL(fullUrl).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  return (
    <View style={styles.milestoneItem}>
      <TouchableOpacity
        style={styles.milestoneHeader}
        onPress={() => toggleCollapse(milestone.id)}
      >
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneName}>{milestone.name}</Text>
          <Text style={styles.milestoneAmount}>
            {milestone.amount?.toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}
            {milestone.bonus > 0 &&
              ` + ${milestone.bonus?.toLocaleString("en-US", {
                currency: "USD",
                style: "currency",
              })}`}
          </Text>
          {milestone.dueDate && (
            <Text style={styles.milestoneDueDate}>
              Due: {format(new Date(milestone.dueDate), "dd MMM yyyy")}
            </Text>
          )}
        </View>
        <View style={[styles.milestoneStatus]}>
          <Text style={styles.milestoneStatusText}>{statusText}</Text>
        </View>
        {isCollapsed ? (
          <ChevronDown size={20} color="#6B7280" />
        ) : (
          <ChevronUp size={20} color="#6B7280" />
        )}
      </TouchableOpacity>

      <Collapsible collapsed={isCollapsed}>
        <View style={styles.milestoneContent}>
          {milestone.description && (
            <Text style={styles.milestoneDescription}>
              {milestone.description}
            </Text>
          )}

          {milestone.status === "revision_required" &&
            milestone.feedback?.length > 0 && (
              <View style={styles.revisionRequiredNotice}>
                <View style={styles.revisionRequiredHeader}>
                  <AlertTriangle size={16} color="#D97706" />
                  <Text style={styles.revisionRequiredHeading}>
                    Revision Required
                  </Text>
                </View>
                {milestone.feedback.map((fb, idx) => (
                  <View key={fb.id} style={styles.feedbackItem}>
                    <Text style={styles.feedbackText}>
                      <Text style={{ fontWeight: "600" }}>
                        Feedback {idx + 1}:
                      </Text>{" "}
                      {fb.feedback}
                    </Text>
                    <Text style={styles.feedbackDate}>
                      {format(new Date(fb.createdAt), "dd MMM yyyy")}
                    </Text>
                  </View>
                ))}
              </View>
            )}

          {milestone.deliverables?.length > 0 ? (
            <View style={styles.submittedWorkSection}>
              <Text style={styles.submittedWorkTitle}>Submitted Content</Text>
              {milestone.deliverables.map((submission, subIdx) => {
                const textDeliverable = submission.deliverables.find(
                  (d) => d.type === "text"
                );

                return (
                  <View key={submission.id}>
                    {textDeliverable && (
                      <View style={styles.submissionDescriptionContainer}>
                        <Text style={styles.submissionDescription}>
                          {textDeliverable.content || "No description provided"}
                        </Text>
                        <Text style={styles.submissionDate}>
                          Submitted on{" "}
                          {format(
                            new Date(submission.submittedAt),
                            "dd MMM yyyy"
                          )}
                        </Text>
                      </View>
                    )}

                    {submission.deliverables
                      .filter((d) => d.type !== "text")
                      .map((file, fileIdx) => (
                        <View key={fileIdx} style={styles.deliverableItem}>
                          <FileText size={24} color="#430B92" />
                          <View style={styles.deliverableInfo}>
                            <Text
                              style={styles.deliverableName}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {file.originalName || "Submitted File"}
                            </Text>
                            <Text style={styles.deliverableDate}>
                              Submitted on{" "}
                              {format(
                                new Date(submission.submittedAt),
                                "dd MMM yyyy"
                              )}
                            </Text>
                          </View>
                          <View style={styles.deliverableActions}>
                            <TouchableOpacity
                              style={styles.deliverableAction}
                              onPress={() => handleOpenFile(file.url)}
                            >
                              <ExternalLink size={16} color="#430B92" />
                              <Text style={styles.deliverableActionText}>
                                View
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                );
              })}
            </View>
          ) : milestone.status === "in_review" ? (
            <Text style={styles.noContentText}>
              Content submitted for review
            </Text>
          ) : null}

          {user?.userType === "Creator" && (
            <View style={styles.milestoneActions}>
              {(milestone.status === "paid" ||
                milestone.status === "active") && (
                <TouchableOpacity
                  style={styles.submitWorkButton}
                  onPress={() =>
                    router.push({
                      pathname: "/UOM13CreatorUploadProof",
                      params: {
                        dealId: dealId as string,
                        milestoneId: milestone.id,
                      },
                    })
                  }
                >
                  <Text style={styles.submitWorkButtonText}>
                    Upload Content for Review
                  </Text>
                </TouchableOpacity>
              )}
              {milestone.status === "revision_required" && (
                <TouchableOpacity
                  style={styles.resubmitButton}
                  onPress={() => handleResubmitWork(milestone.id)}
                >
                  <Text style={styles.submitWorkButtonText}>Resubmit Work</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {user?.userType === "Marketer" && (
            <View style={styles.milestoneActions}>
              {milestone.status === "in_review" && (
                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => {
                      setSelectedMilestone(milestone);
                      setReviewStatus("approved");
                      setReviewModalVisible(true);
                    }}
                  >
                    <Text style={styles.approveButtonText}>Approve Work</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.revisionButton}
                    onPress={() => {
                      setSelectedMilestone(milestone);
                      setReviewStatus("revision_required");
                      setReviewModalVisible(true);
                    }}
                  >
                    <Text style={styles.revisionButtonText}>
                      Request Revision
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </Collapsible>
    </View>
  );
}

export default function DealDetail() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [activeTab, setActiveTab] = useState<"overview" | "milestones">(
    "overview"
  );
  const [collapsedMilestones, setCollapsedMilestones] = useState<string[]>([]);

  const [isAddMilestoneModalVisible, setAddMilestoneModalVisible] =
    useState(false);
  const [isEditMilestone, setIsEditMilestone] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null
  );
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    amount: "",
    dueDate: new Date(),
    description: "",
    bonus: "",
  });
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<
    "approved" | "revision_required"
  >("approved");
  const [selectedFile, setSelectedFile] = useState<FilePreviewType | null>(
    null
  );
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const { dealId } = useLocalSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: deal,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["deal", dealId, user?.userType, user?._id],
    queryFn: () => {
      if (user?.userType && user?._id) {
        return fetchDeal(dealId as string, user?.userType, user?._id);
      }
      return null;
    },
    enabled: !!dealId && !!user?._id,
    retry: 2,
  });

  useEffect(() => {
    if (
      activeTab === "milestones" &&
      deal?.milestones?.length > 0 &&
      collapsedMilestones.length === 0
    ) {
      setCollapsedMilestones(deal.milestones.map((m: Milestone) => m.id));
    }
  }, [activeTab, deal?.milestones]);

  const reviewMutation = useMutation({
    mutationFn: async (data: {
      milestoneId: string;
      status: "approved" | "revision_required";
      feedback: string;
    }) => {
      const res = await axios.post(
        `${API_URL}/api/marketer/deals/${dealId}/milestones/${data.milestoneId}/review`,
        {
          status: data.status,
          feedback: data.feedback,
          userId: user?._id,
          userType: user?.userType,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      setReviewModalVisible(false);
      setReviewFeedback("");
      refetch();
      Toast.show({
        type: "customNotification",
        text1: "Review Submitted",
        position: "top",
      });
    },
    onError: (err) => {
      console.error("Review submission error:", err);
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: "Failed to submit review.",
        position: "top",
      });
    },
  });

  const handleMilestoneCollapse = (id: string) => {
    setCollapsedMilestones((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleResubmitWork = (milestoneId: string) => {
    router.push({
      pathname: "/UOM13CreatorUploadProof",
      params: {
        dealId: dealId as string,
        milestoneId: milestoneId,
        isResubmission: "true",
      },
    });
  };

  const handleReviewSubmission = async () => {
    if (!selectedMilestone) return;
    if (reviewStatus === "revision_required" && !reviewFeedback.trim()) {
      Toast.show({
        type: "customNotification",
        text1: "Feedback Required",
        text2: "Please provide feedback for the revision.",
        position: "top",
      });
      return;
    }
    await reviewMutation.mutateAsync({
      milestoneId: selectedMilestone.id,
      status: reviewStatus,
      feedback: reviewFeedback,
    });
  };

  const handleFundMilestone = (m: Milestone) => {
    console.warn("handleFundMilestone not implemented on mobile yet.");
  };

  const handleMarkAsPosted = () => {
    console.warn("handleMarkAsPosted not implemented on mobile yet.");
  };

  const handleEditMilestonePress = (m: Milestone) => {
    console.warn("handleEditMilestonePress not implemented on mobile yet.");
  };

  const handleDeleteMilestonePress = (m: Milestone) => {
    console.warn("handleDeleteMilestonePress not implemented on mobile yet.");
  };

  const handleOpenFilePreview = (file: FilePreviewType) => {
    setSelectedFile(file);
    setShowFilePreview(true);
    console.warn("File preview modal not implemented on mobile yet.");
  };

  const {
    projectPrice,
    inEscrow,
    milestonesPaidCount,
    milestonesPaidAmount,
    milestonesRemainingCount,
    milestonesRemainingAmount,
    totalEarnings,
  } = computeMilestoneSummary(deal);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: {(error as Error).message}</Text>
      </View>
    );
  }

  if (!deal && user?.userType && user?._id) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No deal data found.</Text>
      </View>
    );
  }

  const otherParty =
    user?.userType === "Marketer" ? deal?.creatorId : deal?.marketerId;

  let transactionNumber = "";
  const transaction =
    deal?.paymentInfo?.transactions?.[deal.paymentInfo.transactions.length - 1];

  if (user?.userType === "Marketer" && transaction?.transactionId) {
    if (transaction.transactionId.includes("ch_")) {
      transactionNumber = transaction.transactionId.split("ch_")[1];
    } else if (transaction.transactionId.includes("pi_")) {
      transactionNumber = transaction.transactionId.split("pi_")[1];
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        {/* <CustomBackButton /> */}
        <Text style={styles.headerTitle}>Deal Details</Text>
        <ProfileInfo />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.dealCard}>
          <Text style={styles.dealName}>
            {deal?.dealName || "Unnamed Deal"}
          </Text>
          <Text style={styles.dealAmount}>
            {deal?.paymentInfo?.paymentAmount?.toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}
          </Text>

          <View style={styles.userInfo}>
            <View style={styles.userProfile}>
              <Text style={styles.username}>
                {otherParty?.userName
                  ? otherParty.userName.includes("@")
                    ? otherParty.userName
                    : `@${otherParty.userName}`
                  : user?.userType === "Marketer"
                  ? "@Creator"
                  : "@Marketer"}
              </Text>
              <View style={[styles.statusBadge]}>
                <Text style={styles.statusText}>{deal?.status}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Project price</Text>
            <Text style={styles.summaryValue}>
              ${projectPrice.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>In escrow</Text>
            <Text style={styles.summaryValue}>
              ${inEscrow.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              Paid ({milestonesPaidCount})
            </Text>
            <Text style={styles.summaryValue}>
              ${milestonesPaidAmount.toLocaleString()}
            </Text>
          </View>
          {user?.userType !== "Marketer" && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total earnings</Text>
              <Text style={styles.summaryValue}>
                ${totalEarnings.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "overview" && styles.activeTab]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "overview" && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "milestones" && styles.activeTab]}
            onPress={() => setActiveTab("milestones")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "milestones" && styles.activeTabText,
              ]}
            >
              Milestones
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "overview" ? (
          <View style={styles.detailsContainer}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Platforms</Text>
              <View style={styles.platformIcons}>
                {deal?.deliverables?.map((platform: string, index: number) => (
                  <View key={index} style={styles.platformIconContainer}>
                    <Image
                      source={getPlatformIcon(platform)}
                      style={styles.platformIcon}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.descriptionText}>
                {deal?.offerId?.description || "No description provided."}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Desired Post Date</Text>
              <Text style={styles.detailText}>
                {deal?.offerId?.desiredPostDate
                  ? format(
                      new Date(deal?.offerId.desiredPostDate),
                      "dd MMM yyyy"
                    )
                  : "N/A"}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>
                Desired Content Review Date
              </Text>
              <Text style={styles.detailText}>
                {deal?.offerId?.desiredReviewDate
                  ? format(
                      new Date(deal?.offerId.desiredReviewDate),
                      "dd MMM yyyy"
                    )
                  : "N/A"}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Deal No</Text>
              <Text style={styles.detailText}>{deal?.dealNumber}</Text>
            </View>

            {transactionNumber && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Transaction No</Text>
                <Text style={styles.detailText}>{transactionNumber}</Text>
              </View>
            )}

            {user?.userType === "Creator" && (
              <View style={styles.uploadProofSection}>
                <TouchableOpacity
                  style={styles.uploadProofButton}
                  onPress={() => {
                    router.push({
                      pathname: "/UOM13CreatorUploadProof",
                      params: {
                        dealId: dealId as string,
                        isProof: "true",
                      },
                    });
                  }}
                >
                  <Text style={styles.uploadProofButtonText}>
                    Upload Content
                  </Text>
                </TouchableOpacity>
                <Text style={styles.uploadProofNote}>
                  Upload content related to this deal. Check Milestones tab for
                  specifics.
                </Text>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Files</Text>
              <View style={styles.filesList}>
                {deal?.attachments?.length > 0 ? (
                  deal?.attachments?.map((file: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.fileItem}
                      onPress={() => handleOpenFile(file.url)}
                    >
                      <FileText size={24} color="#430B92" />
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name || `File ${index + 1}`}
                        </Text>
                      </View>
                      <ExternalLink size={16} color="#430B92" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noFilesText}>No files attached.</Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.milestonesContainer}>
            <View style={styles.milestonesHeader}>
              <Text style={styles.milestonesTitle}>Milestone Timeline</Text>
            </View>

            <View style={styles.milestonesList}>
              {deal.milestones?.length > 0 ? (
                deal.milestones.map((milestone: Milestone, index: number) => (
                  <RenderMilestone
                    key={milestone.id}
                    milestone={milestone}
                    index={index}
                    collapsedMilestones={collapsedMilestones}
                    toggleCollapse={handleMilestoneCollapse}
                    user={user}
                    dealId={dealId as string}
                    router={router}
                    setSelectedMilestone={setSelectedMilestone}
                    setReviewStatus={setReviewStatus}
                    setReviewModalVisible={setReviewModalVisible}
                    handleResubmitWork={handleResubmitWork}
                  />
                ))
              ) : (
                <Text style={styles.noMilestonesText}>
                  No milestones defined for this deal yet.
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomButtonsContainer}>
          <Pressable
            style={styles.messageButton}
            onPress={() => {
              if (deal?.offerId?._id) {
                localStorage.setItem("selectedOfferId", deal.offerId._id);
              }
              router.push("/messages");
            }}
          >
            <Text style={styles.messageButtonText}>
              Message {user?.userType === "Marketer" ? "Creator" : "Marketer"}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelDealButton} onPress={() => {}}>
            <Text style={styles.cancelDealButtonText}>Cancel Deal</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={isReviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewStatus === "approved"
                  ? "Approve Work"
                  : "Request Revision"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {reviewStatus === "approved"
                    ? "Feedback (Optional)"
                    : "Revision Instructions *"}
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  multiline
                  numberOfLines={4}
                  value={reviewFeedback}
                  onChangeText={setReviewFeedback}
                  placeholder={
                    reviewStatus === "approved"
                      ? "Add final comments..."
                      : "Explain what needs revising..."
                  }
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleReviewSubmission}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>
                    {reviewStatus === "approved"
                      ? "Approve"
                      : "Request Revision"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  dealCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dealName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  dealAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  username: {
    fontSize: 16,
    color: "#430B92",
    fontWeight: "500",
  },
  statusBadge: {
    backgroundColor: "#430B92",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  summaryItem: {
    alignItems: "center",
    minWidth: 80,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#430B92",
  },
  tabText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#430B92",
    fontWeight: "600",
  },
  detailsContainer: {
    gap: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  platformIcons: {
    flexDirection: "row",
    gap: 10,
  },
  platformIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  platformIcon: {
    width: 20,
    height: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#4B5563",
  },
  filesList: {
    gap: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    color: "#6B7280",
  },
  noFilesText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  milestonesContainer: {
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  milestonesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  milestonesList: {
    gap: 16,
  },
  noMilestonesText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  milestoneItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  milestoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  milestoneInfo: {
    flex: 1,
    gap: 2,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  milestoneAmount: {
    fontSize: 14,
    color: "#430B92",
    fontWeight: "500",
  },
  milestoneDueDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  milestoneStatus: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: "#430B92",
    marginLeft: 8,
  },
  milestoneStatusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  milestoneContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 16,
  },
  milestoneDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  revisionRequiredNotice: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDBA74",
    borderRadius: 8,
    padding: 16,
  },
  revisionRequiredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  revisionRequiredHeading: {
    color: "#D97706",
    fontWeight: "600",
    fontSize: 15,
  },
  submittedWorkSection: {
    gap: 12,
  },
  submittedWorkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  submissionDescriptionContainer: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  submissionDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  submissionDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  deliverableItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  deliverableInfo: {
    flex: 1,
    gap: 2,
  },
  deliverableName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  deliverableDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  deliverableActions: {
    flexDirection: "row",
    gap: 8,
  },
  deliverableAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#E0E7FF",
  },
  deliverableActionText: {
    fontSize: 12,
    color: "#4338CA",
    fontWeight: "500",
  },
  noContentText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  feedbackContainer: {
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#430B92",
  },
  feedbackItem: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  feedbackText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
    lineHeight: 20,
  },
  feedbackDate: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  milestoneActions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  submitWorkButton: {
    backgroundColor: "#430B92",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  submitWorkButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  resubmitButton: {
    backgroundColor: "#430B92",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  revisionButton: {
    backgroundColor: "#F59E0B",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  revisionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  reviewActions: {
    flexDirection: "row",
    gap: 12,
  },
  uploadProofSection: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  uploadProofButton: {
    backgroundColor: "#430B92",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadProofButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  uploadProofNote: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  bottomButtonsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 16,
  },
  messageButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelDealButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelDealButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalForm: {
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalSecondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  modalSecondaryButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  modalPrimaryButton: {
    backgroundColor: "#430B92",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalPrimaryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
