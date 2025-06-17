import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Linking,
  Modal,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Upload, Check, ArrowLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import PaymentWebview from "../components/PaymentWebview";
import DocumentPicker from "expo-document-picker";
import StripeCheckout from "../components/StripeCheckout";
import { useAuth } from "@/contexts/AuthContext";
import TermsModal from "@/components/TermsModal";
import FilePreviewModal from "@/components/FilePreview";
import RNPickerSelect from "react-native-picker-select";
import CurrencyInput from "react-currency-input-field";
import * as FileSystem from "expo-file-system";
import Navbar from "../components/web/navbar";

// ---- NEW IMPORT FOR TOAST ----
import Toast from "react-native-toast-message";
import { Feather } from "@expo/vector-icons";
import CustomBackButton from "@/components/CustomBackButton";
import {
  cleanAndLimitToTwoDecimals,
  formatPrice,
  handlePriceInput,
  parsePrice,
} from "@/utils/formatPrice";
import ProfileInfo from "@/components/ProfileInfo";
import { FontFamily } from "@/GlobalStyles";
import useUploadProgress from "@/hooks/useUploadProgress";
import { ConfigurableCurrencyInput } from "@/components/CurrencyInput";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";
const API_URL_PLATFORMS = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/account";
const USER_API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/users";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

