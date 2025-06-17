"use client";

import React, { useState,useEffect } from "react";
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
  TouchableOpacity,
} from "react-native";
import DateRangePicker from './datepicker'
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import axios from 'axios';
import Arrowleft023 from "../../assets/arrowleft023.svg";
import { useMemo } from "react";
import CustomBackButton from "@/components/CustomBackButton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "../ProfileInfo";
import Navbar from "./navbar";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};
interface EarningsSummary {
  availableBalance : number;
  currentWeekEarnings: number;
}

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
  const [selectedRange, setSelectedRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const[history,showHistory]=useState(false)
  const[earnings,setEarnings]=useState(true)
  const { user } = useAuth();
  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/payments";

  const fetchPayoutHistory = async (userId: string) => {
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await axios.get(`${API_URL}/withdrawals/history?userId=${userId}`);
    return response.data;
  };

  

  const fetchEarningsHistory = async (userId: string, startDate: string, endDate: string) => {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const response = await axios.get(`${API_URL}/earnings`, {
      params: {
        userId: userId,
        filter: "dateRange",
        startDate: startDate,
        endDate: endDate,
      },
    });
    return response.data;
  };
  const handleConfirm = (range: { startDate: string; endDate: string }) => {
    setSelectedRange(range);
    setShowAll(false); // Reset to filtered view
  };
  

  const { data: payoutHistory, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ["payoutHistory", user?._id],
    queryFn: () => fetchPayoutHistory(user?._id || ""),
    enabled: !!user,
  });

  const fetchEarningsSummary = async (userId: string, startDate: string, endDate: string) => {
    const response = await axios.get(`${API_URL}/earnings/summary`, {
      params: { userId, startDate, endDate },
    });
    return response.data;
  };
  

  const filteredWithdrawals = useMemo(() => {
    if (!payoutHistory) return [];
  
    // Show all by default if withdrawals tab is open and user hasn't selected a range
    if (showAll || !selectedRange) return payoutHistory;
  
    const start = new Date(selectedRange.startDate);
    const end = new Date(selectedRange.endDate);
  
    return payoutHistory.filter((withdrawal: any) => {
      const createdAt = new Date(withdrawal.completedAt || withdrawal.createdAt);
      return createdAt >= start && createdAt <= end;
    });
  }, [payoutHistory, selectedRange, showAll]);
  
  
  
  // Fallback to current week if selectedRange is not set
const fallbackStart = moment().startOf('isoWeek').format('YYYY-MM-DD');
const fallbackEnd = moment().endOf('isoWeek').format('YYYY-MM-DD');
const startDate = selectedRange?.startDate || fallbackStart;
const endDate = selectedRange?.endDate || fallbackEnd;

const { data: earningsSummary } = useQuery<EarningsSummary>({
  queryKey: ["earningsSummary", user?._id, startDate, endDate],
  queryFn: () => fetchEarningsSummary(user?._id || "", startDate, endDate),
  enabled: !!user,
});

const { data: earningsHistory } = useQuery({
  queryKey: ["earningsHistory", user?._id, startDate, endDate],
  queryFn: () => fetchEarningsHistory(user?._id || "", startDate, endDate),
  enabled: !!user,
});

  useEffect(() => {
    const start = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const end = moment().endOf('isoWeek').format('YYYY-MM-DD');
    setSelectedRange({ startDate: start, endDate: end });
  }, []);
    

  

  const handleWithdrawPress = () => {
    // Ensure `earningsSummary?.availableBalance` is passed to the next screen correctly
    router.push({
      pathname: "/UOEPM02WithdrawMoneyCreator",
      query: { availableBalance: earningsSummary?.availableBalance || 0 }, // Default to 0 if no value is available
    });
  };
  
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
  

  const startOfWeek = getStartOfWeekUTC();
