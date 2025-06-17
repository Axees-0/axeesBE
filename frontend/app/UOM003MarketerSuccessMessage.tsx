"use client";

import React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Arrowleft02 from "../assets/arrowleft02.svg";
import Tickdouble03 from "../assets/tickdouble03.svg";
import CustomBackButton from "@/components/CustomBackButton";

export default function SuccessMessage() {
  const router = useRouter();
  const { creatorName } = useLocalSearchParams();

  const handleViewStatus = () => {
    // Navigate to the offers list or status page
    router.push("/UOM07MarketerOfferHistoryList");
  };

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
            {creatorName ? `@${creatorName}` : "the creator"}
          </Text>
        </View>

        <Pressable style={styles.button} onPress={handleViewStatus}>
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
    paddingHorizontal: 20,
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
    padding: 20,
    paddingBottom: 40,
  },
  messageContainer: {
    alignItems: "center",
    gap: 16,
    marginTop: "50%",
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#430b92",
  },
  message: {
    fontSize: 18,
    color: "#6C6C6C",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#430b92",
    width: "100%",
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
