"use client";

import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  useWindowDimensions,
  Pressable,
  Linking,
  View,
} from "react-native";

import Arrowdown01 from "@/assets/arrowdown01.svg";
import {
  Padding,
  Border,
  FontFamily,
  Gap,
  Color,
  FontSize,
} from "@/GlobalStyles";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { router, useGlobalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Toast from "react-native-toast-message";
import { format } from "date-fns";

import CustomBackButton from "@/components/CustomBackButton";
import StripeCheckout from "@/components/StripeCheckout";
import FilePreview from "@/components/FilePreview";
import { useAuth } from "@/contexts/AuthContext";

import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  X,
  Plus,
  AlertTriangle,
  Edit3,
  Trash2,
  FileText,
} from "lucide-react-native";
import PromptModal from "@/components/PromptModal";
import ProfileInfo from "../ProfileInfo";
import CurrencyInput from "react-currency-input-field";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { ConfigurableCurrencyInput } from "../CurrencyInput";
import { Switch } from "react-native";
import Navbar from "./navbar";
// authContext.tsx
interface AuthContextType {
  user: {
    _id: string;
    token: string;
    userType: "Marketer" | "Creator";
    // … other fields as needed
  } | null;
  // … any additional fields
}

// ---------- constants / placeholders ----------
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Payment-related statuses
const DEAL_STATUSES = {
  ACCEPTED: "Accepted",
  IN_PROCESS: "In-Process",
  CANCELLATION: "Cancellation",
  CONTENT_FOR_APPROVAL: "Content for Approval Submitted",
  CONTENT_APPROVED: "Content Approved",
  FINAL_CONTENT_POSTED: "Final Content Posted",
  COMPLETION_PAYMENT: "Completion Payment Issued",
};

// ---------- types -------------
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

interface ProofSubmission {
  id: string;
  attachments: Array<{
    type: string;
    url?: string;
    content?: string;
    originalName?: string;
    submittedAt?: Date;
  }>;
  submittedAt: Date;
  submittedBy: string;
  status: "pending_review" | "approved" | "revision_required";
  feedback?: Array<{
    id: string;
    feedback: string;
    createdAt: Date;
    createdBy: string;
  }>;
}

