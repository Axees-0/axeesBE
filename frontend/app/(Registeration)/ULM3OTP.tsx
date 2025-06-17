"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import Frame1000000896 from "@/assets/frame-1000000896.svg";
import { useSearchParams } from "expo-router/build/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

const BREAKPOINTS = {
  MOBILE: 375,
  TABLET: 768,
  DESKTOP: 1280,
};

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/auth";

export default function OTPScreen() {
  const params = useSearchParams();
  const phone = params.get("phone");
  const type = params.get("type");
  const { updateUser, user } = useAuth();
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const inputRefs = Array(4)
    .fill(0)
    .map(() => React.createRef<TextInput>());
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const deviceToken = await AsyncStorage.getItem("deviceToken");
      let response;
      if (type === "forgot") {
        response = await axios.post(`${BASE_URL}/register/verify-reset-otp`, {
          code,
          phone,
          deviceToken: deviceToken,
        });
      } else {
        response = await axios.post(`${BASE_URL}/register/verify-otp`, {
          code,
          phone,
          deviceToken: deviceToken,
        });
      }
      return response.data;
    },
    onSuccess: (response: any) => {
      setError(null);
      updateUser({ ...response.user, token: response.token });
      setTimeout(() => {
        if (type === "forgot") {
          router.push({
            pathname: "/ULM4ResetPassword",
            params: { phone },
          });
        } else {
          Toast.show({
            type: "customNotification",
            text1: "Thank you and welcome to Axees",
            text2:
              "How will others see you? Setup your name to keep using your account smoothly. Otherwise you will lose access",
            position: "top",
            autoHide: true,
            visibilityTime: 10000,
            topOffset: 50,
            onPress: () => {
              router.push({
                pathname: "/URM02Name",
                params: { userId: response.user._id },
              });
            },
          });

          router.push({
            pathname: "/URM04Success",
          });
        }
      }, 10000);
    },
    onError: (error: any) => {
      console.error("OTP verification failed:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("OTP verification failed. Please try again.");
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${BASE_URL}/resend-otp`, { phone });
      return response.data;
    },
    onSuccess: (data) => {
      setTimer(300); // Reset timer to 5 minutes
      setCanResend(false);
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.error || "Failed to resend code",
      });
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setCanResend(true);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timer]);

  useEffect(() => {
    if (verifyMutation.isSuccess) {
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Phone number verified!",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    }
  }, [verifyMutation.isSuccess]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // If all digits are entered, verify OTP
    if (index === 3 && text) {
      verifyMutation.mutate(newOtp.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View
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
          <Text style={styles.titleText}>Verify Phone Number</Text>
          <Text style={styles.subtitleText}>
            We've sent you an OTP on your phone number. Enter it below
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputContainer}>
                {digit ? (
                  <View style={styles.filledDigit}>
                    <Text style={styles.otpText}>{digit}</Text>
                  </View>
                ) : (
                  <Frame1000000896 width={63} height={63} />
                )}
                <TextInput
                  ref={inputRefs[index]}
                  style={styles.hiddenInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              </View>
            ))}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {verifyMutation.isPending && (
            <Text style={styles.loadingText}>Verifying...</Text>
          )}

          <Text style={styles.resendText}>
            <Text style={styles.resendTextGray}>Haven't received OTP? </Text>
            {!canResend ? (
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            ) : (
              <Text
                style={[
                  styles.resendTextPurple,
                  resendMutation.isPending && styles.disabledText,
                ]}
                onPress={() =>
                  !resendMutation.isPending && resendMutation.mutate()
                }
              >
                Try again
              </Text>
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    width: "100%",
  },
  webContainer: {
    marginHorizontal: "auto",
    width: "100%",
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
    fontSize: 20,
    fontFamily: "sFPro",
    textAlign: "center",
    color: "#430B92",
    fontWeight: "400",
  },
  placeholder: {},
  contentContainer: {
    flex: 1,
    width: "100%",
    marginHorizontal: "auto",
    maxWidth: BREAKPOINTS.TABLET,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  webContentContainer: {
    justifyContent: "center",
    alignItems: "center",
    maxWidth: BREAKPOINTS.DESKTOP,
  },
  content: {
    padding: 20,
    width: "100%",
  },
  webContent: {
    maxWidth: BREAKPOINTS.TABLET,
    alignItems: "center",
  },
  titleText: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: "interSemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: "interRegular",
    color: "#6C6C6C",
    marginBottom: 32,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  otpInputContainer: {
    position: "relative",
    width: 63,
    height: 63,
  },
  filledDigit: {
    width: "100%",
    height: "100%",
    backgroundColor: "#430B92",
    borderRadius: 31.5,
    justifyContent: "center",
    alignItems: "center",
  },
  otpText: {
    fontSize: 32,
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: "interMedium",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  resendText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  resendTextGray: {
    color: "#6C6C6C",
    fontFamily: "interRegular",
  },
  resendTextPurple: {
    color: "#430B92",
    fontFamily: "interRegular",
  },
  timerText: {
    color: "#430B92",
    fontFamily: "interRegular",
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    color: "#430B92",
    fontFamily: "interRegular",
  },
  resetButton: {
    backgroundColor: "#430B92",
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  webButton: {
    alignSelf: "center",
    marginHorizontal: "auto",
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: "interMedium",
  },
  successOverlay: {
    backgroundColor: "rgba(67, 11, 146, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  successText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "interSemiBold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 8,
    fontSize: 14,
    fontFamily: "interRegular",
  },
  disabledText: {
    color: "#CCCCCC",
  },
});
