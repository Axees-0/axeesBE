import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import PhoneInput from "react-native-phone-input";
import Vector105 from "@/assets/vector-105.svg";
import { FontFamily } from "@/GlobalStyles";
import { useAuth } from "@/contexts/AuthContext";

import ReactNativePhoneInput, {
  ReactNativePhoneInputProps,
} from "react-native-phone-input";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import CustomBackButton from "@/components/CustomBackButton";

const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
};

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/auth";

const isValidUSPhoneNumber = (phone: string) => {
  const cleanedPhone = phone.replace(/\D/g, "");
  return cleanedPhone.length === 11;
};

export default function PhoneScreen() {
  const params = useLocalSearchParams();
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { updateUser } = useAuth();

  const registerMutation = useMutation({
    mutationFn: async (data: { phone: string; userType: string }) => {
      if (!isValidUSPhoneNumber(data.phone)) {
        setError("Invalid phone number format. Please use XXX-XXX-XXXX.");
        return;
      }
      const response = await axios.post(`${BASE_URL}/register/start`, data);
      await updateUser({ phone: data.phone, userType: data.userType });
      return response.data;
    },
    onSuccess: () => {
      setError(null);
      if (isValidUSPhoneNumber(phone)) {
        router.push({
          pathname: "/ULM3OTP",
          params: { phone },
        });
      } else {
        setError("Invalid phone number format. Please use XXX-XXX-XXXX.");
      }
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message || "Registration failed. Please try again.");
      }
    },
  });

  const handleContinue = () => {
    if (phone) {
      registerMutation.mutate({ phone, userType: params.userType as string });
    } else {
      setError("Please enter a valid phone number.");
    }
  };

  const [cca2, setCca2] = useState<CountryCode>("US");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const phoneInputRef = useRef<ReactNativePhoneInputProps>(null);

  const selectCountry = (country: Country) => {
    setCca2(country.cca2);
    phoneInputRef.current?.selectCountry(country.cca2.toLocaleLowerCase());
  };

  return (
    <View
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
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
              Register your Account
            </Text>

            <Text
              style={[
                styles.description,
                isWeb && isWideScreen && styles.webDescription,
              ]}
            >
              Enter your phone no to get started.
            </Text>

            <View style={styles.phoneSection}>
              <Text style={styles.label}>Phone Number</Text>
              <ReactNativePhoneInput
                style={{ width: "100%" }}
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
              <Vector105 style={styles.underline} width="100%" height={2} />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </View>

          <Pressable
            style={[
              styles.continueButton,
              !phone && styles.disabledButton,
              isWeb && isWideScreen && styles.webContinueButton,
            ]}
            onPress={handleContinue}
            disabled={!phone || registerMutation.isPending}
          >
            <Text style={styles.continueButtonText}>
              {registerMutation.isPending ? "Please wait..." : "Continue"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    width: "100%",
  },
  description: {
    fontSize: 14,
    color: "#6C6C6C",
    marginBottom: 32,
    fontFamily: FontFamily.inter,
    width: "100%",
  },
  webContainer: {
    marginHorizontal: "5%",
    width: "100%",
  },
  webDescription: {
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: "auto",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  headerText: {
    fontSize: 20,
    fontFamily: "sFPro",
    textAlign: "center",
    color: "#430B92",
    fontWeight: "400",
  },
  webContentContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  placeholder: {},
  content: {
    width: "100%",
  },
  webContent: {
    // maxWidth: BREAKPOINTS.MOBILE,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 10,
    fontFamily: FontFamily.inter,
    textAlign: "left",
    width: "100%",
  },
  webTitle: {
    textAlign: "center",
  },
  phoneSection: {
    width: "100%",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
    fontFamily: FontFamily.inter,
  },
  phoneInput: {
    height: 48,
    width: "100%",
  },
  underline: {
    width: "100%",
  },
  errorText: {
    color: "red",
    marginVertical: 8,
  },
  continueButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    marginBottom: Platform.OS === "ios" ? 40 : 20,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  webContinueButton: {
    width: "100%",
    marginHorizontal: 0,
    marginTop: 32,
    alignSelf: "center",
  },
  disabledButton: {
    backgroundColor: "#E2E2E2",
  },
  continueButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "500",
    fontFamily: FontFamily.inter,
  },
});
