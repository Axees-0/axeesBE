import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Calendar03 from "@/assets/calendar03.svg";

/**
 * Props:
 *   label?: string
 *   value: Date
 *   onChange: (newDate: Date) => void
 */
export default function CustomDatePicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: Date;
  onChange: (newDate: Date) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const toggleModal = () => setShowModal(!showModal);

  // A simple date formatter for the Pressable text
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* "Dropdown" style pressable */}
      <Pressable style={styles.datePressable} onPress={toggleModal}>
        <Text style={styles.dateText}>{formatDate(value)}</Text>
        <Calendar03 width={24} height={24} color="#430b92" />
      </Pressable>

      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{label ?? "Select Date"}</Text>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempDate(selectedDate);
                }
              }}
              style={{ width: "100%", backgroundColor: "#FFF" }}
            />

            {/* Done/Confirm button */}
            <Pressable
              style={styles.doneButton}
              onPress={() => {
                onChange(tempDate);
                toggleModal();
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  datePressable: {
    borderWidth: 1,
    borderColor: "#E2D0FB",
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 14,
    color: "#6C6C6C",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    color: "#430b92",
    marginBottom: 8,
  },
  doneButton: {
    backgroundColor: "#430b92",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: "center",
    width: "50%",
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
});
