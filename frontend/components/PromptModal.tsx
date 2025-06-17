import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function PromptModal({
  visible,
  title,
  message,
  onCancel,
  onSubmit,
  isProcessing,
}) {
  const [inputValue, setInputValue] = useState("");

  // Only reset input when modal is explicitly closed
  useEffect(() => {
    if (!visible) {
      setInputValue("");
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      return; // Prevent empty submissions
    }
    try {
      await onSubmit(inputValue);
      // Don't clear input here - let parent component handle modal state
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter reason..."
            value={inputValue}
            multiline
            onChangeText={setInputValue}
            editable={!isProcessing}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={onCancel}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isProcessing || !inputValue.trim()}
            >
              {isProcessing ? (
                <ActivityIndicator color="#430B92" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "30%",
    marginHorizontal: "auto",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
    
  },
  buttonText: {
    fontSize: 16,
    color: "#430B92",
  },
});
