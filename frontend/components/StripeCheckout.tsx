import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import axios from "axios";
import PaymentMethodSelector from "./PaymentMethodSelector";
import { usePayment } from "@/contexts/PaymentContext";
import { useAuth } from "@/contexts/AuthContext";
import { SavedPaymentMethod } from "@/utils/paymentMethodsService";

// We assume you're using environment variables for your Stripe key
const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// Get window dimensions (if needed)
const windowHeight = Dimensions.get("window").height;

interface StripeCheckoutProps {
  /** Called when payment is successful */
  onSuccess: (sessionId: string, transactionNumber: string) => void;
  /** Called when there's an error in payment flow */
  onError: (message: string) => void;
  /** Called when user closes/cancels the payment modal */
  onCancel: () => void;
  /**
   * The "actual" amount that you're charging the user
   * (e.g. 50% of final, plus a platform fee).
   * If not provided, we default to 1 for demonstration.
   */
  amount?: number;
  /**
   * Additional fees or processing fee. If not provided, can default to 0.
   */
  processingFee?: number;
  /** IDs for contextual data in your metadata */
  offerId?: string;
  creatorId?: string;
  marketerId?: string;
  /**
   * The type of payment. If not provided, we default to "offerFee".
   * Can be "offerFee", "escrowPayment", or "milestoneFunding"
   */
  type?: string;
  /** For milestone funding */
  dealId?: string;
  milestoneId?: string;
  bonus?: number;
}

