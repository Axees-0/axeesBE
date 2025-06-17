import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
import { useRouter } from "expo-router";
// Regular expression for card number
const cardNumberRegex = /^[0-9]{16}$/;
const validateCardNumber = (cardNumber) => {
  // Remove spaces and non-numeric characters
  const cleanedCardNumber = cardNumber.replace(/\D/g, '');

  // Regex to check if the card number has exactly 16 digits
  const cardNumberRegex = /^[0-9]{16}$/;

  // Check if the card number matches the regex (valid format)
  if (!cardNumberRegex.test(cleanedCardNumber)) {
    return false; // Invalid format (doesn't have exactly 16 digits)
  }

  // Apply Luhn's algorithm for validation
  let sum = 0;
  let shouldDouble = false;
  for (let i = cleanedCardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanedCardNumber.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0; // Luhn algorithm check for validity
};




const validateExpiryDate = (expiry) => {
  const [month, year] = expiry.split("/").map((e) => parseInt(e.trim(), 10));
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Create a new date object for the expiry date
  const expiryDate = new Date(`20${year}`, month - 1);

  // Compare the expiry date with the current date
  if (expiryDate < currentDate) {
    return false; // Date is in the past, show invalid error
  }
  return true; // Date is valid (either current or future)
};

const validateCVV = (cvv) => {
  return /^[0-9]{3}$/.test(cvv);
};

const validateBankDetails = (accountNumber, routingNumber) => {
  return /^[0-9]{16}$/.test(accountNumber) && /^[0-9]{9}$/.test(routingNumber);
};

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function AddNewMethodCreator() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;

  // State variables for form data and error handling
  const [bankName, setBankName] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
const router=useRouter();
  // State for error messages and collapsible sections
  const [errors, setErrors] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    accountNumber: "",
    routingNumber: "",
  });

  const [showCardDetails, setShowCardDetails] = useState(true); // Default to showing the card details section
  const [showBankDetails, setShowBankDetails] = useState(false); // Default to hiding the bank details section

  const handleAddPaymentMethod = async () => {
    let formErrors = {};
  
    // Check the currently visible section for validation
    if (showCardDetails) {
      if (!validateExpiryDate(expiryDate)) {
        formErrors.expiryDate = "Invalid expiry date.";
      }
      if (!validateCVV(cvv)) {
        formErrors.cvv = "Invalid CVV.";
      }
    }
  
    if (showBankDetails) {
      // Validate bank details
      if (!validateBankDetails(accountNumber, routingNumber)) {
        formErrors.accountNumber = "Invalid account number.";
        formErrors.routingNumber = "Invalid routing number.";
      }
    }
  
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
  
    const paymentMethodData = {
      cardholderName,
      cardNumber,
      expiryDate,
      cvv,
      bankName,
      accountNumber,
      routingNumber,
      postalCode,
    };
  
    try {
      // Retrieve the existing cards from AsyncStorage
      const storedCards = await AsyncStorage.getItem("cards");
      const cards = storedCards ? JSON.parse(storedCards) : [];
  
      // Add the new payment method to the cards array
      cards.push(paymentMethodData);
  
      // Store the updated cards array in AsyncStorage
      await AsyncStorage.setItem("cards", JSON.stringify(cards));
      console.log('Stored Cards:', cards);
  
      // Show success toast
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Payment Method Added.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
  
      // Navigate to the withdraw screen
      router.replace("/UOEPM02WithdrawMoneyCreator");
    } catch (error) {
      console.error("Error saving payment method:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save payment method.",
        position: "top",
        autoHide: true,
        visibilityTime: 3000,
        topOffset: 50,
      });
    }
  
    // Clear form errors after submission
    setErrors({});
  };
  

  const handleInputChange = (field, value) => {
    switch (field) {
      case "cardNumber":
        // Format card number with spaces
        value = value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");  // Format the input with spaces
  
        // Ensure the card number does not exceed 16 digits
        if (value.replace(/\D/g, "").length > 16) {
          return; // Prevent adding more than 16 digits
        }
  
        setCardNumber(value);  // Update the state with formatted card number
  
        const cardNumberWithoutSpaces = value.replace(/\s+/g, "");  // Remove spaces for validation
  
        // Check if the card number is valid (both regex and Luhn check)
        if (!validateCardNumber(cardNumberWithoutSpaces)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            cardNumber: "Invalid card number.",
          }));
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            cardNumber: "",
          }));
        }
        break;
  
      case "cardholderName":
        setCardholderName(value);  // Update cardholder name
        if (!value) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            cardholderName: "Cardholder name is required.",
          }));
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            cardholderName: "",
          }));
        }
        break;
  
      case "expiryDate":
        setExpiryDate(value);  // Update expiry date
        if (!validateExpiryDate(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            expiryDate: "Invalid expiry date.",
          }));
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            expiryDate: "",
          }));
        }
        break;
  
      case "cvv":
        setCvv(value);  // Update CVV
        if (!validateCVV(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            cvv: "Invalid CVV.",
          }));
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            cvv: "",
          }));
        }
        break;
  
      case "routingNumber":
        setRoutingNumber(value);  // Update routing number
        break;
  
      case "accountNumber":
        setAccountNumber(value);  // Update account number
        break;
  
      case "postalCode":
        setPostalCode(value);  // Update postal code
        break;
  
      default:
        break;
    }
  };
  
  

  return (
    <SafeAreaView style={[styles.container, isWeb && isWideScreen && styles.webContainer]}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Add New</Text>
        <ProfileInfo />
      </View>

      <ScrollView style={styles.content}>
        {/* Debit Card Details Section */}
        <Pressable onPress={() => { 
          setShowCardDetails(true); 
          setShowBankDetails(false); // Hide bank details if card details are shown
        }}>
          <Text style={styles.toggleButton}>{showCardDetails ? "Hide" : "Show"} Debit/Credit Card Details</Text>
        </Pressable>

        {showCardDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debit /Credit Card Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Cardholder Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#6C6C6C"
                  value={cardholderName}
                  onChangeText={(text) => handleInputChange("cardholderName", text)}
                />
              </View>
              {errors.cardholderName && <Text style={styles.errorText}>{errors.cardholderName}</Text>}
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#6C6C6C"
                    value={expiryDate}
                    onChangeText={(text) => handleInputChange("expiryDate", text)}
                  />
                </View>
                {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}> CVV</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="2374"
                    placeholderTextColor="#6C6C6C"
                    secureTextEntry
                    value={cvv}
                    onChangeText={(text) => handleInputChange("cvv", text)}
                  />
                </View>
                {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Card Number</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="4562 3653 4595 7852"
                  placeholderTextColor="#6C6C6C"
                  value={cardNumber}
                  onChangeText={(text) => handleInputChange("cardNumber", text)}
                />
              </View>
              {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
            </View>
          </View>
        )}

        {/* Bank Details Section */}
        <Pressable onPress={() => { 
          setShowBankDetails(true); 
          setShowCardDetails(false); // Hide card details if bank details are shown
        }}>
          <Text style={styles.toggleButton}>{showBankDetails ? "Hide" : "Show"} Bank Details</Text>
        </Pressable>

        {showBankDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Account holder Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#6C6C6C"
                  value={cardholderName}
                  onChangeText={(text) => handleInputChange("cardholderName", text)}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Routing Number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="1232654347"
                    placeholderTextColor="#6C6C6C"
                    value={routingNumber}
                    onChangeText={(text) => handleInputChange("routingNumber", text)}
                  />
                </View>
                {errors.routingNumber && <Text style={styles.errorText}>{errors.routingNumber}</Text>}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Account Number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="32487327463274637"
                    placeholderTextColor="#6C6C6C"
                    value={accountNumber}
                    onChangeText={(text) => handleInputChange("accountNumber", text)}
                  />
                </View>
                {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Postal Code</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="2345"
                  placeholderTextColor="#6C6C6C"
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <Pressable
  style={[styles.addButton, isWeb && isWideScreen && styles.webButton]}
  onPress={handleAddPaymentMethod}
>
  <Text style={styles.addButtonText}>Add Payment Method</Text>
</Pressable>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  webContainer: { maxWidth: BREAKPOINTS.DESKTOP, marginHorizontal: "auto", width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "600", color: "#000000" },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 24, fontWeight: "500", color: "#000000", marginBottom: 24 },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  label: { fontSize: 14, color: "#6C6C6C", marginBottom: 8 },
  inputContainer: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#E2D0FB", borderRadius: 8, paddingHorizontal: 16, height: 58 },
  input: { flex: 1, fontSize: 16, color: "#000000" },
  addButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  webButton: { alignSelf: "center", width: "100%" },
  addButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "500" },
  errorText: { color: "red", fontSize: 12, marginTop: 4 },
  toggleButton: { fontSize: 16, fontWeight: "500", color: "#430B92", marginBottom: 10, textDecorationLine: "underline" },
});
