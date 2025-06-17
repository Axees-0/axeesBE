// components/PaymentModal.tsx
import React, { useEffect } from "react";
import { Modal, StyleSheet, View, Platform } from "react-native";
import { usePayment } from "@/contexts/PaymentContext";
import StripeCheckout from "./StripeCheckout";
import Toast from "react-native-toast-message";
import { router, usePathname } from "expo-router";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/marketer";

export default function StripePaymentModal() {
  const {
    showPaymentModal,
    setShowPaymentModal,
    setPaymentDetails,
    paymentDetails,
  } = usePayment();
  const { user } = useAuth();

  // Grab the current route path from expo-router
  const currentPath = usePathname();

  // A function to check payment status
  const checkPaymentStatus = async () => {
    if (!user || user.userType !== "Marketer" || !user.email || !user.name)
      return;

    try {
      const res = await axios.get(`${API_URL}/offers/payment-status`, {
        params: { userId: user._id },
      });

      if (res.data.paymentNeeded) {
        if (user.userType === "Marketer") {
          // We have a pending payment
          setPaymentDetails({
            amount: res.data.requiredAmount,
            dealId: res.data.dealId,
            offerId: res.data.offerId,
            marketerId: res.data.marketerId,
            creatorId: res.data.creatorId,
            type: "escrowPayment",
          });
          setShowPaymentModal(true);
        } else {
          // Payment not needed
          setShowPaymentModal(false);
        }
      } else {
        // Payment not needed
        setShowPaymentModal(false);
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
    }
  };

  // 1) On mount, check once
  useEffect(() => {
    checkPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2) Re-check payment status each time the route changes
  useEffect(() => {
    checkPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  // If we have no relevant payment details or not on web, no modal
  if (!paymentDetails || Platform.OS !== "web") {
    return null;
  }

  // Payment success callback
  const handleSuccess = async (
    sessionId: string,
    transactionNumber: string
  ) => {
    setShowPaymentModal(false);

    if (paymentDetails.type === "escrowPayment") {
      await axios.post(`${API_URL}/deals/${paymentDetails.dealId}/payment`, {
        transactionId: transactionNumber,
        paymentAmount: paymentDetails.amount,
        paymentMethod: "CreditCard",
      });

      Toast.show({
        type: "customNotification",
        text1: "Payment Successful",
        text2: "Your escrow payment has been processed.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
      router.push("/UOM08MarketerDealHistoryList");
    } else {
      Toast.show({
        type: "success",
        text1: "Payment Successful",
        text2: "Your payment has been processed successfully.",
      });
      // Optionally navigate
      router.push({
        pathname: "/UOM003MarketerSuccessMessage",
        params: {
          sessionId,
          offerId: paymentDetails.offerId,
          dealId: paymentDetails.dealId,
        },
      });
    }
  };

  // Payment error callback
  const handleError = (message: string) => {
    Toast.show({
      type: "error",
      text1: "Payment Failed",
      text2: message,
    });
  };

  return (
    <Modal
      visible={showPaymentModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <StripeCheckout
            amount={paymentDetails.amount}
            offerId={paymentDetails.offerId}
            creatorId={paymentDetails.creatorId}
            marketerId={paymentDetails.marketerId}
            onSuccess={handleSuccess}
            onError={handleError}
            // You can pass custom type for text in your line_item
            type={"escrowPayment"}
            onCancel={() => setShowPaymentModal(false)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 600,
    maxHeight: "90%",
  },
});
