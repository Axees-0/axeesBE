import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  Clipboard,
  Linking,
} from "react-native";
// If using expo-clipboard: `import * as Clipboard from 'expo-clipboard';`
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
export default function ShareProfileModal({ visible, onClose, profileUrl }) {
  // On press, either open URL in a new tab (web) or use Linking for native
  const openShareUrl = (shareLink) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(shareLink, "_blank");
    } else {
      Linking.openURL(shareLink);
    }
  };

  // Generate share links:
  // 1) WhatsApp
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(profileUrl)}`;

  const handleCopyLink = async () => {
    // If using expo-clipboard: Clipboard.setString(profileUrl);
    // If using RN built-in: Clipboard.setString(profileUrl);
    Clipboard.setString(profileUrl);
    Toast.show({
      text1: "Link copied to clipboard",
      type: "success",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      style={{ flex: 1 }}
    >
      {/* Press outside to close */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.headerText}>Share Profile</Text>

          {/* The link itself */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={1}>
              {profileUrl}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.shareViaText}>Share via:</Text>

          {/* Icons row */}
          <View style={styles.iconsRow}>
            {/* WhatsApp */}
            <TouchableOpacity
              style={styles.iconWrapper}
              onPress={() => openShareUrl(whatsappUrl)}
            >
              <Image
                source={require("../assets/whatsapp-icon.png")}
                style={styles.iconImage}
                contentFit="contain"
              />
              <Text style={styles.iconLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: "30%",
    margin: "auto",
    borderRadius: 10,
    padding: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  copyButton: {
    marginLeft: 8,
    backgroundColor: "#430B92",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonText: {
    color: "#FFF",
    fontSize: 14,
  },
  shareViaText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  iconsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  iconWrapper: {
    alignItems: "center",
    gap: 10,
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  iconLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "center",
  },
  closeButtonText: {
    fontSize: 14,
    color: "#333",
  },
});
