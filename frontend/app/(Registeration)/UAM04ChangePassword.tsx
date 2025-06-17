"use client";

import React, { useState, useRef } from "react";
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
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import ReactNativePhoneInput, {
  ReactNativePhoneInputProps,
} from "react-native-phone-input";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";

import Vector1051 from "@/assets/vector-1051.svg";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import Group1000000859 from "@/assets/group-1000000859.svg";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/auth";

export default function ChangePassword() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();

  // Phone and OTP states
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [cca2, setCca2] = useState<CountryCode>("US");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const phoneInputRef = useRef<ReactNativePhoneInputProps>(null);

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      // Clean up phone number by removing spaces, +, and -
      const formattedPhone = phone.replace(/[\s-]/g, "");

      if (formattedPhone !== user?.phone) {
        throw new Error("Phone number doesn't match registered number");
      }
      const response = await axios.post(`${API_URL}/password-reset`, {
        phone: formattedPhone,
      });
      return response.data;
    },
    onSuccess: () => {
      router.push({
        pathname: "/ULM3OTP",
        params: { phone, type: "forgot" },
      });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || error.message);
    },
  });

  const selectCountry = (country: Country) => {
    setCca2(country.cca2);
    phoneInputRef.current?.selectCountry(country.cca2.toLocaleLowerCase());
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.keyboardAvoidingView,
          isWeb && isWideScreen && styles.webContainer,
        ]}
      >
        <View style={styles.contentContainer}>
          {/* Phone Input Section */}
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
            <Vector1051 style={styles.underline} width={"100%"} height={2} />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
          <Pressable
            style={[
              styles.saveButton,
              isWeb && isWideScreen && styles.webButton,
              sendOtpMutation.isPending && styles.disabledButton,
            ]}
            onPress={() => sendOtpMutation.mutate()}
            disabled={sendOtpMutation.isPending || !phone}
          >
            {sendOtpMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Send OTP</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
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
  placeholder: {},
  contentContainer: {
    paddingTop: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
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
    opacity: 0.5,
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
  errorText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#FF0000",
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#430B92",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  webButton: {
    alignSelf: "center",
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
  disabledButton: {
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
