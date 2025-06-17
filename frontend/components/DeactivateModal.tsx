import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const DeactivateModal = React.memo(
  ({
    visible,
    deactivationStep,
    setDeactivationStep,
    deactivationPassword,
    setDeactivationPassword,
    showPassword,
    setShowPassword,
    onClose,
    handleContinue,
    message,
    setMessage,
  }: {
    visible: boolean;
    deactivationStep: string;
    setDeactivationStep: (step: string) => void;
    deactivationPassword: string;
    setDeactivationPassword: (password: string) => void;
    showPassword: boolean;
    setShowPassword: (showPassword: boolean) => void;
    onClose: () => void;
    handleContinue: () => void;
    message: string;
    setMessage: (message: string) => void;
  }) => {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={onClose} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="#000" />
              </Pressable>
              <Text style={styles.modalHeaderTitle}>
                {deactivationStep === "thanks"
                  ? "Account Deactivation"
                  : "Settings"}
              </Text>
              <View style={styles.placeholder} />
            </View>

            {deactivationStep === "initial" && (
              <>
                <Text style={styles.modalTitle}>Deactivate Account</Text>
                <Text style={styles.modalDescription}>
                  Deactivate your account to temporarily suspend your access and
                  stop receiving notifications.
                </Text>
                <Text style={styles.modalSubtext}>
                  To continue, please enter your password
                </Text>
              </>
            )}

            {deactivationStep === "password" && (
              <>
                <Text style={styles.modalTitle}>Deactivate Account</Text>
                <Text style={styles.modalDescription}>
                  To continue, please enter your password.
                </Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={deactivationPassword}
                    onChangeText={setDeactivationPassword}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#666"
                  />

                  <Pressable
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color="#666"
                    />
                  </Pressable>
                </View>
                {message && <Text style={styles.errorMessage}>{message}</Text>}
              </>
            )}

            {deactivationStep === "thanks" && (
              <>
                <Text style={styles.modalTitle}>
                  Thank you for using our app!
                </Text>
                <Text style={styles.modalDescription}>
                  Your account has been successfully deactivated. All access and
                  notifications have been halted. Thank you for using our
                  services!
                </Text>
              </>
            )}

            <Pressable
              style={[
                styles.continueButton,
                deactivationStep === "password" &&
                  !deactivationPassword &&
                  styles.disabledButton,
              ]}
              onPress={handleContinue}
              disabled={
                deactivationStep === "password" && !deactivationPassword
              }
            >
              <Text style={styles.continueButtonText}>
                {deactivationStep === "thanks" ? "Done" : "Continue"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }
);

export default DeactivateModal;

const styles = StyleSheet.create({
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  accountManagement: {
    marginTop: 32,
    gap: 16,
  },
  placeholder: {
    flex: 1,
  },
  accountManagementTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  accountButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deactivateButton: {
    backgroundColor: "#FFF0F0",
  },
  deactivateButtonText: {
    color: "#430B92",
    fontSize: 16,
  },
  deleteButton: {},
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
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
  modalSubtext: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 16,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#000000",
  },
  passwordToggle: {
    padding: 12,
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
  errorMessage: {
    color: "#FF0000",
    fontSize: 14,
    marginBottom: 16,
  },
});