export default function StripeCheckout({
  onSuccess,
  onError,
  onCancel,
  amount = 1, // If not provided, default to $1
  processingFee = 9, // If not provided, default to $0
  offerId,
  creatorId,
  marketerId,
  type = "offerFee",
  dealId,
  milestoneId,
  bonus,
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  const { user } = useAuth();
  const { 
    selectedPaymentMethod, 
    useNewPaymentMethod, 
    setSelectedPaymentMethod,
    setUseNewPaymentMethod 
  } = usePayment();

  // Summation of amounts (if you want them combined)
  const totalToCharge = amount;

  // Process payment with saved payment method
  const processPaymentWithSavedMethod = async (paymentMethod: SavedPaymentMethod) => {
    setProcessingPayment(true);
    setError(null);

    try {
      const metadata: any = {
        type: type || "offerFee",
      };

      // Handle different payment types
      if (type === "offerFee" && offerId) {
        metadata.offerId = offerId;
        metadata.creatorId = creatorId || "";
        metadata.marketerId = marketerId || "";
      } else if (type === "milestoneFunding" && dealId && milestoneId) {
        metadata.dealId = dealId;
        metadata.milestoneId = milestoneId;
        metadata.marketerId = marketerId || "";
        metadata.paymentType = "milestoneFunding";
      } else if (type === "finalPayment" && dealId) {
        metadata.dealId = dealId;
        metadata.paymentType = "finalPayment";
      }

      metadata.escrowAmount = type === "offerFee" ? String(1) : String(totalToCharge);
      metadata.feeAmount = type === "offerFee" ? 0 : processingFee || 9;
      metadata.bonusAmount = bonus || 0;

      // Create payment intent with saved payment method
      const paymentIntentResponse = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payments/create-payment-intent`,
        {
          amount: type === "offerFee" ? 100 : totalToCharge * 100, // Convert to cents
          currency: "usd",
          userId: marketerId,
          paymentMethodId: paymentMethod.id,
          metadata,
          confirmationMethod: 'automatic'
        }
      );

      const { paymentIntent, clientSecret: intentSecret } = paymentIntentResponse.data;

      // Confirm the payment
      const confirmResponse = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payments/confirm-payment`,
        {
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentMethod.id,
          userId: marketerId,
          ...metadata
        }
      );

      if (confirmResponse.data.success) {
        const transactionNumber = confirmResponse.data.transactionNumber || paymentIntent.id;
        onSuccess(paymentIntent.id, transactionNumber);
      } else {
        throw new Error(confirmResponse.data.error || 'Payment confirmation failed');
      }

    } catch (err: any) {
      console.error("Error processing payment with saved method:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to process payment";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelected = (method: SavedPaymentMethod | null) => {
    if (method) {
      // User selected a saved payment method
      setShowPaymentMethodSelector(false);
    } else {
      // User chose to add new payment method - show checkout
      setShowPaymentMethodSelector(false);
      createCheckoutSession();
    }
  };

  const handleProceedWithSavedMethod = () => {
    if (selectedPaymentMethod) {
      processPaymentWithSavedMethod(selectedPaymentMethod);
    }
  };

  const createCheckoutSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const metadata: any = {
        type: type || "offerFee",
      };

      // Handle different payment types
      if (type === "offerFee" && offerId) {
        metadata.offerId = offerId;
        metadata.creatorId = creatorId || "";
        metadata.marketerId = marketerId || "";
      } else if (type === "milestoneFunding" && dealId && milestoneId) {
        metadata.dealId = dealId;
        metadata.milestoneId = milestoneId;
        metadata.marketerId = marketerId || "";
        metadata.paymentType = "milestoneFunding";
      } else if (type === "finalPayment" && dealId) {
        metadata.dealId = dealId;
        metadata.paymentType = "finalPayment";
      }

      // Add amount info to metadata (preserving existing offerFee handling)
      metadata.escrowAmount =
        type === "offerFee" ? String(1) : String(totalToCharge);
      metadata.feeAmount = type === "offerFee" ? 0 : processingFee || 9;
      metadata.bonusAmount = bonus || 0;

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payments/create-checkout-session`,
        {
          amount: type === "offerFee" ? 1 : totalToCharge,
          currency: "usd",
          userId: marketerId, // Add userId to the body
          metadata,
        }
      );

      console.log("Session created:", response.data.sessionId);
      setClientSecret(response.data.clientSecret);
      setSessionId(response.data.sessionId);
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      setError(err.message || "Failed to create checkout session");
      onError(err.message || "Failed to create checkout session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't automatically create checkout session
    // Wait for user to select payment method
    setLoading(false);
  }, []);

  // Listen for checkout completion event
  // Listen for checkout completion
  const handleCheckoutComplete = async () => {
    console.log("Checkout complete, session ID:", sessionId);
    if (sessionId) {
      try {
        // 1) Verify the session status on the backend, now includes transaction_number
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payments/session-status?session_id=${sessionId}&userId=${marketerId}`
        );

        console.log("Session status:", response.data);

        if (response.data.payment_status === "paid") {
          const transactionNumber = response.data.transaction_number;

          onSuccess(sessionId, transactionNumber); // or call your success callback
        } else {
          const errorMsg = "Payment was not completed. Please try again.";
          setError(errorMsg);
          onError(errorMsg);
        }
      } catch (err: any) {
        console.error("Error checking session status:", err);
        const errorMsg =
          "Could not verify payment status. Please contact support.";
        setError(errorMsg);
        onError(errorMsg);
      }
    }
  };
  if (Platform.OS !== "web") {
    return null;
  }

  if (loading || processingPayment) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text>{processingPayment ? 'Processing payment...' : 'Initializing payment...'}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.button}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!clientSecret) {
    return (
      <View style={styles.container}>
        <Text>Unable to initialize payment</Text>
        <TouchableOpacity onPress={onCancel} style={styles.button}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show payment method selector first
  if (showPaymentMethodSelector) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.paymentTitle}>Select Payment Method</Text>
          <Text style={styles.paymentSubtitle}>
            Choose a saved payment method or add a new one
          </Text>

          <PaymentMethodSelector
            onMethodSelected={handlePaymentMethodSelected}
            onAddNewMethod={() => handlePaymentMethodSelected(null)}
            showAddButton={true}
            allowRemoval={true}
            compact={false}
          />

          {selectedPaymentMethod && !useNewPaymentMethod && (
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={handleProceedWithSavedMethod}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.proceedButtonText}>
                  Pay ${totalToCharge} with saved method
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* <View style={styles.rowTable}>
          <View style={styles.rowTableCell}>
            <Text>Escrow Amount (50%).</Text>
            <Text>${totalToCharge}</Text>
          </View>
          <View style={styles.rowTableCell}>
            <Text>Platform Fee (5%).</Text>
            <Text>${totalToCharge * 0.05}</Text>
          </View>
          <View style={styles.rowTableCell}>
            <Text>Total</Text>
            <Text>${totalToCharge + totalToCharge * 0.05}</Text>
          </View>
        </View> */}
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            onComplete: handleCheckoutComplete,
          }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#0070f3",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  paymentSubtitle: {
    fontSize: 16,
    color: "#6C6C6C",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  proceedButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 20,
  },
  proceedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
