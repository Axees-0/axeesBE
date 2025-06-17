import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router, Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import RenderHTML from "react-native-render-html";
import Navbar from "@/components/web/navbar";

const PrivacyAndGuidelinesScreen = () => {
  const { width } = useWindowDimensions();
 const [html, setHtml] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Works in dev and production -- both web & native
    fetch("/legal/privacy-policy.html")
      .then(res => res.text())
      .then(setHtml)
      .catch(err => {
        console.error("Could not load policy:", err);
        setHtml("<h1>Error loading policy</h1>");
      });
  }, []);

  if (!html) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!user?._id) {
    return <Redirect href="/UAM001Login" />;
  }

  return (
    <View style={styles.safeArea}>
      <Navbar pageTitle="Privacy Policy & Community Guidelines"/>
      {/* <View style={styles.header}>
        <CustomBackButton />

        <Text style={styles.headerTitle}>
          Privacy Policy & Community Guidelines
        </Text>
        <ProfileInfo />
      </View> */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <RenderHTML
          contentWidth={width - 48}
          source={{ html }}
          tagsStyles={{
            body: { fontFamily: "Inter, sans-serif", color: "#333" },
            h1: { fontSize: 28, marginBottom: 8 },
            h2: { fontSize: 22, marginTop: 24, marginBottom: 6 },
            p: { lineHeight: 22, marginBottom: 10 },
            ul: { marginLeft: 20, marginBottom: 10 },
            li: { marginBottom: 6 },
            hr: { borderColor: "#e5e5e5" },
          }}
        />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: "5%",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: "#430B92",
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {},
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 26,
  },
  contentWrapper: {
    width: "50%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333333",
  },
});

export default PrivacyAndGuidelinesScreen;
