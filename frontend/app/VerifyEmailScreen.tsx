// screens/VerifyEmailScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  Image,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams(); // e.g. ?token=xxxx in URL
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resultMessage, setResultMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/account/verify-email/${token}`
        );
        setResultMessage(response.data.message);
      } catch (error: any) {
        setResultMessage(
          error.response?.data?.message ||
            "Verification failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setResultMessage("Missing verification token.");
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#430B92" />
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Missing verification token.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{resultMessage}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/UAM001Login")}
      >
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    maxWidth: 1280,
    alignSelf: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  image: {
    width: 250,
    height: 250,
    alignSelf: "center",
  },
  button: {
    backgroundColor: "#430B92",
    padding: 10,
    borderRadius: 5,
    maxWidth: 350,
    width: "100%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
});
