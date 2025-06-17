import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import Arrowleft021 from "@/assets/arrowleft021.svg";
import axios from "axios";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
  MOBILE: 550,
};

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/account";

const EMAIL_REQUIREMENTS = [
  "Must be a valid email format",
  "Must contain @ symbol",
  "Must have a domain (e.g., .com)",
  "No spaces allowed",
];

const validateEmail = (email: string) => {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.includes("@")) {
    errors.push("Must contain @ symbol");
  }

  if (!email.includes(".")) {
    errors.push("Must have a domain (e.g., .com)");
  }

  if (/\s/.test(email)) {
    errors.push("No spaces allowed");
  }

  if (!emailRegex.test(email)) {
    errors.push("Must be a valid email format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default function URM05SetEmail() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { userId } = useLocalSearchParams();
  const { updateUser } = useAuth();
  const { user } = useAuth();
  const handleEmailChange = (text: string) => {
    setEmail(text);
    const validation = validateEmail(text);
    setEmailErrors(validation.errors);
  };

  const handleSave = async () => {
    const validation = validateEmail(email);
    if (validation.isValid) {
      setIsLoading(true);
      try {
        const response = await axios.post(`${BASE_URL}/set-email`, {
          userId: user?._id || userId,
          email: email.trim(),
        });

        if (response.status === 200 && user?._id) {
          await updateUser({ email: email.trim() });

          Toast.show({
            type: "customNotification",
            text1: "Thank you for providing your email",
            text2:
              "Setup your Password to keep using your account smoothly. Otherwise you will lose access",
            position: "top",
            autoHide: true,
            visibilityTime: 10000,
            topOffset: 50,
            onPress: () => {
              router.push({
                pathname: "/URM06SetPassword",
                params: {
                  userId: user?._id || userId,
                },
              });
              Toast.hide();
            },
          });

          router.push({
            pathname: "/URM04Success",
            params: {
              name: params.name,
              email: email.trim(),
            },
          });
        } else if (!!response.data.currentStep) {
          switch (response.data.currentStep) {
            case "userName":
              router.push({
                pathname: "/URM03Username",
                params: { userId: user?._id || userId },
              });
              break;
            case "name":
              router.push({
                pathname: "/URM02Name",
                params: { userId: user?._id || userId },
              });
              break;
            case "password":
              router.push({
                pathname: "/URM06SetPassword",
                params: { userId: user?._id || userId },
              });
              break;
          }
        } else {
          router.push({
            pathname: "/UAM001Login",
          });
        }
      } catch (error: any) {
        Toast.show({
          type: "customNotification",
          text1: "Error",
          text2: error.response?.data?.message || "Failed to update email",
          autoHide: true,
          visibilityTime: 10000,
          topOffset: 50,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (user?.email) {
    router.push("/profile");
  }

  return (
    <View
      style={[
        styles.contentContainer,
        isWeb && isWideScreen && styles.webContentContainer,
      ]}
    >
      <View
        style={[styles.content, isWeb && isWideScreen && styles.webContent]}
      >
        <Text style={[styles.title, isWeb && isWideScreen && styles.webTitle]}>
          What's your email?
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input]}
            value={email}
            textContentType="emailAddress"
            onChangeText={handleEmailChange}
            onFocus={() => setShowRequirements(true)}
            keyboardType="email-address"
            maxLength={30}
            placeholder="example@email.com"
            placeholderTextColor="#6C6C6C"
            autoCapitalize="none"
          />
          <View style={[styles.underline]} />

          {showRequirements && (
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
        </View>
      </View>

      <Pressable
        style={[
          styles.saveButton,
          !validateEmail(email).isValid && styles.disabledButton,
          isWeb && isWideScreen && styles.webContinueButton,
          isLoading && styles.loadingButton,
        ]}
        onPress={handleSave}
        disabled={!validateEmail(email).isValid || isLoading}
      >
        {isLoading ? (
          <Text style={styles.saveButtonText}>Setting email...</Text>
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webContainer: {},
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
    fontFamily: "interSemiBold",
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {},
  contentContainer: {
    justifyContent: "center",
    width: "100%",
  },
  webContentContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  content: {
    width: "100%",
  },
  webContent: {
    // maxWidth: BREAKPOINTS.MOBILE,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: "interSemiBold",
    color: "#000000",
    marginBottom: 32,
  },
  inputContainer: {
    marginVertical: 16,
    width: "100%",
  },
  label: {
    fontSize: 16,
    color: "#6C6C6C",
    fontFamily: "interRegular",
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontFamily: "interRegular",
    color: "#000000",
    paddingVertical: 8,
  },
  underline: {
    height: 2,
    backgroundColor: "#F4F4F4",
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
    alignSelf: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "interMedium",
  },
  disabledButton: {
    opacity: 0.5,
  },
  inputError: {
    color: "#FF4D4F",
  },
  underlineError: {
    backgroundColor: "#FF4D4F",
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
  loadingButton: {
    opacity: 0.7,
  },
  webTitle: {
    textAlign: "center",
    width: "100%",
  },
});
