import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const BREAKPOINTS = {
  TABLET: 768,
};

const ProfileInfo = ({ onProfilePress }: { onProfilePress?: () => void }) => {
  const { user } = useAuth();
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const isMobile = window.width < BREAKPOINTS.TABLET;

  if (!user || !user?.name) return <View />;

  if (isWeb && isMobile) {
    return (
      <TouchableOpacity
        style={styles.placeholder}
        onPress={() => {
          if (onProfilePress) {
            onProfilePress();
          } else {
            router.push("/profile");
          }
        }}
      >
        <MaterialIcons name="account-circle" size={30} color="#430B92" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.placeholder}
      onPress={() => {
        if (onProfilePress) {
          onProfilePress();
        } else {
          router.push("/profile");
        }
      }}
    >
      <Text style={styles.placeholderText}>
        <Text style={styles.placeholderTextNormal}>
          The {user?.userType} :{" "}
        </Text>{" "}
        {user?.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  placeholder: {},
  placeholderText: { fontSize: 16, fontWeight: "600" },
  placeholderTextNormal: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666",
  },
});

export default ProfileInfo;