const weeklyEarningsHistory = earningsHistory
  ? earningsHistory.filter((earning: any) => {
      const createdAt = new Date(earning.createdAt);
      // If earnings are stored in UTC, this works because both dates are compared as UTC
      return createdAt >= startOfWeek;
    })
  : [];  



  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.DESKTOP;

  return (
    <>
    <Navbar pageTitle="Payment History"/>
    <SafeAreaView>      
      <StatusBar style="auto" />
      
      <View style={[ isWeb && isWideScreen && styles.webContainer]}>
      {/* <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.headerTitle}>Payment History</Text>
        <ProfileInfo /> 
      </View> */}

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, earnings && styles.activeTab]}
          onPress={() => { setEarnings(true); showHistory(false); }}
        >
          <Text style={[styles.tabText, earnings && styles.activeTabText]}>Earnings</Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, history && styles.activeTab]}
          onPress={() => {
            setEarnings(false);
            showHistory(true);
            setShowAll(true); // 🔥 ensure all withdrawals show by default
          }}
          
        >
          <Text style={[styles.tabText, history && styles.activeTabText]}>WithDrawals</Text>
        </Pressable>
      </View>


      <ScrollView style={styles.content}>
     { /* Earnings */}   
     {earnings && (
      <View>
        <View style={styles.balanceCards}>
          <Pressable
            style={styles.balanceCard}
            onPress={() => router.push("/UOEPM02WithdrawMoneyCreator")}
          >
            <TouchableOpacity onPress={handleWithdrawPress}>
            <Text style={styles.balanceLabel} >Available Balance</Text>

            
            <Text style={styles.balanceAmount}>
  ${earningsSummary?.availableBalance ? earningsSummary.availableBalance.toFixed(2) : "0.00"}
</Text>
            </TouchableOpacity>
          </Pressable>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Week Earnings</Text>
            <Text style={styles.balanceAmount}>
              $
              {earningsSummary?.currentWeekEarnings
                ? earningsSummary.currentWeekEarnings.toFixed(2)
                : "0.00"}
            </Text>
          </View>
        </View>
        <DateRangePicker onConfirm={handleConfirm} />

        
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Select Week</Text>
<Pressable onPress={() => setShowAll(true)}>
  <Text style={styles.seeAllButton}>See All</Text>
</Pressable>


          </View>
<ScrollView>
          <View style={styles.transactionsList}>
            {weeklyEarningsHistory.map((earning: any) => (
              <Pressable
                key={earning.id || earning._id}
                style={styles.transactionCard}
                // When a transaction is pressed, navigate using:

              >
                <View style={styles.transactionInfo}>
                 <Image
                                    style={styles.transactionImage}
                                    source={
                                     earning?.user?.avatarUrl?.includes("/uploads/")
                                        ? { uri: `${process.env.EXPO_PUBLIC_BACKEND_URL}${earning?.user.avatarUrl}` }
                                        : earning?.user.avatarUrl || require("@/assets/empty-image.png")
                                    }
                                  />
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionName}>
                    {earning?.deal?.marketerId?.name  || earning?.deal?.marketerId?.userName || "Unknown"}
                    {/* @{earning?.user?._id?.userName || "Montano123"} */}
                    </Text>
                  
                    <Text style={styles.transactionId}>
  {earning.createdAt && !isNaN(Date.parse(earning.createdAt)) ? (
    format(new Date(earning.createdAt), "dd MMM yyyy")
  ) : (
    <Text style={{ color: 'red' }}>Invalid Date</Text>
  )}
</Text>

                  </View>
                </View>
                <Text style={styles.transactionAmount}>
                  + ${earning.amount.toFixed(2)}
                </Text>
              </Pressable>
            ))}
          </View>
          </ScrollView>
        </View>
      </View>
     )}     
     
      

{/*Earninhgs end */}
{/* History */}
{history && (
  <View style={styles.historySection}>  
   <View style={styles.balanceCards}>
          <Pressable
            style={styles.balanceCard}
            onPress={() => router.push("/UOEPM02WithdrawMoneyCreator")}
          >
            <TouchableOpacity onPress={handleWithdrawPress}>
            <Text style={styles.balanceLabel} >Available Balance</Text>

            
            <Text style={styles.balanceAmount}>
  ${earningsSummary?.availableBalance ? earningsSummary.availableBalance.toFixed(2) : "0.00"}
</Text>
            </TouchableOpacity>
          </Pressable>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Week Earnings</Text>
            <Text style={styles.balanceAmount}>
              $
              {earningsSummary?.currentWeekEarnings
                ? earningsSummary.currentWeekEarnings.toFixed(2)
                : "0.00"}
            </Text>
          </View>
        </View>
        <DateRangePicker onConfirm={handleConfirm} />
    <View style={styles.historyHeader}>
      <Text style={styles.historyTitle}>Select Week</Text>
      <Pressable onPress={() => setShowAll(true)}>
  <Text style={styles.seeAllButton}>See All</Text>
</Pressable>

    </View>

    <View style={styles.transactionsList}>
    {filteredWithdrawals && filteredWithdrawals.length > 0 ? (
  filteredWithdrawals.map((withdrawal) => (
                <Pressable
                  key={withdrawal.id || withdrawal._id}
                  style={styles.transactionCard}
                  onPress={() => router.push(`/UOEPM03TransactionDetailsCreator?id=${withdrawal._id}`)}
                >
                  <View style={styles.transactionInfo}>
                    <Image
                      source={withdrawal.image ? { uri: withdrawal.image } : require("@/assets/empty-image.png")}
                      style={styles.transactionImage}
                    />
                    <View style={styles.transactionDetails}>
                    <Text style={styles.transactionNames}>
                 {withdrawal.status || 'failed' }  
</Text>
                  
<Text style={styles.transactionId}>
  {withdrawal.completedAt && !isNaN(Date.parse(withdrawal.completedAt)) ? (
    format(new Date(withdrawal.completedAt), "dd MMM yyyy")
  ) : (
    <Text style={{ color: 'red' }}>Invalid Date</Text>
  )}
</Text>

                    </View>
                  </View>
                  <Text style={styles.transactionAmount}>
                    - ${withdrawal.amount.toFixed(2)}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text>No withdrawal history available</Text>
            )}
          </View>
  </View>
)}

     
      </ScrollView>
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: "#FFFFFF",
  },
webContainer: {
  width: "100%",
  paddingHorizontal: "15%", // 5% margin on both sides
},


  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingHorizontal: 20,
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
    // paddingHorizontal: 20,
    marginBottom: 24,
  },
  tabItem: {
    paddingVertical: 12,
    // paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#430B92",
  },
  tabText: {
    fontSize: 16,
    color: "#000000",
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
    // paddingHorizontal: 20,
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
  transactionNames: {
    fontSize: 20,
    fontWeight: "500",
    color: "green",
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