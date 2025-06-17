import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import CustomBackButton from "@/components/CustomBackButton";
import { Feather } from "@expo/vector-icons";

export default function OfferRejectMessage() {
  const { offerName, reason } = useLocalSearchParams();
  const router = useRouter();

  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/UOM07MarketerOfferHistoryList");
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <View style={styles.iconContainer}>
            <Feather name="x-circle" size={48} color="#FF5252" />
          </View>
          <Text style={styles.title}>Offer Rejected</Text>
          <Text style={styles.message}>
            The offer{" "}
            {offerName && <Text style={styles.highlight}>{offerName}</Text>} has
            been rejected
          </Text>
          {reason && <Text style={styles.reason}>{reason}</Text>}
        </View>

        <Pressable
          style={styles.button}
          onPress={() => {
            router.push("/UOM07MarketerOfferHistoryList");
          }}
        >
          <Text style={styles.buttonText}>View Offers</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    maxWidth: 1280,
    marginHorizontal: "auto",
    width: "100%",
    marginTop: "1%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 20,
    width: "100%",
  },
  placeholder: {},
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
    maxWidth: 1280,
    marginHorizontal: "auto",
    width: "100%",
  },
  messageContainer: {
    alignItems: "center",
    gap: 16,
    marginTop: "25%",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "600",
    color: "#FF5252",
    textAlign: "center",
  },
  message: {
    fontSize: "1.5rem",
    color: "#6C6C6C",
    textAlign: "center",
    lineHeight: 32,
  },
  highlight: {
    color: "#430b92",
    fontWeight: "500",
  },
  reason: {
    fontSize: "1rem",
    color: "#6C6C6C",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
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