// ---------- helpers ----------
async function fetchDeal(dealId: string, role: string, userId: string) {
  const response = await axios.get(
    `${API_URL}/api/marketer/deals/${dealId}?role=${role}&userId=${userId}`
  );
  return response.data.deal;
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

// For milestone status UI text
function getStatusText(status: string) {
  switch (status) {
    case "pending":
      return "Pending Funding";
    case "active":
      return "Active";
      case "paid":              
       return "Funded";   
    case "in_review":
      return "In Review";
    case "revision_required":
      return "Revision Required";
    case "approved":
      return "Approved";
    case "proposed":
      return "Proposed";
    default:
      return "Pending";
  }
}


/**
 * computeMilestoneSummary
 * Summarizes project price, escrow, total earnings, etc.
 */
function computeMilestoneSummary(deal: any) {
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

  const baseAmount = Number(deal.paymentInfo?.paymentAmount) || 0;
  const dealStatus = deal.status;

  let projectPrice = baseAmount;
  let inEscrow = 0;
  let totalEarnings = 0;

  // For the main 50% escrow logic:
  if (dealStatus !== "Cancelled") {
    inEscrow += deal.paymentInfo.transactions.reduce((acc: number, t: any) => {
      if (t.milestoneId || t.type === "release_final") return acc;
      if (t.type === "escrow") {
        return acc + Number(t.paymentAmount);
      }
      return acc;
    }, 0);

    totalEarnings += deal.paymentInfo.transactions.reduce(
      (acc: number, t: any) => {
        if (t.milestoneId) return acc;
        if (t.type === "release_half" || t.type === "release_final") {
          inEscrow = Math.max(inEscrow - Number(t.paymentAmount), 0);
          return acc + Number(t.paymentAmount);
        }
        return acc;
      },
      0
    );
  }

  // Summaries for milestones
  let milestonesPaidCount = 0;
  let milestonesPaidAmount = 0;
  let milestonesRemainingCount = 0;
  let milestonesRemainingAmount = 0;

  deal.milestones?.forEach((m: any) => {
    const amount = Number(m.amount) || 0;
    const bonus = Number(m.bonus) || 0;
    const totalMilestoneAmount = amount + bonus;
  
    // Escrowed milestones
    const isEscrowed = ["active", "in_review", "paid", "revision_required"].includes(m.status);
    if (isEscrowed) {
      inEscrow += totalMilestoneAmount;
    }
  
    // Paid milestones
    if (m.status === "completed" || m.status === "paid") {
      milestonesPaidCount += 1;
      milestonesPaidAmount += totalMilestoneAmount;
      inEscrow -= totalMilestoneAmount;
      if (inEscrow < 0) inEscrow = 0;
      totalEarnings += totalMilestoneAmount;
    }
  
    // Remaining milestones (not yet completed/paid)
    if (
      m.status === "pending" ||
      m.status === "proposed" ||
      m.status === "active" ||
      m.status === "in_review" ||
      m.status === "revision_required"
    ) {
      milestonesRemainingCount += 1;
      milestonesRemainingAmount += totalMilestoneAmount;
    }
  });
  
  

  if (milestonesPaidAmount > 0) {
    projectPrice += milestonesPaidAmount;
  }

  if (milestonesRemainingAmount > 0) {
    projectPrice += milestonesRemainingAmount;
  }

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

/**
 * Renders a single milestone UI block
 */
function renderMilestone(
  milestone: Milestone,
  index: number,
  collapsedMilestones: string[],
  toggleCollapse: (id: string) => void,
  user: any,
  dealId: string,
  router: any,
  handleFundMilestone: (m: Milestone) => void,
  setSelectedMilestone: (m: Milestone | null) => void,
  setReviewStatus: (s: "approved" | "revision_required") => void,
  setReviewModalVisible: (b: boolean) => void,
  handleMarkAsPosted: () => void,
  handleResubmitWork: (id: string) => void,
  handleEditMilestonePress: (m: Milestone) => void,
  handleDeleteMilestonePress: (m: Milestone) => void,
  setSelectedFile: (f: FilePreviewType | null) => void,
  setShowFilePreview: (b: boolean) => void
) {
  const isToggleableCreator =
    milestone.status === "pending" && user?.userType === "Creator";
    const isToggleableMarketer =
    +   ["active", "paid"].includes(milestone.status) && user?.userType === "Marketer";
    
  const isCollapsed = !collapsedMilestones.includes(milestone.id);
  const statusText = getStatusText(milestone.status);

  return (
    <View style={styles.milestoneItem}>
      {/* Collapsible header */}
      <TouchableOpacity
        style={styles.milestoneHeader}
        disabled={isToggleableCreator || isToggleableMarketer}
        onPress={() => toggleCollapse(milestone.id)}
      >
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneName}>{milestone.name}</Text>
          <Text style={styles.milestoneAmount}>
            {milestone?.amount.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
            })}
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
          <ChevronRight size={20} color="#6B7280" />
        ) : (
          <ChevronDown size={20} color="#6B7280" />
        )}
      </TouchableOpacity>

      {/* Collapsible content */}
      {!isCollapsed && (
        <View style={styles.milestoneContent}>
          {/* If revision required, show notice + feedback */}
          {/* Submitted deliverables */}
          {milestone.deliverables?.length > 0 ? (
            <View>
              <Text style={styles.deliverablesSectionTitle}>
                Submitted Content
              </Text>
              {milestone.deliverables.map((block, i) => (
                <View key={i} style={styles.deliverablesContainer}>
                  {block.deliverables?.length > 0 ? (
                    block.deliverables
                      .filter((d) => d.type !== "text")
                      .map((file, j) => (
                        <View key={j} style={styles.deliverableItem}>
                          <View style={styles.deliverableInfo}>
                            <Text style={styles.deliverableName}>
                              {file.originalName}
                            </Text>
                          </View>
                          {file.url && (
                            <View style={styles.deliverableActions}>
                              <TouchableOpacity
                                style={styles.deliverableAction}
                                onPress={() => {
                                  setSelectedFile({
                                    fileUrl: `${API_URL}${file.url}`,
                                    originalName: file.originalName,
                                    type: file.type,
                                  });
                                  setShowFilePreview(true);
                                }}
                              >
                                <ExternalLink size={16} color="#430B92" />
                                <Text style={styles.deliverableActionText}>
                                  View
                                </Text>
                              </TouchableOpacity>
                              {/* Download on web */}
                              {Platform.OS === "web" && (
                                <TouchableOpacity
                                  style={styles.deliverableAction}
                                  onPress={() => {
                                    const link = document.createElement("a");
                                    link.href = `${API_URL}${file.url}`;
                                    link.download = file.originalName || "file";
                                    link.click();
                                  }}
                                >
                                  <Download size={16} color="#430B92" />
                                  <Text style={styles.deliverableActionText}>
                                    Download
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      ))
                  ) : (
                    <Text style={styles.noContentText}>
                      No content files found
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : milestone.status === "in_review" ? (
            <Text style={styles.noContentText}>
              Content submitted for review
            </Text>
          ) : null}

          {/* Creator actions */}
          {user?.userType === "Creator" && (
            <View style={styles.creatorActionsSection}>
              {(milestone.status === "paid" ||
                milestone.status === "active") && (
                <TouchableOpacity
                  style={styles.uploadContentButton}
                  onPress={() =>
                    router.push({
                      pathname: "/UOM13CreatorUploadProof",
                      params: { dealId, milestoneId: milestone.id },
                    })
                  }
                >
                  <Text style={styles.uploadContentButtonText}>
                    Upload Content for Review
                  </Text>
                </TouchableOpacity>
              )}
              {milestone.status === "revision_required" && (
                <TouchableOpacity
                  style={styles.resubmitButton}
                  onPress={() => handleResubmitWork(milestone.id)}
                >
                  <Text style={styles.resubmitButtonText}>Resubmit Work</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Marketer actions */}
          {user?.userType === "Marketer" && (
            <View style={styles.marketerActionsSection}>
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
              {milestone.status === "pending" && (
                <TouchableOpacity
                  style={styles.fundButton}
                  onPress={() => handleFundMilestone(milestone)}
                >
                  <Text style={styles.fundButtonText}>Fund Milestone</Text>
                </TouchableOpacity>
              )}

              {/* Edit / delete if not funded yet */}
              {!milestone.fundedAt && (
                <View style={styles.milestoneManageRow}>
                  <TouchableOpacity
                    style={styles.editMilestoneButton}
                    onPress={() => handleEditMilestonePress(milestone)}
                  >
                    <Edit3 size={16} color="#430B92" />
                    <Text style={styles.editMilestoneText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteMilestoneButton}
                    onPress={() => handleDeleteMilestonePress(milestone)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <Text style={styles.deleteMilestoneText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ---------- main component ----------
export default function DealDetail() {
  const { user } = useAuth();
  const { dealId } = useGlobalSearchParams();
  const windowSize = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = windowSize.width >= BREAKPOINTS.TABLET;

  const [activeTab, setActiveTab] = useState<"overview" | "milestones">(
    "overview"
  );
  const [collapsedMilestones, setCollapsedMilestones] = useState<string[]>([]);

  // Add/edit milestone
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

  // Milestone review
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<
    "approved" | "revision_required"
  >("approved");

  // Payment
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(
    null
  );
  const [paymentType, setPaymentType] = useState("offerFee");

  // File preview
  const [selectedFile, setSelectedFile] = useState<FilePreviewType | null>(
    null
  );
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Delete milestone confirm
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(
    null
  );

  // Offer revision
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");

  // Cancel deal
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Proof
  const [selectedProof, setSelectedProof] = useState<ProofSubmission | null>(
    null
  );
  const [proofReviewModalVisible, setProofReviewModalVisible] = useState(false);
  const [collapsedProofs, setCollapsedProofs] = useState<string[]>([]);
  const toggleProofCollapse = (id: string) => {
    setCollapsedProofs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // New: release modals for first & final 50%
  const [showReleaseFirstModal, setShowReleaseFirstModal] = useState(false);
  const [showReleaseFinalModal, setShowReleaseFinalModal] = useState(false);

  const queryClient = useQueryClient();

  // ---------- fetch deal ----------
  const {
    data: deal,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["deal", dealId, user?.userType, user?._id],
    queryFn: () => {
      if (dealId && user?._id && user?.userType) {
        return fetchDeal(dealId as string, user.userType, user._id);
      }
      return null;
    },
    enabled: !!dealId && !!user?._id,
  });

  useEffect(() => {
    if (activeTab === "milestones" && deal?.milestones?.length > 0) {
      setCollapsedMilestones([]);
    }
  }, [activeTab, deal?.milestones]);

  // ---------- Summaries ----------
  const {
    projectPrice,
    inEscrow,
    milestonesPaidCount,
    milestonesPaidAmount,
    milestonesRemainingCount,
    milestonesRemainingAmount,
    totalEarnings,
  } = computeMilestoneSummary(deal);

     /* -------------------------------------------------------------
    * NEW (fix) — hide further “Review” buttons **only after the
    * final 50 % payment** is released.  Releasing the first-half
    * escrow must not block reviewers.
    * ----------------------------------------------------------- */
   const hasFinalPaymentReleased = React.useMemo(
     () =>
       deal?.paymentInfo?.transactions?.some(
         (tx: any) => tx.type === "release_final"
       ) ?? false,
     [deal]
   );

  // ---------- Mutations ----------
  // Add milestone
  const addMilestoneMutation = useMutation({
    mutationFn: async (data: typeof milestoneForm) => {
      const amount = Number(data.amount);
      if (isNaN(amount) || amount < 100) {
        throw new Error("Amount must be a number and at least $100");
      }
      const res = await axios.post(
        `${API_URL}/api/marketer/deals/${dealId}/milestones`,
        {
          ...data,
          userId: user?._id,
          userType: user?.userType,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      setAddMilestoneModalVisible(false);
      refetch();
    },
    onError: (error: any) => {
      Toast.show({
        type: "customNotification",
        text1: "Validation Error",
        text2: error.message,
        position: "top",
        visibilityTime: 3000,
      });
    },
  });

  // Edit milestone
  const editMilestoneMutation = useMutation({
    mutationFn: async (data: typeof milestoneForm) => {
      const amount = Number(data.amount);
      if (isNaN(amount) || amount < 100) {
        throw new Error("Amount must be a number and at least $100");
      }
      const res = await axios.put(
        `${API_URL}/api/marketer/deals/${dealId}/milestones/${editingMilestoneId}`,
        {
          ...data,
          userId: user?._id,
          userType: user?.userType,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      setAddMilestoneModalVisible(false);
      refetch();
    },
    onError: (error: any) => {
      Toast.show({
        type: "customNotification",
        text1: "Validation Error",
        text2: error.message,
        position: "top",
        visibilityTime: 3000,
      });
    },
  });

  // Delete milestone
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const res = await axios.delete(
        `${API_URL}/api/marketer/deals/${dealId}/milestones/${milestoneId}`,
        {
          data: {
            userId: user?._id,
            userType: user?.userType,
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Milestone Deleted",
        text2: "Successfully deleted the milestone",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      refetch();
    },
  });

  // Milestone review
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
      refetch();
    },
  });

  // Offer content revision
  const requestOfferContentRevisionMutation = useMutation({
    mutationFn: async (feedback: string) => {
      const resp = await axios.post(
        `${API_URL}/api/marketer/deals/${dealId}/offer-content/revision`,
        {
          userId: user?._id,
          userType: user?.userType,
          feedback,
        }
      );
      return resp.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Revision Requested",
        text2: "Creator will revise the main content",
        position: "top",
      });
      refetch();
      setRevisionFeedback("");
    },
    onError: (err) => {
      Toast.show({
        type: "customNotification",
        text1: "Revision Request Failed",
        text2: String(err),
        position: "top",
      });
    },
  });

  // Cancel deal
  const cancelDealMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await axios.post(
        `${API_URL}/api/marketer/deals/${dealId}/cancel`,
        {
          user: { _id: user?._id, role: user?.userType },
          reason,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: data.message,
        position: "top",
        visibilityTime: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
    },
    onError: (error: any) => {
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: error.response?.data?.error,
        position: "top",
        visibilityTime: 3000,
      });
    },
  });

  // Review proof
  const reviewProofMutation = useMutation({
    mutationFn: async (data: {
      proofId: string;
      status: "approved" | "revision_required";
      feedback: string;
    }) => {
      const response = await axios.post(
        `${API_URL}/api/marketer/deals/${dealId}/proofs/${data.proofId}/review`,
        {
          status: data.status,
          feedback: data.feedback,
          userId: user?._id,
          userType: user?.userType,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setProofReviewModalVisible(false);
      setSelectedProof(null);
      refetch();
    },
  });

  // ---------- NEW: Release first 50% escrow  ----------
  const releaseFirstHalfMutation = useMutation({
        mutationFn: async () => {
          return axios.post(
            `${API_URL}/api/marketer/deals/${dealId}/release-first-half`,
        {
          userId: user?._id,
          userType: user?.userType,
        }
      );
    },
    onSuccess: () => {
      setShowReleaseFirstModal(false);
      refetch();
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "First 50% escrow released",
        position: "top",
        visibilityTime: 3000,
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: err?.response?.data?.error || "Failed to release escrow",
        position: "top",
      });
    },
  });

  // ---------- handlers ----------
  // Add or edit milestone
  const handleAddMilestonePress = () => {
    setIsEditMilestone(false);
    setEditingMilestoneId(null);
    setMilestoneForm({
      name: "",
      amount: "",
      dueDate: new Date(),
      description: "",
      bonus: "",
    });
    setAddMilestoneModalVisible(true);
  };

  const handleMilestoneSave = async () => {
    console.log("milestoneForm", milestoneForm);
    if (Number(milestoneForm.amount) < 100) {
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: "Minimum amount is 100",
      });
      return;
    }

    try {
      if (isEditMilestone) {
        await editMilestoneMutation.mutateAsync(milestoneForm);
      } else {
        await addMilestoneMutation.mutateAsync(milestoneForm);
      }
    } catch (err) {
      console.error("Save milestone error:", err);
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: "Failed to save milestone",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    }
  };

  const handleEditMilestonePress = (milestone: Milestone) => {
    setIsEditMilestone(true);
    setEditingMilestoneId(milestone.id);
    setMilestoneForm({
      name: milestone.name,
      amount: String(milestone.amount),
      dueDate: new Date(milestone.dueDate),
      description: milestone.description || "",
      bonus: String(milestone.bonus || 0),
    });
    setAddMilestoneModalVisible(true);
  };

  const handleDeleteMilestonePress = (m: Milestone) => {
    setMilestoneToDelete(m);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!milestoneToDelete) return;
    try {
      await deleteMilestoneMutation.mutateAsync(milestoneToDelete.id);
    } catch (error) {
      console.error("Error deleting milestone:", error);
    } finally {
      setShowDeleteModal(false);
      setMilestoneToDelete(null);
    }
  };

  // Reviewing milestone
  const handleReviewSubmission = async () => {
    if (!selectedMilestone) return;
    await reviewMutation.mutateAsync({
      milestoneId: selectedMilestone.id,
      status: reviewStatus,
      feedback: reviewFeedback,
    });
  };

  const handleMilestoneCollapse = (id: string) => {
    setCollapsedMilestones((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Payment
  const handleFundMilestone = (milestone: Milestone) => {
    setCurrentMilestone(milestone);
    setPaymentType("milestoneFunding");
    setShowStripeCheckout(true);
  };

  const handlePaymentSuccess = async () => {
    if (paymentType === "finalPayment") {
      if (selectedProof) {
        reviewProofMutation.mutate({
          proofId: selectedProof.id,
          status: "approved",
          feedback: "",
        });
      }
    } else {
      Toast.show({
        type: "customNotification",
        text1: "Payment Successful",
        text2: "Escrow funded or final payment processed",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    }
    setShowStripeCheckout(false);
    refetch();
  };

  const handlePaymentError = (errorMsg: string) => {
    console.error("Payment error:", errorMsg);
    Toast.show({
      type: "customNotification",
      text1: "Payment Error",
      text2: errorMsg,
      position: "top",
      visibilityTime: 3000,
      topOffset: 50,
    });
    setShowStripeCheckout(false);
  };

  const handlePaymentCancel = () => {
    Toast.show({
      type: "customNotification",
      text1: "Payment Cancelled",
      text2: "Payment was cancelled",
      position: "top",
      visibilityTime: 3000,
      topOffset: 50,
    });
    setShowStripeCheckout(false);
  };

  // Mark entire content posted
  const handleMarkAsPosted = async () => {
    try {
      await axios.post(`${API_URL}/api/marketer/deals/${dealId}/mark-posted`, {
        userId: user?._id,
        userType: user?.userType,
      });
      refetch();
    } catch (err) {
      console.error("Mark as posted error:", err);
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: "Failed to mark as posted",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    }
  };

  // Resubmit if revision
  const handleResubmitWork = async (milestoneId: string) => {
    try {
      router.push({
        pathname: "/UOM13CreatorUploadProof",
        params: { dealId, milestoneId, isResubmission: "true" },
      });
    } catch (err) {
      console.error("Error resubmitting:", err);
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: "Failed to resubmit work",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    }
  };

  // Upload entire offer
  const handleUploadOfferContent = () => {
    router.push({
      pathname: "/UOM13CreatorUploadProof",
      params: { dealId, isProof: "true" },
    });
  };

  // Cancel deal
  const handleCancelDeal = () => {
    setShowCancelConfirm(true);
  };

  const handlePromptSubmit = async (reason: string) => {
    if (!reason.trim()) {
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: "Please provide a cancellation reason",
        position: "top",
      });
      return;
    }
    try {
      setIsProcessing(true);
      await cancelDealMutation.mutateAsync(reason);
    } catch (error: any) {
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: error.response?.data?.error || "Cancellation failed",
        position: "top",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Release first half confirm
  const handleConfirmReleaseFirst = () => {
    releaseFirstHalfMutation.mutate();
  };

  // ---------- date input for milestone (web only) ----------
  const DateInput = ({ value, onChange }: any) => {
    if (Platform.OS === "web") {
      return (
        <DatePicker
          selected={value}
          onChange={onChange}
          dateFormat="dd MMM, yyyy"
          className="date-picker-input"
          minDate={new Date()}
          popperClassName="datepicker-popper"
          portalId="datepicker-popper-container"
          customInput={
            <View style={styles.dateInput}>
              <Text style={styles.dateText}>
                {value.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <Calendar width={24} height={24} color="#430B92" />
            </View>
          }
        />
      );
    }
    // For mobile, you might open a DateTimePicker
    return (
      <TouchableOpacity style={styles.dateInput}>
        <Text style={styles.dateText}>
          {value.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
        <Calendar width={24} height={24} color="#430B92" />
      </TouchableOpacity>
    );
  };
  const [isDropDown, setIsDropDown] = useState(false);  // ---------- Conditionals for transaction number display ----------
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
        <Text>{String(error)}</Text>
      </View>
    );
  }
  if (!deal) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  const otherParty =
    user?.userType === "Marketer" ? deal.creatorId : deal.marketerId;
  const transaction = deal.paymentInfo?.transactions?.[0];
  let transactionNumber = "";
  if (user?.userType === "Marketer" && transaction?.transactionId) {
    if (transaction.transactionId.includes("ch_")) {
      transactionNumber = transaction.transactionId.split("ch_")[1];
    } else if (transaction.transactionId.includes("pi_")) {
      transactionNumber = transaction.transactionId.split("pi_")[1];
    }
  }
 
  // ---------- main UI ----------
  return (
    <>
    <Navbar pageTitle="Deal Details"/>
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />      
      {/* HEADER */}
      {/* <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Deal Details</Text>
        <TouchableOpacity
          style={styles.placeholder}
          onPress={() => router.push("/profile")}
        >
          <ProfileInfo />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.scrollView}>
        <View style={styles.webContainer}>
          {/* Deal Card */}
          <View style={styles.dealCard}>
            <View style={styles.dealContainer}>
              <Text style={styles.dealName}>
                {deal.dealName || "Unnamed Deal"}
              </Text>
              <View style={styles.rightContainer}>
            <TouchableOpacity
              style={styles.businessBadge}
              onPress={() => setIsDropDown(!isDropDown)}
            >
                          <Text style={styles.businessText}>My Business</Text>
                          <Arrowdown01 width={24} height={24} />
            </TouchableOpacity>

  {isDropDown && (
                  <View style={styles.dropDown}>
                    <TouchableOpacity
                      style={styles.dropDownItem}
                      onPress={() => {
                        if (user.userType === "Creator") {
                          router.push("/UOEPM01PaymentHistoryCreator");
                        } else if (user.userType === "Marketer") {
                          router.push("/UOEPM05PaymentHistoryMarketer");
                        }
                        setIsDropDown(false);
                      }}
                    >
                      <Text style={styles.dropDownItemText}>
                        {user.userType === "Creator"
                          ? "Earnings History"
                          : "Payout History"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setShowCancelConfirm(true);
                }}
              >
                <MaterialCommunityIcons name="cancel" size={15} color="white" />
              </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.dealAmount}>
              {deal.paymentInfo?.paymentAmount?.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              }) || 0}
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
                  <Text style={styles.statusText}>{deal.status}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Summary bar */}
          <View style={styles.upworkSummaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Project price</Text>
              <Text style={styles.summaryValue}>
                {projectPrice.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.summarySub}>Fixed-price</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>In escrow</Text>
              <Text style={styles.summaryValue}>
                {inEscrow.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                Milestones paid ({milestonesPaidCount})
              </Text>
              <Text style={styles.summaryValue}>
                {milestonesPaidAmount.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                Milestones remaining ({milestonesRemainingCount})
              </Text>
              <Text style={styles.summaryValue}>
                {(milestonesRemainingAmount).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                Total {user?.userType === "Creator" ? "earnings" : "paid"}
              </Text>
              <Text style={styles.summaryValue}>
                {totalEarnings.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* TABS */}
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
              style={[
                styles.tab,
                activeTab === "milestones" && styles.activeTab,
              ]}
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

          {/* Overview tab */}
          {activeTab === "overview" ? (
            <View style={styles.detailsContainer}>
              {/* Platforms */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Platforms</Text>
                  <View style={styles.platformIcons}>
                    {deal.deliverables?.map((pf: string, idx: number) => (
                      <View key={idx} style={styles.platformIcon}>
                        <Image
                          source={getPlatformIcon(pf)}
                          style={styles.platformIconImage}
                        />
                      </View>
                    ))}
                  </View>
                </View>

                {/* If Marketer, show "Release First 50%" when status = ACCEPTED */}
                {user?.userType === "Marketer" &&
                  [
                    DEAL_STATUSES.ACCEPTED,
                    DEAL_STATUSES.CONTENT_FOR_APPROVAL,
                  ].includes(deal.status) &&
                  !deal.paymentInfo?.transactions?.some(
                    (t: any) => t.type === "release_half"
                  ) && (
                    <TouchableOpacity
                      style={styles.releaseButton}
                      onPress={() => setShowReleaseFirstModal(true)}
                    >
                      <Text style={styles.releaseButtonText}>
                        Release First 50%
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>

              {/* Description */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descriptionText}>
                  {deal.offerId?.description || "No description provided."}
                </Text>
              </View>

              {/* Desired Dates */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Desired Post Date</Text>
                <Text style={styles.detailText}>
                  {deal.offerId?.desiredPostDate
                    ? format(
                        new Date(deal.offerId.desiredPostDate),
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
                  {deal.offerId?.desiredReviewDate
                    ? format(
                        new Date(deal.offerId.desiredReviewDate),
                        "dd MMM yyyy"
                      )
                    : "N/A"}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Deal No</Text>
                <Text style={styles.detailText}>{deal.dealNumber}</Text>
              </View>

              {transactionNumber && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Transaction No</Text>
                  <Text style={styles.detailText}>{transactionNumber}</Text>
                </View>
              )}
              {/* Offer feedback */}
              {deal.offerContent?.feedback?.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Offer Feedback</Text>
                  <View style={styles.feedbackContainer}>
                    {deal.offerContent.feedback.map((fb: any, i: number) => (
                      <View key={i} style={styles.feedbackItem}>
                        <Text style={styles.feedbackText}>{fb.feedback}</Text>
                        <Text style={styles.feedbackDate}>
                          - {fb.createdBy} (
                          {format(new Date(fb.createdAt), "dd MMM yyyy")})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Proof Submissions */}
              {deal.proofSubmissions?.length > 0 && (
                <View style={styles.proofSubmissionsSection}>
                  <Text style={styles.sectionTitle}>Proof Submissions</Text>
                  {deal.proofSubmissions.map((proof: ProofSubmission) => {
                    const isCollapsed = collapsedProofs.includes(proof.id);
                    return (
                      <View key={proof.id} style={styles.proofSubmissionCard}>
                        <TouchableOpacity
                          style={styles.proofHeader}
                          onPress={() => toggleProofCollapse(proof.id)}
                        >
                          <View style={styles.proofHeaderContent}>
                            <Text style={styles.proofDate}>
                              Submitted on:{" "}
                              {format(
                                new Date(proof.submittedAt),
                                "dd MMM yyyy"
                              )}
                            </Text>
                            {isCollapsed ? (
                              <ChevronRight size={20} color="#6B7280" />
                            ) : (
                              <ChevronDown size={20} color="#6B7280" />
                            )}
                          </View>
                          {proof.status === "pending_review" &&
                            user?.userType === "Marketer" &&
                            !hasFinalPaymentReleased && (
                              <TouchableOpacity
                                style={styles.reviewButton}
                                onPress={() => {
                                  setSelectedProof(proof);
                                  setProofReviewModalVisible(true);
                                }}
                              >
                                <Text style={styles.reviewButtonText}>
                                  Review
                                </Text>
                              </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        {!isCollapsed && (
                          <>
                            <View style={styles.attachmentsContainer}>
                              {proof.attachments.map((attachment, i) => (
                                <TouchableOpacity
                                  key={i}
                                  style={styles.attachmentItem}
                                  onPress={() => {
                                    if (attachment.type === "file") {
                                      Linking.openURL(
                                        `${API_URL}${attachment.url}`
                                      );
                                    }
                                  }}
                                >
                                  {attachment.type === "file" ? (
                                    <>
                                      <FileText size={16} color="#430B92" />
                                      <Text style={styles.attachmentName}>
                                        {attachment.originalName}
                                      </Text>
                                    </>
                                  ) : (
                                    <Text style={styles.textContent}>
                                      {attachment.content}
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              ))}
                            </View>
                            {proof.feedback && proof.feedback.length > 0 && (
                              <View style={styles.feedbackSection}>
                                <Text style={styles.feedbackTitle}>
                                  Feedback:
                                </Text>
                                {proof.feedback.map((fb, idx) => (
                                  <View key={idx} style={styles.feedbackItem}>
                                    <Text style={styles.feedbackText}>
                                      {fb.feedback}
                                    </Text>
                                    <Text style={styles.feedbackDate}>
                                      {format(
                                        new Date(fb.createdAt),
                                        "dd MMM yyyy"
                                      )}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Creator upload proof */}
              {user?.userType === "Creator" &&
                deal.status !== DEAL_STATUSES.COMPLETION_PAYMENT && (
                  <View style={styles.uploadProofSection}>
                    <TouchableOpacity
                      style={styles.uploadProofButton}
                      onPress={handleUploadOfferContent}
                    >
                      <Text style={styles.uploadProofButtonText}>
                        Upload Proof
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.uploadProofNote}>
                      Once fully approved, the marketer will issue the final 50%
                      payment, completing the deal.
                    </Text>
                  </View>
                )}
            </View>
          ) : (
            /* Milestones tab */
            <View style={styles.milestonesContainer}>
              <View style={styles.milestonesHeader}>
                <Text style={styles.milestonesTitle}>Milestone Timeline</Text>
                {user?.userType === "Marketer" && (
                  <TouchableOpacity
                    style={styles.addMilestoneButton}
                    onPress={handleAddMilestonePress}
                  >
                    <Plus size={20} color="white" />
                    <Text style={styles.addMilestoneText}>Add Milestone</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.milestonesList}>
                {deal.milestones?.map((m: Milestone, idx: number) =>
                  renderMilestone(
                    m,
                    idx,
                    collapsedMilestones,
                    handleMilestoneCollapse,
                    user,
                    dealId as string,
                    router,
                    handleFundMilestone,
                    setSelectedMilestone,
                    setReviewStatus,
                    setReviewModalVisible,
                    handleMarkAsPosted,
                    handleResubmitWork,
                    handleEditMilestonePress,
                    handleDeleteMilestonePress,
                    setSelectedFile,
                    setShowFilePreview
                  )
                )}
              </View>
            </View>
          )}

          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[
                styles.messageButton,
                isWeb && isWideScreen && styles.webButton,
              ]}
              onPress={() => router.push("/messages")}
            >
              <Text style={styles.messageButtonText}>
                Message {user?.userType === "Marketer" ? "Creator" : "Marketer"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cancelDealButton,
                isWeb && isWideScreen && styles.webButton,
              ]}
              onPress={handleCancelDeal}
            >
              <Text style={styles.cancelDealButtonText}>Cancel Deal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Milestone Modal */}
      <Modal
        visible={isAddMilestoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMilestoneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMilestone ? "Edit Milestone" : "Add Milestone"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setAddMilestoneModalVisible(false)}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={milestoneForm.name}
                  onChangeText={(text) =>
                    setMilestoneForm({ ...milestoneForm, name: text })
                  }
                />
              </View>
              {/* <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount</Text>
                <CurrencyInput
                  value={milestoneForm.amount}
                  onValueChange={(value) => {
                    if (Number(value) > 500000) {
                      return;
                    }
                    setMilestoneForm({ ...milestoneForm, amount: value || "" });
                  }}
                  style={styles.formInput}
                  prefix="$"
                  min={100}
                  max={500000}
                  maxLength={6}
                  allowDecimals={true}
                  decimalScale={2}
                />
              </View> */}

              <ConfigurableCurrencyInput
                label="Amount"
                value={milestoneForm.amount || ""}
                minAmount={100}
                maxAmount={50000}
                onValueChange={(value) =>
                  setMilestoneForm({ ...milestoneForm, amount: value || "" })
                }
                errorMessage="Please enter an amount between $100 and $50,000"
              />

              <ConfigurableCurrencyInput
                label="Bonus"
                value={milestoneForm.bonus || ""}
                minAmount={5}
                maxAmount={5000}
                onValueChange={(value) =>
                  setMilestoneForm({ ...milestoneForm, bonus: value || "" })
                }
                errorMessage="Please enter an amount between $0 and $50,000"
              />

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date</Text>
                <DateInput
                  value={milestoneForm.dueDate}
                  onChange={(date: Date) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      dueDate: date || new Date(),
                    }))
                  }
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  multiline
                  numberOfLines={4}
                  value={milestoneForm.description}
                  onChangeText={(text) =>
                    setMilestoneForm({ ...milestoneForm, description: text })
                  }
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setAddMilestoneModalVisible(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleMilestoneSave}
                disabled={
                  isEditMilestone
                    ? editMilestoneMutation.isPending
                    : addMilestoneMutation.isPending
                }
              >
                {isEditMilestone ? (
                  editMilestoneMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalPrimaryButtonText}>
                      Save Changes
                    </Text>
                  )
                ) : addMilestoneMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>
                    Add Milestone
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal (Approve / Request Revision for milestone) */}
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
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                {/* <Text style={styles.formLabel}>
                  {reviewStatus === "approved"
                    ? "Feedback"
                    : "Revision Instructions"}
                </Text> */}
                {/* <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  multiline
                  numberOfLines={4}
                  value={reviewFeedback}
                  onChangeText={setReviewFeedback}
                  placeholder={
                    reviewStatus === "approved"
                      ? "Add final comments for the Creator..."
                      : "Explain what needs revising..."
                  }
                /> */}
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
                style={[styles.modalPrimaryButton]}
                onPress={handleReviewSubmission}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>
                    {reviewStatus === "approved"
                      ? "Approve & Release"
                      : "Request Revision"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stripe Payment Modal for milestone funding or final payment */}
      {showStripeCheckout && (
        <Modal
          visible={showStripeCheckout}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStripeCheckout(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <StripeCheckout
                amount={
                  currentMilestone?.amount ||
                  deal.paymentInfo?.paymentAmount * 0.5 ||
                  0
                }
                bonus={currentMilestone?.bonus || 0}
                processingFee={9}
                marketerId={user?._id}
                type={paymentType}
                dealId={dealId as string}
                milestoneId={currentMilestone?._id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* File Preview Modal */}
      <FilePreview
        visible={showFilePreview}
        file={selectedFile}
        onClose={() => {
          setShowFilePreview(false);
          setSelectedFile(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={deleteModalStyles.overlay}>
          <View style={deleteModalStyles.container}>
            <Text style={deleteModalStyles.title}>Confirm Deletion</Text>
            <Text style={deleteModalStyles.message}>
              Are you sure you want to delete this milestone? This action cannot
              be undone.
            </Text>
            <View style={deleteModalStyles.buttonContainer}>
              <Pressable
                style={[
                  deleteModalStyles.button,
                  deleteModalStyles.cancelButton,
                ]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={deleteModalStyles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  deleteModalStyles.button,
                  deleteModalStyles.confirmButton,
                ]}
                onPress={confirmDelete}
              >
                <Text style={deleteModalStyles.buttonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Revision Request Modal (for the entire offer) */}
      <Modal
        visible={showRevisionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRevisionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Revision</Text>
              <TouchableOpacity onPress={() => setShowRevisionModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.feedbackInput}
              placeholder="Explain what needs to be revised..."
              multiline
              value={revisionFeedback}
              onChangeText={setRevisionFeedback}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRevisionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  requestOfferContentRevisionMutation.mutate(revisionFeedback);
                  setShowRevisionModal(false);
                }}
                disabled={requestOfferContentRevisionMutation.isPending}
              >
                {requestOfferContentRevisionMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Feedback</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel deal prompt */}
      {showCancelConfirm && (
        <PromptModal
          visible={showCancelConfirm}
          title="Cancel Deal"
          message="Are you sure you want to cancel this deal? Please specify the reason:"
          onCancel={() => setShowCancelConfirm(false)}
          onSubmit={handlePromptSubmit}
          isProcessing={isProcessing}
        />
      )}

      {/* Proof Review Modal (final 50% is also triggered here if 'Approve') */}
      <ProofReviewModal
        visible={proofReviewModalVisible}
        onClose={() => {
          setProofReviewModalVisible(false);
          setSelectedProof(null);
        }}
        onSubmit={(status, feedback) => {
          if (selectedProof) {
            reviewProofMutation.mutate({
              proofId: selectedProof.id,
              status,
              feedback,
            });
          }
        }}
        isPending={reviewProofMutation.isPending}
        deal={deal}
        setPaymentType={setPaymentType}
        setShowStripeCheckout={setShowStripeCheckout}
        setShowReleaseFinalModal={setShowReleaseFinalModal}
      />

      {/* Confirm "Release First 50%" */}
      <Modal
        visible={showReleaseFirstModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReleaseFirstModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Release First 50%?</Text>
              <TouchableOpacity onPress={() => setShowReleaseFirstModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={{ marginBottom: 16 }}>
              Are you sure you want to release the first 50% escrow to the
              creator?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowReleaseFirstModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryButton]}
                onPress={handleConfirmReleaseFirst}
                disabled={releaseFirstHalfMutation.isPending}
              >
                {releaseFirstHalfMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>
                    Yes, Release
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm "Release Final 50%" */}
      {/* <Modal
        visible={showReleaseFinalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReleaseFinalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pay Final 50%?</Text>
              <TouchableOpacity onPress={() => setShowReleaseFinalModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={{ marginBottom: 16 }}>
              Once you pay the final half, the deal will be completed.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowReleaseFinalModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryButton]}
                onPress={handleConfirmReleaseFinal}
              >
                <Text style={styles.modalPrimaryButtonText}>Pay & Release</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> */}

      {isProcessing && <ActivityIndicator size="large" color="#430B92" />}
    </SafeAreaView>
    </>
  );
}

// ---------- ProofReviewModal component ----------
function ProofReviewModal({
  visible,
  onClose,
  onSubmit,
  isPending,
  setShowReleaseFinalModal,
  deal,
  setPaymentType,
  setShowStripeCheckout,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    status: "approved" | "revision_required",
    feedback: string
  ) => void;
  isPending: boolean;
  deal: any;
  setShowReleaseFinalModal: (b: boolean) => void;
  setPaymentType: (p: string) => void;
  setShowStripeCheckout: (b: boolean) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"approved" | "revision_required">(
    "approved"
  );

  const handleSubmit = () => {
    /* ---------------------------------------------------------
      *  Block final 50 % until the first-half escrow is released
      * --------------------------------------------------------- */
     const firstHalfReleased =
       deal?.paymentInfo?.transactions?.some(
         (t: any) => t.type === "release_half"
       ) ?? false;
 
     if (status === "approved" && !firstHalfReleased) {
       Toast.show({
         type: "customNotification",
         text1: "Please release 50% first",
         text2:
           "Release the first half escrow before approving and paying the final amount.",
         position: "top",
         visibilityTime: 4000,
         topOffset: 50,
       });
       return; // ⟵ stop here – don’t open Stripe / approve
     }
 
     /* Require feedback when requesting revision */
     if (!feedback.trim() && status !== "approved") {
       Toast.show({
         type: "customNotification",
         text1: "Please add feedback",
         position: "top",
       });
       return;
     }

    if (status === "approved") {
      // This triggers Stripe for final 50%.
      // You can do the same approach as in "ProofReviewModal" => setPaymentType('finalPayment') => showStripeCheckout(true).
      setPaymentType("finalPayment");
      setShowStripeCheckout(true);
      setShowReleaseFinalModal(false);
      // TODO: Create Stripe session for the final payment
    } else {
      onSubmit(status, feedback);
    }

    setFeedback("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Proof</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.reviewActions}>
              <Text style={styles.switchLabel}>
                {status === "approved" ? "Approved" : "Revision Required"}
              </Text>
              <Switch
                value={status === "approved"}
                onValueChange={(value) =>
                  setStatus(value ? "approved" : "revision_required")
                }
                trackColor={{ false: "#f4f3f4", true: "#430B92" }}
                thumbColor={status === "approved" ? "#430B92" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Feedback section */}
          {status === "revision_required" && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{"Revision Instructions"}</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                multiline
                numberOfLines={4}
                value={feedback}
                onChangeText={setFeedback}
                placeholder={"Explain what needs revising..."}
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={onClose}
            >
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalPrimaryButton]}
              onPress={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalPrimaryButtonText}>
                  {status === "approved"
                    ? "Approve & Release"
                    : "Request Revision"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", marginHorizontal: "10%" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 16,
  },

  switchLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  dealContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editButton: {
    backgroundColor: "#430B92",
    padding: 10,
    borderRadius: 25,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    // marginHorizontal: "5%",
  },
  headerTitle: { fontSize: 24, fontWeight: "600", color: "#000" },
  placeholder: {},
  placeholderText: { fontSize: 16, fontWeight: "600" },

  scrollView: {
    flex: 1,
  },

  // Summary
  upworkSummaryContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  summaryItem: {
    minWidth: 110,
    flex: 1,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: "#6B7280", marginBottom: 2 },
  summaryValue: { fontSize: 20, color: "#000", fontWeight: "600" },
  summarySub: { fontSize: 12, color: "#888", marginTop: 2 },

  // Deal Card
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
    textTransform: "capitalize",
  },
  dealAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
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
    gap: 12,
    justifyContent: "space-between",
    width: "100%",
  },
  username: { fontSize: 16, color: "#430B92" },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#430B92"
  },
  statusText: { color: "#FFFFFF", fontSize: 12 },
  webContainer: {
    marginHorizontal: "5%",
    flex: 1,
  },
  // Release button
  releaseButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
    alignSelf: "flex-end",
  },
  releaseButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  // Tabs
  tabs: {
    flexDirection: "row",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E2E2",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#430B92" },
  tabText: { fontSize: 16, color: "#6B7280" },
  activeTabText: { color: "#430B92", fontWeight: "600" },

  // Overview details
  detailsContainer: { gap: 24, marginBottom: 24 },
  detailSection: { gap: 8 },
  sectionLabel: { fontSize: 20, color: "#000" },
  platformIcons: { flexDirection: "row", gap: 8 },
  platformIcon: {
    width: 35,
    height: 35,
    backgroundColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  platformIconImage: { width: 20, height: 20 },
  descriptionText: { fontSize: 14, color: "#6C6C6C", lineHeight: 20 },
  detailText: { fontSize: 14, color: "#6C6C6C" },
  feedbackContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#F9F5FF",
    borderRadius: 8,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  feedbackItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2D0FB",
  },
  feedbackText: { fontSize: 14, color: "#333333", marginBottom: 4 },
  feedbackDate: { fontSize: 12, color: "#6B7280" },

  // Proofs
  proofSubmissionsSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F9F5FF",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  proofSubmissionCard: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2D0FB",
  },
  proofHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  proofHeaderContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  proofDate: { fontSize: 14, color: "#6B7280" },
  reviewButton: {
    backgroundColor: "#430B92",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  reviewButtonText: { color: "#FFF", fontSize: 14, fontWeight: "500" },
  attachmentsContainer: { marginTop: 12 },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    marginBottom: 8,
  },
  attachmentName: { marginLeft: 8, color: "#430B92", fontSize: 14 },
  textContent: { fontSize: 14, color: "#333" },
  feedbackSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2D0FB",
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },

  uploadProofSection: { marginTop: 24, gap: 12, alignItems: "center" },
  uploadProofButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "30%",
  },
  uploadProofButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "500" },
  uploadProofNote: { fontSize: 12, color: "#6B7280", fontStyle: "italic" },

  // Milestones tab
  milestonesContainer: { gap: 24 },
  milestonesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  milestonesTitle: { fontSize: 20, fontWeight: "600", color: "#000000" },
  addMilestoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#430B92",
  },
  addMilestoneText: { color: "white", fontSize: 14, fontWeight: "500" },
  milestonesList: { gap: 16, marginBottom: 24 },

  // Single milestone item
  milestoneItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    overflow: "hidden",
    marginBottom: 20,
    elevation: 2,
  },
  dropDown: {
    position: "absolute",
    top: 40, // adjust accordingly if needed
    right: 160, // adjust based on your layout (or use left if you need)
    width: 140,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 8,
    paddingVertical: 6,
    // Add shadow for iOS    shadowRadius: 3.84,
    // Add elevation for Android
    elevation: 80,
    zIndex: 10999, // set a high zIndex so it overlays other components
  },
  dropDownItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dropDownItemText: {
    fontSize: 14,
    color: "#000",
  },
  
  businessBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#430B92",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight:10,
  },
  businessText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  milestoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  milestoneInfo: { flex: 1 },
  milestoneName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  milestoneAmount: { fontSize: 14, color: "#430B92", fontWeight: "500" },
  milestoneDueDate: { fontSize: 12, color: "#6B7280" },
  milestoneStatus: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginLeft: 8,
    backgroundColor: "#430B92",
  },
  milestoneStatusText: { color: "#FFFFFF", fontSize: 12, fontWeight: "500" },
  milestoneContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2D0FB",
  },
  revisionRequiredNotice: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  revisionRequiredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  revisionRequiredHeading: {
    color: "#D97706",
    fontWeight: "700",
    fontSize: 16,
  },
  deliverablesSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  deliverablesContainer: { gap: 12, marginBottom: 16 },
  deliverableItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  deliverableInfo: { flex: 1 },
  deliverableName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  deliverableActions: { flexDirection: "row", gap: 8 },
  deliverableAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#F0E7FD",
  },
  deliverableActionText: { fontSize: 12, color: "#430B92" },
  noContentText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 16,
  },

  feedbackTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: 8,
  },

  // Creator actions
  creatorActionsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2D0FB",
  },
  uploadContentButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    width: "30%",
    alignSelf: "center",
  },
  uploadContentButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  resubmitButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    width: "30%",
    alignSelf: "center",
  },
  resubmitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  // Marketer actions
  marketerActionsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2D0FB",
  },
  reviewActions: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 16,
    justifyContent: "space-around",
  },
  approveButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "30%",
    alignSelf: "center",
  },
  approveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  revisionButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "30%",
    alignSelf: "center",
  },
  revisionButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  fundButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    width: "30%",
    alignSelf: "center",
  },
  fundButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  markPostedButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  markPostedButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  milestoneManageRow: { flexDirection: "row", gap: 16, marginTop: 12 },
  editMilestoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#F0E7FD",
  },
  editMilestoneText: { color: "#430B92", fontSize: 14, fontWeight: "500" },
  deleteMilestoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  deleteMilestoneText: { color: "#EF4444", fontSize: 14, fontWeight: "500" },

  // Bottom Buttons
  messageButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  messageButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "500" },
  cancelDealButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF0000",
    height: 58,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelDealButtonText: { color: "#FF0000", fontSize: 18, fontWeight: "500" },
  webButton: { width: "30%" },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "30%",

    height: "80%",
    maxHeight: 650,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    width: "30%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "600", color: "#000" },
  modalCloseButton: { padding: 4 },
  modalForm: { gap: 16 },
  formGroup: { gap: 8 },
  formLabel: { fontSize: 14, color: "#6B7280" },
  formInput: {
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderStyle: "solid",
    height: 58,
  },
  formTextArea: { height: 100, textAlignVertical: "top" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  modalSecondaryButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  modalSecondaryButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  modalPrimaryButton: {
    backgroundColor: "#430B92",
    padding: 12,
    borderRadius: 8,
  },
  modalPrimaryButtonText: { color: "#FFF", fontSize: 14, fontWeight: "500" },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 12,
    height: 48,
    width: "100%",
  },
  dateText: { fontSize: 14, color: "#000000" },
  feedbackInput: {
    height: 120,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  submitButton: {
    backgroundColor: "#430B92",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: { color: "#FFF", fontWeight: "500" },

  // Delete milestone modal
});

const deleteModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 1280,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 16,
  },
  message: { fontSize: 16, color: "#666666", marginBottom: 24 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#F0F0F0" },
  confirmButton: { backgroundColor: "#FF3B30" },
  buttonText: { fontSize: 16, fontWeight: "500", color: "#FFFFFF" },
});
