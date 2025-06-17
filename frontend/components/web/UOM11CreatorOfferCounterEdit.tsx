import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Arrowleft02 from "../../assets/arrowleft02.svg";
import Calendar03 from "../../assets/calendar03.svg";
import Cloudupload from "../../assets/cloudupload.svg";
import Checkmarksquare01 from "../../assets/checkmarksquare01.svg";
import CustomBackButton from "@/components/CustomBackButton";
import { Calendar, Check, Upload } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import ProfileInfo from "../ProfileInfo";
import CurrencyInput from "react-currency-input-field";
import useUploadProgress from "@/hooks/useUploadProgress";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message";

import TermsModal from "../TermsModal";
import { ConfigurableCurrencyInput } from "../CurrencyInput";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function CreatorOfferCounterEdit() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobile = window.width < BREAKPOINTS.TABLET;
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const { offerId, draftId, type } = useLocalSearchParams();
  const { user } = useAuth();

  const [showTerms, setShowTerms] = useState(false);
  const { uploadProgress, totalSize, calculateProgress } = useUploadProgress();

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
      return response.data;
    },
    enabled: !!offerId && type !== "draft",
  });

  const { data: draftData, isLoading: draftLoading } = useQuery({
    queryKey: ["draft", draftId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/drafts/${draftId}`);
      return response.data;
    },
    enabled: !!draftId,
  });

  const offer = data?.offer;
  const draft = draftData?.draft;
  const latestCounter = offer?.counters?.[offer.counters.length - 1];

  // Determine the data source: latest counter or original offer
  const dataSource = type === "draft" ? draft : latestCounter || offer;

  const [formData, setFormData] = useState({
    offerName: dataSource?.offerName || "",
    description: dataSource?.description || "",
    counterReviewDate: dataSource?.counterReviewDate
      ? new Date(dataSource.counterReviewDate)
      : dataSource?.desiredReviewDate
      ? new Date(dataSource.desiredReviewDate)
      : draft?.reviewDate
      ? new Date(draft.reviewDate)
      : new Date(),
    counterPostDate: dataSource?.counterPostDate
      ? new Date(dataSource.counterPostDate)
      : dataSource?.desiredPostDate
      ? new Date(dataSource.desiredPostDate)
      : draft?.postDate
      ? new Date(draft.postDate)
      : new Date(),
    counterAmount: dataSource?.counterAmount
      ? dataSource.counterAmount.toString()
      : dataSource?.proposedAmount
      ? dataSource.proposedAmount.toString()
      : "",
    notes: dataSource?.notes || "",
    selectedPlatforms: dataSource?.deliverables || offer?.deliverables || [],
  });

  // Counter offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_URL}/${offerId}/counter`, {
        ...formData,
        creatorId: user?._id,
        counterBy: user?.userType,
      });
      return response.data;
    },
    onSuccess: () => {
      router.push("/UOM07MarketerOfferHistoryList");
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const formDataToSend = new FormData();

      // Calculate total size
      totalSize.current = selectedFiles.reduce((sum, file) => {
        return sum + (file.size || 0);
      }, 0);

      // Append files
      selectedFiles.forEach((file) => {
        if (Platform.OS === "web") {
          formDataToSend.append("attachments", file);
        } else {
          formDataToSend.append("attachments", {
            uri:
              Platform.OS === "ios"
                ? file.uri.replace("file://", "")
                : file.uri,
            name: file.name,
            type: file.mimeType || "application/octet-stream",
          });
        }
      });

      // Fix field names here:
      formDataToSend.append("description", formData.description);
      formDataToSend.append("notes", formData.notes);
      formDataToSend.append("amount", formData.counterAmount.toString());
      formDataToSend.append(
        "reviewDate",
        formData.counterReviewDate.toISOString()
      );
      formDataToSend.append("postDate", formData.counterPostDate.toISOString());
      formDataToSend.append(
        "deliverables",
        JSON.stringify(formData.selectedPlatforms)
      );
      formDataToSend.append("offerName", String(formData.offerName));
      formDataToSend.append("draftType", "Counter");
      formDataToSend.append(
        "offerType",
        String(offer?.offerType || draft?.offerType || "custom")
      );
      formDataToSend.append("userId", String(user?._id || ""));

      const creatorId = offer?.creatorId?._id;
      const marketerId = offer?.marketerId?._id;

      const id = offerId;
      const draftId = draft ? draft._id : offer?.draftId;

      formDataToSend.append("creatorId", String(creatorId || ""));
      formDataToSend.append(
        "marketerId",
        String(marketerId || user?._id || "")
      );
      formDataToSend.append("offerId", String(id || ""));
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.loaded && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            calculateProgress(progress);
          }
        },
      };

      if (draftId) {
        return axios.put(
          `${API_URL}/drafts/${draftId}`,
          formDataToSend,
          config
        );
      } else {
        return axios.post(`${API_URL}/drafts`, formDataToSend, config);
      }
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Draft saved successfully",
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
        text1: "Error",
        text2: "Failed to save draft",
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
      const response = await axios.delete(`${API_URL}/${offerId}`);
      return response.data;
    },
  });

  const handleSaveDraft = async () => {
    try {
      await saveDraftMutation.mutateAsync();
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      router.back();
    } catch (error) {
      console.error("Error deleting offer:", error);
    }
  };

  const handleSend = async () => {
    try {
      await counterOfferMutation.mutateAsync();
    } catch (error) {
      console.error("Error sending counter offer:", error);
    }
  };

  const handleFilePick = async () => {
    try {
      if (selectedFiles.length >= 10) {
        Toast.show({
          type: "error",
          text1: "Limit Exceeded",
          text2: "Maximum 10 files allowed",
        });
        return;
      }

      let files: any[] = [];

      if (isWeb) {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".pdf,.gif,.jpeg,.png,.psd";

        const fileSelected = new Promise<File[]>((resolve) => {
          input.onchange = (e) => {
            const selected = Array.from(
              (e.target as HTMLInputElement).files || []
            );
            resolve(selected.slice(0, 10 - selectedFiles.length));
          };
        });

        input.click();
        files = await fileSelected;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          multiple: true,
          type: ["*/*"],
        });
        files = result.assets?.slice(0, 10 - selectedFiles.length) || [];
      }

      if (files.length === 0) return;

      // Add file size validation
      const MAX_SIZE_MB = 10;
      const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

      const validFiles = await Promise.all(
        files.map(async (file) => {
          let size = file.size || 0;
          if (Platform.OS !== "web" && file.uri) {
            const fileInfo = await FileSystem.getInfoAsync(file.uri);
            size = fileInfo.size || 0;
          }
          return size > MAX_BYTES ? null : file;
        })
      );

      const filteredFiles = validFiles.filter(Boolean);
      setSelectedFiles((prev) => [...prev, ...filteredFiles].slice(0, 10));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (draft) {
      setFormData({
        offerName: draft.offerName || "",
        description: draft.description || "",
        counterReviewDate: draft.counterReviewDate
          ? new Date(draft.counterReviewDate)
          : draft.desiredReviewDate
          ? new Date(draft.desiredReviewDate)
          : draft.reviewDate
          ? new Date(draft.reviewDate)
          : new Date(),
        counterPostDate: draft.counterPostDate
          ? new Date(draft.counterPostDate)
          : draft.desiredPostDate
          ? new Date(draft.desiredPostDate)
          : draft.postDate
          ? new Date(draft.postDate)
          : new Date(),
        counterAmount: draft.counterAmount
          ? draft.counterAmount.toString()
          : draft.amount
          ? draft.amount.toString()
          : "",
        notes: draft.notes || "",
        selectedPlatforms: draft.deliverables || [],
      });

      setSelectedFiles(draft.attachments || []);
    } else if (dataSource) {
      setFormData({
        offerName: dataSource.offerName || offer.offerName || "",
        description: dataSource.description || offer.description || "",
        counterReviewDate: dataSource.counterReviewDate
          ? new Date(dataSource.counterReviewDate)
          : offer.desiredReviewDate
          ? new Date(offer.desiredReviewDate)
          : new Date(),
        counterPostDate: dataSource.counterPostDate
          ? new Date(dataSource.counterPostDate)
          : offer.desiredPostDate
          ? new Date(offer.desiredPostDate)
          : new Date(),
        counterAmount: dataSource.counterAmount
          ? dataSource.counterAmount.toString()
          : offer.proposedAmount
          ? offer.proposedAmount.toString()
          : "",
        notes: dataSource.notes || "",
        selectedPlatforms:
          dataSource?.deliverables || offer?.deliverables || [],
      });
    }
  }, [dataSource, offer, draft]);

  // Add this useEffect to handle date validation
  useEffect(() => {
    if (formData.counterPostDate < formData.counterReviewDate) {
      setFormData((prev) => ({
        ...prev,
        counterPostDate: formData.counterReviewDate,
      }));
    }
  }, [formData.counterReviewDate, formData.counterPostDate]);

  if (isLoading || draftLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Edit Counter Offer</Text>
        <TouchableOpacity
          style={styles.placeholder}
          onPress={() => {
            router.push("/profile");
          }}
        >
          <ProfileInfo />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Offer Name</Text>
            <Text style={styles.offerName}>{formData.offerName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Platforms</Text>
            <View style={styles.platformsGrid}>
              {formData.selectedPlatforms.map(
                (deliverable: string, index: number) => (
                  <View key={index} style={styles.platformIcon}>
                    <Image
                      source={getPlatformIcon(deliverable)}
                      style={styles.platformIconImage}
                    />
                  </View>
                )
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Write description"
              placeholderTextColor="#6C6C6C"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Desired Content Review Date</Text>
            {isWeb ? (
              <DatePicker
                selected={formData.counterReviewDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData({
                      ...formData,
                      counterReviewDate: date,
                      // Auto-update post date if it becomes invalid
                      counterPostDate:
                        date > formData.counterPostDate
                          ? date
                          : formData.counterPostDate,
                    });
                  }
                }}
                minDate={new Date()}
                className="date-picker-input"
                popperClassName="datepicker-popper"
                portalId="datepicker-popper-container"
                dateFormat="dd MMM, yyyy"
                customInput={
                  <View style={styles.dateInput}>
                    <Text style={styles.dateText}>
                      {format(formData.counterReviewDate, "dd MMM, yyyy")}
                    </Text>
                    <Calendar width={24} height={24} color="#430B92" />
                  </View>
                }
              />
            ) : (
              <Pressable style={styles.dateInput}>
                <Text style={styles.dateText}>
                  {format(formData.counterReviewDate, "dd MMM, yyyy")}
                </Text>
                <Calendar03 width={24} height={24} />
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Desired Post Date</Text>
            {isWeb ? (
              <DatePicker
                selected={formData.counterPostDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData({
                      ...formData,
                      counterPostDate: date,
                    });
                  }
                }}
                minDate={formData.counterReviewDate}
                className="date-picker-input"
                popperClassName="datepicker-popper"
                portalId="datepicker-popper-container"
                dateFormat="dd MMM, yyyy"
                customInput={
                  <View style={styles.dateInput}>
                    <Text style={styles.dateText}>
                      {format(formData.counterPostDate, "dd MMM, yyyy")}
                    </Text>
                    <Calendar width={24} height={24} color="#430B92" />
                  </View>
                }
              />
            ) : (
              <Pressable style={styles.dateInput}>
                <Text style={styles.dateText}>
                  {format(formData.counterPostDate, "dd MMM, yyyy")}
                </Text>
                <Calendar03 width={24} height={24} />
              </Pressable>
            )}
          </View>

          <ConfigurableCurrencyInput
            label="Your Offer"
            value={formData.counterAmount}
            onValueChange={(value) =>
              setFormData({ ...formData, counterAmount: value || "" })
            }
            errorMessage="Please enter an amount between $100 and $500,000"
          />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
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
              disabled={saveDraftMutation.isPending}
            >
              <Cloudupload width={24} height={24} color="#430B92" />
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} files selected (max 10)`
                    : "Attach Content"}
                </Text>
                <Text style={styles.uploadSubtext}>
                  pdf, gif, jpeg, png, photoshop, adobe
                </Text>
              </View>
              {saveDraftMutation.isPending ? (
                <ActivityIndicator color="#430B92" />
              ) : (
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={handleFilePick}
                >
                  <Text style={styles.browseText}>Browse Files</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {saveDraftMutation.isPending && selectedFiles.length > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.uploadTitle}>
                  Uploading - {uploadProgress}%
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

            {selectedFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedFile}
                onPress={() => {
                  if (file.fileUrl) {
                    Linking.openURL(file.fileUrl);
                  }
                }}
              >
                <Text style={styles.fileName}>
                  {file.name || file.fileName}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <Text style={styles.removeFile}>Remove</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
          {/* End of File Upload */}

          <View style={styles.termsContainer}>
            <Pressable
              style={[styles.checkbox, isTermsAgreed && styles.checkboxChecked]}
              onPress={() => setIsTermsAgreed(!isTermsAgreed)}
            >
              {isTermsAgreed && <Check width={16} height={16} color="white" />}
            </Pressable>
            <Text style={styles.termsText}>
              By agreeing, we assume you have read the{" "}
              <TouchableOpacity
                onPress={() => {
                  setShowTerms(true);
                }}
              >
                <Text style={styles.termsLink}>Transaction Terms</Text>
              </TouchableOpacity>
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[
                styles.sendButton,
                counterOfferMutation.isPending && styles.buttonDisabled,
                isMobile && { width: "100%" },
              ]}
              onPress={handleSend}
              disabled={!isTermsAgreed || counterOfferMutation.isPending}
            >
              {counterOfferMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.draftButton,
                saveDraftMutation.isPending && styles.buttonDisabled,
                isMobile && { width: "100%" },
              ]}
              onPress={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              {saveDraftMutation.isPending ? (
                <ActivityIndicator color="#430B92" />
              ) : (
                <Text style={styles.draftButtonText}>Save Draft</Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.deleteButton,
                deleteMutation.isPending && styles.buttonDisabled,
                isMobile && { width: "100%" },
              ]}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator color="#6C6C6C" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  checkboxChecked: {
    backgroundColor: "#430B92",
    borderColor: "#430B92",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    // marginHorizontal: "5%",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {},
  content: {
    zIndex: -1,
    position: "relative",
    marginHorizontal: "5%",
  },
  section: {
    marginBottom: 24,
    zIndex: -1,
    position: "relative",
  },
  sectionLabel: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  offerName: {
    fontSize: 20,
    color: "#000000",
  },
  platformsGrid: {
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
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 14,
    color: "#000000",
    borderStyle: "solid",
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
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
  },
  termsLink: {
    color: "#430B92",
  },
  actionButtons: {
    gap: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 24,
  },
  sendButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  draftButton: {
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  draftButtonText: {
    color: "#430B92",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#6C6C6C",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  deleteButtonText: {
    color: "#6C6C6C",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#E2D0FB",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#430B92",
  },
  fileSize: {
    fontSize: 12,
    color: "#6C6C6C",
  },
});

function getPlatformIcon(deliverable: string) {
  switch (deliverable.toLowerCase()) {
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
