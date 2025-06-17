"use client";

import React from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";

import Arrowleft022 from "../assets/arrowleft022.svg";
import Addteam from "../assets/addteam.svg";
import Arrowsdiagramsarrow from "../assets/arrows-diagramsarrow.svg";
import Settings01 from "../assets/settings01.svg";
import Lockpassword from "../assets/lockpassword.svg";
import Securitylock from "../assets/securitylock.svg";
import Logout05 from "../assets/logout05.svg";
import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
  MOBILE: 550,
};

const SettingItem = ({ icon: Icon, title, onPress, isLogout = false }) => (
  <Pressable style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      <Icon width={24} height={24} color={isLogout ? "#f82f2f" : "#430B92"} />
      <Text style={[styles.settingItemText, isLogout && styles.logoutText]}>
        {title}
      </Text>
    </View>
    {!isLogout && <Arrowsdiagramsarrow width={24} height={24} />}
  </Pressable>
);

export default function Settings() {
  const { logout, user } = useAuth();
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;

  const settingsItems = [
    {
      icon: Addteam,
      title: "Invites",
      onPress: () => router.push("/UAM05InviteList"),
    },
    {
      icon: Settings01,
      title: "Notification Settings",
      onPress: () => router.push("/UAM003NotificationSettings"),
    },
    {
      icon: Lockpassword,
      title: "Change Password",
      onPress: () => router.push("/UAM04ChangePassword"),
    },
    {
      icon: Securitylock,
      title: "Privacy Policy",
      onPress: () => router.push("/privacy-policy"),
    },
    {
      icon: Logout05,
      title: "Log Out",
      onPress: async () => {
        await logout();
        router.replace("/UAM001Login");
      },
      isLogout: true,
    },
  ];

  if (!user?._id) {
    return <Redirect href="/UAM001Login" />;
  }

  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />

        <Text style={styles.headerText}>Settings</Text>
        <ProfileInfo />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => (
            <React.Fragment key={item.title}>
              <SettingItem {...item} />
              {index < settingsItems.length - 1 && (
                <View style={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
    marginHorizontal: "5%",
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
  content: {
    flex: 1,
    alignItems: "center",
    marginTop: "5%",
  },
  settingsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingItemText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
    color: "#000000",
  },
  logoutText: {
    color: "#f82f2f",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(11, 2, 24, 0.1)",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
