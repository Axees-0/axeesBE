"use client";

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
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import useUploadProgress from "@/hooks/useUploadProgress";
import * as FileSystem from "expo-file-system";
import DocumentUpload from "@/components/DocumentUpload";
import { useDocumentSubmission, DocumentFile, DocumentSubmissionResult } from "@/utils/documentSubmissionService";
import ProofSubmission from "@/components/ProofSubmission";
import SocialMediaLinks from "@/components/SocialMediaLinks";

import Arrowleft02 from "../assets/arrowleft02.svg";
import Cloudupload from "../assets/cloudupload.svg";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import Navbar from "@/components/web/navbar";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api";

export default function CreatorUploadProof() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const {
    dealId,
    milestoneId,
    isResubmission,
    isOfferContent,
    isProof,
    proofId,
  } = useLocalSearchParams();

  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const { uploadProgress, totalSize, calculateProgress } = useUploadProgress();
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [useEnhancedUpload, setUseEnhancedUpload] = useState(true);
  const [showEnhancedProofSubmission, setShowEnhancedProofSubmission] = useState(false);

  // Check mode flags
  const isResubmissionMode = isResubmission === "true";
  const isOfferContentMode = isOfferContent === "true";
  const isProofMode = isProof === "true";

  // Fetch deal details
  const { data: deal, isLoading } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/marketer/deals/${dealId}`, {
        params: {
          userId: user?._id,
          userType: user?.userType,
        },
      });
      return response.data.deal;
    },
    enabled: !!dealId && !!user?._id,
  });

  // Enhanced submit function using new document service
  const submitWorkEnhancedMutation = useMutation({
    mutationFn: async () => {
      if (documentFiles.length === 0) {
        throw new Error('No files selected');
      }

      const formData = new FormData();

      // Add files from DocumentFile[]
      documentFiles.forEach((file) => {
        if (Platform.OS === "web" && file.file) {
          formData.append("files", file.file);
        } else if (file.uri) {
          formData.append("files", {
            uri: file.uri,
            type: file.mimeType || file.type,
            name: file.name,
          } as any);
        }
      });

      const deliverables = {
        attachments: documentFiles.map((f) => f.name),
      };

      formData.append("deliverables", JSON.stringify(deliverables));
      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      const response = await axios.post(
        `${API_URL}/marketer/deals/${dealId}/milestones/${milestoneId}/submit`,
        formData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Submission Successful",
        text2: "Your work has been submitted for review",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Submission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Submission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  // Submit regular milestone work
  const submitWorkMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        if (Platform.OS === "web") {
          formData.append("files", file);
        } else {
          formData.append("files", file);
        }
      });

      const deliverables = {
        attachments: selectedFiles.map((f) => f.name),
      };

      formData.append("deliverables", JSON.stringify(deliverables));
      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      const response = await axios.post(
        `${API_URL}/marketer/deals/${dealId}/milestones/${milestoneId}/submit`,
        formData,
        {
          timeout: 30000,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Submission Successful",
        text2: "Your work has been submitted for review",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Submission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Submission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  // Submit offer content (new)
  const submitOfferContentMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        if (Platform.OS === "web") {
          formData.append("files", file);
        } else {
          formData.append("files", file);
        }
      });

      const deliverables = {
        attachments: selectedFiles.map((f) => f.name),
      };

      formData.append("deliverables", JSON.stringify(deliverables));
      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      const response = await axios.post(
        `${API_URL}/marketer/deals/${dealId}/offer-content`,
        formData,
        {
          timeout: 30000,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Offer Content Submitted",
        text2: "Your content has been submitted for approval",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Submission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Submission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  // Submit proof mutation
  const submitProofMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      // Add required fields first
      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      // Create deliverables structure
      const deliverables = {
        attachments: selectedFiles.map((f) => f.name),
      };
      formData.append("deliverables", JSON.stringify(deliverables));

      // Prepare files and calculate sizes
      const filesWithSize = await Promise.all(
        selectedFiles.map(async (file) => {
          if (Platform.OS === "web") {
            return { file, size: file.size };
          } else {
            const fileInfo = await FileSystem.getInfoAsync(file.uri);
            return { file, size: fileInfo.size || 0 };
          }
        })
      );

      // Calculate total size for progress
      const total = filesWithSize.reduce((sum, { size }) => sum + size, 0);
      totalSize.current = total;

      // Append files to form data
      filesWithSize.forEach(({ file }) => {
        if (Platform.OS === "web") {
          formData.append("files", file);
        } else {
          formData.append("files", file);
        }
      });

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.loaded && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            calculateProgress(progress);
          }
        },
        timeout: 30000,
      };

      await axios.post(
        `${API_URL}/marketer/deals/${dealId}/submit-proof`,
        formData,
        config
      );
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Proof Submitted",
        text2: "Your proof has been submitted for review",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      console.log("Error submitting proof:", error);
      const errorMessage =
        error.response?.data?.message || "Submission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Submission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  // Resubmit work mutation
  const resubmitWorkMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      // Ensure proper file handling for React Native
      selectedFiles.forEach((file) => {
        if (Platform.OS === "web") {
          formData.append("files", file);
        } else {
          formData.append("files", file);
        }
      });

      // Structure deliverables to match backend expectations
      const deliverables = {
        attachments: selectedFiles.map((f) => f.name),
      };

      formData.append("deliverables", JSON.stringify(deliverables));
      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      // Add debug logging
      console.log("Resubmitting form data:", {
        deliverables,
        files: selectedFiles.map((f) => f.name),
        userId: user?._id,
        userType: user?.userType,
      });

      const response = await axios.post(
        `${API_URL}/marketer/deals/${dealId}/milestones/${milestoneId}/resubmit`,
        formData,
        {
          timeout: 30000,
          // Let axios set the Content-Type automatically
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Resubmission Successful",
        text2: "Your revised work has been submitted for review",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        "Resubmission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Resubmission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  // Fix 4: Update file handling to match working implementation
  const handleFilePick = async () => {
    try {
      const MAX_FILES = 10;

      if (selectedFiles.length >= MAX_FILES) {
        Toast.show({
          type: "customNotification",
          text1: "Maximum Files Reached",
          text2: `You can only upload up to ${MAX_FILES} files`,
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      if (isWeb) {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".pdf,.gif,.jpeg,.png,.psd";

        input.onchange = (e: any) => {
          const files = Array.from(e.target.files as FileList);
          const remainingSlots = MAX_FILES - selectedFiles.length;
          const newFiles = files.slice(0, remainingSlots);

          if (files.length > remainingSlots) {
            Toast.show({
              type: "customNotification",
              text1: "Too Many Files",
              text2: `Only ${remainingSlots} files added`,
              position: "top",
              visibilityTime: 3000,
            });
          }
          setSelectedFiles((prev) => [...prev, ...newFiles]);
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*", "application/pdf"],
          multiple: true,
        });

        if (!result.canceled) {
          const remainingSlots = MAX_FILES - selectedFiles.length;
          const newFiles = result.assets.slice(0, remainingSlots);

          if (result.assets.length > remainingSlots) {
            Toast.show({
              type: "customNotification",
              text1: "Too Many Files",
              text2: `Only ${remainingSlots} files added`,
              position: "top",
              visibilityTime: 3000,
            });
          }
          setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
      }
    } catch (err) {
      console.error("Error picking files:", err);
    }
  };

  const handleSubmit = async () => {
    const filesToCheck = useEnhancedUpload ? documentFiles : selectedFiles;
    
    if (filesToCheck.length === 0 && !isProofMode) {
      Toast.show({
        type: "customNotification",
        text1: "Missing Content",
        text2: isProofMode
          ? "Please upload files"
          : "Please add or upload files",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      return;
    }

    try {
      if (useEnhancedUpload) {
        // Use enhanced upload service
        if (isOfferContentMode) {
          await submitOfferContentEnhancedMutation.mutateAsync();
        } else if (isResubmissionMode) {
          await resubmitWorkEnhancedMutation.mutateAsync();
        } else if (isProofMode) {
          await submitProofEnhancedMutation.mutateAsync();
        } else {
          await submitWorkEnhancedMutation.mutateAsync();
        }
      } else {
        // Use legacy upload
        if (isOfferContentMode) {
          await submitOfferContentMutation.mutateAsync();
        } else if (isResubmissionMode) {
          await resubmitWorkMutation.mutateAsync();
        } else if (isProofMode) {
          await submitProofMutation.mutateAsync();
        } else {
          await submitWorkMutation.mutateAsync();
        }
      }
    } catch (error) {
      // Error handling done in onError
    }
  };

  // Enhanced submit offer content mutation
  const submitOfferContentEnhancedMutation = useMutation({
    mutationFn: async () => {
      if (documentFiles.length === 0) {
        throw new Error('No files selected');
      }

      const formData = new FormData();

      documentFiles.forEach((file) => {
        if (Platform.OS === "web" && file.file) {
          formData.append("files", file.file);
        } else if (file.uri) {
          formData.append("files", {
            uri: file.uri,
            type: file.mimeType || file.type,
            name: file.name,
          } as any);
        }
      });

      const deliverables = {
        attachments: documentFiles.map((f) => f.name),
      };

      formData.append("deliverables", JSON.stringify(deliverables));
      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      const response = await axios.post(
        `${API_URL}/marketer/deals/${dealId}/offer-content`,
        formData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Offer Content Submitted",
        text2: "Your content has been submitted for approval",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Submission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Submission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  // Enhanced resubmit work mutation
  const resubmitWorkEnhancedMutation = useMutation({
    mutationFn: async () => {
      if (documentFiles.length === 0) {
        throw new Error('No files selected');
      }

      const formData = new FormData();

      documentFiles.forEach((file) => {
        if (Platform.OS === "web" && file.file) {
          formData.append("files", file.file);
        } else if (file.uri) {
          formData.append("files", {
            uri: file.uri,
            type: file.mimeType || file.type,
            name: file.name,
          } as any);
        }
      });

      const deliverables = {
        attachments: documentFiles.map((f) => f.name),
      };

      formData.append("deliverables", JSON.stringify(deliverables));
      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      const response = await axios.post(
        `${API_URL}/marketer/deals/${dealId}/milestones/${milestoneId}/resubmit`,
        formData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Resubmission Successful",
        text2: "Your revised work has been submitted for review",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Resubmission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Resubmission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  // Enhanced submit proof mutation
  const submitProofEnhancedMutation = useMutation({
    mutationFn: async () => {
      if (documentFiles.length === 0) {
        throw new Error('No files selected');
      }

      const formData = new FormData();

      formData.append("userId", user?._id || "");
      formData.append("userType", user?.userType || "");

      const deliverables = {
        attachments: documentFiles.map((f) => f.name),
      };
      formData.append("deliverables", JSON.stringify(deliverables));

      documentFiles.forEach((file) => {
        if (Platform.OS === "web" && file.file) {
          formData.append("files", file.file);
        } else if (file.uri) {
          formData.append("files", {
            uri: file.uri,
            type: file.mimeType || file.type,
            name: file.name,
          } as any);
        }
      });

      await axios.post(
        `${API_URL}/marketer/deals/${dealId}/submit-proof`,
        formData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    },
    onSuccess: () => {
      Toast.show({
        type: "customNotification",
        text1: "Proof Submitted",
        text2: "Your proof has been submitted for review",
        position: "top",
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Submission failed. Please try again.";
      Toast.show({
        type: "customNotification",
        text1: "Submission Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 50,
      });
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  const milestone = deal?.milestones?.find((m: any) => m.id === milestoneId);

  return (
    <SafeAreaView style={[styles.container]}>
     <Navbar pageTitle= {isResubmissionMode
            ? "Resubmit Work"
            : isOfferContentMode
            ? "Upload Offer Content"
            : "Upload Proof"}
     />
      <StatusBar style="auto" />

      {/* <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>
          {isResubmissionMode
            ? "Resubmit Work"
            : isOfferContentMode
            ? "Upload Offer Content"
            : "Upload Proof"}
        </Text>
        <TouchableOpacity
          style={styles.placeholder}
          onPress={() => {
            router.push("/profile");
          }}
        >
          <ProfileInfo />
        </TouchableOpacity> */}
      {/* </View> */}
      <ScrollView>
        <View
          style={[styles.content, isWeb && isWideScreen && styles.webContainer]}
        >
          {isResubmissionMode && (
            <View style={styles.resubmissionBanner}>
              <Text style={styles.resubmissionText}>
                You are resubmitting work for this milestone based on the
                marketer's feedback.
              </Text>
            </View>
          )}

          {isOfferContentMode || isProofMode ? (
            // Offer Content Mode
            <>
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Offer Name</Text>
                <Text style={styles.detailText}>{deal?.dealName}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descriptionText}>
                  {deal?.offerId?.description}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Desired Post Date</Text>
                <Text style={styles.detailText}>
                  {deal?.offerId?.desiredPostDate
                    ? new Date(deal.offerId.desiredPostDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
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
                    ? new Date(
                        deal.offerId.desiredReviewDate
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </Text>
              </View>
            </>
          ) : (
            // Milestone Mode (unchanged)
            <>
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Milestone Name</Text>
                <Text style={styles.detailText}>{milestone?.name}</Text>
              </View>

              {/* <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descriptionText}>
                  {milestone?.description}
                </Text>
              </View> */}

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Due Date</Text>
                <Text style={styles.detailText}>
                  {milestone?.dueDate
                    ? new Date(milestone.dueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Amount</Text>
                <Text style={styles.detailText}>${milestone?.amount}</Text>
              </View>
            </>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Upload Files</Text>
            
            {/* Enhanced Proof Submission for Proof Mode */}
            {isProofMode && (
              <View style={styles.enhancedProofSection}>
                <TouchableOpacity
                  style={styles.enhancedProofButton}
                  onPress={() => setShowEnhancedProofSubmission(true)}
                >
                  <Text style={styles.enhancedProofButtonText}>
                    Use Enhanced Proof Submission
                  </Text>
                </TouchableOpacity>
                <Text style={styles.enhancedProofSubtext}>
                  Template-based submission with metadata and validation
                </Text>
              </View>
            )}
            
            {/* Enhanced Upload Toggle */}
            <View style={styles.uploadToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  useEnhancedUpload && styles.toggleButtonActive
                ]}
                onPress={() => setUseEnhancedUpload(true)}
              >
                <Text style={[
                  styles.toggleButtonText,
                  useEnhancedUpload && styles.toggleButtonTextActive
                ]}>
                  Enhanced Upload
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !useEnhancedUpload && styles.toggleButtonActive
                ]}
                onPress={() => setUseEnhancedUpload(false)}
              >
                <Text style={[
                  styles.toggleButtonText,
                  !useEnhancedUpload && styles.toggleButtonTextActive
                ]}>
                  Legacy Upload
                </Text>
              </TouchableOpacity>
            </View>

            {useEnhancedUpload ? (
              /* Enhanced Document Upload Component */
              <DocumentUpload
                onFilesChange={(files) => setDocumentFiles(files)}
                options={{
                  maxFiles: 10,
                  maxFileSize: 50 * 1024 * 1024, // 50MB
                  allowedTypes: [
                    'image/jpeg',
                    'image/png', 
                    'image/gif',
                    'application/pdf',
                    'image/vnd.adobe.photoshop',
                    'video/mp4',
                    'video/quicktime'
                  ],
                  enableCompression: true,
                  enableBatchUpload: true
                }}
                title="Attach Content"
                subtitle="Drag and drop files here or click to browse"
                compact={false}
              />
            ) : (
              /* Legacy Upload Section */
              <>
                <View style={styles.uploadSection}>
                  <Cloudupload width={24} height={24} color="#430b92" />
                  <View style={styles.uploadContent}>
                    <Text style={styles.uploadTitle}>Attach Content</Text>
                    <Text style={styles.uploadSubtext}>
                      pdf, gif, jpeg, png, photoshop, adobe
                    </Text>
                  </View>
                  <Pressable style={styles.browseButton} onPress={handleFilePick}>
                    <Text style={styles.browseText}>Browse Files</Text>
                  </Pressable>
                </View>

                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileSize}>
                        {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "N/A"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedFiles((files) =>
                          files.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <Text style={styles.removeFile}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Social Media Links Section - only show for proof mode */}
          {isProofMode && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Social Media Posts</Text>
              <Text style={styles.descriptionText}>
                Add links to your published content for tracking and verification
              </Text>
              <SocialMediaLinks
                dealId={dealId as string}
                milestoneId={milestoneId as string}
                onLinksChange={(links) => {
                  console.log('Social media links updated:', links);
                }}
                compact={true}
                allowEdit={true}
                title="Post Links"
              />
            </View>
          )}

          {uploadProgress > 0 && selectedFiles.length > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                Uploading... {uploadProgress}%
              </Text>
            </View>
          )}

          <Pressable
            style={[
              styles.submitButton,
              isWeb && isWideScreen && styles.webButton,
            ]}
            onPress={handleSubmit}
            disabled={
              useEnhancedUpload ? (
                isResubmissionMode
                  ? resubmitWorkEnhancedMutation.isPending
                  : isOfferContentMode
                  ? submitOfferContentEnhancedMutation.isPending
                  : isProofMode
                  ? submitProofEnhancedMutation.isPending
                  : submitWorkEnhancedMutation.isPending
              ) : (
                isResubmissionMode
                  ? resubmitWorkMutation.isPending
                  : isOfferContentMode
                  ? submitOfferContentMutation.isPending
                  : isProofMode
                  ? submitProofMutation.isPending
                  : submitWorkMutation.isPending
              )
            }
          >
            {(
              useEnhancedUpload ? (
                isResubmissionMode
                  ? resubmitWorkEnhancedMutation.isPending
                  : isOfferContentMode
                  ? submitOfferContentEnhancedMutation.isPending
                  : isProofMode
                  ? submitProofEnhancedMutation.isPending
                  : submitWorkEnhancedMutation.isPending
              ) : (
                isResubmissionMode
                  ? resubmitWorkMutation.isPending
                  : isOfferContentMode
                  ? submitOfferContentMutation.isPending
                  : isProofMode
                  ? submitProofMutation.isPending
                  : submitWorkMutation.isPending
              )
            ) ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isResubmissionMode
                  ? "Resubmit for Review"
                  : isOfferContentMode
                  ? "Submit Offer Content"
                  : "Submit for Review"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      
      {/* Enhanced Proof Submission Modal */}
      {isProofMode && (
        <Modal
          visible={showEnhancedProofSubmission}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEnhancedProofSubmission(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <ProofSubmission
              dealId={dealId as string}
              milestoneId={milestoneId as string}
              onSubmissionComplete={(proofId) => {
                setShowEnhancedProofSubmission(false);
                Toast.show({
                  type: "customNotification",
                  text1: "Enhanced Proof Submitted",
                  text2: "Your proof has been submitted with enhanced metadata",
                  position: "top",
                  visibilityTime: 3000,
                  topOffset: 50,
                });
                router.back();
              }}
              onCancel={() => setShowEnhancedProofSubmission(false)}
              compact={false}
            />
          </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webContainer: {
    marginHorizontal: "5%",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
    marginHorizontal: "5%",
  },
  headerTitle: {
    fontSize: 24,
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
  detailSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    textTransform: "capitalize",
  },
  detailText: {
    fontSize: 16,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    textTransform: "capitalize",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
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
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
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
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#430b92",
    borderRadius: 4,
  },
  browseText: {
    fontSize: 14,
    color: "#430b92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  fileSize: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  removeFile: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#430b92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  webButton: {
    alignSelf: "center",
    width: "30%",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
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
  resubmissionBanner: {
    backgroundColor: "#F0E7FD",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#430B92",
  },
  resubmissionText: {
    fontSize: 14,
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  feedbackItem: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
  },
  feedbackText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  feedbackDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  offerUploadNote: {
    backgroundColor: "#F0E7FD",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#430B92",
  },
  offerUploadNoteText: {
    fontSize: 14,
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  descriptionInput: {
    height: 127,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 16,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E2D0FB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#430B92",
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6C6C6C",
    textAlign: "center",
  },
  uploadToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#430B92",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  enhancedProofSection: {
    backgroundColor: "#F0E7FD",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#430B92",
  },
  enhancedProofButton: {
    backgroundColor: "#430B92",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  enhancedProofButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  enhancedProofSubtext: {
    fontSize: 12,
    color: "#430B92",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
