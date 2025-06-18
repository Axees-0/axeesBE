import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface NotificationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export const NotificationPermissionModal = ({
  visible,
  onAllow,
  onDeny,
}: NotificationPermissionModalProps) => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDeny}
    >
      <View style={styles.centeredView}>
        <View
          style={[
            styles.modalView,
            isWeb && isWideScreen && styles.webModalView,
          ]}
        >
          <Ionicons name="notifications" size={64} color="black" />
          <Text style={styles.modalTitle}>Enable Notifications</Text>
          <Text style={styles.modalText}>
            Stay updated with important messages and updates from Axees
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.buttonDeny]}
              onPress={onDeny}
            >
              <Text style={styles.buttonTextDeny}>Not Now</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonAllow]}
              onPress={onAllow}
            >
              <Text style={styles.buttonTextAllow}>Allow</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
                    elevation: 5,
    width: "90%",
    maxWidth: 400,
  },
  webModalView: {
    width: 400,
  },
  modalTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "interSemiBold",
    color: "#000000",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 24,
    textAlign: "center",
    fontSize: 16,
    color: "#6C6C6C",
    fontFamily: "interRegular",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  buttonAllow: {
    backgroundColor: "#430B92",
  },
  buttonDeny: {
    backgroundColor: "#F4F4F4",
  },
  buttonTextAllow: {
    color: "white",
    fontWeight: "500",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "interMedium",
  },
  buttonTextDeny: {
    color: "#6C6C6C",
    fontWeight: "500",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "interMedium",
  },
});
