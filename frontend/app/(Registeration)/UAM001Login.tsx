import React, { useRef, useState, useEffect } from "react";
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
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import Logo from "@/assets/Logo.svg";
import Arrowleft02 from "@/assets/arrowleft021.svg";
import Group1000000859 from "@/assets/group-1000000859.svg";
import Interfaceessentiallockpassword from "@/assets/interface-essentiallock-password.svg";
import Vector105 from "@/assets/vector-105.svg";
import ReactNativePhoneInput, {
  ReactNativePhoneInputProps,
} from "react-native-phone-input";
import { useAuth } from "@/contexts/AuthContext";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { Feather } from "@expo/vector-icons";
import CustomBackButton from "@/components/CustomBackButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthRateLimiter } from "@/utils/AuthRateLimiter";
import { showErrorToast } from "@/utils/errorHandler";
import { metrics } from "@/utils/metrics";

// Demo Mode Imports
import { DEMO_MODE, DemoConfig, DemoUsers, demoLog } from "@/demo/DemoMode";
import { DemoAPI } from "@/demo/DemoAPI";
import { BREAKPOINTS, isMobile, isWideScreen } from "@/constants/breakpoints";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/auth";

export default function Login() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWide = isWideScreen(window.width);
  const isMobileDevice = isMobile(window.width);
  const { updateUser } = useAuth();
  const [cca2, setCca2] = useState<CountryCode>("US");
  const [country, setCountry] = useState<Country>();
  const [error, setError] = useState<string>("");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const phoneInputRef = useRef<ReactNativePhoneInputProps>(null);
  const { user } = useAuth();
  const selectCountry = (country: Country) => {
    setCca2(country.cca2);
    setCountry(country);
    phoneInputRef.current?.selectCountry(country.cca2.toLocaleLowerCase());
  };

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  // Demo Mode Auto-Login Effect
  useEffect(() => {
    if (DEMO_MODE && DemoConfig.autoLogin) {
      demoLog('Auto-login enabled, redirecting to dashboard');
      
      // Get demo user based on config
      const demoUser = DemoUsers[DemoConfig.autoLoginAs as keyof typeof DemoUsers];
      
      // Simulate fast login process for demo performance
      setTimeout(() => {
        updateUser({
          ...demoUser,
          token: 'demo-token-12345',
        });
        
        // Redirect to dashboard
        router.push('/(tabs)');
      }, 500); // Reduced delay for better demo performance
      
      return;
    }
  }, []);

  // Early return if demo mode
  if (DEMO_MODE && DemoConfig.autoLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Logo width={200} height={60} />
          <Text style={styles.demoText}>Demo Mode - Auto Login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const loginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Use demo API in demo mode
      if (DEMO_MODE) {
        demoLog('Using demo login API');
        return await DemoAPI.auth.login(data.phone, data.password);
      }
      
      // Normal login flow
      const deviceToken = await AsyncStorage.getItem("deviceToken");
      const response = await axios.post(`${API_URL}/login`, {
        ...data,
        deviceToken,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Reset rate limit on successful login
      const rateLimiter = getAuthRateLimiter();
      rateLimiter.resetAttempts(formData.phone);
      
      // Store auth token/user data
      updateUser({ ...data.user, token: data.token });
      // Check for redirect route in session storage
      const redirectRoute = sessionStorage.getItem("redirectAfterLogin");
      if (redirectRoute) {
        // Remove the redirect route from session storage
        sessionStorage.removeItem("redirectAfterLogin");
        // Redirect to the stored route
        router.push(redirectRoute as any);
      } else {
        router.push("/(tabs)");
      }
    },
    onError: (error: any) => {
      // Record failed login attempt
      const rateLimiter = getAuthRateLimiter();
      rateLimiter.recordFailedAttempt(formData.phone);
      
      // Track auth failure in metrics
      const reason = error.response?.data?.message || error.message || 'Unknown error';
      metrics.trackAuthFailure(reason, formData.phone);
      
      updateUser({
        ...error.response.data.user,
        token: error.response.data.token,
      });

      if (error.response.status === 403) {
        if (error.response.data.currentStep === "name") {
          router.push({
            pathname: "/URM02Name",
            params: { userId: error.response.data.userId || user?._id },
          });
        } else if (error.response.data.currentStep === "userName") {
          router.push({
            pathname: "/URM03Username",
            params: { userId: error.response.data.userId || user?._id },
          });
        } else if (error.response.data.currentStep === "email") {
          router.push({
            pathname: "/URM05SetEmail",
            params: { userId: error.response.data.userId || user?._id },
          });
        } else if (error.response.data.currentStep === "password") {
          router.push({
            pathname: "/URM06SetPassword",
            params: { userId: error.response.data.userId || user?._id },
          });
        }
      }

      setError(error.response.data.message);
      // Show error message to user
    },
  });

  const handleLogin = () => {
    // Skip rate limiting in demo mode
    if (!DEMO_MODE) {
      // Check rate limiting for normal mode
      const rateLimiter = getAuthRateLimiter();
      const rateLimitCheck = rateLimiter.checkAttempt(formData.phone);
      
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message || 'Too many login attempts');
        showErrorToast(new Error(rateLimitCheck.message || 'Too many login attempts'));
        return;
      }
    }
    
    loginMutation.mutate(formData);
  };

  if (user?._id) {
    return <Redirect href="/" />;
  }

  return (
    <View style={[styles.container]}>
      <View
        style={[
          styles.contentContainer,
          isWeb && isWide && styles.webContentContainer,
        ]}
      >
        <View
          style={[styles.content, isWeb && isWide && styles.webContent]}
        >
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitleText}>
            Enter your credentials to log in your account
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
                  setFormData((prev) => ({ ...prev, phone: text }));
                  setCca2(iso2.toUpperCase() as CountryCode);
                }}
              />
            </View>
            <Vector105 style={styles.underline} width="100%" height={2} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Interfaceessentiallockpassword width={18} height={22} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, password: text }))
                }
                placeholderTextColor="#6C6C6C"
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityHint="Toggle password visibility"
              >
                {!showPassword ? (
                  <Feather name="eye" size={16} color="#6C6C6C" />
                ) : (
                  <Feather name="eye-off" size={16} color="#6C6C6C" />
                )}
              </Pressable>
            </View>
            <Vector105 style={styles.underline} width="100%" height={2} />

            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <Pressable
            onPress={() => router.push("/ULM02ForgotPassword")}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>
          <Pressable
            style={[
              styles.loginButton,
              isWeb && isWide && styles.webContinueButton,
            ]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            <Text style={styles.loginButtonText}>
              {loginMutation.isPending ? "Logging in..." : "Log in"}
            </Text>
          </Pressable>
          <Text style={styles.resendText}>
            <Text style={styles.resendTextGray}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/URM01CreateAccount")}
            >
              <Text style={styles.resendTextPurple}>Create account</Text>
            </TouchableOpacity>
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
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  webContainer: {
    marginHorizontal: "auto",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
    marginHorizontal: "5%",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 20,
    fontFamily: "sFPro",
    textAlign: "center",
    color: "#430B92",
    fontWeight: "400",
  },
  placeholder: {},
  contentContainer: {
    // maxWidth: BREAKPOINTS.MOBILE,
    justifyContent: "center",
    flex: 1,
  },
  webContentContainer: {
    justifyContent: "center",
    alignItems: "center",
    // maxWidth: BREAKPOINTS.DESKTOP,
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  webContent: {},
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
    width: "100%",
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
  errorText: {
    fontSize: 16,
    fontFamily: "interRegular",
    color: "#FF0000",
    marginBottom: 8,
    marginTop: 8,
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginVertical: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: "interRegular",
    color: "#430B92",
  },
  loginButton: {
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
  loginButtonText: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "interMedium",
    color: "#FFFFFF",
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
  demoText: {
    fontSize: 16,
    color: "#430B92",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "interMedium",
  },
});
