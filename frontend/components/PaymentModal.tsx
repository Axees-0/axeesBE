import { View, Text, Modal, Pressable, TextInput } from "react-native";
import React from "react";
import { StyleSheet } from "react-native";
import MastercardIcon from "../assets/mastercard.svg";
import Featuredicon from "../assets/featured-icon.svg";
import { router } from "expo-router";
const PaymentModal = ({
  isPaymentModalVisible,
  setPaymentModalVisible,
  cardDetails,
  setCardDetails,
}: {
  isPaymentModalVisible: boolean;
  setPaymentModalVisible: (visible: boolean) => void;
  cardDetails: {
    name: string;
    expiry: string;
    number: string;
    cvv: string;
  };
  setCardDetails: (details: {
    name: string;
    expiry: string;
    number: string;
    cvv: string;
  }) => void;
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={isPaymentModalVisible}
    onRequestClose={() => setPaymentModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Featuredicon width={48} height={48} />
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>Add Payment Details</Text>
            <Text style={styles.modalSubtitle}>Update your card details.</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.label}>Name on card</Text>
            <TextInput
              style={styles.input}
              placeholder="Timothy Baio"
              value={cardDetails.name}
              onChangeText={(text) =>
                setCardDetails({ ...cardDetails, name: text })
              }
            />
          </View>
          <View style={[styles.formField, styles.expiryField]}>
            <Text style={styles.label}>Expiry</Text>
            <TextInput
              style={styles.input}
              placeholder="06/2024"
              value={cardDetails.expiry}
              onChangeText={(text) =>
                setCardDetails({ ...cardDetails, expiry: text })
              }
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.label}>Card number</Text>
            <View style={styles.cardNumberContainer}>
              <MastercardIcon width={34} height={24} />
              <TextInput
                style={styles.cardNumberInput}
                placeholder="1234 1234 1234 1234"
                value={cardDetails.number}
                onChangeText={(text) =>
                  setCardDetails({ ...cardDetails, number: text })
                }
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={[styles.formField, styles.cvvField]}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={styles.input}
              placeholder="•••"
              value={cardDetails.cvv}
              onChangeText={(text) =>
                setCardDetails({ ...cardDetails, cvv: text })
              }
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
          </View>
        </View>

        <Pressable
          style={styles.confirmButton}
          onPress={() => {
            setPaymentModalVisible(false);
            router.push("/UOM003MarketerSuccessMessage");
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 24,
  },
  modalHeader: {
    gap: 16,
  },
  modalTitleContainer: {
    gap: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  formField: {
    flex: 1,
    gap: 8,
  },
  expiryField: {
    flex: 0.3,
    width: 112,
  },
  cvvField: {
    flex: 0.3,
    width: 112,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  cardNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  cardIcon: {
    width: 32,
    height: 20,
    marginRight: 8,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#430b92",
    height: 58,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  paymentButton: {
    backgroundColor: "#430b92",
    height: 58,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default PaymentModal;
