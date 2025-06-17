import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { router, useLocalSearchParams } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "../ProfileInfo";
import { 
  useOfferCollaboration, 
  EditingSession, 
  EditHistoryEntry 
} from "@/utils/realTimeCollaborationService";

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

export default function MarketerOfferCounter() {
  const window = useWindowDimensions();
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const isWeb = Platform.OS === "web";

  const { user } = useAuth();
  const { offerId, marketerId, creatorId, role } = useLocalSearchParams();

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

  const [formData, setFormData] = useState({
    offerName: "",
    description: "",
    desiredReviewDate: new Date(),
    desiredPostDate: new Date(),
    counterAmount: "",
    notes: "",
    selectedPlatforms: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const queryClient = useQueryClient();

  // Fetch original offer data
  const { data: offerData, isLoading } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/${offerId}`, {
        params: { userId: user?._id, userType: user?.userType }
      });
      return response.data.offer;
    },
    enabled: !!offerId && !!user?._id,
    onSuccess: (data) => {
      // Initialize form with original data
      if (data) {
        setFormData({
          offerName: data.offerName || "",
          description: data.description || "",
          desiredReviewDate: data.desiredReviewDate ? new Date(data.desiredReviewDate) : new Date(),
          desiredPostDate: data.desiredPostDate ? new Date(data.desiredPostDate) : new Date(),
          counterAmount: data.proposedAmount?.toString() || "",
          notes: data.notes || "",
          selectedPlatforms: data.deliverables || [],
        });
      }
    }
  });

  // Auto-save changes with real-time collaboration
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const saveTimer = setTimeout(async () => {
      try {
        const updates = {
          offerName: formData.offerName,
          description: formData.description,
          desiredReviewDate: formData.desiredReviewDate,
          desiredPostDate: formData.desiredPostDate,
          counterAmount: parseFloat(formData.counterAmount) || 0,
          notes: formData.notes,
          deliverables: formData.selectedPlatforms,
        };

        const result = await updateOffer(updates);
        
        if (result.success) {
          setHasUnsavedChanges(false);
        } else if (result.hasConflict) {
          Alert.alert(
            "Version Conflict",
            "Someone else has modified this offer. Would you like to see the latest version?",
            [
              { text: "Keep My Changes", style: "cancel" },
              { text: "Load Latest", onPress: resolveConflict }
            ]
          );
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [formData, hasUnsavedChanges, updateOffer]);

  // Counter offer submission
  const submitCounterMutation = useMutation({
    mutationFn: async (counterData: any) => {
      const response = await axios.post(`${API_URL}/${offerId}/counter`, {
        ...counterData,
        userId: user?._id,
        userType: user?.userType
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      Alert.alert("Success", "Counter offer sent successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.response?.data?.error || "Failed to send counter offer");
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSubmitCounter = () => {
    if (!formData.counterAmount || parseFloat(formData.counterAmount) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid counter amount");
      return;
    }

    setIsSubmitting(true);
    submitCounterMutation.mutate({
      counterAmount: parseFloat(formData.counterAmount),
      counterReviewDate: formData.desiredReviewDate,
      counterPostDate: formData.desiredPostDate,
      notes: formData.notes,
      deliverables: formData.selectedPlatforms,
    });
  };

  const DateInput = ({ value, onChange, label }: any) => {
    if (isWeb) {
      return (
        <DatePicker
          selected={value}
          onChange={onChange}
          dateFormat="dd MMM, yyyy"
          className="date-picker-input"
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

  if (isLoading || collaborationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#430B92" />
          <Text style={styles.loadingText}>Loading offer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.content, isWideScreen && styles.wideContent]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>← Back to offer</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Counter Offer</Text>
            <ProfileInfo />
          </View>

          {/* Real-time Collaboration Status */}
          <View style={styles.collaborationBar}>
            <View style={styles.collaborationLeft}>
              <View style={styles.collaborationStatus}>
                {collaborationState.hasConflict ? (
                  <AlertTriangle width={16} height={16} color="#FF9800" />
                ) : hasUnsavedChanges ? (
                  <Clock width={16} height={16} color="#FF9800" />
                ) : (
                  <CheckCircle width={16} height={16} color="#4CAF50" />
                )}
                <Text style={[
                  styles.collaborationText,
                  { color: collaborationState.hasConflict ? "#FF9800" : hasUnsavedChanges ? "#FF9800" : "#4CAF50" }
                ]}>
                  {collaborationState.hasConflict 
                    ? "Version conflict" 
                    : hasUnsavedChanges 
                      ? "Saving changes..." 
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
            <View style={styles.activeEditorsPanel}>
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
            <View style={styles.editHistoryPanel}>
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

          {/* Original Offer Summary */}
          <View style={styles.originalOfferSection}>
            <Text style={styles.sectionTitle}>Original Offer</Text>
            <View style={styles.originalOfferContent}>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Amount:</Text>
                <Text style={styles.offerValue}>${offerData?.proposedAmount || 0}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Review Date:</Text>
                <Text style={styles.offerValue}>
                  {offerData?.desiredReviewDate 
                    ? new Date(offerData.desiredReviewDate).toLocaleDateString()
                    : "Not specified"
                  }
                </Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Post Date:</Text>
                <Text style={styles.offerValue}>
                  {offerData?.desiredPostDate 
                    ? new Date(offerData.desiredPostDate).toLocaleDateString()
                    : "Not specified"
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Counter Offer Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Counter Offer</Text>
            
            {/* Counter Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Counter Amount</Text>
              <TextInput
                style={styles.input}
                value={formData.counterAmount}
                onChangeText={(text) => handleInputChange('counterAmount', text)}
                placeholder="$"
                keyboardType="numeric"
                placeholderTextColor="#6C6C6C"
              />
            </View>

            {/* Dates */}
            <View style={[styles.dateContainer, isWideScreen && styles.wideDateContainer]}>
              <View style={[styles.inputGroup, isWideScreen && styles.halfWidth]}>
                <Text style={styles.inputLabel}>Desired Review Date</Text>
                <DateInput
                  value={formData.desiredReviewDate}
                  onChange={(date: Date) => handleInputChange('desiredReviewDate', date)}
                />
              </View>

              <View style={[styles.inputGroup, isWideScreen && styles.halfWidth]}>
                <Text style={styles.inputLabel}>Desired Post Date</Text>
                <DateInput
                  value={formData.desiredPostDate}
                  onChange={(date: Date) => handleInputChange('desiredPostDate', date)}
                />
              </View>
            </View>

            {/* Platforms */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Platforms</Text>
              <View style={styles.platformsGrid}>
                {PLATFORMS.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    onPress={() => {
                      const newPlatforms = formData.selectedPlatforms.includes(platform.id)
                        ? formData.selectedPlatforms.filter(p => p !== platform.id)
                        : [...formData.selectedPlatforms, platform.id];
                      handleInputChange('selectedPlatforms', newPlatforms);
                    }}
                    style={[
                      styles.platformButton,
                      formData.selectedPlatforms.includes(platform.id) && styles.platformButtonActive,
                    ]}
                  >
                    <Image source={platform.icon} style={styles.platformIcon} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Counter Notes</Text>
              <TextInput
                style={styles.textArea}
                multiline
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                placeholder="Explain your counter offer..."
                placeholderTextColor="#6C6C6C"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitCounter}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send width={20} height={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Send Counter Offer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6C6C6C",
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
  collaborationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
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
    marginBottom: 16,
  },
  editHistoryPanel: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
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
  originalOfferSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  originalOfferContent: {
    gap: 8,
  },
  offerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerLabel: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  offerValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    padding: 16,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  dateContainer: {
    gap: 16,
  },
  wideDateContainer: {
    flexDirection: "row",
  },
  halfWidth: {
    flex: 1,
  },
  dateInput: {
    height: 48,
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
    fontSize: 16,
    color: "#000000",
  },
  platformsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  platformButtonActive: {
    backgroundColor: "#F0E7FD",
    borderColor: "#430B92",
  },
  platformIcon: {
    width: 24,
    height: 24,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#430B92",
    height: 56,
    borderRadius: 8,
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});