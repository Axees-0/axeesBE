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

const USERNAME_REQUIREMENTS = [
  "At least 8 characters",
  "Only letters, numbers, and underscores",
  "Cannot start with a number",
  "No spaces allowed",
];

const validateUsername = (username: string) => {
  const errors: string[] = [];

  // Remove @ if it exists at the start
  const cleanUsername = username.startsWith("@") ? username.slice(1) : username;

  if (cleanUsername.length < 8) {
    errors.push("At least 8 characters");
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(cleanUsername)) {
    if (/^\d/.test(cleanUsername)) {
      errors.push("Cannot start with a number");
    }
    if (/\s/.test(cleanUsername)) {
      errors.push("No spaces allowed");
    }
    if (!/^[a-zA-Z0-9_]*$/.test(cleanUsername)) {
      errors.push("Only letters, numbers, and underscores");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanUsername,
  };
};

export default function URM03Username() {
  const params = useLocalSearchParams();
  const [username, setUsername] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);
  const [usernameErrors, setUsernameErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { userId } = useLocalSearchParams();
  const { updateUser } = useAuth();
  const { user } = useAuth();

  const handleUsernameChange = (text: string) => {
    // Always ensure @ is at the start
    const formattedText = text.startsWith("@") ? text : "@" + text;
    setUsername(formattedText);

    // Validate without the @ symbol
    const validation = validateUsername(text);
    setUsernameErrors(validation.errors);
  };

  const handleSave = async () => {
    const validation = validateUsername(username);
    if (validation.isValid) {
      setIsLoading(true);
      try {
        const response = await axios.post(`${BASE_URL}/update-username`, {
          userId: user?._id || userId,
          username: validation.cleanUsername, // Send without @ symbol
        });

        if (response.status === 200 && user?._id) {
          await updateUser({ username: validation.cleanUsername });

          Toast.show({
            type: "customNotification",
            text1: "Thank you for providing your Username",
            text2:
              "Setup your Email to keep using your account smoothly. Otherwise you will lose access",
            position: "top",
            autoHide: true,
            visibilityTime: 10000,
            topOffset: 50,
            onPress: () => {
              router.push({
                pathname: "/URM05SetEmail",
                params: {
                  name: params.name,
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
              username: validation.cleanUsername,
            },
          });
        } else if (!!response.data.currentStep) {
          switch (response.data.currentStep) {
            case "name":
              router.push({
                pathname: "/URM02Name",
                params: { userId: user?._id || userId },
              });
              break;
            case "email":
              router.push({
                pathname: "/URM05SetEmail",
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
          text2: error.response?.data?.error || "Failed to update username",
          position: "top",
          autoHide: true,
          visibilityTime: 10000,
          topOffset: 50,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (user?.username) {
    router.push("/profile");
  }

  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <View
        style={[
          styles.contentContainer,
          isWeb && isWideScreen && styles.webContentContainer,
        ]}
      >
        <View
          style={[styles.content, isWeb && isWideScreen && styles.webContent]}
        >
          <Text
            style={[styles.title, isWeb && isWideScreen && styles.webTitle]}
          >
            How do you want to be known on this platform?
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input]}
                value={username}
                onChangeText={handleUsernameChange}
                onFocus={() => setShowRequirements(true)}
                placeholder="@username"
                placeholderTextColor="#6C6C6C"
                maxLength={30}
              />
            </View>
            <View style={[styles.underline]} />

            {showRequirements && (
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
          </View>
        </View>

        <Pressable
          style={[
            styles.saveButton,
            !validateUsername(username).isValid && styles.disabledButton,
            isWeb && isWideScreen && styles.webContinueButton,
            isLoading && styles.loadingButton,
          ]}
          onPress={handleSave}
          disabled={!validateUsername(username).isValid || isLoading}
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>Setting username...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
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
    flex: 1,
    marginHorizontal: "auto",
    gap: 20,
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
  title: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: "interSemiBold",
    color: "#000000",
    marginBottom: 32,
  },
  inputContainer: {
    marginTop: 16,
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
  },
  webContinueButton: {
    width: "100%",
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  webTitle: {
    width: "100%",
  },
});
