import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Color } from "@/GlobalStyles";

// Import tab icons
import Discoveryiconlypro from "../assets/discovery--iconly-pro.svg";
import Hotprice from "../assets/hotprice.svg";
import Message01 from "../assets/message01.svg";
import Notification02 from "../assets/user.svg";
import User from "../assets/user.svg";
import { TabButton } from "./TabButton";
import { useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useUnreadMessages } from "@/hooks/messagesContext";
// import { useUnreadMessages } from '@/contexts/UnreadMessagesContext';

const TABS = [
  { name: "index", icon: Discoveryiconlypro, label: "Explore", route: "/" },
  { name: "deals", icon: Hotprice, label: "Deals/Offers", route: "/deals" },
  { name: "messages", icon: Message01, label: "Messages", route: "/messages" },
  { name: "notifications", icon: Notification02, label: "Notifications", route: "/notifications" },
  { name: "profile", icon: User, label: "Profile", route: "/profile" },
];

const WebBottomTabs = ({ activeIndex }: { activeIndex: number }) => {
  const window = useWindowDimensions();
  const isWideScreen = window.width >= 1280;
  const { unreadCount } = useUnreadMessages();

  return (
    <View
      style={{
        position: "relative",
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: Color.cSK430B92500,
        width: "100%",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          maxWidth: 1280,
          marginHorizontal: "auto",
          width: "100%",
          position: "relative",
        }}
      >
        {TABS.map((tab, index) => (
          <View key={tab.name} style={styles.tabContainer}>
            <TabButton
              icon={
                <tab.icon
                  width={isWideScreen ? 40 : 24}
                  height={isWideScreen ? 40 : 24}
                />
              }
              label={tab.label}
              isActive={index === activeIndex}
              onPress={() => {
                router.push(tab.route);
              }}
            />
            {/* Add badge only to Messages tab */}
            {tab.name === "messages" && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    position: "relative",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: "25%",
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default WebBottomTabs;