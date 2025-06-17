"use client";

import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import {
  validatePassword,
  PASSWORD_REQUIREMENTS,
} from "@/utils/passwordValidation";
import axios from "axios";
import Arrowleft022 from "../assets/arrowleft022.svg";
import Vector105 from "@/assets/vector-105.svg";
import Eye from "@/assets/eye-show-up-arrow.svg";
import { Feather } from "@expo/vector-icons";
import Interfaceessentiallockpassword from "@/assets/interface-essentiallock-password.svg";
import { useSearchParams } from "expo-router/build/hooks";
import CustomBackButton from "@/components/CustomBackButton";
import Toast from "react-native-toast-message";
import ProfileInfo from "@/components/ProfileInfo";
import { useAuth } from "@/contexts/AuthContext";
const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/auth";

export default function ResetPassword() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const isMobile = window.width < BREAKPOINTS.TABLET;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong"
  >("weak");
  const params = useSearchParams();
  const phone = params.get("phone");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const handlePasswordChange = (text: string) => {
    setFormData((prev) => ({ ...prev, password: text }));
    const validation = validatePassword(text);
    setPasswordErrors(validation.errors);
    setPasswordStrength(validation.strength);
    setError(""); // Clear any previous errors
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    // Validate password
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      setError("Password does not meet requirements");
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Password doesn't match");
      return;
    }
    try {
      await axios.post(`${API_URL}/complete-password-reset`, {
        phone: phone,
        newPassword: formData.password,
      });

      Toast.show({
        type: "customNotification",
        text1: "Password reset successful",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
      setIsLoading(false);

      router.push("/UAM001Login");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar style="auto" />

      <View
        style={[
          styles.contentContainer,
          isWeb && isWideScreen && styles.webContentContainer,
        ]}
      >
        <View
          style={[styles.content, isWeb && isWideScreen && styles.webContent]}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Interfaceessentiallockpassword width={18} height={22} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Enter new password"
                value={formData.password}
                onChangeText={handlePasswordChange}
                placeholderTextColor="#6C6C6C"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {!showPassword ? (
                  <Feather name="eye" size={16} color="#6C6C6C" />
                ) : (
                  <Feather name="eye-off" size={16} color="#6C6C6C" />
                )}
              </Pressable>
            </View>
            <Vector105 style={styles.underline} width="100%" height={2} />

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              {PASSWORD_REQUIREMENTS.map((req, index) => (
                <Text
                  key={index}
                  style={[
                    styles.requirementText,
                    !passwordErrors.includes(req) && styles.requirementMet,
                  ]}
                >
                  • {req}
                </Text>
              ))}
            </View>

            {/* Password Strength */}
            <View style={styles.strengthContainer}>
              <Text style={styles.strengthText}>
                Password Strength: {passwordStrength}
              </Text>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthIndicator,
                    styles[
                      `strength${
                        passwordStrength.charAt(0).toUpperCase() +
                        passwordStrength.slice(1)
                      }`
                    ],
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Interfaceessentiallockpassword width={18} height={22} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: text }))
                }
                placeholderTextColor="#6C6C6C"
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {!showConfirmPassword ? (
                  <Feather name="eye" size={16} color="#6C6C6C" />
                ) : (
                  <Feather name="eye-off" size={16} color="#6C6C6C" />
                )}
              </Pressable>
            </View>
            <Vector105 style={styles.underline} width="100%" height={2} />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <Pressable
          style={[
            styles.saveButton,
            isWeb && isWideScreen && styles.webContinueButton,
            (!validatePassword(formData.password).isValid ||
              formData.password !== formData.confirmPassword) &&
              styles.disabledButton,
          ]}
          onPress={handleResetPassword}
          disabled={
            !validatePassword(formData.password).isValid ||
            formData.password !== formData.confirmPassword ||
            isLoading
          }
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Save Password</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webHeaderText: {
    fontSize: 24,
    textAlign: "center",
  },
  webContainer: {},
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
    marginHorizontal: "5%",
  },
  headerText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "400",
    fontFamily: "sFPro",
    color: "#430B92",
    textAlign: "center",
  },
  placeholder: {},
  contentContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  webContentContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
  },
  webContent: {
    // maxWidth: BREAKPOINTS.MOBILE,
    alignItems: "flex-start",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#6C6C6C",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#000000",
  },
  underline: {
    alignSelf: "stretch",
    backgroundColor: "#F4F4F4",
  },
  helperText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#430B92",
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    marginBottom: Platform.OS === "ios" ? 40 : 20,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  webContinueButton: {
    marginHorizontal: 0,
    marginTop: 32,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#FFFFFF",
  },
  requirementsContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#6C6C6C",
    marginBottom: 4,
    fontFamily: "interRegular",
  },
  requirementMet: {
    color: "#430B92",
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthText: {
    fontSize: 12,
    color: "#6C6C6C",
    marginBottom: 4,
    fontFamily: "interRegular",
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#F4F4F4",
    borderRadius: 2,
  },
  strengthIndicator: {
    height: "100%",
    borderRadius: 2,
    width: "33.33%",
  },
  strengthWeak: {
    backgroundColor: "#FF4D4F",
    width: "33.33%",
  },
  strengthMedium: {
    backgroundColor: "#FFA940",
    width: "66.66%",
  },
  strengthStrong: {
    backgroundColor: "#52C41A",
    width: "100%",
  },
  errorText: {
    color: "#FF4D4F",
    fontSize: 14,
    marginTop: 8,
    fontFamily: "interRegular",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
