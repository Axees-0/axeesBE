import { View, Text, StyleSheet, Platform } from "react-native";
import React, { useEffect, useRef } from "react";
import { Color } from "@/GlobalStyles";

// Import tab icons
import Discoveryiconlypro from "../assets/discovery--iconly-pro.svg";
import Hotprice from "../assets/hotprice.svg";
import Message01 from "../assets/message01.svg";
import BellNotificationRegular from "../assets/bell-notification.svg";
import DashboardIcon from "../assets/dashboard.svg";
import { TabButton } from "./TabButton";
import { useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useUnreadMessages } from "@/hooks/messagesContext";
// import { useUnreadMessages } from '@/contexts/UnreadMessagesContext';

const TABS = [
  { name: "index", icon: Discoveryiconlypro, label: "Discover", route: "/" },
  { name: "deals", icon: Hotprice, label: "Deals/Offers", route: "/(tabs)/deals" },
  { name: "messages", icon: Message01, label: "Messages", route: "/(tabs)/messages" },
  { name: "notifications", icon: BellNotificationRegular, label: "Notifications", route: "/(tabs)/notifications" },
  { name: "dashboard", icon: DashboardIcon, label: "Dashboard", route: "/(tabs)/dashboard" },
];

const WebBottomTabs = ({ activeIndex }: { activeIndex: number }) => {
  const window = useWindowDimensions();
  const isWideScreen = window.width >= 1280;
  const isDesktop = window.width >= 1024; // Hide on desktop viewports
  const { unreadCount } = useUnreadMessages();
  const tabsRef = useRef<View>(null);

  // Don't render on desktop - using both JS and CSS for robustness
  if (isDesktop) {
    return null;
  }

  // Handle keyboard navigation between tabs
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when focus is within the tab bar
      const activeElement = document.activeElement;
      const tabBar = (tabsRef.current as any)?._nativeTag;
      
      if (!tabBar || !activeElement) return;
      
      // Check if active element is within the tab bar
      const isInTabBar = activeElement.closest(`[data-testid="bottom-tabs"]`);
      if (!isInTabBar) return;

      let newIndex = activeIndex;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = activeIndex > 0 ? activeIndex - 1 : TABS.length - 1;
          break;
        case 'ArrowRight':
          event.preventDefault();
          newIndex = activeIndex < TABS.length - 1 ? activeIndex + 1 : 0;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = TABS.length - 1;
          break;
        default:
          return;
      }

      // Navigate to the new tab
      if (newIndex !== activeIndex) {
        router.push(TABS[newIndex].route);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  return (
    <View
      ref={tabsRef}
      style={[
        styles.bottomTabsContainer,
        {
          position: "relative",
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          backgroundColor: Color.cSK430B92500,
          width: "100%",
          zIndex: 100,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        }
      ]}
      accessibilityRole="navigation"
      accessibilityLabel="Bottom navigation"
      {...(Platform.OS === 'web' && { 'data-testid': 'bottom-tabs' })}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          maxWidth: 1280,
          marginHorizontal: "auto",
          width: "100%",
          position: "relative",
          paddingHorizontal: window.width <= 768 ? 4 : 8, // Reduced padding for 5 tabs on mobile
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
                // Ensure navigation works properly with browser history
                if (index === activeIndex) {
                  // If clicking on the same tab, do nothing to avoid unnecessary navigation
                  return;
                }
                router.push(tab.route);
              }}
            />
            {/* Add badge only to Messages tab */}
            {tab.name === "messages" && unreadCount > 0 && (
              <View 
                style={styles.badge}
                accessibilityRole="status"
                accessibilityLabel={`${unreadCount} unread messages`}
                aria-hidden="true"
              >
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
  bottomTabsContainer: {
    ...Platform.select({
      web: {
        // Hide on desktop screens ≥1024px using CSS media queries for extra protection
        '@media (min-width: 1024px)': {
          display: 'none',
        },
      },
    }),
  },
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