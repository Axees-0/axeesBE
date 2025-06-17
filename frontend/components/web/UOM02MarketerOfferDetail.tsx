import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Check } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import ProfileInfo from "../ProfileInfo";
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";
const DRAFT_API_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/drafts";

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

export default function MarketerOfferDetail({ id }: { id: string }) {
  const window = useWindowDimensions();
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isReviewDatePickerVisible, setReviewDatePickerVisible] =
    useState(false);
  const [isPostDatePickerVisible, setPostDatePickerVisible] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    desiredReviewDate: new Date(),
    desiredPostDate: new Date(),
    amount: "",
    notes: "",
    selectedPlatforms: [] as string[],
    status: "",
  });
  const { user } = useAuth();

  // Add state for file attachments
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch offer details
  const { data: offer, isLoading } = useQuery({
    queryKey: ["offer", id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Use useEffect instead of onSuccess
  useEffect(() => {
    if (offer) {
      setFormData({
        description: offer.description || "",
        desiredReviewDate: new Date(offer.desiredReviewDate) || new Date(),
        desiredPostDate: new Date(offer.desiredPostDate) || new Date(),
        amount: offer.proposedAmount?.toString() || "",
        notes: offer.notes || "",
        selectedPlatforms: offer.deliverables || [],
        status: offer.status || "",
      });
    }
  }, [offer]);

  // Update offer mutation
  const updateOfferMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      Toast.show({
        type: "customNotification",
        text1: "Draft Saved",
        text2: "Your draft has been successfully saved.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "customNotification",
        text1: "Save Failed",
        text2: error?.message || "Something went wrong saving the draft.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
  });

  // Updated Send offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Use FormData for sending just like drafts
      const response = await axios.post(`${API_URL}/${id}/send`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      Toast.show({
        type: "customNotification",
        text1: "Offer Sent",
        text2: "Your offer was sent successfully!",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "customNotification",
        text1: "Send Failed",
        text2: error?.message || "Something went wrong sending the offer.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${DRAFT_API_URL}/save`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      Toast.show({
        type: "customNotification",
        text1: "Draft Saved",
        text2: "Your draft has been successfully saved.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "customNotification",
        text1: "Save Failed",
        text2: error?.message || "Something went wrong saving the draft.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
  });

  const handleSaveDraft = async () => {
    if (!isTermsAgreed) {
      Toast.show({
        type: "customNotification",
        text1: "Agreement Required",
        text2: "Please agree to the terms first",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      return;
    }

    // Create FormData object
    const draftData = new FormData();
    draftData.append("userId", user?.id);
    draftData.append("description", formData.description);
    draftData.append(
      "desiredReviewDate",
      formData.desiredReviewDate.toISOString()
    );
    draftData.append("desiredPostDate", formData.desiredPostDate.toISOString());
    draftData.append("amount", formData.amount);
    draftData.append("notes", formData.notes);
    draftData.append(
      "deliverables",
      JSON.stringify(formData.selectedPlatforms)
    );
    draftData.append("offerType", "custom");
    draftData.append("offerName", "My Offer");

    // Append each file to FormData
    attachments.forEach((file, index) => {
      console.log("File:", file);
      draftData.append("attachments", file);
    });

    await saveDraftMutation.mutateAsync(draftData);
  };

  // Updated handleSendOffer function
  const handleSendOffer = async () => {
    if (!isTermsAgreed) {
      Toast.show({
        type: "customNotification",
        text1: "Agreement Required",
        text2: "Please agree to the terms first",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      return;
    }

    // Create FormData exactly like in handleSaveDraft
    const offerData = new FormData();

    // Same field naming convention as in draft
    offerData.append("userId", user?.id);
    offerData.append("description", formData.description);
    offerData.append("reviewDate", formData.desiredReviewDate.toISOString());
    offerData.append("postDate", formData.desiredPostDate.toISOString());
    offerData.append("amount", formData.amount);
    offerData.append("notes", formData.notes);
    offerData.append(
      "deliverables",
      JSON.stringify(formData.selectedPlatforms)
    );
    offerData.append("offerType", "custom");
    offerData.append("offerName", "My Offer");

    // If you have a draftId, include it
    if (id) {
      offerData.append("draftId", id);
    }

    // Add status for sent
    offerData.append("status", "Sent");

    // Add any other needed fields
    if (offer?.creatorId) {
      offerData.append("creatorId", offer.creatorId);
    }

    if (offer?.marketerId) {
      offerData.append("marketerId", offer.marketerId);
    }

    // Append each file to FormData
    attachments.forEach((file) => {
      offerData.append("attachments", file);
    });

    await sendOfferMutation.mutateAsync(offerData);
  };
  // Handle file changes
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Convert FileList to Array
      const fileArray = Array.from(files);
      setAttachments(fileArray);
    }
  };
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.content, isWideScreen && styles.wideContent]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>Back to offers list</Text>
            </TouchableOpacity>
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

          <View style={styles.offerHeader}>
            <Text style={styles.offerTitle}>Pre-made Reel Offer</Text>
            <Text style={styles.offerId}>#{id}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platforms</Text>
            <View style={styles.platformsGrid}>
              {["youtube", "instagram", "facebook", "tiktok", "twitter"].map(
                (platform) => (
                  <TouchableOpacity
                    key={platform}
                    onPress={() => {
                      const newPlatforms = formData.selectedPlatforms.includes(
                        platform
                      )
                        ? formData.selectedPlatforms.filter(
                            (p) => p !== platform
                          )
                        : [...formData.selectedPlatforms, platform];
                      setFormData({
                        ...formData,
                        selectedPlatforms: newPlatforms,
                      });
                    }}
                    style={[
                      styles.platformButton,
                      formData.selectedPlatforms.includes(platform) &&
                        styles.platformButtonActive,
                    ]}
                  >
                    <Image
                      source={getPlatformIcon(platform)}
                      style={styles.platformIcon}
                    />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Description Section */}
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

          {/* Date Sections */}
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
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setReviewDatePickerVisible(true)}
              >
                <Text style={styles.dateText}>
                  {formData.desiredReviewDate.toLocaleDateString()}
                </Text>
                <Calendar width={24} height={24} color="#430B92" />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, isWideScreen && styles.halfWidth]}>
              <Text style={styles.sectionTitle}>Desired Post Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setPostDatePickerVisible(true)}
              >
                <Text style={styles.dateText}>
                  {formData.desiredPostDate.toLocaleDateString()}
                </Text>
                <Calendar width={24} height={24} color="#430B92" />
              </TouchableOpacity>
            </View>
          </View>

          {/* File Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <TouchableOpacity
              style={styles.fileInputButton}
              onPress={() => {
                // Trigger the hidden file input
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              <Text style={styles.fileInputButtonText}>
                {attachments.length > 0
                  ? `${attachments.length} files selected`
                  : "Select Files"}
              </Text>
            </TouchableOpacity>
            <input
              type="file"
              multiple
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </View>

          {/* Rest of the sections... */}
          {/* Continue with the rest of your form sections following the same pattern */}

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

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.draftButton}
              onPress={handleSaveDraft}
              disabled={updateOfferMutation.isPending}
            >
              <Text style={styles.draftButtonText}>
                {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendOffer}
              disabled={sendOfferMutation.isPending}
            >
              <Text style={styles.sendButtonText}>
                {sendOfferMutation.isPending ? "Sending..." : "Send for $1"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={isReviewDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
          setFormData({ ...formData, desiredReviewDate: date });
          setReviewDatePickerVisible(false);
        }}
        onCancel={() => setReviewDatePickerVisible(false)}
      />

      <DateTimePickerModal
        isVisible={isPostDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
          setFormData({ ...formData, desiredPostDate: date });
          setPostDatePickerVisible(false);
        }}
        onCancel={() => setPostDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}

// Add a ref for the file input
const fileInputRef = React.createRef<HTMLInputElement>();

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
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  offerTitle: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  offerId: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
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
  platformIcon: {
    width: 20,
    height: 20,
  },
  textArea: {
    height: 127,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 16,
    textAlignVertical: "top",
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
  sendButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  fileInputButton: {
    backgroundColor: "#F0E7FD",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  fileInputButtonText: {
    color: "#430B92",
  },
});
