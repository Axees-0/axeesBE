"use client";
import * as FileSystem from "expo-file-system";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Modal,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import Navbar from "@/components/web/navbar";
import { StatusBar } from "expo-status-bar";
import { Redirect, router, useNavigation } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import Vector107 from "@/assets/vector-107.svg";
import Arrowleft02 from "@/assets/arrowleft02.svg";
import Vector105 from "@/assets/vector-105.svg";
import Eye from "@/assets/eye-show-up-arrow.svg";
import { Feather } from "@expo/vector-icons";
import Interfaceessentiallockpassword from "@/assets/interface-essentiallock-password.svg";
import Frame4 from "@/assets/frame-4.svg";
import Cloudupload from "@/assets/cloudupload.svg";
import Cancelcircle from "@/assets/cancelcircle.svg";
import Cancelcircle1 from "@/assets/cancelcircle1.svg";
import { useQueryClient } from "@tanstack/react-query";
import RNPickerSelect from "react-native-picker-select";
import ReactNativePhoneInput from "react-native-phone-input";

import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import * as DocumentPicker from "expo-document-picker";
import { FontFamily, Gap } from "@/GlobalStyles";
import { Padding } from "@/GlobalStyles";
import { Border } from "@/GlobalStyles";
import { Color } from "@/GlobalStyles";
import { FontSize } from "@/GlobalStyles";
import Toast from "react-native-toast-message";

import DeactivateModal from "@/components/DeactivateModal";
import DeleteModal from "@/components/DeleteModal";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import {
  validateUsername,
  validateEmail,
  validatePhone,
  validateBio,
  validateWebsite,
  validateBuythis,
  validateHandle,
  validateBrandName,
  validateName,
} from "@/utils/validationHelpers";
import useUploadProgress from "@/hooks/useUploadProgress";

const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
};

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/account";

const platformOptions = [
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
  { label: "TikTok", value: "tiktok" },
  { label: "Facebook", value: "facebook" },
  { label: "Twitter/X", value: "twitter" },
  { label: "Other", value: "other" },
];

const USERNAME_REQUIREMENTS = [
  "At least 3 characters",
  "Only letters, numbers, and underscores",
  "Cannot start with a number",
  "No spaces allowed",
];

const NAME_REQUIREMENTS = [
  "At least 3 characters",
  "Only letters and spaces",
  "Cannot start with a number",
];

const BRAND_NAME_REQUIREMENTS = [
  "At least 3 characters",
  "Only letters, numbers, and spaces",
];

const EMAIL_REQUIREMENTS = ["Must be a valid email address", "Cannot be empty"];

const PHONE_REQUIREMENTS = [
  "Must be a valid phone number",
  "Must include country code",
];

const BIO_REQUIREMENTS = [
  "Maximum 500 characters",
  "Minimum 10 characters",
  "Cannot be empty",
];

const WEBSITE_REQUIREMENTS = [
  "Must be a valid URL",
  "Must start with http:// or https://",
];

const BUYTHIS_REQUIREMENTS = [
  "Must be a valid URL",
  "Must start with http:// or https://",
];

const formatFollowerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
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

