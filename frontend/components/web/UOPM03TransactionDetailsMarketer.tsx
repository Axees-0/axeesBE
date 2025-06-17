"use client";

import React from "react";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
import {
  Text,
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { requestPayout } from "../../../axeesBE/controllers/paymentController";

interface Payout {
  _id: string;
  user: {
    _id: string;
    userName?: string;
    name?: string;
  };
  deal?: {
    dealName: string;
    dealNumber: string;
    // Optionally include more deal details if needed
  };
  amount: number;
  paymentMethod: string;
  transactionId: string;
  reference?: string;
  image?: string;
  createdAt: string;
  senderName?: string;
}

const BREAKPOINTS = { TABLET: 768, DESKTOP: 1280 };


export default function TransactionDetailsMarketer() {
  const { id } = useGlobalSearchParams(); // Get earning ID from query parameter
  const { user } = useAuth();

  const isCreator = user?.userType === "Creator";
  const isMarketer = user?.userType === "Marketer";


    const window = useWindowDimensions();
const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  // Update the fetch method to use the new dedicated route:
  // Example for fetching a single earning in your TransactionDetailsCreator component:
  const fetchPayoutById = async (payoutId: string): Promise<Payout> => {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payments/payouts/marketers/${payoutId}`, // Pass payoutId in the URL path
      {
        params: { userId: user?._id } // Optional: if you need to send the userId as a query parameter for authorization
      }
    );
    return response.data;
  };
  

  const downloadReceipt = async () => {
    if (!payout) return;

    // 1. Build a super‑simple HTML receipt
    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1   { color: #430B92; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          td, th { padding: 8px 4px; border-bottom: 1px solid #eee; text-align: left; }
          th { color: #666; font-weight: normal; width: 40%; }
          .amount { color: #430B92; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>Transaction Receipt</h1>
        <table>
          <tr><th>Deal</th><td>${payout.status}</td></tr>
          <tr><th>Transaction ID</th><td>${payout.transactionId ?? "N/A"}</td></tr>
          <tr><th>Payment Date</th><td>${payout.completedAt}</td></tr>
          <tr><th>Payment Method</th><td>${payout.paymentMethod ?? "N/A"}</td></tr>
          <tr><th>Amount</th><td class="amount">$${payout.amount.toFixed(2)}</td></tr>
        </table>
      </body>
    </html>
  `;

    try {
      // 2. Create the PDF in memory
      const { uri } = await Print.printToFileAsync({ html });

      // 3. Move it to a share‑friendly location (optional but nice)
      const pdfName = `receipt_${payout._id}.pdf`;
      const dest = FileSystem.cacheDirectory + pdfName;
      await FileSystem.moveAsync({ from: uri, to: dest });

      // 4. Share / save
      await Sharing.shareAsync(dest, { UTI: "com.adobe.pdf", mimeType: "application/pdf" });
    } catch (err) {
      console.error("PDF generation failed:", err);
      //alert("Sorry, we couldn't create the receipt.");
    }
  };
  const { data: payout, isLoading, error } = useQuery<Payout>({
    queryKey: ["Payout", id],
    queryFn: () => fetchPayoutById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <CustomBackButton />
        <Text>Loading Transaction...</Text>
      </SafeAreaView>
    );
  }

  if (error || !payout) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Error: {String(error)}</Text>
      </SafeAreaView>
    );
  }

  // Format payment date with a fallback
  const paymentDate = payout.createdAt
    ? format(new Date(payout.createdAt), "dd MMM yyyy")
    : "N/A";

  return (
    <SafeAreaView style={[styles.container && isWeb && isWideScreen && styles.webContainer]}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Payout Details</Text>
        <ProfileInfo />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.transactionName}>
          {payout.status || "Transaction"}
        </Text>
        <View style={styles.detailsList}>
          {/* <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Deal No</Text>
            <Text style={styles.detailValue}>
              {payout.deal ? payout.deal.dealNumber : "N/A"}
            </Text>
          </View> */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Transaction Number</Text>
            <Text style={styles.detailValue}>
              {requestPayout.transactionId}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Date</Text>
            <Text style={styles.detailValue}>
              {payout.completedAt && !isNaN(Date.parse(payout.completedAt)) ? (
                format(new Date(payout.completedAt), "dd MMM yyyy")
              ) : (
                <Text style={{ color: 'red' }}>Invalid Date</Text>
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>
              {payout.paymentMethod || "Credit Card"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Depositing Account</Text>
            <Text style={styles.detailValue}>
              {payout.image ? "Image Available" : "N/A"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, styles.amountValue]}>
              {payout.amount != null && !isNaN(payout.amount)
                ? `$${payout.amount.toFixed(2)}`
                : "Invalid Amount"}
            </Text>
          </View>

        </View>
      </ScrollView>
      <TouchableOpacity style={styles.downloadButton} onPress={downloadReceipt}>
        <Text style={styles.downloadButtonText}>Download Receipt</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 86,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
  },
  innerWeb: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: BREAKPOINTS.DESKTOP,  // 1280 px
  },
  inner: { flex: 1 },

  headerTitle: { fontSize: 24, fontWeight: "600", color: "#000000" },
  content: { flex: 1, padding: 20 },
  transactionName: { fontSize: 24, fontWeight: "500", color: "#000000", marginBottom: 32 },
  detailsList: { marginBottom: 32 },
  detailItem: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  detailLabel: { fontSize: 16, color: "#6C6C6C" },
  detailValue: { fontSize: 16, fontWeight: "500", color: "#000000" },
  amountValue: { color: "#430B92" },
  downloadButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  downloadButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "500" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
