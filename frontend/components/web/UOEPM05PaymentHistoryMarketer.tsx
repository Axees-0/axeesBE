"use client";
import React, { useEffect } from "react";
import { useMemo } from "react";
import moment from "moment";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
} from "react-native";
import DateRangePicker from './datepicker';
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import axios from 'axios';
import CustomBackButton from "@/components/CustomBackButton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "../ProfileInfo";
import Navbar from "./navbar";
import { useState } from "react";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

interface AuthContextType {
  user: {
    _id: string;
    token: string;
    userType: "Marketer" | "Creator";
    // … other fields as needed
  } | null;
  // … any additional fields
}

export default function PaymentHistoryCreator() {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ startDate: string; endDate: string } | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/payments";

  const fetchMarketerPayoutHistory = async (userId: string, startDate?: string, endDate?: string) => {
    const response = await axios.get(`${API_URL}/marketer`, {
      params: { userId, ...(startDate && endDate ? { startDate, endDate } : {}) },
    });
    return response.data;
  };

  // Fetch payouts for the selected date range
  const { data: payoutHistory, isLoading, error } = useQuery({
    queryKey: ["payoutHistory", user?._id, selectedRange?.startDate, selectedRange?.endDate],
    queryFn: () => fetchMarketerPayoutHistory(
      user?._id || "",
      showAll ? undefined : selectedRange?.startDate,
      showAll ? undefined : selectedRange?.endDate
    ),
    enabled: !!user,
  });

  const payouts = payoutHistory?.payoutHistory || [];
  const availableBalance = payoutHistory?.availableBalance || 0;
  const currentWeekPayouts = payoutHistory?.currentWeekPayouts || 0;

  // Set the default date range to the current week
  useEffect(() => {
    const start = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const end = moment().endOf('isoWeek').format('YYYY-MM-DD');
    setSelectedRange({ startDate: start, endDate: end });
  }, []);
  



  // const handleWithdrawPress = () => {
  //   // Ensure `earningsSummary?.availableBalance` is passed to the next screen correctly
  //   router.push({
  //     pathname: "/UOEPM02WithdrawMoneyCreator",
  //     query: { availableBalance: ?.availableBalance || 0 }, // Default to 0 if no value is available
  //   });
  // };

  const getStartOfWeekUTC = () => {
    const now = new Date();
    // Convert the current date/time to UTC by using the date's UTC methods
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const utcDate = now.getUTCDate();

    // Create a new Date that represents the beginning of today in UTC
    const utcToday = new Date(Date.UTC(utcYear, utcMonth, utcDate));

    // Get the day of the week (0 is Sunday) in UTC
    const dayOfWeek = utcToday.getUTCDay();

    // Calculate the start of the week in UTC (assuming Sunday is the start of the week)
    // If you want Monday as the start, adjust accordingly.
    const startOfWeek = new Date(utcToday);
    startOfWeek.setUTCDate(utcToday.getUTCDate() - dayOfWeek);

    return startOfWeek;
  };

  const handleConfirm = (range: { startDate: string; endDate: string }) => {
    setSelectedRange(range);
    setShowAll(false); // Reset to filtered view when a new date range is selected
  };

  // Since the backend already filters by date range, no need to filter again on the frontend
  const filteredPayoutHistory = useMemo(() => {
    if (!payouts) return [];
    return payouts; // The backend already filters the data based on selectedRange
  }, [payouts]);


  // const filteredPayoutHistory = useMemo(() => {
  //   if (!payoutHistory) return [];
  
  //   if (showAll || !selectedRange) return payoutHistory;
  
  //   const start = new Date(selectedRange.startDate);
  //   const end = new Date(selectedRange.endDate);
  
  //   return payoutHistory.filter((p: any) => {
  //     const createdAt = new Date(p.createdAt);
  //     return createdAt >= start && createdAt <= end;
  //   });
  // }, [payoutHistory, selectedRange, showAll]);

  
  useEffect(() => {
    const start = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const end = moment().endOf('isoWeek').format('YYYY-MM-DD');
    setSelectedRange({ startDate: start, endDate: end });
  }, []);
  

  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.DESKTOP;
  
  return (
    <>
      <Navbar pageTitle="Payouts Detail" />
      <SafeAreaView style={[styles.container]}>
        <StatusBar style="auto" />
        <View style={[isWeb && isWideScreen && styles.webContainer]}>
          <View style={styles.tabBar}>
            <Pressable style={[styles.tabItem, styles.activeTab]}>
              <Text style={[styles.tabText, styles.activeTabText]}>Payouts</Text>
            </Pressable>
          </View>

          
            <View style={styles.balanceCards}>
              <Pressable
                style={styles.balanceCard}
                onPress={() => router.push("/UOEPM02WithdrawMoneyCreator")}
              >
                <TouchableOpacity>
                  <Text style={styles.balanceLabel}>OutStanding Balance</Text>
                  <Text style={styles.balanceAmount}>
                    ${availableBalance.toFixed(2) || "0.00"}
                  </Text>
                </TouchableOpacity>
              </Pressable>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Current Week Payouts</Text>
                <Text style={styles.balanceAmount}>
                  ${currentWeekPayouts.toFixed(2) || "0.00"}
                </Text>
              </View>
            </View>

            <DateRangePicker
              onConfirm={handleConfirm} // Pass the handler to update selectedRange
            />

            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Select Week</Text>
                <Pressable onPress={() => setShowAll(true)}>
                  <Text style={styles.seeAllButton}>See All</Text>
                </Pressable>
              </View>

              <ScrollView>
                <View style={styles.transactionsList}>
                  {isLoading ? (
                    <Text>Loading...</Text>
                  ) : error ? (
                    <Text style={{ color: "red" }}>
                      Error loading payout history: {(error as Error)?.message}
                    </Text>
                  ) : filteredPayoutHistory && filteredPayoutHistory.length > 0 ? (
                    filteredPayoutHistory.map((payout: { _id: any; id: any; deal: { creatorId: { name: any; userName: any; }; }; createdAt: string | number | Date; amount: number; }) => {
                      if (!payout) return null; // Skip any null or undefined payout records

                      return (
                        <Pressable
                          key={payout?._id || payout?.id}
                          
                          style={styles.transactionCard}
                          onPress={() => router.push(`/UOEPM03TransactionDetailsCreator?id=${payout._id}`)}
                        >
                          <View style={styles.transactionInfo}>
                            <Image
                              source={require("@/assets/empty-image.png")}
                              style={styles.transactionImage}
                            />
                            <View style={styles.transactionDetails}>
                              <Text style={styles.transactionName}>
                                {payout?.deal?.creatorId?.name || payout?.deal?.creatorId?.userName || "Unknown"}
                              </Text>
                              <Text style={styles.transactionId}>
                                {payout.createdAt && !isNaN(Date.parse(payout.createdAt)) ? (
                                  format(new Date(payout.createdAt), "dd MMM yyyy")
                                ) : (
                                  <Text style={{ color: 'red' }}>Invalid Date</Text>
                                )}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.transactionAmount}>
                            -${payout?.amount ? payout.amount.toFixed(2) : "0.00"}
                          </Text>
                        </Pressable>
                      );
                    })
                  ) : (
                    <Text>No payout history found.</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          
        </View>
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
    paddingHorizontal: '15%',
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
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tabItem: {
    borderBottomWidth: 2,
    borderColor: '#430B92',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#430B92",
  },
  tabText: {
    fontSize: 16,
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  activeTabText: {
    color: "#430B92",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCards: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    padding: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6C6C6C",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  historySection: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  seeAllButton: {
    fontSize: 14,
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionImage: {
    width: 44,
    height: 42,
    borderRadius: 8,
  },
  transactionDetails: {
    gap: 4,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  transactionId: {
    fontSize: 12,
    color: "#6C6C6C",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
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