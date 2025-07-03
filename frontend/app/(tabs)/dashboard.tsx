import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";

import { Fragment, useState } from "react";

import Mobile from "@/components/mobile/index";
import Dashboard from "@/components/Dashboard/index";
import { WebSEO } from "../web-seo";
import { useAuth } from "@/contexts/AuthContext";
import { Color } from "@/GlobalStyles";
import { router } from "expo-router";
import { BREAKPOINTS, isUltraWide, isWideScreen, isTablet } from "@/constants/breakpoints";
import WebBottomTabs from "@/components/WebBottomTabs";

const { width, height } = Dimensions.get("window");

const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const isMobileScreen = width <= BREAKPOINTS.TABLET;
  const isUltraWideScreen = isUltraWide(width);
  const isWideScreenDevice = isWideScreen(width);
  const isWeb = Platform.OS === "web";

  return (
    <>
      <WebSEO 
        title="Dashboard - Analytics & Overview"
        description="View your campaign analytics, performance metrics, and account overview on Axees dashboard."
        keywords="dashboard, analytics, campaigns, metrics, overview, performance"
      />
      <Dashboard />
      <WebBottomTabs activeIndex={4} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.cSK430B92500,
    padding: 16,
    borderRadius: 16,
    position: "absolute",
    bottom: 50,
    left: 16,
    right: 16,
  },
  text: {
    color: Color.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default DashboardScreen;