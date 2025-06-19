"use client";

import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Arrowleft02 from "../assets/arrowleft021.svg";
import Tickdouble03 from "../assets/tickdouble03.svg";
import CustomBackButton from "@/components/CustomBackButton";

export default function SuccessMessage() {
  const { creatorName, creatorUserName, offerId } = useLocalSearchParams();
  const router = useRouter();
  const windowWidth = useWindowDimensions().width;
  const isMobile = windowWidth < 768;
  // Use creatorUserName if available, fallback to creatorName
  const displayName = creatorUserName || creatorName;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />

        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Tickdouble03 width={32} height={32} />
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.message}>
            Your Offer has been sent to{" "}
            {displayName?.startsWith("@") ? displayName : `@${displayName}`}
          </Text>
        </View>

        <Pressable
          style={[styles.button, { width: isMobile ? "100%" : "30%" }]}
          onPress={() => {
            router.push({
              pathname: "/UOM07MarketerOfferHistoryList",
            });
          }}
        >
          <Text style={styles.buttonText}>View Status</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginLeft: "auto",
    marginRight: "auto",
    width: "100%",
    marginTop: "1%",
  },
  statusBar: {
    height: 44,
    paddingTop: 12,
    alignItems: "center",
  },
  statusBarTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginHorizontal: "5%",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {},
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 40,
    marginHorizontal: "5%",
  },
  messageContainer: {
    alignItems: "center",
    gap: 16,
    marginTop: "25%",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "600",
    color: "#430b92",
  },
  message: {
    fontSize: "1.5rem",
    color: "#6C6C6C",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#430b92",
    width: "30%",
    height: 58,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});
