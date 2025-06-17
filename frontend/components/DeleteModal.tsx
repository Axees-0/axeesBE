import { Alert, Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color, FontSize } from "@/GlobalStyles";
import { router } from "expo-router";
import React from "react";

const DeleteModal = ({
  visible,
  setVisible,
  deletionStep,
  setDeletionStep,
  deletionReason,
  setDeletionReason,
  deleteAccountMutation,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  deletionStep: string;
  setDeletionStep: (step: string) => void;
  deletionReason: string;
  setDeletionReason: (reason: string) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (showDeleteModal: boolean) => void;
  router: any;
  deleteAccountMutation: any;
}) => {
  const handleContinue = async () => {
    if (deletionStep === "initial") {
      if (!deletionReason) {
        Alert.alert(
          "Error",
          "Please select a reason for deleting your account"
        );
        return;
      }
      try {
        await deleteAccountMutation.mutateAsync({
          reason: deletionReason,
        });
        setDeletionStep("thanks");
      } catch (error) {
        Alert.alert("Error", "Failed to delete account. Please try again.");
      }
    } else {
      setDeletionStep("initial");
      setDeletionReason("");
      setVisible(false);
      router.replace("/UAM001Login");
    }
  };

  const handleClose = () => {
    setDeletionStep("initial");
    setDeletionReason("");
    setVisible(false);
  };

  const reasons = [
    "I'm no longer using my account",
    "I don't know how to use it",
    "Found a similar app",
    "The date is incorrect",
    "Other",
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleClose} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#000" />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>
              {deletionStep === "thanks" ? "Account Deletion" : "Settings"}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {deletionStep === "initial" && (
            <>
              <Text style={styles.modalTitle}>Delete account</Text>
              <Text style={styles.modalDescription}>
                We are sorry to see you go. Are you sure you want to delete your
                account? Once you confirm, your data will be gone
              </Text>
              <View style={styles.reasonsContainer}>
                {reasons.map((reason, index) => (
                  <Pressable
                    key={index}
                    style={styles.reasonItem}
                    onPress={() => setDeletionReason(reason)}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        deletionReason === reason && styles.radioButtonSelected,
                      ]}
                    >
                      {deletionReason === reason && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.reasonText}>{reason}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {deletionStep === "thanks" && (
            <>
              <Text style={styles.modalTitle}>
                Thank you for using our app!
              </Text>
              <Text style={styles.modalDescription}>
                Your account has been successfully deleted. All access and
                notifications have been halted. Thank you for using our
                services!
              </Text>
            </>
          )}

          <Pressable
            style={[
              styles.continueButton,
              deletionStep === "initial" &&
                !deletionReason &&
                styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={deletionStep === "initial" && !deletionReason}
          >
            <Text style={styles.continueButtonText}>
              {deletionStep === "thanks" ? "Done" : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  placeholder: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 16,
  },
  entertainment: {
    color: Color.cSK430B92500,
    fontSize: FontSize.size_xs,
  },
  reasonsContainer: {
    marginBottom: 24,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E2E2",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#430B92",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#430B92",
  },
  reasonText: {
    fontSize: 16,
    color: "#000000",
  },
  continueButton: {
    backgroundColor: "#430B92",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
