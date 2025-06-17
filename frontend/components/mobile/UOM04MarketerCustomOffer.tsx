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
  Pressable,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Upload, Check } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";

import DocumentPicker from "expo-document-picker";
import StripeCheckout from "../StripeCheckout";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "../ProfileInfo";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";

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

  const [selectedCreator, setSelectedCreator] = React.useState<any>(null);
  const { user } = useAuth();
  const { creatorId, marketerId, creatorName } = useLocalSearchParams();

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

  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/marketer/offers`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log("Offer created successfully", data);
      queryClient.invalidateQueries({ queryKey: ["marketerOffers"] });
      router.push("/UOM003MarketerSuccessMessage");
    },
    onError: (error) => {
      console.error("Failed to create offer", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating the offer."
      );
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["user", marketerId ? marketerId : creatorId],
    queryFn: async () => {
      const id = marketerId ? marketerId : creatorId;
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/${id}`
      );
      return response.data;
    },
    enabled: !!(marketerId || creatorId),
  });

  const connectedPlatforms =
    userData?.user?.marketerData?.platforms ||
    userData?.user?.creatorData?.platforms ||
    [];

  const isFormValid = () => {
    return (
      formData.offerName.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.amount.trim() !== "" &&
      formData.selectedPlatforms.length > 0 &&
      isTermsAgreed
    );
  };

  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    const formDataToSend = {
      marketerId: user?.userType === "Marketer" ? user?._id : marketerId,
      offerName: formData.offerName,
      creatorId: user?.userType === "Creator" ? user?._id : creatorId,
      description: formData.description,
      deliverables: formData.selectedPlatforms,
      desiredReviewDate: formData.desiredReviewDate,
      desiredPostDate: formData.desiredPostDate,
      proposedAmount: formData.amount,
      notes: formData.notes,
      attachments: selectedFiles,
      status: "Draft",
    };

    mutation.mutate(formDataToSend);
  };

  const handleSendOffer = () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields and agree to the terms");
      return;
    }
    setPaymentModalVisible(true);
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

  const handlePaymentSuccess = async (sessionId: string) => {
    setPaymentModalVisible(false);
  };

  const handlePaymentError = (errorMessage: string) => {
    setPaymentModalVisible(false);
  };

  const handlePaymentCancel = () => {
    setPaymentModalVisible(false);
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
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setIsTermsAgreed(!isTermsAgreed)}
          >
            <View
              style={[styles.checkbox, isTermsAgreed && styles.checkboxChecked]}
            >
              {isTermsAgreed && <Check width={16} height={16} color="white" />}
            </View>
            <Text style={styles.termsText}>
              By agreeing, we assume you have read the{" "}
              <Text style={styles.termsLink}>Transaction Terms</Text>
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.draftButton}
              onPress={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Text style={styles.draftButtonText}>
                {isSubmitting ? "Saving..." : "Save Draft"}
              </Text>
            </TouchableOpacity>

            <Pressable
              style={[
                styles.sendButton,
                isWeb && isWideScreen && styles.webSendButton,
              ]}
              onPress={handleSendOffer}
              disabled={isSubmitting}
            >
              <Text style={styles.sendButtonText}>
                {isSubmitting ? "Sending..." : "Send Offer"}
              </Text>
            </Pressable>
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
                offerId={""}
                creatorId={formData.creatorId as string}
                marketerId={formData.marketerId as string}
              />
            </View>
          </View>
        </Modal>
      )}
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
    textTransform: "capitalize",
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
  },
  draftButtonText: {
    fontSize: 16,
    color: "#430B92",
    fontWeight: "500",
  },
  sendButton: {
    flex: 1,
    height: 58,
    backgroundColor: "#430B92",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  webSendButton: {
    alignSelf: "center",
    width: "100%",
  },
  sendButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
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
    width: "90%",
    maxWidth: BREAKPOINTS.DESKTOP,
    height: "80%",
    maxHeight: 650,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
