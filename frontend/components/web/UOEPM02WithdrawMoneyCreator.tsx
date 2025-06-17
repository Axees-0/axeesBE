import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import CustomBackButton from "@/components/CustomBackButton";
import Group27 from "../../assets/group-27.svg";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "../ProfileInfo";
import Toast from "react-native-toast-message";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Navbar from "./navbar";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/payments";

export default function WithdrawMoneyCreator() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const [addedCards, setAddedCards] = useState([]);
  const [UserId, SetUserID]  = useState("");
  const [amount, setAmount] = useState(0.00);
  const [errorMessage,setErrorMessage]=useState("")
  const [isAmountValid, setIsAmountValid] = useState(true); // To track if the entered amount is valid
  /* selected radio */
const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Fetch earnings summary
  const fetchEarningsSummary = async (userId) => {
    SetUserID(userId);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await axios.get(`${API_URL}/earnings/summary?userId=${userId}`);
    return response.data;
  };


  const { data: earningsSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["earningsSummary", user?._id],  // Query key as an array
    queryFn: () => fetchEarningsSummary(user?._id || ""),  // Query function
    enabled: !!user,  // Only run the query if the user exists
  });




  /* ───────────────────────── NEW HOOKS ───────────────────────── */
// fetch the user's payment‑methods from backend → Stripe
const fetchPaymentMethods = async () => {
  const res = await axios.get(
    `${API_URL}/paymentmethods`,
    { params: { userId: user?._id } }               // manualAuth needs it
  );
  return res.data.payoutMethods;                   // array from backend
};


const { data: paymentMethods = [], isLoading: pmLoading } = useQuery({
  queryKey: ["paymentMethods", user?._id],
  queryFn : fetchPaymentMethods,
  enabled : !!user,
});
  



  


