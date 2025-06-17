"use client";

import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import CustomBackButton from "@/components/CustomBackButton";
import { AlertCircle } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "@/components/ProfileInfo";

export default function ErrorMessage() {
  const router = useRouter();
  const { errorMessage } = useLocalSearchParams();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <ProfileInfo />
      </View>

      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <AlertCircle width={32} height={32} color="#d32f2f" />
          <Text style={styles.title}>Error</Text>
          <Text style={styles.message}>
            {errorMessage || "Something went wrong. Please try again."}
          </Text>
        </View>

        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Try Again</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 20,
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
    color: "#d32f2f",
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
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
