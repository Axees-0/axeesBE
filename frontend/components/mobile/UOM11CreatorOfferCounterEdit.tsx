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
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Check, Upload } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
import {
  Color,
  FontFamily,
  FontSize,
  Padding,
  Border,
  Gap,
} from "@/GlobalStyles"; // Import for styles
import ProfileInfo from "../ProfileInfo";

import CurrencyInput from "react-currency-input-field";
import { ConfigurableCurrencyInput } from "../CurrencyInput";

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

const UOM11CreatorOfferCounterEdit = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const { offerId } = useLocalSearchParams();
  const { user } = useAuth();

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
  });

  const offer = data?.offer;
  const latestCounter = offer?.counters?.[offer.counters.length - 1];

  // Determine the data source: latest counter or original offer
  const dataSource = latestCounter || offer;

  const [formData, setFormData] = useState({
    offerName: dataSource?.offerName || "",
    description: dataSource?.description || "",
    counterReviewDate: dataSource?.counterReviewDate
      ? new Date(dataSource.counterReviewDate)
      : dataSource?.desiredReviewDate
      ? new Date(dataSource.desiredReviewDate)
      : new Date(),
    counterPostDate: dataSource?.counterPostDate
      ? new Date(dataSource.counterPostDate)
      : dataSource?.desiredPostDate
      ? new Date(dataSource.desiredPostDate)
      : new Date(),
    counterAmount: dataSource?.counterAmount
      ? dataSource.counterAmount.toString()
      : dataSource?.proposedAmount
      ? dataSource.proposedAmount.toString()
      : "",
    notes: dataSource?.notes || "",
    selectedPlatforms: dataSource?.deliverables || [],
  });

  // Counter offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_URL}/${offerId}/counter`, {
        ...formData,
        counterBy: user?.userType, // Set 'counterBy'
      });
      return response.data;
    },
    onSuccess: () => {
      router.back();
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.put(`${API_URL}/${offerId}/draft`, {
        ...formData,
        userId: user?._id,
        userType: user?.userType,
        counterAmount: formData.counterAmount,
        notes: formData.notes,
        counterReviewDate: formData.counterReviewDate,
        counterPostDate: formData.counterPostDate,
        status: "Draft",
      });
      return response.data;
    },
    onSuccess: () => {
      alert("Draft saved successfully");
      router.back();
    },
    onError: (error) => {
      console.error("Error saving draft:", error);
      alert("Failed to save draft");
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

  useEffect(() => {
    if (dataSource) {
      setFormData({
        offerName: dataSource.offerName || "",
        description: dataSource.description || "",
        counterReviewDate: dataSource.counterReviewDate
          ? new Date(dataSource.counterReviewDate)
          : dataSource.desiredReviewDate
          ? new Date(dataSource.desiredReviewDate)
          : new Date(),
        counterPostDate: dataSource.counterPostDate
          ? new Date(dataSource.counterPostDate)
          : dataSource.desiredPostDate
          ? new Date(dataSource.desiredPostDate)
          : new Date(),
        counterAmount: dataSource.counterAmount
          ? dataSource.counterAmount.toString()
          : dataSource.proposedAmount
          ? dataSource.proposedAmount.toString()
          : "",
        notes: dataSource.notes || "",
        selectedPlatforms: dataSource.deliverables || [],
      });
    }
  }, [dataSource]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.cSK430B92950} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
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
                onChange={(date: Date | null) =>
                  setFormData({ ...formData, counterReviewDate: date })
                }
                dateFormat="dd MMM, yyyy"
                className="date-picker-input"
                popperClassName="datepicker-popper"
                portalId="datepicker-popper-container"
                customInput={
                  <View style={styles.dateInput}>
                    <Text style={styles.dateText}>
                      {formData.counterReviewDate.toLocaleDateString()}
                    </Text>
                    <Calendar width={24} height={24} color="#430B92" />
                  </View>
                }
              />
            ) : (
              <Pressable
                style={styles.dateInput}
                onPress={() => {
                  /* Open date picker for mobile */
                }}
              >
                <Text style={styles.dateText}>
                  {formData.counterReviewDate.toLocaleDateString()}
                </Text>
                <Calendar width={24} height={24} color={Color.cSK430B92950} />
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Desired Post Date</Text>
            {isWeb ? (
              <DatePicker
                selected={formData.counterPostDate}
                onChange={(date: Date | null) =>
                  setFormData({ ...formData, counterPostDate: date })
                }
                dateFormat="dd MMM, yyyy"
                className="date-picker-input"
                popperClassName="datepicker-popper"
                portalId="datepicker-popper-container"
                customInput={
                  <View style={styles.dateInput}>
                    <Text style={styles.dateText}>
                      {formData.counterPostDate.toLocaleDateString()}
                    </Text>
                    <Calendar width={24} height={24} color="#430B92" />
                  </View>
                }
              />
            ) : (
              <Pressable
                style={styles.dateInput}
                onPress={() => {
                  /* Open date picker for mobile */
                }}
              >
                <Text style={styles.dateText}>
                  {formData.counterPostDate.toLocaleDateString()}
                </Text>
                <Calendar width={24} height={24} color={Color.cSK430B92950} />
              </Pressable>
            )}
          </View>

          {/* <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Offer</Text>

            <CurrencyInput
              value={formData.counterAmount}
              onValueChange={(value) => {
                if (Number(value) > 500000) {
                  return;
                }
                setFormData({ ...formData, counterAmount: value || "" });
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
              min={0}
              max={500000}
              maxLength={6}
              allowDecimals={true}
            />
          </View> */}

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
          {/* End of File Upload */}

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

          <View style={styles.actionButtons}>
            <Pressable
              style={[
                styles.sendButton,
                counterOfferMutation.isPending && styles.buttonDisabled,
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
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: FontSize.size_5xl,
    fontWeight: "600",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
    textAlign: "center",
  },
  placeholder: {},
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: FontSize.size_xl,
    color: Color.cSK430B92950,
    opacity: 0.5,
    marginBottom: 8,
    fontFamily: FontFamily.textSmNormal,
  },
  offerName: {
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.degular,
  },
  platformsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Gap.gap_sm,
  },
  platformIcon: {
    width: 35,
    height: 35,
    backgroundColor: Color.cSK430B9250,
    borderRadius: Border.br_7xs,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Color.cSK430B9250,
    borderStyle: "solid",
    paddingHorizontal: Padding.p_base,
    paddingVertical: Padding.p_5xs,
  },
  platformIconImage: {
    width: 20,
    height: 20,
  },
  textArea: {
    height: 127,
    borderWidth: 1,
    borderColor: Color.cSK430B9250,
    borderRadius: Border.br_7xs,
    padding: Padding.p_base,
    textAlignVertical: "top",
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
  },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: Color.cSK430B9250,
    borderRadius: Border.br_7xs,
    paddingHorizontal: Padding.p_base,
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
  },
  dateInput: {
    height: 58,
    borderWidth: 1,
    borderColor: Color.cSK430B9250,
    borderRadius: Border.br_7xs,
    paddingHorizontal: Padding.p_base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Padding.p_5xs,
  },
  dateText: {
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Gap.gap_md,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: Color.cSK430B9250,
    borderRadius: Border.br_5xs,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Color.cSK430B92500,
    borderColor: Color.cSK430B92500,
  },
  termsText: {
    flex: 1,
    fontSize: FontSize.size_base,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
  },
  termsLink: {
    color: Color.cSK430B92500,
    fontFamily: FontFamily.textSmNormal,
  },
  actionButtons: {
    gap: Gap.gap_md,
  },
  sendButton: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: Border.br_xs,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingVertical: Padding.p_5xs,
    paddingHorizontal: Padding.p_5xl,
  },
  sendButtonText: {
    color: Color.white,
    fontSize: FontSize.size_lg,
    fontWeight: "500",
    fontFamily: FontFamily.textSmNormal,
  },
  draftButton: {
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    borderRadius: Border.br_xs,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingVertical: Padding.p_5xs,
    paddingHorizontal: Padding.p_5xl,
  },
  draftButtonText: {
    color: Color.cSK430B92500,
    fontSize: FontSize.size_lg,
    fontWeight: "500",
    fontFamily: FontFamily.textSmNormal,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: Color.grey,
    borderRadius: Border.br_xs,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingVertical: Padding.p_5xs,
    paddingHorizontal: Padding.p_5xl,
  },
  deleteButtonText: {
    color: Color.grey,
    fontSize: FontSize.size_lg,
    fontWeight: "500",
    fontFamily: FontFamily.textSmNormal,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: FontSize.size_xl,
    color: Color.cSK430B92950,
    opacity: 0.5,
    marginBottom: 8,
  },
  uploadSection: {
    borderWidth: 1,
    borderColor: Color.cSK430B9250,
    borderRadius: Border.br_7xs,
    padding: Padding.p_base,
    alignItems: "center",
    gap: Gap.gap_xs,
  },
  uploadContent: {
    alignItems: "center",
    gap: Gap.gap_xs,
  },
  uploadTitle: {
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92950,
    textAlign: "center",
    fontFamily: FontFamily.textSmNormal,
  },
  uploadSubtext: {
    fontSize: FontSize.size_xs,
    color: Color.cSK430B92950,
    textAlign: "center",
    opacity: 0.5,
    fontFamily: FontFamily.textSmNormal,
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    borderRadius: 4,
  },
  browseText: {
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92500,
    fontFamily: FontFamily.textSmNormal,
  },
  selectedFile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    marginTop: 8,
    backgroundColor: Color.cSK430B9250,
    borderRadius: 4,
  },
  fileName: {
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.textSmNormal,
  },
  removeFile: {
    fontSize: FontSize.textSmNormal_size,
    color: Color.cSK430B92500,
    fontFamily: FontFamily.textSmNormal,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UOM11CreatorOfferCounterEdit;