/* disable Withdraw button unless everything valid */
const canWithdraw =
  isAmountValid &&
  parseFloat(amount) > 0 &&
  !!selectedPaymentId &&
  !pmLoading &&
  !summaryLoading;


  

  const handleWithdraw = async (instant = true) => {
    const enteredAmount = parseFloat(formattedAmount);
    
    // Validation for empty amount
    if (amount < 10) {
      Toast.show({
        type: "customNotification",
        text1: "Validation Error",
        text2: "You can Withdraw minimum $10 USD",
        position: "top",
        visibilityTime: 3000,
      });
      return; // Don't proceed if no amount is entered
    }

    // Validation for exceeding balance
    if (enteredAmount > earningsSummary?.availableBalance) {
      Toast.show({
        type: "customNotification",
        text1: "Validation Error",
        text2: "The entered amount exceeds the available balance.",
        position: "top",
        visibilityTime: 3000,
      });
      return; // Don't proceed if amount exceeds balance
    }

    

    // If all validations pass, proceed with the API call to withdraw
    axios.post(`${API_URL}/withdrawmoney?userId=${UserId}`, {
      amount: enteredAmount,
      paymentMethodId: selectedPaymentId,
      instantPay: instant, 
    })
    .then(response => {
      Toast.show({
        type: "customNotification",
        text1: "Success",
        text2: "Withdrawal successful!",
        position: "top",
        visibilityTime: 3000,
      });
      router.push("/UOEPM01PaymentHistoryCreator"); // Redirect to transaction details page
    })
    .catch(error => {
      Toast.show({
        type: "customNotification",
        text1: "Error",
        text2: "Failed to process withdrawal.",
        position: "top",
        visibilityTime: 3000,
      });
    });
  };


  // Handle amount input change
  const handleAmountChange = (value) => {
    const formattedValue = value.replace(/[^0-9.]/g, ''); // Remove anything except digits and decimal point
    const parsedAmount = parseFloat(formattedValue);
console.log("when put something: ", formattedValue);
    setAmount(formattedValue);

    // Check if the entered amount exceeds the available balance
    if (parsedAmount > earningsSummary?.availableBalance) {
      setIsAmountValid(false); // Invalid amount
      setErrorMessage("The entered amount exceeds the available balance.");
    } else {
      setIsAmountValid(true); // Valid amount
      setErrorMessage("");
    }
  };

  // Format amount to 2 decimals
  const formattedAmount = parseFloat(amount).toFixed(2);
  console.log("After that put something: ", formattedAmount);



  return (
    <>
    <Navbar pageTitle="Withdraw Money"/>
    <SafeAreaView style={styles.container}>      
      <StatusBar style="auto" />
{/* 
      <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Withdraw Money</Text>
        <ProfileInfo />
      </View> */}

      <ScrollView style={styles.content}>
        <View style={[isWeb && isWideScreen && styles.webContainer]}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          
          <View style={styles.row}>
              <Text style={styles.dollarSign}>$</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.amount, !isAmountValid && styles.invalidAmount]}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={formattedAmount}
                  onChangeText={handleAmountChange}
                  selectionColor="black"
                  cursorColor="black"
                  maxLength={10}
                />
              </View>
            </View>



          {!isAmountValid && <Text style={styles.errorText}>{errorMessage}</Text>}
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceAmount}>
              ${earningsSummary?.availableBalance ? earningsSummary.availableBalance.toFixed(2) : "0.00"}
            </Text>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
        </View>

        <View style={styles.withdrawSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Withdraw money to</Text>
            <Pressable
              style={styles.addAccountButton}
              onPress={() => router.push("/UOEPM04AddNewMethodCreator")}
            >
              <Text style={styles.addAccountText}>+ Add new account</Text>
            </Pressable>
          </View>

          
              {/* Withdraw money to – list each payment method from Stripe */}
              {paymentMethods.length ? (
                paymentMethods.map((pm: { card: { last4: any; exp_month: { toString: () => string; }; exp_year: { toString: () => string | any[]; }; }; us_bank_account: { last4: any; }; id: string | number | bigint | ((prevState: string | null) => string | null) | null | undefined; }) => {
                  const last4  = pm.card?.last4 || pm.us_bank_account?.last4 || "XXXX";
                  const expiry =
                    pm.card
                      ? `${pm.card.exp_month.toString().padStart(2, "0")}/${pm.card.exp_year
                          .toString()
                          .slice(-2)}`
                      : "";
                  return (
                    <Pressable
                      key={pm.id}
                      style={[
                        styles.paymentMethod,
                        selectedPaymentId === pm.id && { borderColor: "#430B92", borderWidth: 1 },
                      ]}
                      onPress={() => setSelectedPaymentId(pm.id)}
                    >
                      <View style={styles.methodInfo}>
                        <Group27 width={44} height={42} />
                        <View style={styles.methodDetails}>
                          <Text style={styles.methodName}>
                            {pm.card ? "Card" : "Bank"} •••• {last4}
                          </Text>
                          {expiry ? <Text style={styles.methodExpiry}>Expiry {expiry}</Text> : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <Text>No payment method found. Please add one.</Text>
              )}

          <View style={styles.payoutOptions}>
            <Text style={styles.payoutLabel}>Select one payout method to continue</Text>
            <View style={styles.payoutButtons}>
              <Pressable style={styles.payoutButton}>
                <Text style={styles.payoutButtonTitle}>Instant Pay</Text>
                <Text style={styles.payoutButtonDescription}>
                  Cash-out at the end of the day. This operation has a 1% fee.
                </Text>
              </Pressable>

              <Pressable style={[styles.payoutButton, styles.payoutButtonInactive]}>
                <Text style={styles.payoutButtonTitle}>48h Cash-Out</Text>
                <Text style={styles.payoutButtonDescription}>
                  Payout request is released within 48h with no deductions.
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        </View>
      </ScrollView>

      <Pressable
        style={[styles.withdrawButton, isWeb && isWideScreen && styles.webButton]}
        /* onPress handler update */
        onPress={() => handleWithdraw(true)}
        disabled={!canWithdraw}
      >
        <Text style={styles.withdrawButtonText}>Withdraw</Text>
      </Pressable>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webContainer: {
    // maxWidth: BREAKPOINTS.DESKTOP,
    paddingHorizontal:'15%',
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  amountSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  
  errorText:{
    color:'red',
    margin:20
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 20,
  },
  dollarSign: {
    fontSize: 48,
    fontWeight: "600",
    marginRight: 8,      // space between $ and box
  },
  inputWrapper: {
    
    
    borderRadius: 8,
    maxWidth: "35%",            
    height: 58,          // match your design
    justifyContent: "center",
  },
  amount: {
    fontSize: 48,
    fontWeight: "600",
    textAlign: "center", // this does the horizontal centering
    paddingVertical: 0,  // removes extra padding so it really centers
  },
  invalidAmount: {
    color: "red",
  },
  balanceInfo: {
    alignItems: "center",
    gap: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6C6C6C",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  withdrawSection: {
    gap: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#000000",
  },
  addAccountButton: {
    backgroundColor: "#F0E7FD",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  addAccountText: {
    fontSize: 14,
    color: "#430B92",
  },
  paymentMethod: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  methodInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodDetails: {
    gap: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  methodExpiry: {
    fontSize: 12,
    color: "#6C6C6C",
  },
  cardNumber: {
    fontSize: 16,
    color: "#000000",
  },
  payoutOptions: {
    gap: 16,
  },
  payoutLabel: {
    fontSize: 14,
    color: "#6C6C6C",
  },
  payoutButtons: {
    gap: 12,
  },
  payoutButton: {
    borderWidth: 1,
    borderColor: "#430B92",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  payoutButtonInactive: {
    borderColor: "#E2D0FB",
  },
  payoutButtonTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  payoutButtonDescription: {
    fontSize: 12,
    color: "#6C6C6C",
    textAlign: "center",
  },
  withdrawButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    //paddingHorizontal:'50%',
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  webButton: {
    alignSelf: "center",
    paddingHorizontal:'5%',
    width:'30%'

  },
  withdrawButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
});
