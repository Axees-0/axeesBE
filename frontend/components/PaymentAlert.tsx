// components/PaymentAlert.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { usePayment } from "@/contexts/PaymentContext";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer/offers";

export default function PaymentAlert() {
  const {
    pendingPayments,
    setShowPaymentModal,
    setPaymentDetails,
    paymentDetails,
  } = usePayment();
  const { user } = useAuth();

  if (!user || pendingPayments.length === 0 || Platform.OS !== "web") {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>Payment Required</Text>
        <Text style={styles.alertText}>
          You have {pendingPayments.length} pending payment
          {pendingPayments.length > 1 ? "s" : ""} for accepted offers.
        </Text>
        <Pressable
          style={styles.payButton}
          onPress={() => {
            if (paymentDetails) {
              setShowPaymentModal(true);
            }
          }}
        >
          <Text style={styles.payButtonText}>Complete Payment</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  alertContent: {
    backgroundColor: "#430B92",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
    elevation: 5,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  payButtonText: {
    color: "#430B92",
    fontSize: 14,
    fontWeight: "500",
  },
});