function getPlatformIcon(platform: string) {
  switch (platform?.toLowerCase()) {
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
const formatFollowerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count?.toString() || "0";
};

const platformOptions = [
  { label: "YouTube", value: "youtube" },
  { label: "TikTok", value: "tiktok" },
  { label: "Facebook", value: "facebook" },
  { label: "Twitter", value: "twitter" },
  { label: "Twitch", value: "twitch" },
  { label: "Other", value: "other" },
];
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});
const PLATFORMS = [
  { id: "youtube", icon: getPlatformIcon("youtube") },
  { id: "instagram", icon: getPlatformIcon("instagram") },
  { id: "twitter", icon: getPlatformIcon("twitter") },
  { id: "facebook", icon: getPlatformIcon("facebook") },
  { id: "tiktok", icon: getPlatformIcon("tiktok") },
  { id: "twitch", icon: getPlatformIcon("twitch") },
];
const validateHandle = (handle: string) => {
  const errors: string[] = [];

  if (handle.length < 3) {
    errors.push("At least 3 characters");
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_\.]*$/.test(handle)) {
    errors.push("Only letters, numbers, dots, and underscores");
    errors.push("Cannot start with a number");
  }

  if (handle.includes(" ")) {
    errors.push("No spaces allowed");
  }

  return errors;
};
const PlatformsModal = React.memo(
  ({
    visible,
    onClose,
    initialPlatforms = [],
  }: {
    visible: boolean;
    onClose: () => void;
    initialPlatforms: any[];
  }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [platforms, setPlatforms] = useState(initialPlatforms);
    const [showOtherPlatform, setShowOtherPlatform] = useState(false);

    // New platform form state
    const [newPlatform, setNewPlatform] = useState({
      platform: "",
      customPlatform: "",
      handle: "",
      followersCount: "",
    });

    // Reset platforms when modal opens with new data
    useEffect(() => {
      setPlatforms(initialPlatforms);
    }, [initialPlatforms]);

    const [handleErrors, setHandleErrors] = useState<string[]>([]);

    const addPlatformMutation = useMutation({
      mutationFn: async (data: {
        platform: string;
        handle: string;
        followersCount: number;
      }) => {
        const response = await axios.post(
          `${API_URL_PLATFORMS}/${"creator"}/${user?._id}/social-handles`,
          data
        );
        return response.data;
      },
      onSuccess: () => {
        // Invalidate the query that fetches connected platforms
        queryClient.invalidateQueries({ queryKey: ["user", user?._id] });
        Toast.show({
          type: "customNotification",
          text1: "Success",
          text2: "Platform added successfully",
          position: "top",
          autoHide: true,
          visibilityTime: 3000,
          topOffset: 50,
        });
      },
    });

    const deletePlatformMutation = useMutation({
      mutationFn: async (handleId: string) => {
        const response = await axios.delete(
          `${API_URL_PLATFORMS}/${"creator"}/${
            user?._id
          }/social-handles/${handleId}`
        );
        return response.data;
      },
      onSuccess: () => {
        // Invalidate the connected platforms query after deletion
        queryClient.invalidateQueries({ queryKey: ["user", user?._id] });
        Toast.show({
          type: "customNotification",
          text1: "Success",
          text2: "Platform deleted successfully",
          position: "top",
          autoHide: true,
          visibilityTime: 3000,
          topOffset: 50,
        });
      },
    });

    const handleAddPlatform = async () => {
      const platform =
        newPlatform.platform === "other"
          ? newPlatform.customPlatform
          : newPlatform.platform;

      const errors = validateHandle(newPlatform.handle);
      if (errors.length > 0) {
        setHandleErrors(errors);

        return;
      }

      if (!platform || !newPlatform.handle || !newPlatform.followersCount) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please fill all fields",
        });
        return;
      }

      try {
        await addPlatformMutation.mutateAsync({
          platform,
          handle: newPlatform.handle,
          followersCount: parseInt(newPlatform.followersCount),
        });

        setNewPlatform({
          platform: "",
          customPlatform: "",
          handle: "",
          followersCount: "",
        });
        setShowOtherPlatform(false);
        Toast.show({
          type: "customNotification",
          text1: "Success",
          text2: "Platform added successfully",
          position: "top",
          autoHide: true,
          visibilityTime: 3000,
          topOffset: 50,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to add platform",
        });
      }
    };

    const handleDeletePlatform = async (platformId: string) => {
      try {
        await deletePlatformMutation.mutateAsync(platformId);
        setPlatforms((prev: any) =>
          prev.filter((p: any) => p._id !== platformId)
        );
        Toast.show({
          type: "customNotification",
          text1: "Success",
          text2: "Platform deleted successfully",
          position: "top",
          autoHide: true,
          visibilityTime: 3000,
          topOffset: 50,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to delete platform",
        });
      }
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.platformModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Platforms</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#000" />
              </Pressable>
            </View>

            {/* Add New Platform Form */}
            <View style={styles.platformForm}>
              <Text style={styles.formSectionTitle}>Add New Platform</Text>
              <View style={styles.platformInputRow}>
                <View style={styles.platformSelectContainer}>
                  {Platform.OS === "web" ? (
                    <select
                      value={newPlatform.platform}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPlatform((prev) => ({
                          ...prev,
                          platform: value,
                        }));
                        setShowOtherPlatform(value === "other");
                      }}
                      style={styles.webSelect}
                    >
                      <option value="">Select Platform</option>
                      {platformOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <RNPickerSelect
                      value={newPlatform.platform}
                      onValueChange={(value: string) => {
                        setNewPlatform((prev) => ({
                          ...prev,
                          platform: value,
                        }));
                        setShowOtherPlatform(value === "other");
                      }}
                      items={platformOptions}
                      style={pickerSelectStyles}
                    />
                  )}
                </View>

                {showOtherPlatform && (
                  <TextInput
                    style={[styles.input, styles.platformInput]}
                    value={newPlatform.customPlatform}
                    onChangeText={(text) =>
                      setNewPlatform((prev) => ({
                        ...prev,
                        customPlatform: text,
                      }))
                    }
                    placeholder="Platform name"
                  />
                )}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.platformInput,
                      handleErrors.length > 0 && { borderColor: "red" },
                    ]}
                    value={newPlatform.handle}
                    onChangeText={(text) => {
                      setNewPlatform((prev) => ({ ...prev, handle: text }));
                      setHandleErrors(validateHandle(text));
                    }}
                    placeholder="@username"
                  />
                  {handleErrors.length > 0 && (
                    <Text style={[styles.errorText]}>{handleErrors[0]}</Text>
                  )}
                </View>

                <TextInput
                  style={[styles.input, styles.platformInput]}
                  value={newPlatform.followersCount}
                  onChangeText={(text) =>
                    setNewPlatform((prev) => ({
                      ...prev,
                      followersCount: text.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="Followers"
                  keyboardType="numeric"
                />

                <Pressable
                  style={[
                    styles.addPlatformButton,
                    {
                      opacity:
                        !newPlatform.platform ||
                        !newPlatform.handle ||
                        !newPlatform.followersCount ||
                        addPlatformMutation.isPending
                          ? 0.5
                          : 1,
                    },
                  ]}
                  onPress={handleAddPlatform}
                  disabled={
                    !newPlatform.platform ||
                    !newPlatform.handle ||
                    !newPlatform.followersCount ||
                    addPlatformMutation.isPending
                  }
                >
                  <Feather name="plus" size={20} color="#FFF" />
                </Pressable>
              </View>
            </View>

            {/* Platform List */}
            <View style={styles.platformList}>
              <Text style={styles.sectionTitle}>Current Platforms</Text>
              {platforms.map((platform) => (
                <View key={platform._id} style={styles.platformItem}>
                  <View style={styles.platformInfo}>
                    <Image
                      source={getPlatformIcon(platform.platform)}
                      style={styles.platformIcon}
                      contentFit="contain"
                    />
                    <Text style={styles.platformHandle}>{platform.handle}</Text>
                    <Text style={styles.platformFollowers}>
                      {formatFollowerCount(platform.followersCount)}
                    </Text>
                  </View>
                  <View style={styles.platformActions}>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeletePlatform(platform._id)}
                    >
                      <Feather name="trash-2" size={20} color="#FF0000" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

export default function MarketerOfferDetail() {
  const windowSize = useWindowDimensions();
  const isWideScreen = windowSize.width >= BREAKPOINTS.TABLET;
  const isMobile = windowSize.width < BREAKPOINTS.TABLET;
  const isWeb = Platform.OS === "web";

  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  // Grab any params from the URL (e.g., id=... if editing an existing offer)
  const {
    offerId: id,
    offerName,
    creatorId,
    draftId,
    type,
    marketerId,
  } = useLocalSearchParams();

  // Basic local states
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [offerType, setOfferType] = useState(
    (typeof offerName === "string" && offerName.toLowerCase()) || "custom"
  );
  const [validationErrors, setValidationErrors] = useState({
    platforms: false,
    description: false,
    amount: false,
    terms: false,
  });

  const { user } = useAuth();

  // The main form state
  const [formData, setFormData] = useState({
    description: "",
    reviewDate: new Date(),
    postDate: new Date(),
    amount: "",
    draftId: draftId || "",
    attachments: [] as any[],
    notes: "",
    offerType: offerName || "custom",
    selectedPlatforms: [] as string[],
    offerName: offerName || "",
    creatorId: creatorId || "",
    marketerId: marketerId || user?._id,
    role: "Marketer",
    status: "Draft",
  });

  // Add query to fetch draft data if draftId exists
  const { data: draftData, isLoading: isDraftLoading } = useQuery({
    queryKey: ["draft", draftId],
    queryFn: async () => {
      if (!draftId) return null;
      const response = await axios.get(`${API_URL}/drafts/${draftId}`);
      return response.data.draft;
    },
    enabled: !!draftId,
  });

  // Effect to handle loading draft data
  useEffect(() => {
    if (draftData) {
      setFormData((prev) => ({
        ...prev,
        description: draftData.description || "",
        reviewDate: draftData.reviewDate
          ? new Date(draftData.reviewDate)
          : new Date(),
        postDate: draftData.postDate
          ? new Date(draftData.postDate)
          : new Date(),
        amount: draftData.amount?.toString() || "",
        notes: draftData.notes || "",
        selectedPlatforms: draftData.deliverables || [],
        offerName: draftData.offerName || "",
        attachments: draftData.attachments || [],
        offerType: draftData.offerType || "custom",
        status: "Draft",
        creatorId: draftData.creatorId || "",
      }));
      setOfferType(draftData.offerType || "custom");

      // Set selected files if any
      if (draftData.attachments?.length > 0) {
        setSelectedFiles(draftData.attachments);
      }
    }
  }, [draftData]);

  // Fetch existing offer if there's an id
  const {
    data: existingOffer,
    isLoading: isOfferLoading,
    refetch,
  } = useQuery({
    queryKey: ["offer", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data.offer;
    },
    enabled: !!id && type !== "draft", // only fetch if there's an 'id'
  });

  // Add this query to fetch user data
  //

  const { data: userData } = useQuery({
    queryKey: ["user", marketerId],
    queryFn: async () => {
      const response = await axios.get(`${USER_API_URL}/${user?._id}`);
      return response.data;
    },
    enabled: !!user?._id,
  });

  // Get connected platforms from user data
  const connectedPlatforms = userData?.user?.marketerData?.platforms || [];

  // Whenever we get the existing offer, populate the form
  // Modify useEffect to handle offer type when loading draft
  useEffect(() => {
    if (existingOffer) {
      setFormData((prev) => ({
        ...prev,
        description: existingOffer.description || "",
        reviewDate: existingOffer.reviewDate
          ? new Date(existingOffer.reviewDate)
          : new Date(),
        postDate: existingOffer.postDate
          ? new Date(existingOffer.postDate)
          : new Date(),
        amount: existingOffer.proposedAmount?.toString() || "",
        notes: existingOffer.notes || "",
        selectedPlatforms: existingOffer.deliverables || [],
        offerName: existingOffer.offerName || "",
        offerType: existingOffer.offerType || "custom",
        creatorId: existingOffer.creatorId || "",
        marketerId: existingOffer.marketerId || "",
        status: existingOffer.status || "Draft",
      }));
      setOfferType(existingOffer.offerType || "custom");
    }
  }, [existingOffer]);

  // Check if the offer is "Sent" => we disallow edits
  const isSent = existingOffer?.status === "Sent";

  const isDraft = existingOffer?.status === "Draft" || !existingOffer;
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    fileUrl: string;
    fileName?: string;
    fileType?: string;
  } | null>(null);

  const handleFilePress = (file: any) => {
    if (file.fileUrl) {
      setPreviewFile(file);
    } else {
      const fileUrl = URL.createObjectURL(file);
      setPreviewFile({
        fileUrl,
        fileName: file.fileName || file.name,
        fileType: file.mimeType || file.type,
      });
    }
    setShowFilePreviewModal(true);
  };

  // Split validation logic from state updates
  const validateForm = () => {
    if (isSent)
      return {
        isValid: false,
        errors: {
          platforms: false,
          description: false,
          amount: false,
          terms: false,
        },
      };

    const errors = {
      platforms: formData.selectedPlatforms.length === 0,
      description: formData.description.trim() === "",
      amount:
        formData.amount === "" ||
        Number(formData.amount) < 100 ||
        Number(formData.amount) > 500000,
      terms: !isTermsAgreed,
    };

    return {
      isValid: !Object.values(errors).some((error) => error),
      errors,
    };
  };
  const { uploadProgress, totalSize, calculateProgress } = useUploadProgress();

  // Modified saveDraftMutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const formDataToSend = new FormData();

      // Validate file count
      if (selectedFiles.length > 10) {
        throw new Error("Maximum 10 files allowed");
      }

      // Process files with accurate size
      const fileSizes = await Promise.all(
        selectedFiles.map(async (file) => {
          let size = file.size || 0;
          if (!isWeb && file.uri) {
            const fileInfo = await FileSystem.getInfoAsync(file.uri);
            size = fileInfo.size || 0;
          }

          formDataToSend.append(
            "attachments",
            isWeb
              ? file
              : {
                  uri: file.uri,
                  name: file.name,
                  type: file.mimeType,
                }
          );

          return size;
        })
      );

      totalSize.current = fileSizes.reduce((sum, size) => sum + size, 0);

      // Add other fields...
      formDataToSend.append("description", formData.description);
      formDataToSend.append("notes", formData.notes);
      formDataToSend.append("amount", formData.amount.toString());
      formDataToSend.append("reviewDate", formData.reviewDate.toISOString());
      formDataToSend.append("postDate", formData.postDate.toISOString());
      formDataToSend.append(
        "deliverables",
        JSON.stringify(formData.selectedPlatforms)
      );
      formDataToSend.append("offerName", String(formData.offerName));
      formDataToSend.append("offerType", String(formData.offerType));
      formDataToSend.append("userId", String(user?._id || ""));
      formDataToSend.append("creatorId", String(creatorId || ""));
      formDataToSend.append(
        "marketerId",
        String(marketerId || user?._id || "")
      );
      formDataToSend.append("offerId", String(id || ""));
      formDataToSend.append("draftType", "regular");

      // Dates
      formDataToSend.append(
        "desiredReviewDate",
        formData.reviewDate.toISOString()
      );
      formDataToSend.append("desiredPostDate", formData.postDate.toISOString());

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.loaded && progressEvent.total) {
            calculateProgress(progressEvent.loaded);
          }
        },
      };

      return draftId
        ? axios.put(`${API_URL}/drafts/${draftId}`, formDataToSend, config)
        : axios.post(`${API_URL}/drafts`, formDataToSend, config);
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Draft Saved",
        text2: "Your draft has been saved successfully.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error) => {
      console.error("Error saving draft:", error);
      Toast.show({
        type: "customNotification",
        text1: "Save Draft Failed",
        text2: error.message || "Something went wrong saving your draft.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
  });

  // Modified mutation with proper progress
  const sendOfferMutation = useMutation({
    mutationFn: async () => {
      const formDataToSend = new FormData();

      // Validate file count
      if (selectedFiles.length > 10) {
        throw new Error("Maximum 10 files allowed");
      }

      // Process files with accurate size
      const fileSizes = await Promise.all(
        selectedFiles.map(async (file) => {
          if (file.fileUrl) {
            formDataToSend.append("existingAttachments", file.fileUrl);
            return 0;
          }

          let size = file.size || 0;
          if (!isWeb && file.uri) {
            const fileInfo = await FileSystem.getInfoAsync(file.uri);
            size = fileInfo.size || 0;
          }

          if (isWeb) {
            formDataToSend.append("attachments", file);
          } else {
            formDataToSend.append("attachments", {
              uri: file.uri,
              name: file.name,
              type: file.mimeType,
            });
          }

          return size;
        })
      );

      totalSize.current = fileSizes.reduce((sum, size) => sum + size, 0);

      // Add other fields...
      formDataToSend.append(
        "marketerId",
        String(marketerId || user?._id || "")
      );
      formDataToSend.append("creatorId", String(formData.creatorId || ""));
      formDataToSend.append(
        "offerName",
        String(formData.offerName || offerType || "")
      );
      formDataToSend.append(
        "offerType",
        String(formData.offerType || "custom")
      );
      formDataToSend.append(
        "deliverables",
        JSON.stringify(formData.selectedPlatforms)
      );
      formDataToSend.append("description", String(formData.description || ""));
      formDataToSend.append("amount", formData.amount.toString());
      formDataToSend.append("notes", formData.notes);
      formDataToSend.append("status", "Sent");
      formDataToSend.append("draftId", String(draftId || ""));

      // Dates
      formDataToSend.append(
        "desiredReviewDate",
        formData.reviewDate.toISOString()
      );
      formDataToSend.append("desiredPostDate", formData.postDate.toISOString());

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.loaded && progressEvent.total) {
            calculateProgress(progressEvent.loaded);
          }
        },
      };

      return axios.post(`${API_URL}`, formDataToSend, config);
    },
    onSuccess: (res) => {
      Toast.show({
        type: "customNotification",
        text1: "Offer Sent",
        text2: "Your offer has been sent successfully.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });

      // Fixed by accessing data property from the AxiosResponse
      const responseData = res.data || {};
      const offerData = responseData.offer || {};

      router.push({
        pathname: "/UOM003MarketerSuccessMessage",
        params: {
          creatorName: offerData.creatorName || "",
          creatorUserName: offerData.creatorUserName || "",
        },
      });
    },
    onError: (error) => {
      console.error("Error sending offer:", error);
      Toast.show({
        type: "customNotification",
        text1: "Send Failed",
        text2: error.message || "Something went wrong sending the offer.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
  });
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await axios.delete(`${API_URL}/${id}`);
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Offer Deleted",
        text2: "This offer has been deleted permanently.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error) => {
      console.error("Error deleting offer:", error);
      Toast.show({
        type: "customNotification",
        text1: "Delete Failed",
        text2: error.message || "Something went wrong deleting the offer.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
  });

  useEffect(() => {
    console.log("📝 formData changed →", formData);
  }, [formData]);

  // Update handleSendOffer to set validation errors
  const handleSendOffer = async () => {
    console.log("📬 submitting formData:", JSON.stringify(formData, null, 2));
    const { isValid, errors } = validateForm();
    setValidationErrors(errors);
    console.log(errors, isValid);
    if (!isValid) {
      return;
    }

    if (id) {
      await saveDraftMutation.mutateAsync();
    } else {
      setPaymentModalVisible(true);
    }
  };

  // put this near the top of your component, before the return
  const togglePlatform = (platformId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedPlatforms.includes(platformId);
      const selectedPlatforms = exists
        ? prev.selectedPlatforms.filter((p) => p !== platformId)
        : [...prev.selectedPlatforms, platformId];
      console.log("🔀 toggled", platformId, "→", selectedPlatforms);
      return { ...prev, selectedPlatforms };
    });
  };

  // handleSaveDraft
  const handleSaveDraft = async () => {
    if (isSent) return;
    await saveDraftMutation.mutateAsync();
  };

  // handleDelete
  const handleDelete = async () => {
    if (!id) return;

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Are you sure you want to delete this offer permanently?"
        )
      ) {
        await deleteMutation.mutateAsync();
      }
    } else {
      // On mobile, you might do Alert.alert, but let's do toast for consistency or do an alert.
      Toast.show({
        type: "customNotification",
        text1: "Delete Confirmation",
        text2: "To delete, please confirm on Web or do an Alert here on Mobile",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    }
  };

  // Payment flows remain the same, just replace error messages with Toast if you want
  const handlePaymentError = (errorMessage: string) => {
    setPaymentModalVisible(false);
    router.push({
      pathname: "/UOM003MarketerErrorMessage",
      params: { errorMessage },
    });
  };

  const handlePaymentSuccess = async (sessionId: string) => {
    setPaymentModalVisible(false);

    try {
      const response = await sendOfferMutation.mutateAsync();

      Toast.show({
        type: "customNotification",
        text1: "Offer Sent",
        text2: "Your payment succeeded and the offer was sent.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });

      // Fixed by accessing data property from the AxiosResponse
      const responseData = response.data || {};
      const offerData = responseData.offer || {};

      router.push({
        pathname: "/UOM003MarketerSuccessMessage",
        params: {
          creatorName: offerData.creatorName || "",
          creatorUserName: offerData.creatorUserName || "",
        },
      });
    } catch (error) {
      console.error("Error sending offer:", error);
      router.push({
        pathname: "/UOM003MarketerErrorMessage",
        params: {
          errorMessage:
            "Payment was successful, but we couldn't submit your offer. Please contact support.",
        },
      });
    }
  };

  const handlePaymentCancel = () => {
    setPaymentModalVisible(false);
  };

  // File pick logic
  const [error, setError] = useState<string | null>(null);

  const handleFilePick = async () => {
    try {
      if (selectedFiles.length >= 10) {
        setError("Maximum 10 files allowed");
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "image/gif",
        "image/jpeg",
        "image/png",
        "image/vnd.adobe.photoshop",
      ];
      const allowedExtensions = [
        ".pdf",
        ".gif",
        ".jpeg",
        ".jpg",
        ".png",
        ".psd",
      ];

      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true; // Enable multiple selection
        input.style.display = "none";
        input.accept = allowedTypes.concat(allowedExtensions).join(", ");
        input.max = "10";

        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files.length > 0) {
            const files = Array.from(target.files);

            // Validate all files
            const validFiles = files.filter((file) => {
              const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
              const isValidType =
                allowedTypes.includes(file.type) ||
                allowedExtensions.includes(ext);
              const isValidSize = file.size <= 10 * 1024 * 1024;

              return isValidType && isValidSize;
            });

            // Show error for invalid files
            if (validFiles.length !== files.length) {
              setError(
                "Some files were invalid (max 10MB, allowed types: PDF, GIF, JPEG, PNG, PSD)"
              );
            }

            // Add valid files to state
            const newFiles = validFiles.filter((file) => {
              if (selectedFiles.length + validFiles.length > 10) {
                setError("Cannot exceed 10 files total");
                return false;
              }
              return true;
            });
            setSelectedFiles((prev) => [...prev, ...newFiles]);
          }
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: allowedTypes,
          multiple: true, // Enable multiple selection
        });

        if (result.assets) {
          const validFiles = result.assets.filter(
            (file) => file.size && file.size <= 10 * 1024 * 1024
          );

          if (selectedFiles.length + validFiles.length > 10) {
            setError("Cannot exceed 10 files total");
            return;
          }

          setSelectedFiles((prev) => [...prev, ...validFiles]);
        }
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        setError("Error selecting files");
      }
    }
  };

  // Add this helper function
  const validateDates = (reviewDate: Date, postDate: Date) => {
    return postDate >= reviewDate;
  };

  // Update the DateInput component to include validation
  const DateInput = ({ value, onChange, minDate }: any) => {
    if (isWeb) {
      return (
        <DatePicker
          selected={value}
          onChange={onChange}
          dateFormat="dd MMM, yyyy"
          className="date-picker-input"
          minDate={minDate}
          popperClassName="datepicker-popper"
          portalId="datepicker-popper-container"
          disabled={isSent}
          customInput={
            <View
              style={{
                height: 58,
                borderWidth: 1,
                borderColor: "#E2D0FB",
                borderRadius: 8,
                paddingLeft: 16,
                paddingRight: 16,
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                backgroundColor: isSent ? "#f0f0f0" : "white",
              }}
            >
              <Text style={{ fontSize: 14, color: "#000000" }}>
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
    return (
      <TouchableOpacity
        style={[styles.dateInput, isSent && { backgroundColor: "#f0f0f0" }]}
        disabled={isSent}
        onPress={() => {}}
      >
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

  // Add this function to handle profile edit navigation
  const handleEditProfile = () => {
    setShowPlatformsModal(true);
  };

  // useEffect(() => {
  //   // Filter out any platforms that are no longer connected.
  //   const updatedSelected = formData.selectedPlatforms.filter((selected) =>
  //     connectedPlatforms.some(
  //       (cp) => cp.platform.toLowerCase() === selected.toLowerCase()
  //     )
  //   );

  //   if (updatedSelected.length !== formData.selectedPlatforms.length) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       selectedPlatforms: updatedSelected,
  //     }));
  //   }
  // }, [connectedPlatforms]);

  if (isOfferLoading && id) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Offer...</Text>
      </View>
    );
  }

  return (
    <>
      <Navbar
        pageTitle={
          id
            ? `Editing Offer #${id}`
            : offerType.toLowerCase() === "custom"
            ? "Create Custom Offer"
            : "Create Pre-made Offer"
        }
      />

      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={[styles.content, isWideScreen && styles.wideContent]}>
            {/* Header */}

            {/* Offer Name/Title */}
            {offerType.toLowerCase() === "custom" ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Custom Offer Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    isSent && { backgroundColor: "#f0f0f0" },
                  ]}
                  value={
                    typeof formData.offerName === "string"
                      ? formData.offerName
                      : String(formData.offerName)
                  }
                  editable={!isSent}
                  onChangeText={(text) =>
                    setFormData({ ...formData, offerName: text })
                  }
                  placeholder="Enter custom offer name"
                  placeholderTextColor="#6C6C6C"
                />
              </View>
            ) : (
              <View style={styles.offerHeader}>
                <Text style={styles.offerTitle}>
                  {formData.offerName || "Untitled Offer"}
                </Text>
                {id && <Text style={styles.offerId}>#{id}</Text>}
              </View>
            )}

            {/* Platforms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platforms</Text>

              <>
                <View style={styles.platformsGrid}>
                  {PLATFORMS.map((platform) => {
                    const isActive = formData.selectedPlatforms.includes(
                      platform.id
                    );
                    const isConnected = connectedPlatforms.some(
                      (p: any) =>
                        p.platform.toLowerCase() === platform.id.toLowerCase()
                    );

                    return (
                      <TouchableOpacity
                        key={platform.id}
                        onPress={() => togglePlatform(platform.id)}
                        style={[
                          styles.platformButton,
                          formData.selectedPlatforms.includes(platform.id) &&
                            styles.platformButtonActive,
                        ]}
                      >
                        <Image
                          source={platform.icon}
                          style={[
                            styles.platformIcon,
                            // !isConnected && { opacity: 0.5 },
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {validationErrors.platforms && (
                  <Text style={styles.errorText}>
                    Please select at least one platform
                  </Text>
                )}
              </>

              <Text style={styles.platformHintText}>
                You can only select platforms linked to your profile.
                <Text
                  style={styles.platformHintLink}
                  onPress={handleEditProfile}
                >
                  {" "}
                  Update your profile
                </Text>{" "}
                to add more platforms.
              </Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description/Instructions</Text>
              <TextInput
                style={[
                  styles.textArea,
                  validationErrors.description && styles.errorInput,
                  isSent && { backgroundColor: "#f0f0f0" },
                ]}
                multiline
                value={formData.description}
                editable={!isSent}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Write more instructions"
                placeholderTextColor="#6C6C6C"
              />
              {validationErrors.description && (
                <Text style={styles.errorText}>
                  Please provide a description
                </Text>
              )}
            </View>

            {/* Dates */}
            <View
              style={[
                styles.dateContainer,
                isWideScreen && styles.wideDateContainer,
              ]}
            >
              <View style={[styles.section, isWideScreen && styles.halfWidth]}>
                <Text style={styles.sectionTitle}>
                  Desired Content Review Date
                </Text>
                <DateInput
                  value={formData.reviewDate}
                  onChange={(date: Date) => {
                    setFormData((prev) => ({
                      ...prev,
                      reviewDate: date,
                      postDate: validateDates(date, prev.postDate)
                        ? prev.postDate
                        : date,
                    }));
                  }}
                  minDate={new Date()}
                />
              </View>

              <View style={[styles.section, isWideScreen && styles.halfWidth]}>
                <Text style={styles.sectionTitle}>Desired Post Date</Text>
                <DateInput
                  value={formData.postDate}
                  onChange={(date: Date) => {
                    if (validateDates(formData.reviewDate, date)) {
                      setFormData((prev) => ({ ...prev, postDate: date }));
                    } else {
                      Toast.show({
                        type: "customNotification",
                        text1: "Invalid Date",
                        text2: "Post date cannot be before review date",
                        position: "top",
                        autoHide: true,
                        visibilityTime: 3000,
                        topOffset: 50,
                      });
                    }
                  }}
                  minDate={formData.reviewDate}
                />
              </View>
            </View>

            {/* Amount */}
            {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Offer</Text> */}
            {/* <TextInput
              style={[
                styles.input,
                validationErrors.amount && styles.errorInput,
                isSent && { backgroundColor: "#f0f0f0" },
              ]}
              value={formData.amount}
              editable={!isSent}
              onChangeText={(text) => {
                setFormData({
                  ...formData,
                  amount: text.replace(/[^0-9.]/g, ""), // Allow only numbers and decimal point
                });
              }}
              placeholder="$"
              keyboardType="number-pad"
              inputMode="numeric"
              placeholderTextColor="#6C6C6C"
            /> */}

            {/* <CurrencyInput
              value={formData.amount}
              onValueChange={(value, name, values) => {
                // Use the raw value string from the callback for state
                // It should be just the numbers, e.g., "454" or "454.5"
                setFormData({ ...formData, amount: value || "" });
              }}
              onBlur={(event) => {
                // Get the current raw value from state (e.g., "454")
                const currentValue = formData.amount;

                if (
                  currentValue === null ||
                  currentValue === undefined ||
                  currentValue.trim() === ""
                ) {
                  // Don't format if it's empty
                  return;
                }

                // Clean any lingering formatting just in case (though value from onValueChange should be clean)
                const cleanedValue = currentValue.replace(/[,$]/g, "");
                const numberValue = parseFloat(cleanedValue);

                if (!isNaN(numberValue)) {
                  // Format the number to exactly 2 decimal places as a string
                  const formattedNumberString = numberValue.toFixed(2); // e.g., 454 -> "454.00", 45.6 -> "45.60"

                  // Only update the state if the formatting actually changes the raw string representation
                  if (cleanedValue !== formattedNumberString) {
                    // Update state with the raw number string including the decimals
                    setFormData({ ...formData, amount: formattedNumberString });
                  }
                }
              }}
              onKeyDown={(e) => {
                const cleanedValue = e.currentTarget.value.replace(/[,$]/g, ""); // Remove ',' and '$'
                if (
                  parseFloat(cleanedValue) > 500000 ||
                  parseFloat(cleanedValue) < 100
                ) {
                  setValidationErrors({
                    ...validationErrors,
                    amount: true,
                  });
                } else {
                  setValidationErrors({
                    ...validationErrors,
                    amount: false,
                  });
                }
              }}
              onKeyUp={(e) => {
                const cleanedValue = e.currentTarget.value.replace(/[,$]/g, ""); // Remove ',' and '$'
                if (
                  parseFloat(cleanedValue) > 500000 ||
                  parseFloat(cleanedValue) < 100
                ) {
                  setValidationErrors({
                    ...validationErrors,
                    amount: true,
                  });
                } else {
                  setValidationErrors({
                    ...validationErrors,
                    amount: false,
                  });
                }
              }}
              prefix="$"
              style={{
                height: 58,
                borderWidth: 1,
                borderColor: "#E2D0FB",
                borderRadius: 8,
                paddingLeft: 16,
                paddingRight: 16,
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
                borderStyle: "solid",
              }}
              intlConfig={{
                locale: "en-US",
                currency: "USD",
              }}
              maxLength={10}
              allowDecimals={true}
              // decimalScale={2} // Remove this prop
              decimalsLimit={2} // Keep this to limit typing decimals
            />
            {validationErrors.amount && (
              <Text style={styles.errorText}>
                Please enter an amount between $100 and $500,000
              </Text>
            )}
          </View> */}

            <ConfigurableCurrencyInput
              label="Your Offer"
              value={formData.amount}
              onValueChange={(value) =>
                setFormData({ ...formData, amount: value || "" })
              }
              error={validationErrors.amount}
              errorMessage="Please enter an amount between $100 and $500,000"
            />

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={[
                  styles.textArea,
                  isSent && { backgroundColor: "#f0f0f0" },
                ]}
                multiline
                value={formData.notes}
                editable={!isSent}
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
                placeholder="Any notes here"
                placeholderTextColor="#6C6C6C"
              />
            </View>

            {/* File Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Files</Text>
              <View style={[styles.uploadSection, isSent && { opacity: 0.5 }]}>
                <Upload width={24} height={24} color="#430B92" />
                <View style={styles.uploadContent}>
                  <Text style={styles.uploadTitle}>Attach Content</Text>
                  <Text style={styles.uploadSubtext}>
                    pdf, gif, jpeg, png, photoshop, adobe
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={isSent ? undefined : handleFilePick}
                  disabled={isSent}
                >
                  <Text style={styles.browseText}>Browse Files</Text>
                </TouchableOpacity>
              </View>
              {selectedFiles.map((file: any, index) => (
                <View key={index} style={styles.selectedFile}>
                  <TouchableOpacity
                    onPress={() => {
                      handleFilePress(file);
                    }}
                  >
                    <Text style={styles.fileName}>
                      {file.name || file.fileName || "No file name"}
                    </Text>
                  </TouchableOpacity>
                  {!isSent && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedFiles(
                          selectedFiles.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <Text style={styles.removeFile}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Progress Display */}
              {(sendOfferMutation.isPending || saveDraftMutation.isPending) &&
                selectedFiles.length > formData.attachments?.length && (
                  <View style={styles.progressContainer}>
                    <Text style={styles.uploadTitle}>
                      Uploading {selectedFiles.length} file(s) -{" "}
                      {uploadProgress}%
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${uploadProgress}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}

              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Terms */}
            {!isSent && (
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  onPress={() => setIsTermsAgreed(!isTermsAgreed)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isTermsAgreed && styles.checkboxChecked,
                      validationErrors.terms && { borderColor: "#FF0000" },
                    ]}
                  >
                    {isTermsAgreed && (
                      <Check width={16} height={16} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  By agreeing, we assume you have read the{" "}
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <Text style={styles.termsLink}>Transaction Terms</Text>
                  </TouchableOpacity>
                </Text>
                {validationErrors.terms && (
                  <Text style={styles.errorText}>
                    Please agree to the terms
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {(!id || isDraft) && (
                <TouchableOpacity
                  style={[styles.draftButton, isMobile && { width: "100%" }]}
                  onPress={handleSaveDraft}
                  disabled={sendOfferMutation.isPending}
                >
                  <Text style={styles.draftButtonText}>
                    {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                  </Text>
                </TouchableOpacity>
              )}
              {!isSent && (
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    sendOfferMutation.isPending && styles.sendButtonDisabled,
                    isMobile && { width: "100%" },
                  ]}
                  onPress={handleSendOffer}
                >
                  <Text
                    style={[
                      styles.sendButtonText,
                      sendOfferMutation.isPending &&
                        styles.sendButtonTextDisabled,
                    ]}
                  >
                    {sendOfferMutation.isPending ? "Sending..." : "Send for $1"}
                  </Text>
                </TouchableOpacity>
              )}
              {id && (
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    (isSent || deleteMutation.isPending) && { opacity: 0.7 },
                    isMobile && { width: "100%" },
                  ]}
                  onPress={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Text style={styles.deleteButtonText}>
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {isPaymentModalVisible && (
          <Modal
            visible={isPaymentModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setPaymentModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  isWideScreen && { width: "30%" },
                ]}
              >
                <StripeCheckout
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                  amount={formData.amount || 0}
                  offerId={id as string}
                  creatorId={formData.creatorId as string}
                  marketerId={formData.marketerId as string}
                />
              </View>
            </View>
          </Modal>
        )}

        <FilePreviewModal
          visible={showFilePreviewModal}
          file={previewFile}
          onClose={() => setShowFilePreviewModal(false)}
        />

        <PlatformsModal
          visible={showPlatformsModal}
          onClose={() => setShowPlatformsModal(false)}
          initialPlatforms={connectedPlatforms}
        />

        <TermsModal
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholderText: { fontSize: 16, fontWeight: "600" },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  wideContent: {
    marginHorizontal: "15%",
  },
  webSelect: {
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    position: "relative",
    width: "100%",
  },
  header: {
    justifyContent: "space-between",
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  backLink: { color: "#430B92", fontSize: 16 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {},
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  modalText: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  platformModalContent: {
    maxHeight: "80%",
    width: "95%",
    maxWidth: 600,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 24,
    lineHeight: 24,
  },
  modalSubtext: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },

  offerTitle: { fontSize: 18, textTransform: "capitalize" },
  offerId: { fontSize: 18 },
  section: { marginBottom: 24, zIndex: -1 },
  sectionTitle: { fontSize: 16, color: "#6C6C6C", marginBottom: 8 },
  platformsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformButton: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0E7FD",
  },
  platformButtonActive: { backgroundColor: "#430a92" },
  platformButtonDisabled: { display: "none" },
  platformIcon: { width: 20, height: 20 },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#000000",
  },
  textArea: {
    height: 127,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 16,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#000000",
  },
  dateContainer: { marginBottom: 24 },
  wideDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  halfWidth: { flex: 1 },
  dateInput: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: -1,
  },
  dateText: { fontSize: 14, color: "#000000" },
  uploadSection: {
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  uploadContent: { alignItems: "center" },
  uploadTitle: { fontSize: 14, color: "#000000", textAlign: "center" },
  uploadSubtext: { fontSize: 12, color: "#6C6C6C", textAlign: "center" },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 4,
  },
  platformForm: {
    marginBottom: 20,
  },
  platformInputRow: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    marginTop: 8,
  },
  platformSelectContainer: {
    flex: 1,
    width: "100%",
  },
  platformInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 12,
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    position: "relative",
  },
  addPlatformButton: {
    backgroundColor: "#430B92",
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  platformList: {
    flex: 1,
  },
  platformItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    marginBottom: 8,
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  platformHandle: {
    flex: 1,
    fontSize: 16,
  },
  platformFollowers: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginRight: 12,
  },
  platformActions: {
    flexDirection: "row",
    gap: 8,
  },
  categoryForm: {
    marginBottom: 20,
  },
  categoryInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  categoryInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  addCategoryButton: {
    backgroundColor: "#430B92",
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 16,
  },
  removeCategoryButton: {
    padding: 4,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },

  browseText: { fontSize: 14, color: "#430B92" },
  selectedFile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    marginTop: 8,
    backgroundColor: "#F0E7FD",
    borderRadius: 4,
  },
  fileName: { fontSize: 14, color: "#000000" },
  removeFile: { fontSize: 14, color: "#430B92" },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#430B92", borderColor: "#430B92" },
  termsText: { flex: 1, fontSize: 14, color: "#000000" },
  termsLink: { color: "#430B92" },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 24,
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  draftButton: {
    minWidth: 100,
    height: 58,
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    width: "30%",
  },
  draftButtonText: {
    fontSize: 16,
    color: "#430B92",
    fontWeight: "500",
  },
  sendButton: {
    minWidth: 100,
    height: 58,
    backgroundColor: "#430B92",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    width: "30%",
  },
  sendButtonDisabled: { backgroundColor: "#E2D0FB" },
  sendButtonText: { fontSize: 16, color: "#FFFFFF", fontWeight: "500" },
  sendButtonTextDisabled: { color: "#FFFFFF", opacity: 0.7 },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#6C6C6C",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "30%",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#6C6C6C",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    height: "80%",
    maxHeight: 650,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  platformWarningContainer: {
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  platformWarningText: {
    color: "#E65100",
    fontSize: 14,
    marginBottom: 12,
  },
  updateProfileButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  updateProfileButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  platformHintText: {
    color: "#666666",
    fontSize: 12,
    marginTop: 8,
  },
  platformHintLink: {
    color: "#430B92",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 4,
  },
  errorInput: {
    borderColor: "#FF0000",
  },
  progressContainer: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginVertical: 16,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#430b92",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  fileCount: {
    marginTop: 8,
    fontFamily: FontFamily.inter,
    color: "#666",
    fontSize: 14,
  },
});
