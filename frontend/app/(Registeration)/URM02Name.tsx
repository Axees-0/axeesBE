import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import Arrowleft021 from "@/assets/arrowleft021.svg";
import axios from "axios";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
import { validateName, NAME_REQUIREMENTS } from "@/utils/nameValidation";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
  MOBILE: 550,
};

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/account";

export default function URM02Name() {
  const [name, setName] = useState("");
  const [nameErrors, setNameErrors] = useState<string[]>([]);
  const [showRequirements, setShowRequirements] = useState(false);
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;

  const { updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();

  const handleNameChange = (text: string) => {
    // Capitalize the first letter
    const cappedText = text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    setName(cappedText);
    const validation = validateName(cappedText);
    setNameErrors(validation.errors);
  };

  const handleSave = async () => {
    setIsLoading(true);
    const validation = validateName(name);
    if (!validation.isValid) {
      Toast.show({
        type: "error",
        text1: "Invalid Name",
        text2: validation.errors[0],
      });
      setIsLoading(false);
      return;
    }

    try {
      const nameToSend = name.trim();

      const response = await axios.post(`${BASE_URL}/update-name`, {
        userId: user?._id || userId,
        name: nameToSend,
      });

      updateUser({ name: nameToSend });

      if (response.status === 200 && user?._id) {
        Toast.show({
          type: "customNotification",
          text1: "Thank you for providing your name",
          text2:
            "Setup your Username to keep using your account smoothly. Otherwise you will lose access",
          position: "top",
          autoHide: true,
          visibilityTime: 10000,
          topOffset: 50,
          onPress: () => {
            router.push({
              pathname: "/URM03Username",
              params: { userId: user?._id || userId },
            });
            Toast.hide();
          },
        });

        router.push({
          pathname: "/URM04Success",
          params: {
            name: nameToSend,
            userId: user?._id || userId,
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
        text2: error.response?.data?.message || "Failed to update name",
        position: "top",
        autoHide: true,
        visibilityTime: 10000,
        topOffset: 50,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const preventClipboardActions = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isMac =
      Platform.OS === "macos" ||
      (Platform.OS === "web" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    const modifierKeyPressed = isMac ? e.metaKey : e.ctrlKey;

    // Check for Paste (Cmd+V / Ctrl+V)
    if (modifierKeyPressed && (e.key === "v" || e.code === "KeyV")) {
      e.preventDefault();
      return;
    }

    // Check for Copy (Cmd+C / Ctrl+C)
    if (modifierKeyPressed && (e.key === "c" || e.code === "KeyC")) {
      e.preventDefault(); // Prevent copying *from* the field
      return;
    }

    // Check for Cut (Cmd+X / Ctrl+X)
    if (modifierKeyPressed && (e.key === "x" || e.code === "KeyX")) {
      e.preventDefault(); // Prevent cutting *from* the field
      return;
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      // Disable Right click
      document.addEventListener("contextmenu", (event) =>
        event.preventDefault()
      );
    }
  }, []);

  if (user?.name) {
    router.push("/profile");
  }

  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar />

      <View
        style={[
          styles.contentContainer,
          isWeb && isWideScreen && styles.webContentContainer,
        ]}
      >
        <View
          style={[styles.content, isWeb && isWideScreen && styles.webContent]}
        >
          <Text style={styles.title}>How will other users see you?</Text>
          <View style={styles.inputContainer}>
            {Platform.OS === "web" ? (
              <input
                style={{
                  ...styles.input,
                  border: "none",
                  width: "100%",
                  fontSize: 18,
                }}
                value={name}
                onPaste={preventClipboardActions}
                onCopy={preventClipboardActions}
                onFocus={() => setShowRequirements(true)}
                onCut={preventClipboardActions}
                onKeyDown={handleKeyDown}
                onBeforeInput={(e: any) => {
                  console.log("e.inputType", e.inputType);
                  if (e.inputType === "insertFromPaste") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            ) : (
              <TextInput
                style={[styles.input]}
                value={name}
                onChangeText={handleNameChange}
                onFocus={() => setShowRequirements(true)}
                maxLength={30}
                placeholder="Enter your name"
                placeholderTextColor="#6C6C6C"
                contextMenuHidden={true}
                autoCapitalize="words"
                autoCorrect={false}
                // Add platform-specific handlers
              />
            )}
            <View style={[styles.underline]} />

            {showRequirements && (
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
          </View>
        </View>

        <Pressable
          style={[
            styles.saveButton,
            !validateName(name).isValid && styles.disabledButton,
            isWeb && isWideScreen && styles.webContinueButton,
            isLoading && styles.loadingButton,
          ]}
          onPress={handleSave}
          disabled={!validateName(name).isValid || isLoading}
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>Setting name...</Text>
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
  webContainer: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
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
    marginHorizontal: 20,
    marginBottom: Platform.OS === "ios" ? 40 : 20,
    borderRadius: 12,
    alignItems: "center",
  },
  webContinueButton: {
    marginHorizontal: 0,
    marginTop: 32,
    alignSelf: "center",
    width: "100%",
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
    opacity: 0.5,
  },
});
