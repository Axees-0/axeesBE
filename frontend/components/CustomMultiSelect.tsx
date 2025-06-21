import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import Checkmarksquare01 from "@/assets/checkmarksquare01.svg";
import EmptyCheckbox from "../assets/emptycheckbox.svg";

interface Props {
  label?: string;
  allOptions: string[];
  selectedValues: string[];
  onChange: (newValues: string[]) => void;
}

/**
 * Shows a stylized "dropdown" that, when tapped, opens a modal
 * with multiple checkboxes. This works the same way on web or mobile,
 * ensuring consistent design.
 */
export default function CustomMultiSelect({
  label,
  allOptions,
  selectedValues,
  onChange,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => setShowModal(!showModal);

  const handleToggleValue = (val: string) => {
    let newValues = [...selectedValues];
    if (newValues.includes(val)) {
      newValues = newValues.filter((v) => v !== val);
    } else {
      newValues.push(val);
    }
    onChange(newValues);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* The "dropdown" pressable */}
      <Pressable style={styles.dropdownPressable} onPress={toggleModal}>
        <Text style={styles.dropdownPressableText}>
          {selectedValues.length === 0
            ? "Select Platforms"
            : selectedValues.join(", ")}
        </Text>
      </Pressable>

      {/* The modal with checkboxes */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label ?? "Select Options"}</Text>

            <ScrollView style={styles.optionsList}>
              {allOptions.map((option) => {
                const checked = selectedValues.includes(option);
                return (
                  <Pressable
                    key={option}
                    style={styles.optionRow}
                    onPress={() => handleToggleValue(option)}
                  >
                    {checked ? (
                      <Checkmarksquare01
                        width={24}
                        height={24}
                        color={checked ? "#430b92" : "#e2d0fb"}
                      />
                    ) : (
                      <EmptyCheckbox
                        width={24}
                        height={24}
                        color={checked ? "#430b92" : "#e2d0fb"}
                      />
                    )}
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.closeButton} onPress={toggleModal}>
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20, width: "50%" },
  label: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  dropdownPressable: {
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 58,
    justifyContent: "center",
  },
  dropdownPressableText: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 4,
    color: "#430b92",
    fontWeight: "bold",
  },
  optionsList: {
    maxHeight: 300,
    marginVertical: 10,
    paddingRight: 8, // Add padding to prevent scrollbar overlap
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
  closeButton: {
    backgroundColor: "#430b92",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
});
