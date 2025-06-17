import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Link, router } from "expo-router";
import axios from "axios";

export default function ReturnScreen() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("No session ID found.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payments/session-status?session_id=${sessionId}`
        );

        if (response.data.payment_status === "paid") {
          setStatus("success");
          setMessage("Payment successful! Redirecting...");

          // Redirect after 2 seconds
          setTimeout(() => {
            // Go back to the previous screen or to a specific route
            router.back();
            // Or navigate to a specific route
            // router.push('/dashboard');
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Payment was not completed. Please try again.");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setStatus("error");
        setMessage("Could not verify payment status. Please contact support.");
      }
    };

    verifyPayment();
  }, []);

  return (
    <View style={styles.container}>
      {status === "loading" && (
        <ActivityIndicator size="large" color="#0070f3" />
      )}

      <Text
        style={[
          styles.message,
          status === "success"
            ? styles.success
            : status === "error"
            ? styles.error
            : null,
        ]}
      >
        {message}
      </Text>

      {status === "error" && (
        <Link href="/" style={styles.link}>
          Return to Home
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 20,
  },
  success: {
    color: "green",
  },
  error: {
    color: "red",
  },
  link: {
    color: "#0070f3",
    marginTop: 20,
    textDecorationLine: "underline",
  },
});
