import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import SuccessIcon from "@/assets/tickdouble03.svg";
import { useAuth } from "@/contexts/AuthContext";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
  MOBILE: 550,
};

export default function URM04Success() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();

  useEffect(() => {
    const id = setTimeout(() => {
      router.push("/(tabs)");
    }, 3000);

    return () => clearTimeout(id);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
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
          <View style={styles.mainContent}>
            <SuccessIcon width={64} height={64} />
            <Text style={styles.title}>Great!</Text>
            <Text style={styles.subtitle}>
              Now you can add your favorite creators.
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.feedButton,
            isWeb && isWideScreen && styles.webContinueButton,
          ]}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.feedButtonText}>Go to Feed</Text>
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
  contentContainer: {
    flex: 1,
    width: "100%",
    marginHorizontal: "auto",
    // maxWidth: BREAKPOINTS.MOBILE,
    justifyContent: "space-between",
  },
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
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
    // maxWidth: BREAKPOINTS.MOBILE,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: "interSemiBold",
    color: "#000000",
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "interRegular",
    color: "#6C6C6C",
    textAlign: "center",
  },
  feedButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: Platform.OS === "ios" ? 40 : 20,
    borderRadius: 12,
    alignItems: "center",
    width: "90%",
  },
  webContinueButton: {
    width: BREAKPOINTS.MOBILE - 40,
    marginHorizontal: 0,
    marginTop: 32,
    alignSelf: "center",
  },
  feedButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "interMedium",
  },
});
