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
import Web from "@/components/web-static-old";
import { WebSEO } from "../web-seo";
import { useAuth } from "@/contexts/AuthContext";
import { Color } from "@/GlobalStyles";
import { router } from "expo-router";
const { width, height } = Dimensions.get("window");
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
};
const UFM01ResultsScreen = () => {
  const { width } = useWindowDimensions();
  // const { user, isLoading } = useAuth();
  const isMobileScreen = width <= BREAKPOINTS.tablet;
  const isWeb = Platform.OS === "web";

  return (
    <>
      <WebSEO 
        title="Explore Creators & Influencers"
        description="Discover and connect with top creators and influencers on Axees. Find the perfect match for your brand campaigns."
        keywords="influencers, creators, brand partnerships, marketing, campaigns"
      />
      <Web />
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

export default UFM01ResultsScreen;
