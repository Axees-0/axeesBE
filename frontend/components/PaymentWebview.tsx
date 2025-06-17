import React from "react";
import { Modal, View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";

interface PaymentModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  isVisible,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  if (!isVisible) return null;

  if (Platform.OS === "web") {
    return (
      <Modal visible={isVisible} onRequestClose={onClose} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <iframe
              src="https://buy.stripe.com/test_6oE6se65284S1AQ288"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              onLoad={(e: any) => {
                // Check if payment was successful
                if (
                  e.target.contentWindow.location.href.includes("success=true")
                ) {
                  onSuccess();
                  onClose();
                } else if (
                  e.target.contentWindow.location.href.includes("cancel=true")
                ) {
                  onClose();
                }
              }}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <WebView
          source={{ uri: "https://buy.stripe.com/test_6oE6se65284S1AQ288" }}
          onNavigationStateChange={(navState) => {
            if (navState.url.includes("success=true")) {
              onSuccess();
              onClose();
            } else if (navState.url.includes("cancel=true")) {
              onClose();
            }
          }}
          style={styles.webview}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "90%",
    maxWidth: 500,
    height: "90%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
});
