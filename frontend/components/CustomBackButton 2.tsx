import React from "react";
import {
  Pressable,
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import Arrowleft02 from "@/assets/arrowleft02.svg";
import Logo from "@/assets/Logo.svg";
import { useNotifications } from "@/hooks/useNotifications";

export default function CustomBackButton({
  onBackPress,
}: {
  onBackPress?: () => void;
}) {
  const router = useRouter();
  const currentPath = usePathname();
  const { requestNotificationPermission } = useNotifications();
  const handleBack = () => {
    if (Platform.OS === "web") {
      // Use browser history to go back
      window.history.back();
    } else {
      // Use Expo Router's back function on native
      router.back();
    }
  };

  return (
    <View style={styles.backConrainer}>
      {/* <Pressable onPress={handleBack} style={styles.backButton}>
        <Arrowleft02 width={24} height={24} />
      </Pressable> */}
      {currentPath !== "/" && (
        <TouchableOpacity
          style={styles.header}
          onPress={() => {
            requestNotificationPermission();
            onBackPress ? onBackPress() : router.push("/");
          }}
        >
          <Logo />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
  backConrainer: {
    top: 0,
    left: 0,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  header: {},
});
