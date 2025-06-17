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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Interfaceessentiallockpassword from "@/assets/interface-essentiallock-password.svg";
import Vector105 from "@/assets/vector-105.svg";
import {
  validatePassword,
  PASSWORD_REQUIREMENTS,
} from "@/utils/passwordValidation";
import CustomBackButton from "@/components/CustomBackButton";
import { useAuth } from "@/contexts/AuthContext";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
  MOBILE: 550,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/account";

export default function SetPassword() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [error, setError] = useState("");
  const { userId } = useLocalSearchParams();
  const { user, updateUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong"
  >("weak");

  const setPasswordMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const response = await axios.post(`${API_URL}/set-password`, {
        ...data,
        userId: user?._id || userId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      updateUser({ ...data.user, password: data.user.password });
      router.push("/(tabs)");
    },
    onError: (error: any) => {
      console.error("Password setup failed:", error);
      // Show error message to user
    },
  });

  const handlePasswordChange = (text: string) => {
    setFormData((prev) => ({ ...prev, password: text }));
    const validation = validatePassword(text);
    setPasswordErrors(validation.errors);
    setPasswordStrength(validation.strength as "weak" | "medium" | "strong");
  };

  const handleSetPassword = () => {
    // Validate password before submission
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      setError("Password does not meet requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password doesn't match");
      return;
    }

    setPasswordMutation.mutate({ password: formData.password });
  };

  if (user?.password) {
    router.push("/profile");
  }

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
          <Text style={styles.welcomeText}>Create Password</Text>
          <Text style={styles.subtitleText}>
            Set a secure password for your account
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Interfaceessentiallockpassword width={18} height={22} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
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

            {/* Password requirements */}
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

            {/* Password strength indicator */}
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
                placeholder="Confirm your password"
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
            styles.setPasswordButton,
            isWeb && isWideScreen && styles.webContinueButton,
          ]}
          onPress={handleSetPassword}
          disabled={setPasswordMutation.isPending}
        >
          <Text style={styles.setPasswordButtonText}>
            {setPasswordMutation.isPending
              ? "Setting password..."
              : "Set Password"}
          </Text>
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
  webContainer: {
    marginHorizontal: "auto",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
    marginHorizontal: "5%",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "sFProDisplaySemibold",
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {},
  contentContainer: {
    flex: 1,
    width: "100%",
    marginHorizontal: "auto",
    // maxWidth: BREAKPOINTS.MOBILE,
    justifyContent: "center",
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
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: "sFProDisplaySemibold",
    color: "#000000",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: "interRegular",
    color: "#6C6C6C",
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: "interRegular",
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
    fontFamily: "interRegular",
    color: "#000000",
  },
  underline: {
    alignSelf: "stretch",
    backgroundColor: "#F4F4F4",
  },
  setPasswordButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    marginBottom: Platform.OS === "ios" ? 40 : 20,
    borderRadius: 12,
    alignItems: "center",
  },
  webContinueButton: {
    width: "100%",
    marginHorizontal: 0,
    marginTop: 32,
    alignSelf: "center",
  },
  setPasswordButtonText: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "interMedium",
    color: "#FFFFFF",
  },
  errorText: {
    color: "red",
    marginHorizontal: 20,
    marginTop: 12,
  },
  requirementsContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#FF4D4F",
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
});
