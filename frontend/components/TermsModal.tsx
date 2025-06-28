import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
const PRIVACY_POLICY_AND_GUIDELINES = `
 1. Terms and Conditions

Content Needed. Please provide the content.

`;

const TermsModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  // Add ESC key support for web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [visible, onClose]);

  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.contentWrapper}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.contentText}>
                {PRIVACY_POLICY_AND_GUIDELINES}
              </Text>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default TermsModal;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 1280,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: "#430B92",
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {},
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    maxWidth: 1280,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
                elevation: 2,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1000,
    padding: 10,
  },
});
