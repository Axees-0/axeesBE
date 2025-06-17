import React, { useState, useEffect, memo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
const INVITE_API = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/invite";

/**
 * Example requirements (adjust as needed):
 * - "Name at least 2 characters"
 * - "Name can contain only letters, underscores, or digits"
 * - "Email must be valid"
 */
const NAME_REQUIREMENTS = [
  "At least 2 characters",
  "Only letters, numbers, underscores and spaces",
];
const EMAIL_REQUIREMENTS = ["Must be a valid email address"];

// A simple function to check the name
function validateName(name) {
  const errors = [];
  if (name.length < 2) {
    errors.push(NAME_REQUIREMENTS[0]); // "At least 2 characters"
  }
  // Letters, numbers, underscores and spaces only
  if (!/^[a-zA-Z0-9_ ]+$/.test(name)) {
    errors.push(NAME_REQUIREMENTS[1]); // "Only letters, numbers, underscores"
  }
  return errors;
}

// A simple function to check the email
function validateEmail(email) {
  const errors = [];
  // Basic pattern; you may want a more robust regex
  if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email)) {
    errors.push(EMAIL_REQUIREMENTS[0]); // "Must be a valid email address"
  }
  return errors;
}

function NewInviteModal({
  visible,
  onClose,
  onInviteCreated, // callback if needed
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { user } = useAuth();
  const [nameErrors, setNameErrors] = useState([]);
  const [emailErrors, setEmailErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // For toggling the display of requirements
  const [showNameReqs, setShowNameReqs] = useState(false);
  const [showEmailReqs, setShowEmailReqs] = useState(false);

  // Validate name on change
  useEffect(() => {
    setNameErrors(validateName(name));
  }, [name]);

  // Validate email on change
  useEffect(() => {
    setEmailErrors(validateEmail(email));
  }, [email]);

  const handleCreateInvite = async () => {
    setIsLoading(true);
    // Final check
    if (nameErrors.length > 0 || emailErrors.length > 0) {
      setIsLoading(false);
      return;
    }
    if (!name || !email) {
      return;
    }

    try {
      // Example: call your back-end
      // POST /api/invite/create { inviteeName, inviteeEmail }
      const response = await axios.post(
        `${INVITE_API}/create`,
        {
          inviteeName: name,
          inviteeEmail: email,
          inviterId: user?._id,
        },
        {
          headers: {
            // Authorization: `Bearer ${token}`, // if needed
          },
        }
      );

      if (response.data.invite) {
        // optional callback
        onInviteCreated && onInviteCreated(response.data.invite);
        onClose(); // close modal
      }
    } catch (error) {
      console.error("Error creating invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // reset fields if you want
    setName("");
    setEmail("");
    setNameErrors([]);
    setEmailErrors([]);
    setShowNameReqs(false);
    setShowEmailReqs(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Invite</Text>

          {/* Name input */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onFocus={() => setShowNameReqs(true)}
            onBlur={() => setShowNameReqs(false)}
            placeholder="Enter invitee's name"
          />
          {/* Requirements for name */}
          {showNameReqs && (
            <View style={styles.requirementsContainer}>
              {NAME_REQUIREMENTS.map((req, index) => {
                const isMet = !nameErrors.includes(req);
                return (
                  <Text
                    key={index}
                    style={[styles.requirementText, isMet && styles.met]}
                  >
                    • {req}
                  </Text>
                );
              })}
            </View>
          )}

          {/* Email input */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setShowEmailReqs(true)}
            onBlur={() => setShowEmailReqs(false)}
            placeholder="Enter invitee's email"
            keyboardType="email-address"
          />
          {/* Requirements for email */}
          {showEmailReqs && (
            <View style={styles.requirementsContainer}>
              {EMAIL_REQUIREMENTS.map((req, index) => {
                const isMet = !emailErrors.includes(req);
                return (
                  <Text
                    key={index}
                    style={[styles.requirementText, isMet && styles.met]}
                  >
                    • {req}
                  </Text>
                );
              })}
            </View>
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateInvite}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "30%",
    marginHorizontal: "auto",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  requirementsContainer: {
    backgroundColor: "#F0F0F0",
    padding: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  requirementText: {
    color: "#B33",
    fontSize: 12,
    marginBottom: 2,
  },
  met: {
    color: "#430B92",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ccc",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  createButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#430B92",
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default memo(NewInviteModal);
