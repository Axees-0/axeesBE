"use client";

import React, { useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Dimensions,
  Platform,
  useWindowDimensions,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, Redirect, router } from "expo-router";
import Group1000000859 from "@/assets/group-1000000859.svg";
import Vector105 from "@/assets/vector-105.svg";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import ReactNativePhoneInput, {
  ReactNativePhoneInputProps,
} from "react-native-phone-input";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/auth";

export default function ForgotPassword() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const isMobile = window.width < BREAKPOINTS.TABLET;
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [cca2, setCca2] = useState<CountryCode>("US");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const phoneInputRef = useRef<ReactNativePhoneInputProps>(null);

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_URL}/password-reset`, {
        phone,
      });
      return response.data;
    },
    onSuccess: (data) => {
      router.push({
        pathname: "/ULM3OTP",
        params: { phone, type: "forgot" },
      });
    },
    onError: (error) => {
      console.error(error);
      setError(error.response.data.message);
    },
  });

  const selectCountry = (country: Country) => {
    setCca2(country.cca2);
    phoneInputRef.current?.selectCountry(country.cca2.toLocaleLowerCase());
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
          <Text
            style={[
              styles.titleText,
              isWeb && isWideScreen && styles.webTitleText,
            ]}
          >
            Reset your Password
          </Text>
          <Text
            style={[
              styles.subtitleText,
              isWeb && isWideScreen && styles.webSubtitleText,
            ]}
          >
            Enter your registered phone no to reset your password
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone No</Text>
            <View style={styles.inputWrapper}>
              <Group1000000859 width={26} height={22} />
              <ReactNativePhoneInput
                style={styles.input}
                initialCountry="us"
                ref={phoneInputRef}
                onPressFlag={() => setCountryPickerVisible(true)}
                renderFlag={(props) => (
                  <CountryPicker
                    {...{
                      countryCode: cca2 as CountryCode,
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
                }}
                autoFormat
                onChangePhoneNumber={(text, iso2) => {
                  setPhone(text);
                  setCca2(iso2.toUpperCase() as CountryCode);
                }}
              />
            </View>
            <Vector105 style={styles.underline} width={"100%"} height={2} />
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[
            styles.sendOtpButton,
            !phone && styles.disabledButton,
            isWeb && isWideScreen && styles.webContinueButton,
          ]}
          disabled={!phone}
          onPress={() => sendOtpMutation.mutate()}
        >
          {sendOtpMutation.isPending ? (
            <Text style={styles.sendOtpText}>Sending...</Text>
          ) : (
            <Text style={styles.sendOtpText}>Send OTP</Text>
          )}
        </Pressable>

        {error && error.includes("No user") && (
          <Text style={styles.resendText}>
            <Text style={styles.resendTextGray}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/URM01CreateAccount")}
            >
              <Text style={styles.resendTextPurple}>Create account</Text>
            </TouchableOpacity>
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  webSubtitleText: {
    textAlign: "center",
    width: "100%",
    marginHorizontal: "auto",
  },

  phoneInput: {
    height: 48,
    paddingHorizontal: 12,
    width: "100%",
  },
  webHeaderText: {
    textAlign: "center",
    width: "100%",
    marginHorizontal: "auto",
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
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {
    width: 100,
  },
  contentContainer: {
    width: "100%",
    alignSelf: "center",
    height: "100%",
    justifyContent: "center",
  },
  webContentContainer: {
    justifyContent: "center",
    alignItems: "center",
    maxWidth: BREAKPOINTS.DESKTOP,
  },
  content: {
    width: "100%",
  },
  webContent: {
    // maxWidth: BREAKPOINTS.MOBILE,
    width: "100%",
  },
  titleText: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#000000",
    marginBottom: 8,
  },
  errorText: {
    color: "red",
    marginBottom: 16,
  },
  webTitleText: {
    textAlign: "center",
    width: "100%",
    marginHorizontal: "auto",
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#6C6C6C",
    marginBottom: 32,
  },
  inputContainer: {
    marginTop: 16,
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
  sendOtpButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    marginBottom: Platform.OS === "ios" ? 40 : 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  webContinueButton: {
    marginHorizontal: 0,
    marginTop: 32,
    alignSelf: "center",
    width: "100%",
  },
  sendOtpText: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: "interRegular",
    textAlign: "center",
  },
  resendTextGray: {
    color: "#6C6C6C",
  },
  resendTextPurple: {
    color: "#430B92",
  },
});