const PlatformsModal = React.memo(
  ({ visible, onClose, initialPlatforms = [] }) => {
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
    const [isUploading, setIsUploading] = useState(false); // Add loading state

    const deletePlatformMutation = useMutation({
      mutationFn: async (handleId: string) => {
        const response = await axios.delete(
          `${API_URL}/${"creator"}/${user?._id}/social-handles/${handleId}`
        );
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["profile", user?._id],
        });
      },
    });

    const addPlatformMutation = useMutation({
      mutationFn: async (data: {
        platform: string;
        handle: string;
        followersCount: number;
      }) => {
        const response = await axios.post(
          `${API_URL}/${"creator"}/${user?._id}/social-handles`,
          data
        );
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["profile", user?._id],
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
        Alert.alert("Error", errors.join("\n"));
        return;
      }

      if (!platform || !newPlatform.handle || !newPlatform.followersCount) {
        Alert.alert("Error", "Please fill all fields");
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
                      onValueChange={(value) => {
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
            <ScrollView style={styles.platformList}>
              <Text style={styles.formSectionTitle}>Current Platforms</Text>
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
);

const CategoriesModal = React.memo(
  ({ visible, onClose, initialCategories = [] }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [categories, setCategories] = useState(initialCategories);
    const [newCategory, setNewCategory] = useState("");

    // Reset categories when modal opens with new data
    useEffect(() => {
      setCategories(initialCategories);
    }, [initialCategories]);

    // Mutation: update creator data (categories)
    const updateCategoriesMutation = useMutation({
      mutationFn: async (updatedCategories) => {
        const response = await axios.patch(
          `${API_URL}/${
            user?.userType === "Creator" ? "creator" : "marketer"
          }/${user?._id}`,
          {
            categories: updatedCategories,
          }
        );
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["profile", user?._id] });
      },
    });

    const handleAddCategory = async () => {
      if (!newCategory.trim()) {
        Alert.alert("Error", "Please enter a category");
        return;
      }
      try {
        const updatedCategories = [...categories, newCategory.trim()];
        await updateCategoriesMutation.mutateAsync(updatedCategories);
        setCategories(updatedCategories);
        setNewCategory("");
        Toast.show({
          type: "customNotification",
          text1: "Success",
          text2: "Category added successfully",
          position: "top",
          autoHide: true,
          visibilityTime: 3000,
          topOffset: 50,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to add category",
        });
      }
    };

    const handleRemoveCategory = async (index) => {
      try {
        const updatedCategories = categories.filter((_, i) => i !== index);
        await updateCategoriesMutation.mutateAsync(updatedCategories);
        setCategories(updatedCategories);
        Toast.show({
          type: "customNotification",
          text1: "Success",
          text2: "Category removed successfully",
          position: "top",
          autoHide: true,
          visibilityTime: 3000,
          topOffset: 50,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to remove category",
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
          <View style={[styles.modalContent, styles.categoryModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Tags</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#000" />
              </Pressable>
            </View>

            <View style={styles.categoryForm}>
              <View style={styles.categoryInputRow}>
                <TextInput
                  style={[styles.input, styles.categoryInput]}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="New Category"
                />
                <Pressable
                  style={styles.addCategoryButton}
                  onPress={handleAddCategory}
                >
                  <Feather name="plus" size={20} color="#FFF" />
                </Pressable>
              </View>
            </View>

            <ScrollView style={styles.categoryList}>
              {categories.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <Text style={styles.categoryText}>{category}</Text>
                  <Pressable
                    onPress={() => handleRemoveCategory(index)}
                    style={styles.removeCategoryButton}
                  >
                    <Feather name="x" size={20} color="#FF0000" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
);

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

export default function EditProfile() {
  const { user, logout, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const windowSize = useWindowDimensions();
  const isMobile = windowSize.width >= BREAKPOINTS.TABLET;
  // Modal states
  // Add this state for managing the deactivation flow
  const [deactivationStep, setDeactivationStep] = useState("initial"); // 'initial', 'password', 'thanks'
  const [deactivationPassword, setDeactivationPassword] = useState("");
  const [deactivationMessage, setDeactivationMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showBuythisRequirements, setShowBuythisRequirements] = useState(false);
  const [buythisErrors, setBuythisErrors] = useState<string[]>([]);
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    email: "",
    phone: "",
    bio: "",
    link: "",
    tags: [] as string[],
    newTag: "",
    buythis: "",
    brandName: "",
    emailVerified: false,
  });

  const [creatorData, setCreatorData] = useState({
    handleName: "",
    nicheTopics: [] as string[],
    achievements: "",
    businessVentures: "",

    funFact: "",
    platforms: [] as {
      platform: string;
      handle: string;
      followersCount: number;
    }[],
    categories: [] as string[],
    mostViewedTitle: "",
    mainPlatform: "",
    mediaPackageUrl: "",
    portfolio: [] as {
      mediaUrl: string;
      mediaType: string;
      title: string;
      description: string;
    }[],
  });

  const queryClient = useQueryClient();

  // Avatar URL state
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Validation states
  const [showUsernameRequirements, setShowUsernameRequirements] =
    useState(false);
  const [showEmailRequirements, setShowEmailRequirements] = useState(false);
  const [showPhoneRequirements, setShowPhoneRequirements] = useState(false);
  const [showBioRequirements, setShowBioRequirements] = useState(false);
  const [showBrandNameRequirements, setShowBrandNameRequirements] =
    useState(false);
  const [showNameRequirements, setShowNameRequirements] = useState(false);
  const [deletionStep, setDeletionStep] = useState("initial"); // 'initial', 'thanks'
  const [deletionReason, setDeletionReason] = useState("");

  const navigation = useNavigation();
  const { uploadProgress, totalSize, calculateProgress } = useUploadProgress();

  const [usernameErrors, setUsernameErrors] = useState<string[]>([]);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [phoneErrors, setPhoneErrors] = useState<string[]>([]);
  const [bioErrors, setBioErrors] = useState<string[]>([]);
  const [websiteErrors, setWebsiteErrors] = useState<string[]>([]);
  const [nameErrors, setNameErrors] = useState<string[]>([]);
  const [brandNameErrors, setBrandNameErrors] = useState<string[]>([]);

  // Check if the form is "dirty" - i.e., changed from original
  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [cca2, setCca2] = useState<CountryCode>("US");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const phoneInputRef = useRef<ReactNativePhoneInput>(null);

  const selectCountry = (country: Country) => {
    setCca2(country.cca2);
    phoneInputRef.current?.selectCountry(country.cca2.toLowerCase());
  };

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", user?._id],
    queryFn: async () => {
      if (!user?._id) return null;
      const response = await axios.get(`${API_URL}/profile/${user._id}`);
      console.log("response.data: ", response.data);
      return response.data;
    },
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await updateUser({ ...user, ...data });
      const response = await axios.put(`${API_URL}/profile/${user?._id}`, data);      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", user?._id],
      });

      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Profile updated successfully",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to update profile",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
  });

  // marketer or creator data mutations
  const updateCreatorDataMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch(
        `${API_URL}/${user?.userType === "Creator" ? "creator" : "marketer"}/${
          user?._id
        }`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", user?._id],
      });
    },
  });

  // Account management mutations
  const deactivateAccountMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const response = await axios.post(`${API_URL}/${user?._id}/deactivate`, {
        password,
      });
      return response.data;
    },
    onSuccess: async () => {
      await logout();
    },
    onError: (error) => {
      setDeactivationMessage(
        error.response?.data?.message || "Failed to deactivate account"
      );
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const response = await axios.delete(`${API_URL}/${user?._id}`, {
        data: { reason },
      });
      return response.data;
    },
    onSuccess: async () => {
      await logout();
    },
  });

  const sendVerificationEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_URL}/send-verification-email`, {
        userId: user?._id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Verification email sent. Please check your inbox.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to send verification email",
      });
    },
  });

  const handleContinue = async () => {
    if (deactivationStep === "initial") {
      setDeactivationStep("password");
    } else if (deactivationStep === "password") {
      try {
        await deactivateAccountMutation.mutateAsync({
          password: deactivationPassword,
        });
        setDeactivationStep("thanks");
      } catch (error) {
        Alert.alert("Error", "Invalid password. Please try again.");
      }
    } else {
      setDeactivationStep("initial");
      setDeactivationPassword("");
      setShowDeactivateModal(false);
      router.replace("/UAM001Login");
    }
  };

  // Image picker
  const pickImage = async () => {
    setIsUploading(true); // Start loading
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        const fileSelected = new Promise((resolve) => {
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            resolve(file);
          };
        });

        input.click();

        const file = await fileSelected;
        if (!file) {
          setIsUploading(false); // Stop loading if no file
          return;
        }

        const formData = new FormData();
        formData.append("avatar", file);

        const response = await axios.post(
          `${API_URL}/${user?._id}/avatar`,
          formData,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.data.avatarUrl) {
          const updatedAvatarUrl = response.data.avatarUrl;
        
          let storageUserRaw = await AsyncStorage.getItem("user");
          let storageUser = storageUserRaw ? JSON.parse(storageUserRaw) : {};
        
          storageUser.avatarUrl = updatedAvatarUrl;
        
          await AsyncStorage.setItem("user", JSON.stringify(storageUser));
        
          updateUser?.(storageUser);
        
          setAvatarUrl(process.env.EXPO_PUBLIC_BACKEND_URL + updatedAvatarUrl);
        
          queryClient.invalidateQueries(["profile", user?._id]);
        
          Alert.alert("Success", "Profile picture updated successfully");
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (!result.canceled) {
          const uri = result.assets[0].uri;
          const filename = uri.split("/").pop() || "avatar.jpg";
          const match = /\.(\w+)$/.exec(filename.toLowerCase());
          const type = match ? `image/${match[1]}` : "image/jpeg";

          const formData = new FormData();
          formData.append("avatar", {
            uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
            type,
            name: filename,
          } as any);

          const response = await axios.post(
            `${API_URL}/${user?._id}/avatar`,
            formData,
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "multipart/form-data",
              },
              transformRequest: (data, headers) => {
                return data;
              },
            }
          );

          if (response.data.avatarUrl) {
            queryClient.invalidateQueries(["profile", user?._id]);
            Alert.alert("Success", "Profile picture updated successfully");
          }
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to upload image"
      );
    } finally {
      setIsUploading(false); // Stop loading
    }
  };

  const uploadDocument = async () => {
    try {
      let response;
      let files: any[] = [];

      // Enforce single file limit
      if (files.length >= 1) {
        Toast.show({
          type: "error",
          text1: "Limit Exceeded",
          text2: "Maximum 1 file allowed for media package",
        });
        return;
      }

      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = false; // Force single file
        input.accept = ".pdf,.doc,.docx,.gif,.jpeg,.jpg,.png,.psd";

        const fileSelected = new Promise((resolve) => {
          input.onchange = (e) => {
            const selected = Array.from(
              (e.target as HTMLInputElement).files || []
            );
            resolve(selected.slice(0, 1)); // Only take first file
          };
        });

        input.click();
        files = (await fileSelected) as File[];
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          multiple: false, // Already single file
          type: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/gif",
            "image/jpeg",
            "image/png",
            "application/photoshop",
          ],
        });

        if (!result.canceled && result.assets) {
          files = result.assets.slice(0, 1); // Only take first file
        }
      }

      if (files.length === 0) return;

      // Add file size validation
      const MAX_SIZE_MB = 200;
      const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

      const fileSizes = await Promise.all(
        files.map(async (file) => {
          let size = file.size || 0;
          if (Platform.OS !== "web" && file.uri) {
            const fileInfo = await FileSystem.getInfoAsync(file.uri);
            size = fileInfo.size || 0;
          }
          return size;
        })
      );

      if (fileSizes[0] > MAX_BYTES) {
        Toast.show({
          type: "error",
          text1: "File Too Large",
          text2: `Maximum file size is ${MAX_SIZE_MB}MB`,
        });
        return;
      }

      // Rest of existing file processing...
      totalSize.current = fileSizes.reduce((sum, size) => sum + size, 0);
      const formData = new FormData();

      // Only process first file
      files.slice(0, 1).forEach((file) => {
        if (Platform.OS === "web") {
          formData.append("mediaPackage", file);
        } else {
          formData.append("mediaPackage", {
            uri:
              Platform.OS === "ios"
                ? file.uri.replace("file://", "")
                : file.uri,
            name: file.name,
            type: file.mimeType || "application/octet-stream",
          });
        }
      });

      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.loaded) {
            // Calculate progress percentage directly from the event values
            calculateProgress(progressEvent.loaded);
          }
        },
      };

      setIsUploading(true);
      response = await axios.post(
        `${API_URL}/${user?._id}/media-package`,
        formData,
        config
      );

      if (response?.data.mediaPackageUrl) {
        queryClient.invalidateQueries(["profile", user?._id]);
        Toast.show({
          type: "customNotification",
          text1: "Success",
          text2: "Media package uploaded successfully",
          position: "top",
          autoHide: true,
          visibilityTime: 3000,
          topOffset: 50,
        });
        // Reset progress after upload finishes
      }
      setIsUploading(false);
    } catch (error: any) {
      console.error("Upload error:", error.response?.data || error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to upload media package",
      });
      // Reset progress on error
    }
  };

  const handleRemoveMediaPackage = async (index: number) => {
    try {
      const updatedPortfolio = creatorData.portfolio.filter(
        (_, i) => i !== index
      );
      await updateCreatorDataMutation.mutateAsync({
        ...creatorData,
        portfolio: updatedPortfolio,
      });
      setCreatorData({ ...creatorData, portfolio: updatedPortfolio });
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Media package removed successfully",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
      queryClient.invalidateQueries(["profile", user?._id]);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove media package",
      });
    }
  };

  // Handle data updates in a useEffect
  useEffect(() => {
    if (profile?.user) {
      setFormData({
        name: profile.user.name || "",
        userName: profile.user.userName || "",
        email: profile.user.email || "",
        phone: profile.user.phone || "",
        bio: profile.user.bio || "",
        link: profile.user.link || "",
        tags: profile.user.tags || [],
        newTag: "",
        buythis: profile.user.buythis || "",
        brandName: profile.user.brandName || "",
        emailVerified: profile.user.emailVerified || false,
      });
      // creator or mar
      if (profile.user.userType === "Creator" && profile.user.creatorData) {
        setCreatorData({
          handleName: profile.user.creatorData.handleName || "",
          nicheTopics: profile.user.creatorData.nicheTopics || [],
          achievements: profile.user.creatorData.achievements || "",
          businessVentures: profile.user.creatorData.businessVentures || "",

          funFact: profile.user.creatorData.funFact || "",
          platforms: profile.user.creatorData.platforms || [],
          mainPlatform: profile.user.creatorData.mainPlatform || "",
          categories: profile.user.creatorData.categories || [],
          mostViewedTitle: profile.user.creatorData.mostViewedTitle || "",
          portfolio: profile.user.creatorData.portfolio || [],
          mediaPackageUrl: profile.user.creatorData.mediaPackageUrl || "",
        });

        // Also update original data to the new state,
        // so subsequent changes can be tracked again.
        setOriginalData({
          name: profile.user.name || "",
          brandName: profile.user.brandName || "",
          userName: profile.user.userName || "",
          email: profile.user.email || "",
          phone: profile.user.phone || "",
          bio: profile.user.bio || "",
          link: profile.user.link || "",
          buythis: profile.user.buythis || "",
          achievements: profile.user.creatorData.achievements || "",
          businessVentures: profile.user.creatorData.businessVentures || "",
          funFact: profile.user.creatorData.funFact || "",
          mostViewedTitle: profile.user.creatorData.mostViewedTitle || "",
        });
      } else if (
        profile.user.userType === "Marketer" &&
        profile.user.marketerData
      ) {
        setCreatorData({
          handleName: profile.user.marketerData.handleName || "",
          nicheTopics: profile.user.marketerData.nicheTopics || [],
          achievements: profile.user.marketerData.achievements || "",
          businessVentures: profile.user.marketerData.businessVentures || "",
          funFact: profile.user.marketerData.funFact || "",
          mainPlatform: profile.user.marketerData.mainPlatform || "",
          platforms: profile.user.marketerData.platforms || [],
          categories: profile.user.marketerData.categories || [],
          mostViewedTitle: profile.user.marketerData.mostViewedTitle || "",
          portfolio: profile.user.marketerData.portfolio || [],
          mediaPackageUrl: profile.user.marketerData.mediaPackageUrl || "",
        });

        // Also update original data to the new state,
        // so subsequent changes can be tracked again.
        setOriginalData({
          name: profile.user.name || "",
          brandName: profile.user.brandName || "",
          userName: profile.user.userName || "",
          email: profile.user.email || "",
          phone: profile.user.phone || "",
          bio: profile.user.bio || "",
          link: profile.user.link || "",
          buythis: profile.user.buythis || "",
          achievements: profile.user.marketerData.achievements || "",
          businessVentures: profile.user.marketerData.businessVentures || "",
          funFact: profile.user.marketerData.funFact || "",
          mostViewedTitle: profile.user.marketerData.mostViewedTitle || "",
        });
      }

      if (profile.user.avatarUrl) {
        setAvatarUrl(
          profile.user.avatarUrl.startsWith("/uploads/")
        ? process.env.EXPO_PUBLIC_BACKEND_URL + profile.user.avatarUrl
        : profile.user.avatarUrl.match(/^(https?:\/\/|\/\/)/)
        ? profile.user.avatarUrl
        : null
        );
      }
    }
  }, [profile]);

  // Add this useEffect for tracking changes
  useEffect(() => {
    // If we haven't loaded data yet, do nothing
    if (!originalData) return;

    // We'll do a simple check for any of the required fields or known fields
    const hasChanged =
      formData.name !== originalData.name ||
      formData.brandName !== originalData.brandName ||
      formData.userName !== originalData.userName ||
      formData.email !== originalData.email ||
      formData.phone !== originalData.phone ||
      formData.bio !== originalData.bio ||
      formData.link !== originalData.link ||
      formData.buythis !== originalData.buythis ||
      creatorData.achievements !== originalData.achievements ||
      creatorData.businessVentures !== originalData.businessVentures ||
      creatorData.funFact !== originalData.funFact ||
      creatorData.mostViewedTitle !== originalData.mostViewedTitle;

    setIsDirty(hasChanged);
  }, [
    formData,
    creatorData,
    originalData,
    formData.name,
    formData.brandName,
    formData.userName,
    formData.email,
    formData.phone,
    formData.bio,
    formData.link,
    formData.buythis,
    creatorData.achievements,
    creatorData.businessVentures,
    creatorData.funFact,
    creatorData.mostViewedTitle,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Always prevent default first
      e.preventDefault();

      // Only show confirmation if there are unsaved changes
      if (isDirty) {
        if (Platform.OS === "web") {
          const confirmLeave = window.confirm(
            "You have unsaved changes. Are you sure you want to leave?"
          );
          if (confirmLeave) {
            // If user confirms, allow navigation by dispatching the action
            navigation.dispatch(e.data.action);
          }
        } else {
          Alert.alert(
            "Unsaved Changes",
            "You have unsaved changes. Are you sure you want to leave?",
            [
              { text: "Cancel", style: "cancel", onPress: () => {} },
              {
                text: "Discard",
                style: "destructive",
                onPress: () => navigation.dispatch(e.data.action),
              },
            ]
          );
        }
      } else {
        // If no unsaved changes, allow navigation by dispatching the action
        navigation.dispatch(e.data.action);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [navigation, isDirty]);

  // If you have a custom back button or custom navigation:
  // we can intercept that press as well
  const onCustomBackPress = useCallback(() => {
    if (isDirty) {
      if (Platform.OS === "web") {
        const confirmLeave = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        );
        if (confirmLeave) {
          window.history.back();
        }
      } else {
        router.back();
      }
    } else {
      window.history.back();
    }
  }, [isDirty]);

  const onCustomProfilePress = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (confirmLeave) {
        router.push("/profile");
      }
    } else {
      router.push("/profile");
    }
  }, [isDirty]);

  const requiredFieldsFilled = () => {
    const { name, brandName, userName, email, phone } = formData;
    // return (
    //   name.trim().length > 0 &&
    //   brandName.trim().length > 0 &&
    //   userName.trim().length > 0 &&
    //   email.trim().length > 0 &&
    //   phone.trim().length > 0
    // );
    if (name.trim().length <= 0) {
      return "name";
    }
    if (brandName.trim().length <= 0) {
      return "brandName";
    }
    if (userName.trim().length <= 0) {
      return "userName";
    }
    if (email.trim().length <= 0) {
      return "email";
    }
    if (phone.trim().length <= 0) {
      return "phone";
    }
    return "";
  };

  const handleSave = async () => {
    // Check if required fields are empty
    if (requiredFieldsFilled()) {
      // Alert.alert(
      //   "Required Fields",
      //   "Name, Brand Name, Username, Email, and Phone are all required."
      // );

      switch (requiredFieldsFilled()) {
        case "name":
          Toast.show({
            type: "customNotification",
            text1: "Name is required",
            text2: "Please enter your name",
            position: "top",
            autoHide: true,
            visibilityTime: 3000,
            topOffset: 50,
          });
          break;
        case "brandName":
          Toast.show({
            type: "customNotification",
            text1: "Brand Name is required",
            text2: "Please enter your brand name",
            position: "top",
            autoHide: true,
            visibilityTime: 3000,
            topOffset: 50,
          });
          break;
        case "userName":
          Toast.show({
            type: "customNotification",
            text1: "Username is required",
            text2: "Please enter your username",
            position: "top",
            autoHide: true,
            visibilityTime: 3000,
            topOffset: 50,
          });
          break;
        case "email":
          Toast.show({
            type: "customNotification",
            text1: "Email is required",
            text2: "Please enter your email",
            position: "top",
            autoHide: true,
            visibilityTime: 3000,
            topOffset: 50,
          });
          break;
      }

      return;
    }

    // Validate the rest
    const nameErrs = formData.name ? validateName(formData.name) : [];
    const brandNameErrs = formData.brandName
      ? validateBrandName(formData.brandName)
      : [];
    const usernameErrs = formData.userName
      ? validateUsername(formData.userName)
      : [];
    const emailErrs = formData.email ? validateEmail(formData.email) : [];
    const phoneErrs = formData.phone ? validatePhone(formData.phone) : [];
    const bioErrs = formData.bio ? validateBio(formData.bio) : [];
    const websiteErrs = formData.link ? validateWebsite(formData.link) : [];
    const buyErrs = formData.buythis ? validateBuythis(formData.buythis) : [];

    setUsernameErrors(usernameErrs);
    setNameErrors(nameErrs);
    setBrandNameErrors(brandNameErrs);
    setEmailErrors(emailErrs);
    setPhoneErrors(phoneErrs);
    setBioErrors(bioErrs);
    setWebsiteErrors(websiteErrs);
    setBuythisErrors(buyErrs);

    // If there is any validation error, show an alert or toast
    if (
      nameErrs.length > 0 ||
      usernameErrs.length > 0 ||
      emailErrs.length > 0 ||
      phoneErrs.length > 0 ||
      bioErrs.length > 0 ||
      websiteErrs.length > 0 ||
      buyErrs.length > 0
    ) {
      Alert.alert(
        "Validation Error",
        "Please fix all validation errors before saving."
      );
      return;
    }

    // If all good, proceed
    try {
      await updateProfileMutation.mutateAsync(formData);
      await updateCreatorDataMutation.mutateAsync(creatorData);

      // After saving, set dirty to false
      setIsDirty(false);

      // Also update original data to the new state,
      // so subsequent changes can be tracked again.
      setOriginalData({
        name: formData.name,
        brandName: formData.brandName,
        userName: formData.userName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        link: formData.link,
        buythis: formData.buythis,
        achievements: creatorData.achievements,
        businessVentures: creatorData.businessVentures,
        funFact: creatorData.funFact,
        mostViewedTitle: creatorData.mostViewedTitle,
      });
    } catch (e) {
      // Error handling is in the mutation onError callbacks
    }
  };

  const handleRemoveCategory = async (index) => {
    try {
      const updatedCategories = creatorData.categories.filter(
        (_, i) => i !== index
      );
      await updateCreatorDataMutation.mutateAsync({
        ...creatorData,
        categories: updatedCategories,
      });
      setCreatorData({ ...creatorData, categories: updatedCategories });
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Category removed successfully",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove category",
      });
    }
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  if (!user?._id) {
    return <Redirect href="/UAM001Login" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navbar pageTitle="Edit Profile"/>
      <StatusBar style="dark" />
      {/* <View style={styles.header}>
        <CustomBackButton onBackPress={onCustomBackPress} />
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <ProfileInfo onProfilePress={onCustomProfilePress} />
      </View> */}
      <ScrollView>
        <View style={styles.content}>
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.avatarContainer}>
              <Image
              source={
                       avatarUrl?.startsWith("/uploads/")
                         ? {
                             uri:
                               process.env.EXPO_PUBLIC_BACKEND_URL +
                               avatarUrl,
                           }
                         : avatarUrl?.match(/^https?:\/\//)
                         ? { uri: avatarUrl }
                         : require("@/assets/empty-image.png")
                     }
                
                placeholder={require("@/assets/empty-image.png")}
                style={styles.avatar}
              />
              <Pressable style={styles.uploadButton} onPress={pickImage}>
                <Feather name="edit" size={18} />
              </Pressable>
              {/* Show loading spinner while uploading */}
                {isUploading && (
                  <View style={{ marginTop: 10 }}>
                    <ActivityIndicator size="large" color="#0000ff" />
                  </View>
                )}
            </View>
            <Text style={styles.uploadText}>
              {formData.name} {formData.brandName && `(${formData.brandName})`}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "gray",
                marginTop: 4,
              }}
            >
              {formData.userName?.includes("@")
                ? formData.userName
                : `@${formData.userName}`}
            </Text>

            {!formData.emailVerified && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#430B92",
                  padding: 14,
                  borderRadius: 10,
                  marginTop: 10,
                }}
                onPress={() => {
                  sendVerificationEmailMutation.mutate();
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  Get Verified
                </Text>
              </TouchableOpacity>
            )}

            {formData.emailVerified && (
              <View style={[styles.foodWrapper, styles.foodWrapperSpaceBlock]}>
                <Text style={[styles.food, styles.mTypo]}>Email Verified</Text>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  nameErrors.length > 0 && styles.inputError,
                ]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, name: text }));
                  setNameErrors(validateName(text));
                }}
                onFocus={() => setShowNameRequirements(true)}
                onBlur={() => setShowNameRequirements(false)}
                placeholder="Your full name"
              />
              {showNameRequirements && (
                <View style={styles.requirementsContainer}>
                  {NAME_REQUIREMENTS.map((req, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.requirementText,
                        !nameErrors.includes(req) && styles.requirementMet,
                      ]}
                    >
                      • {req}
                    </Text>
                  ))}
                </View>
              )}
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>
            {/* Brand Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand Name</Text>
              <TextInput
                style={[
                  styles.input,
                  brandNameErrors.length > 0 && styles.inputError,
                ]}
                value={formData.brandName}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, brandName: text }));
                  setBrandNameErrors(validateBrandName(text));
                }}
                onFocus={() => setShowBrandNameRequirements(true)}
                onBlur={() => setShowBrandNameRequirements(false)}
                placeholder="Your brand name"
              />
              {showBrandNameRequirements && (
                <View style={styles.requirementsContainer}>
                  {BRAND_NAME_REQUIREMENTS.map((req, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.requirementText,
                        !brandNameErrors.includes(req) && styles.requirementMet,
                      ]}
                    >
                      • {req}
                    </Text>
                  ))}
                </View>
              )}
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  usernameErrors.length > 0 && styles.inputError,
                ]}
                value={formData.userName}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, userName: text }));
                  setUsernameErrors(validateUsername(text));
                }}
                onFocus={() => setShowUsernameRequirements(true)}
                onBlur={() => setShowUsernameRequirements(false)}
                placeholder="@username"
              />
              {showUsernameRequirements && (
                <View style={styles.requirementsContainer}>
                  {USERNAME_REQUIREMENTS.map((req, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.requirementText,
                        !usernameErrors.includes(req) && styles.requirementMet,
                      ]}
                    >
                      • {req}
                    </Text>
                  ))}
                </View>
              )}
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  emailErrors.length > 0 && styles.inputError,
                ]}
                value={formData.email}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, email: text }));
                  setEmailErrors(validateEmail(text));
                }}
                onFocus={() => setShowEmailRequirements(true)}
                onBlur={() => setShowEmailRequirements(false)}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {showEmailRequirements && (
                <View style={styles.requirementsContainer}>
                  {EMAIL_REQUIREMENTS.map((req, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.requirementText,
                        !emailErrors.includes(req) && styles.requirementMet,
                      ]}
                    >
                      • {req}
                    </Text>
                  ))}
                </View>
              )}
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <ReactNativePhoneInput
                style={[
                  styles.input,
                  phoneErrors.length > 0 && styles.inputError,
                ]}
                initialCountry="us"
                ref={phoneInputRef}
                onPressFlag={() => setCountryPickerVisible(true)}
                renderFlag={(props) => (
                  <CountryPicker
                    {...{
                      countryCode: cca2,
                      withFilter: true,
                      withFlag: true,
                      withCountryNameButton: false,
                      withAlphaFilter: false,
                      withCallingCode: true,
                      withEmoji: false,
                      onSelect: selectCountry,
                    }}
                    visible={countryPickerVisible}
                    onClose={() => setCountryPickerVisible(false)}
                  />
                )}
                textProps={{
                  placeholder: "XXX-XXX-XXXX",
                  value: formData.phone,
                }}
                autoFormat
                onChangePhoneNumber={(text, iso2) => {
                  setFormData((prev) => ({ ...prev, phone: text }));
                  setCca2(iso2.toUpperCase() as CountryCode);
                  setPhoneErrors(validatePhone(text));
                }}
              />
              {showPhoneRequirements && (
                <View style={styles.requirementsContainer}>
                  {PHONE_REQUIREMENTS.map((req, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.requirementText,
                        !phoneErrors.includes(req) && styles.requirementMet,
                      ]}
                    >
                      • {req}
                    </Text>
                  ))}
                </View>
              )}
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>

            {/* Bio Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[
                  styles.textArea,
                  bioErrors.length > 0 && styles.inputError,
                ]}
                value={formData.bio}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, bio: text }));
                  setBioErrors(validateBio(text));
                }}
                onFocus={() => setShowBioRequirements(true)}
                onBlur={() => setShowBioRequirements(false)}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
              />
              {showBioRequirements && (
                <View style={styles.requirementsContainer}>
                  {BIO_REQUIREMENTS.map((req, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.requirementText,
                        !bioErrors.includes(req) && styles.requirementMet,
                      ]}
                    >
                      • {req}
                    </Text>
                  ))}
                </View>
              )}
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>

            {/* Website Input */}
            {/* <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={[
                styles.input,
                websiteErrors.length > 0 && styles.inputError,
              ]}
              value={formData.link}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, link: text }));
                setWebsiteErrors(validateWebsite(text));
              }}
              onFocus={() => setShowWebsiteRequirements(true)}
              onBlur={() => setShowWebsiteRequirements(false)}
              placeholder="https://yourwebsite.com"
              keyboardType="url"
              autoCapitalize="none"
            />
            {showWebsiteRequirements && (
              <View style={styles.requirementsContainer}>
                {WEBSITE_REQUIREMENTS.map((req, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.requirementText,
                      !websiteErrors.includes(req) && styles.requirementMet,
                    ]}
                  >
                    • {req}
                  </Text>
                ))}
              </View>
            )}
            <Vector105 style={styles.inputUnderline} width="100%" height={2} />
          </View> */}

            {/* Buythis Link Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Add Link</Text>
              <TextInput
                style={[
                  styles.input,
                  buythisErrors.length > 0 && styles.inputError,
                ]}
                value={formData.buythis}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, buythis: text }));
                  setBuythisErrors(validateBuythis(text));
                }}
                onFocus={() => setShowBuythisRequirements(true)}
                onBlur={() => setShowBuythisRequirements(false)}
                placeholder="https://yourwebsite.com"
                keyboardType="url"
                autoCapitalize="none"
              />
              {showBuythisRequirements && (
                <View style={styles.requirementsContainer}>
                  {BUYTHIS_REQUIREMENTS.map((req, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.requirementText,
                        !buythisErrors.includes(req) && styles.requirementMet,
                      ]}
                    >
                      • {req}
                    </Text>
                  ))}
                </View>
              )}
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label]}>Add Tags</Text>
              <View style={styles.tagsLabel}>
                <View style={[styles.tags]}>
                  <View style={styles.tagLabel}>
                    {creatorData.categories.map((tag, index) => (
                      <View style={styles.entertainmentParent} key={index}>
                        <Text style={[styles.entertainment]}>{tag}</Text>
                        <Pressable onPress={() => handleRemoveCategory(index)}>
                          <Cancelcircle
                            style={styles.cancelCircleIcon}
                            width={14}
                            height={14}
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <Text
                    style={[styles.entertainment]}
                    onPress={() => setShowCategoriesModal(true)}
                  >
                    + Add New
                  </Text>
                </View>
              </View>
              <Vector105
                style={styles.inputUnderline}
                width="100%"
                height={2}
              />
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Upload Media Package File</Text>
              <View style={styles.uploadSection}>
                <Cloudupload width={24} height={24} color="#430b92" />
                <View style={styles.uploadContent}>
                  <Text style={styles.uploadTitle}>Attach Media Package</Text>
                  <Text style={styles.uploadSubtext}>
                    Single file (max 200MB): pdf, gif, jpeg, png, psd
                  </Text>
                </View>
                <Pressable style={styles.browseButton} onPress={uploadDocument}>
                  <Text style={styles.browseText}>Browse Files</Text>
                </Pressable>
              </View>
              {isUploading && formData.mediaPackage?.length > 0 && (
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
              {creatorData?.portfolio?.length > 0 && (
                <View style={styles.mediaPackageContainer}>
                  <Text style={styles.mediaPackageTitle}>Media Package</Text>
                  <View style={styles.mediaPackageItem}>
                    <Text style={styles.mediaPackageUrl}>
                      {creatorData?.portfolio?.[0]?.title}
                    </Text>
                    <Pressable onPress={() => handleRemoveMediaPackage(0)}>
                      <Cancelcircle
                        style={styles.cancelCircleIcon}
                        width={14}
                        height={14}
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Most Viewed Title Input */}
            {user?.userType === "Creator" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Most Viewed Title</Text>
                <TextInput
                  style={[styles.input]}
                  value={creatorData.mostViewedTitle}
                  onChangeText={(text) => {
                    setCreatorData((prev) => ({
                      ...prev,
                      mostViewedTitle: text,
                    }));
                  }}
                  placeholder="Most Viewed Title"
                />
                <Vector105
                  style={styles.inputUnderline}
                  width="100%"
                  height={2}
                />
              </View>
            )}

            {/* Achievements Input */}

            {user?.userType === "Creator" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Achievements</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    bioErrors.length > 0 && styles.inputError,
                  ]}
                  value={creatorData.achievements}
                  onChangeText={(text) => {
                    setCreatorData((prev) => ({ ...prev, achievements: text }));
                  }}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                />

                <Vector105
                  style={styles.inputUnderline}
                  width="100%"
                  height={2}
                />
              </View>
            )}

            {/* Business Ventures Input */}
            {user?.userType === "Creator" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Ventures</Text>
                <TextInput
                  style={[styles.textArea]}
                  value={creatorData.businessVentures}
                  onChangeText={(text) => {
                    setCreatorData((prev) => ({
                      ...prev,
                      businessVentures: text,
                    }));
                  }}
                  placeholder="Tell us about your business ventures"
                  multiline
                  numberOfLines={4}
                />

                <Vector105
                  style={styles.inputUnderline}
                  width="100%"
                  height={2}
                />
              </View>
            )}

            {user?.userType === "Creator" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fun Fact</Text>
                <TextInput
                  style={[styles.input]}
                  value={creatorData.funFact}
                  onChangeText={(text) => {
                    setCreatorData((prev) => ({ ...prev, funFact: text }));
                  }}
                  placeholder="Tell us about your fun fact"
                />
                <Vector105
                  style={styles.inputUnderline}
                  width="100%"
                  height={2}
                />
              </View>
            )}

            {/* Save Button */}
            <Pressable
              style={[
                styles.saveButton,
                styles.mainButton,
                isMobile && { width: "30%" },
              ]}
              onPress={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>

            {/* Account Management */}
            <View style={styles.accountManagement}>
              <Pressable
                style={[]}
                onPress={() => setShowDeactivateModal(true)}
              >
                <Text style={styles.deactivateButtonText}>
                  Deactivate Account
                </Text>
              </Pressable>
              <Pressable style={[]} onPress={() => setShowDeleteModal(true)}>
                <Text style={styles.deactivateButtonText}>Delete Account</Text>
              </Pressable>

              {/* Platform Management */}

              <Pressable onPress={() => setShowPlatformsModal(true)}>
                <Text style={styles.deactivateButtonText}>Edit Platforms</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Modals */}
      <PlatformsModal
        visible={showPlatformsModal}
        onClose={() => setShowPlatformsModal(false)}
        initialPlatforms={creatorData.platforms}
      />
      <CategoriesModal
        visible={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        initialCategories={creatorData.categories}
      />
      <DeactivateModal
        visible={showDeactivateModal}
        deactivationStep={deactivationStep}
        setDeactivationStep={setDeactivationStep}
        deactivationPassword={deactivationPassword}
        setDeactivationPassword={setDeactivationPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        message={deactivationMessage}
        setMessage={setDeactivationMessage}
        onClose={() => {
          setShowDeactivateModal(false);
          setDeactivationStep("initial");
          setDeactivationPassword("");
        }}
        handleContinue={handleContinue}
      />
      <DeleteModal
        visible={showDeleteModal}
        setVisible={setShowDeleteModal}
        deletionStep={deletionStep}
        setDeletionStep={setDeletionStep}
        deletionReason={deletionReason}
        setDeletionReason={setDeletionReason}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deleteAccountMutation={deleteAccountMutation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  entertainment: {
    color: Color.cSK430B92500,
    fontSize: FontSize.size_xs,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  reasonsContainer: {
    marginBottom: 24,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  progressBarContainer: {
    marginTop: 10,
    width: "100%",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#430B92",
  },
  progressText: {
    fontSize: 12,
    color: "#430B92",
    marginTop: 4,
    textAlign: "center",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E2E2",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#430B92",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#430B92",
  },
  reasonText: {
    fontSize: 16,
    color: "#000000",
  },
  continueButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },

  food: {
    color: Color.colorLimegreen_100,
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.inter,
  },
  foodWrapper: {
    backgroundColor: Color.colorLimegreen_200,
    zIndex: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 10,
  },
  icons: {
    top: 19,
    left: 340,
    zIndex: 4,
    position: "absolute",
  },
  pdfTypo: {
    opacity: 0.5,
    textAlign: "left",
    fontFamily: FontFamily.interRegular,
    color: Color.cSK430B92950,
  },
  cancelCircleIcon: {},
  entertainmentParent: {
    borderRadius: Border.br_9xs,
    backgroundColor: Color.cSK430B9250,
    paddingHorizontal: Padding.p_7xs,
    paddingVertical: Padding.p_10xs,
    gap: Gap.gap_xs,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  tagLabel: {
    gap: 13,
    alignItems: "center",
    flexDirection: "row",
  },
  vectorContainer: {
    height: 67,
    alignSelf: "stretch",
  },
  groupChild3: {
    top: 35,
    left: 0,
  },
  vectorParent1: {
    height: 35,
    width: 400,
  },
  tagsLabelChild: {
    top: 38,
    left: 0,
  },
  username: {
    lineHeight: 14,
    fontSize: FontSize.size_sm,
    opacity: 0.5,
  },
  sallymcnulty: {
    lineHeight: 14,
    color: Color.cSK430B92950,
    left: 0,
    top: 0,
    position: "absolute",
  },
  sallymcnultyWrapper: {
    width: 96,
    height: 14,
    left: 0,
  },
  tags: {
    justifyContent: "space-between",
    gap: 0,
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    left: 0,
  },
  tagsLabel: {
    height: 38,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  detailText: {
    fontSize: 16,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginHorizontal: "5%",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {},
  content: {
    flex: 1,
    padding: 20,
    maxWidth: BREAKPOINTS.DESKTOP,
    width: "100%",
    marginHorizontal: "auto",
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 20,
  },
  uploadButton: {
    position: "absolute",
    right: 5,
    top: 5,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },
  uploadText: {
    fontSize: 16,
    marginTop: 4,
  },
  form: {
    gap: 24,
    // maxWidth: BREAKPOINTS.MOBILE,
    width: "100%",
    marginHorizontal: "auto",
  },
  mediaPackageContainer: {
    marginTop: 16,
  },
  mediaPackageTitle: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  mediaPackageUrl: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  mediaPackageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  input: {
    fontSize: 16,
    padding: 8,
    color: "#000000",
  },
  textArea: {
    fontSize: 16,
    padding: 8,
    color: "#000000",
    height: 100,
    textAlignVertical: "top",
  },
  inputUnderline: {
    backgroundColor: "#E2D0FB",
  },
  requirementsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F8F8F8",
    borderRadius: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#FF0000",
    marginBottom: 4,
  },
  requirementMet: {
    color: "#430B92",
  },
  inputError: {
    borderColor: "#FF0000",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  editButton: {
    backgroundColor: "#430B92",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  mainButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  accountManagement: {
    marginTop: 32,
    gap: 16,
  },
  accountManagementTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  accountButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deactivateButton: {
    backgroundColor: "#FFF0F0",
  },
  deactivateButtonText: {
    color: "#430B92",
    fontSize: 16,
  },
  deleteButton: {},
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
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
  passwordInputContainer: {
    position: "relative",
    marginBottom: 24,
  },
  passwordInput: {
    fontSize: 16,
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    color: "#000000",
    paddingRight: 48,
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  continueButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
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
  cancelButtonText: {
    color: "#666666",
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#FF0000",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  webSelect: {
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  platformModalContent: {
    maxHeight: "80%",
    width: "95%",
    maxWidth: 600,
  },
  categoryModalContent: {
    maxHeight: "80%",
    width: "95%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
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
    padding: 12,
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
  platformIcon: {
    width: 24,
    height: 24,
  },
  platformHandle: {
    flex: 1,
    fontSize: 16,
  },
  platformFollowers: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
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
  progressContainer: {
    marginTop: 10,
    width: "100%",
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
});
