import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Upload, Check } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import DocumentPicker from "expo-document-picker";
import StripeCheckout from "../StripeCheckout";
import PaymentModal from "../PaymentWebview";
import TermsModal from "../TermsModal";
import Toast from "react-native-toast-message";
import ProfileInfo from "../ProfileInfo";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";
const USER_API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/users";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

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

const PLATFORMS = [
  { id: "youtube", icon: getPlatformIcon("youtube") },
  { id: "instagram", icon: getPlatformIcon("instagram") },
  { id: "twitter", icon: getPlatformIcon("twitter") },
  { id: "facebook", icon: getPlatformIcon("facebook") },
  { id: "tiktok", icon: getPlatformIcon("tiktok") },
  { id: "twitch", icon: getPlatformIcon("twitch") },
];

export default function CustomOffer() {
  const window = useWindowDimensions();
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const isWeb = Platform.OS === "web";

  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const { creatorId, marketerId, creatorName, draftId } =
    useLocalSearchParams();
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    offerName: "",
    description: "",
    desiredReviewDate: new Date(),
    desiredPostDate: new Date(),
    amount: "",
    notes: "",
    selectedPlatforms: [] as string[],
    creatorId,
    marketerId,
    role: user?.userType === "Creator" ? "Creator" : "Marketer",
  });

  // Add query to fetch user data and connected platforms
  const { data: userData } = useQuery({
    queryKey: ["user", marketerId],
    queryFn: async () => {
      const response = await axios.get(`${USER_API_URL}/${marketerId}`);
      return response.data;
    },
    enabled: !!marketerId,
  });

  // Get connected platforms from user data
  const connectedPlatforms = userData?.user?.marketerData?.platforms || [];

  const isFormValid = () => {
    return (
      formData.offerName.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.amount.trim() !== "" &&
      formData.selectedPlatforms.length > 0 &&
      isTermsAgreed
    );
  };
  // Save Draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      // Build a new FormData object
      const formDataToSend = new FormData();

      // 1) Append each file to `attachments`
      selectedFiles.forEach((file) => {
        // If you're on web, `file` might be a raw File from <input type="file">
        // If you're on React Native, do something like:
        //   formDataToSend.append("attachments", {
        //     uri: file.uri,
        //     name: file.name || `draft-${Date.now()}.jpg`,
        //     type: file.mimeType || "image/jpeg"
        //   });
        formDataToSend.append("attachments", file);
      });

      // 2) Append text fields

      formDataToSend.append("description", formData.description);
      formDataToSend.append("notes", formData.notes);
      formDataToSend.append("counterAmount", formData.amount);
      formDataToSend.append(
        "counterReviewDate",
        formData.desiredReviewDate.toISOString()
      );
      formDataToSend.append(
        "counterPostDate",
        formData.desiredPostDate.toISOString()
      );
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
      formDataToSend.append("offerId", id ? String(id) : "");

      // 3) Make the request
      if (draftId) {
        // Update existing draft
        const response = await axios.put(
          `${API_URL}/drafts/${draftId}`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return response.data;
      } else {
        // Create new draft
        const draftResponse = await axios.post(
          `${API_URL}/drafts`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return draftResponse.data;
      }
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

  // Send Offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async () => {
      // Build a new FormData object
      const formDataToSend = new FormData();

      formDataToSend.append(
        "marketerId",
        String(marketerId || user?._id || "")
      );
      formDataToSend.append("userId", String(user?._id || ""));
      formDataToSend.append("creatorId", String(formData.creatorId || ""));
      formDataToSend.append("draftId", String(draftId || ""));
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
      formDataToSend.append(
        "desiredReviewDate",
        formData.desiredReviewDate.toISOString()
      );
      formDataToSend.append(
        "desiredPostDate",
        formData.desiredPostDate.toISOString()
      );
      formDataToSend.append("amount", formData.amount);
      formDataToSend.append("notes", formData.notes);
      formDataToSend.append("status", "Sent");

      selectedFiles.forEach((file) => {
        // If web: formDataToSend.append("attachments", file);
        // If RN: { uri, name, type }
        formDataToSend.append("attachments", file);
      });

      // If it’s an existing offer, PUT. Otherwise, POST
      if (id) {
        const response = await axios.put(`${API_URL}/${id}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      } else {
        const response = await axios.post(`${API_URL}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      }
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
      router.push({
        pathname: "/UOM003MarketerSuccessMessage",
        params: {
          creatorName: res?.creatorId?.userName || res?.offer?.creatorUserName,
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

  const handlePaymentSuccess = async (sessionId: string) => {
    setPaymentModalVisible(false);

    try {
      await createOfferMutation.mutateAsync();
    } catch (error) {
      console.error("Error sending offer:", error);
      // Navigate to error page if offer creation fails
      router.push({
        pathname: "/UOM003MarketerErrorMessage",
        params: {
          errorMessage:
            "Payment was successful, but we couldn't submit your offer. Please contact support.",
        },
      });
    }
  };
  const handleFilePick = async () => {
    try {
      if (isWeb) {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".pdf,.gif,.jpeg,.png,.psd";

        input.onchange = (e: any) => {
          const files = Array.from(e.target.files);
          setSelectedFiles(files);
        };

        input.click();
      } else {
        const results = await DocumentPicker.getDocumentAsync({
          type: ["*/*"],
        });
        setSelectedFiles(results.assets || []);
      }
    } catch (err) {
      console.log(err);
    }
  };
  // Add a payment error handler
  const handlePaymentError = (errorMessage: string) => {
    setPaymentModalVisible(false);

    // Navigate to error page
    router.push({
      pathname: "/UOM003MarketerErrorMessage",
      params: {
        errorMessage: errorMessage,
      },
    });
  };

  // Add a payment cancel handler
  const handlePaymentCancel = () => {
    setPaymentModalVisible(false);
  };

  const DateInput = ({ value, onChange, label }: any) => {
    if (isWeb) {
      return (
        <DatePicker
          selected={value}
          onChange={onChange}
          dateFormat="dd MMM, yyyy"
          className="date-picker-input"
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.content, isWideScreen && styles.wideContent]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>Back to offers list</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Custom Offer</Text>
            <TouchableOpacity
              style={styles.placeholder}
              onPress={() => {
                router.push("/profile");
              }}
            >
              <ProfileInfo />
            </TouchableOpacity>
          </View>

          {/* Offer Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offer Name</Text>
            <TextInput
              style={styles.input}
              value={formData.offerName}
              maxLength={100}
              onChangeText={(text) =>
                setFormData({ ...formData, offerName: text })
              }
              placeholder="Enter offer name"
              placeholderTextColor="#6C6C6C"
            />
          </View>

          {/* Platforms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platforms</Text>
            <View style={styles.platformsGrid}>
              {PLATFORMS.map((platform) => {
                const isConnected = connectedPlatforms.some(
                  (p: any) =>
                    p.platform.toLowerCase() === platform.id.toLowerCase()
                );
                return (
                  <TouchableOpacity
                    key={platform.id}
                    onPress={() => {
                      if (!isConnected) return;
                      const newPlatforms = formData.selectedPlatforms.includes(
                        platform.id
                      )
                        ? formData.selectedPlatforms.filter(
                            (p) => p !== platform.id
                          )
                        : [...formData.selectedPlatforms, platform.id];
                      setFormData({
                        ...formData,
                        selectedPlatforms: newPlatforms,
                      });
                    }}
                    style={[
                      styles.platformButton,
                      formData.selectedPlatforms.includes(platform.id) &&
                        styles.platformButtonActive,
                      !isConnected && styles.platformButtonDisabled,
                    ]}
                    disabled={!isConnected}
                  >
                    <Image
                      source={platform.icon}
                      style={[
                        styles.platformIcon,
                        !isConnected && styles.platformIconDisabled,
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description/Instructions</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Write more instructions"
              placeholderTextColor="#6C6C6C"
            />
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
                value={formData.desiredReviewDate}
                onChange={(date: Date) =>
                  setFormData({ ...formData, desiredReviewDate: date })
                }
              />
            </View>

            <View style={[styles.section, isWideScreen && styles.halfWidth]}>
              <Text style={styles.sectionTitle}>Desired Post Date</Text>
              <DateInput
                value={formData.desiredPostDate}
                onChange={(date: Date) =>
                  setFormData({ ...formData, desiredPostDate: date })
                }
              />
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Offer</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) =>
                setFormData({ ...formData, amount: text })
              }
              placeholder="$"
              keyboardType="numeric"
              placeholderTextColor="#6C6C6C"
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Any notes here"
              placeholderTextColor="#6C6C6C"
            />
          </View>

          {/* File Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Files</Text>
            <TouchableOpacity
              style={styles.uploadSection}
              onPress={handleFilePick}
            >
              <Upload width={24} height={24} color="#430B92" />
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>Attach Content</Text>
                <Text style={styles.uploadSubtext}>
                  pdf, gif, jpeg, png, photoshop, adobe
                </Text>
              </View>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={handleFilePick}
              >
                <Text style={styles.browseText}>Browse Files</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            {selectedFiles.map((file: any, index) => (
              <View key={index} style={styles.selectedFile}>
                <Text style={styles.fileName}>{file.name}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedFiles(
                      selectedFiles.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <Text style={styles.removeFile}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <TouchableOpacity onPress={() => setIsTermsAgreed(!isTermsAgreed)}>
              <View
                style={[
                  styles.checkbox,
                  isTermsAgreed && styles.checkboxChecked,
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
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.draftButton}
              onPress={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending}
            >
              <Text 
                style={styles.draftButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                !isFormValid() && styles.sendButtonDisabled,
              ]}
              onPress={() => {
                if (isFormValid()) {
                  setPaymentModalVisible(true);
                }
              }}
              disabled={!isFormValid() || sendOfferMutation.isPending}
            >
              <Text
                style={[
                  styles.sendButtonText,
                  !isFormValid() && styles.sendButtonTextDisabled,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {sendOfferMutation.isPending ? "Sending..." : "Send for $1"}
              </Text>
            </TouchableOpacity>
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
            <View style={styles.modalContainer}>
              <StripeCheckout
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
                amount={parseFloat(formData.amount) || 0}
                offerId={""} // If you have an offerId, pass it here
                creatorId={formData.creatorId as string}
                marketerId={formData.marketerId as string}
              />
            </View>
          </View>
        </Modal>
      )}

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "90%",
    maxWidth: BREAKPOINTS.DESKTOP,
    height: "80%",
    maxHeight: 650,
    borderRadius: 16,
    overflow: "hidden",    shadowRadius: 3.84,
    elevation: 5,
  },
  wideContent: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backLink: {
    color: "#430B92",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {},
  section: {
    marginBottom: 24,
    zIndex: -1,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  platformsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformButton: {
    width: 35,
    height: 35,
    borderWidth: 1,
    borderColor: "#F0E7FD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  platformButtonActive: {
    backgroundColor: "#F0E7FD",
  },
  platformButtonDisabled: {
    borderColor: "#E2E2E2",
    backgroundColor: "#F5F5F5",
    opacity: 0.5,
  },
  platformIcon: {
    width: 20,
    height: 20,
  },
  platformIconDisabled: {
    opacity: 0.5,
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
    backgroundColor: "#FFFFFF",
  },
  dateContainer: {
    marginBottom: 24,
  },
  wideDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  halfWidth: {
    flex: 1,
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
    backgroundColor: "#FFFFFF",
  },
  dateText: {
    fontSize: 14,
    color: "#000000",
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
    alignItems: "center",
  },
  uploadTitle: {
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#6C6C6C",
    textAlign: "center",
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 4,
  },
  browseText: {
    fontSize: 14,
    color: "#430B92",
  },
  selectedFile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    marginTop: 8,
    backgroundColor: "#F0E7FD",
    borderRadius: 4,
  },
  fileName: {
    fontSize: 14,
    color: "#000000",
  },
  removeFile: {
    fontSize: 14,
    color: "#430B92",
  },
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
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#430B92",
    borderColor: "#430B92",
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
  },
  termsLink: {
    color: "#430B92",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  draftButton: {
    flex: 1,
    height: 58,
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    minWidth: 120,
  },
  draftButtonText: {
    fontSize: 16,
    color: "#430B92",
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1,
  },
  sendButton: {
    flex: 1,
    height: 58,
    backgroundColor: "#430B92",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    minWidth: 120,
  },
  sendButtonDisabled: {
    backgroundColor: "#E2D0FB",
  },
  sendButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1,
  },
  sendButtonTextDisabled: {
    color: "#FFFFFF",
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
