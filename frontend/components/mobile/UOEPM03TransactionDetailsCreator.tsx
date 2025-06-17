"use client";
import React from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Arrowleft02 from "../../assets/arrowleft02.svg";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "../ProfileInfo";
import Navbar from "../web/navbar";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function TransactionDetailsCreator() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  return (
    <SafeAreaView
      style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
    >
      <Navbar pageTitle="Transaction Details"/>
      <StatusBar style="auto" />

      {/* <View style={styles.header}>
        <CustomBackButton />

        <Text style={styles.headerTitle}>Transaction Details</Text>
        <ProfileInfo /> 
      </View> */}

      <ScrollView style={styles.content}>
        <Text style={styles.transactionName}>Pepsi Promo January</Text>

        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Deal No</Text>
            <Text style={styles.detailValue}>#34587</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Transaction Number</Text>
            <Text style={styles.detailValue}>#478365347</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Billed to</Text>
            <Text style={styles.detailValue}>@timbaio</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Date</Text>
            <Text style={styles.detailValue}>January 15, 2025</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Methods</Text>
            <Text style={styles.detailValue}>Instant Cash</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Depositing Account</Text>
            <Text style={styles.detailValue}>***** 8367</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, styles.amountValue]}>$24.00</Text>
          </View>
        </View>
      </ScrollView>

      <Pressable
        style={[
          styles.downloadButton,
          isWeb && isWideScreen && styles.webButton,
        ]}
      >
        <Text style={styles.downloadButtonText}>Download Receipt</Text>
      </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholder: {},
  content: {
    flex: 1,
    padding: 20,
  },
  transactionName: {
    fontSize: 24,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 32,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  detailsList: {
    gap: 24,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 16,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  amountValue: {
    color: "#430B92",
  },
  downloadButton: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    width:'40%',
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  webButton: {
    width: "100%",
    alignSelf: "center",
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});