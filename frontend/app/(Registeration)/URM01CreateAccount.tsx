import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import Checkmark01 from "@/assets/checkmarksquare01.svg";
import EmptyCheckbox from "@/assets/emptycheckbox.svg";
import { FontFamily } from "@/GlobalStyles";
import CreatorIcon from "@/assets/creator-icon.svg";
import MarketerIcon from "@/assets/markter-icon.svg";
import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
};

export default function CreateAccount() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const [userType, setUserType] = useState<"Marketer" | "Creator" | null>(null);

  const handleContinue = () => {
    if (userType) {
      router.push({
        pathname: "/URM01Phone",
        params: { userType },
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView contentContainerStyle={[styles.container]}>
        <StatusBar style="auto" />

        <View style={[styles.contentContainer]}>
          <View style={[styles.content]}>
            <Text style={styles.title}>What is your Role?</Text>

            <View style={styles.roleOptions}>
              <Pressable
                style={[
                  styles.roleCard,
                  userType === "Marketer" && styles.selectedRole,
                ]}
                onPress={() => setUserType("Marketer")}
              >
                <View style={styles.roleIconContainer}>
                  <View style={styles.roleIcon}>
                    <MarketerIcon style={styles.roleIconImage} />
                  </View>
                  {userType === "Marketer" ? (
                    <Checkmark01 width={40} height={40} />
                  ) : (
                    <EmptyCheckbox width={40} height={40} />
                  )}
                </View>
                <Text style={styles.roleTitle}>I'm a marketer</Text>
                <Text style={styles.roleSubtitle}>
                  looking to hire creators
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.roleCard,
                  userType === "Creator" && styles.selectedRole,
                ]}
                onPress={() => setUserType("Creator")}
              >
                <View style={styles.roleIconContainer}>
                  <View style={styles.roleIcon}>
                    <CreatorIcon style={styles.roleIconImage} />
                  </View>
                  {userType === "Creator" ? (
                    <Checkmark01 width={40} height={40} />
                  ) : (
                    <EmptyCheckbox width={40} height={40} />
                  )}
                </View>
                <Text style={styles.roleTitle}>I'm a creator</Text>
                <Text style={styles.roleSubtitle}>
                  looking for opportunities
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[
              styles.continueButton,
              !userType && styles.disabledButton,
              isWeb && isWideScreen && styles.webContinueButton,
            ]}
            onPress={handleContinue}
            disabled={!userType}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          <Text style={styles.resendText}>
            <Text style={styles.resendTextGray}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/UAM001Login")}>
              <Text style={styles.resendTextPurple}>Login</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    minWidth: "100%",
  },
  roleIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  roleIconImage: {},
  roleIcon: {
    width: 60,
    height: 60,
  },
  contentContainer: {
    // maxWidth: BREAKPOINTS.MOBILE,
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  webContainer: {
    width: "100%",
  },
  headerText: {
    fontSize: 20,
    fontFamily: "sFPro",
    textAlign: "center",
    color: "#430B92",
    fontWeight: "400",
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
    marginHorizontal: "5%",
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
    justifyContent: "center",
    alignItems: "center",
  },
  webContent: {
    // maxWidth: BREAKPOINTS.MOBILE,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 32,
    fontFamily: FontFamily.inter,
    textAlign: "left",
  },
  webTitle: {
    textAlign: "center",
  },
  roleOptions: {
    flexDirection: Dimensions.get("window").width > 768 ? "row" : "column",
    gap: 16,
    marginBottom: 32,
    width: "100%",
  },
  roleCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    alignItems: "center",
    gap: 12,
  },
  selectedRole: {
    borderColor: "#430B92",
    backgroundColor: "#F0E7FD",
    position: "relative",
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: "#000000",
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  roleSubtitle: {
    fontSize: 14,
    color: "#6C6C6C",
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  phoneSection: {
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
  note: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: FontFamily.inter,
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
  errorText: {
    color: "red",
    marginVertical: 8,
    fontSize: 14,
    fontFamily: "interRegular",
  },
  underline: {
    width: "100%",
  },
  webContentContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: FontFamily.inter,
    textAlign: "center",
  },
  resendTextGray: {
    color: "#6C6C6C",
  },
  resendTextPurple: {
    color: "#430B92",
  },
});
