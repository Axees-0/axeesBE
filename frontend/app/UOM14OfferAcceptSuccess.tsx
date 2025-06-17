import React, { useEffect } from "react";
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
import Tickdouble03 from "@/assets/tickdouble03.svg";
import CustomBackButton from "@/components/CustomBackButton";

export default function OfferAcceptSuccess() {
  const { offerName, dealNumber } = useLocalSearchParams();
  const router = useRouter();

  const isMobile = useWindowDimensions().width < 768;

  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/UOM08MarketerDealHistoryList");
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
          <Tickdouble03 width={48} height={48} color="#4CAF50" />
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.message}>
            You've successfully accepted the offer{" "}
            {offerName && <Text style={styles.highlight}>{offerName}</Text>}
          </Text>
          {dealNumber && (
            <Text style={styles.dealNumber}>Deal #{dealNumber}</Text>
          )}
        </View>

        <Pressable
          style={[
            styles.button,
            isMobile ? { width: "100%" } : { width: "30%" },
          ]}
          onPress={() => {
            router.push("/UOM08MarketerDealHistoryList");
          }}
        >
          <Text style={styles.buttonText}>View Deals</Text>
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
    marginLeft: "auto",
    marginRight: "auto",
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
  title: {
    fontSize: "3rem",
    fontWeight: "600",
    color: "#4CAF50",
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
  dealNumber: {
    fontSize: "1.25rem",
    color: "#430b92",
    fontWeight: "500",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#430b92",
    maxWidth: "30%",
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
