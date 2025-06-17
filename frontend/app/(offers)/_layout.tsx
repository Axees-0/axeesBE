import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import React from "react";
import { router, Slot, usePathname } from "expo-router";
import { FontFamily } from "@/GlobalStyles";
import { StatusBar } from "expo-status-bar";
import ProfileInfo from "@/components/ProfileInfo";
import CustomBackButton from "@/components/CustomBackButton";
import { useWindowDimensions } from "react-native";
import WebBottomTabs from "@/components/WebBottomTabs";
import Navbar from "@/components/web/navbar";
const _layout = () => {
  const pathname = usePathname();

  return (
    <>
      <Navbar pageTitle="Deals and Offers" />
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={[styles.webContainer, styles.container]}>
          <View style={styles.header}>
            {/* <CustomBackButton />
          <Text style={styles.headerTitle}>History</Text> */}
          </View>

          <View style={styles.tabBar}>
            <Pressable
              style={[
                styles.tabItem,
                pathname === "/UOM07MarketerOfferHistoryList" &&
                  styles.activeTab,
              ]}
              onPress={() => router.push("/UOM07MarketerOfferHistoryList")}
            >
              <Text
                style={[
                  styles.tabText,
                  pathname === "/UOM07MarketerOfferHistoryList" &&
                    styles.activeTabText,
                ]}
              >
                Offers
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabItem,
                pathname === "/UOM08MarketerDealHistoryList" &&
                  styles.activeTab,
              ]}
              onPress={() => router.push("/UOM08MarketerDealHistoryList")}
            >
              <Text
                style={[
                  styles.tabText,
                  pathname === "/UOM08MarketerDealHistoryList" &&
                    styles.activeTabText,
                ]}
              >
                Deals
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabItem,
                pathname === "/UOM09MarketerDraftHistoryList" &&
                  styles.activeTab,
              ]}
              onPress={() => router.push("/UOM09MarketerDraftHistoryList")}
            >
              <Text
                style={[
                  styles.tabText,
                  pathname === "/UOM09MarketerDraftHistoryList" &&
                    styles.activeTabText,
                ]}
              >
                Drafts
              </Text>
            </Pressable>
          </View>

          <Slot />
        </View>

        {/* {Platform.OS === "web" && <WebBottomTabs activeIndex={1} />} */}
      </SafeAreaView>
    </>
  );
};

export default _layout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    fontFamily: FontFamily.inter,
  },
  placeholder: {},
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 16,
    width: "100%",
    justifyContent: "space-between",
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#430B92",
  },
  tabText: {
    fontSize: 16,
    color: "#000000",
  },
  activeTabText: {
    color: "#430B92",
    fontWeight: "500",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  webContainer: {
    marginHorizontal: "15%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
  },
});
