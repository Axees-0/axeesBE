import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Slot, Tabs, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, lazy, Suspense } from "react";
import { Platform, StyleSheet, useWindowDimensions, View, ActivityIndicator, Text } from "react-native";

import Logo from "@/assets/Logo.svg";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabButton } from "@/components/TabButton";
import { Indicator } from "@/components/Indicator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandColors } from '@/constants/Colors';

// Import tab icons
import Discoveryiconlypro from "../../assets/discovery--iconly-pro.svg";
import Hotprice from "../../assets/hotprice.svg";
import Message01 from "../../assets/message01.svg";
import BellNotificationRegular from "../../assets/user.svg";
import User from "../../assets/user.svg";

const TABS = [
  { name: "index", icon: Discoveryiconlypro, label: "Explore", route: "/" },
  { name: "deals", icon: Hotprice, label: "Deals/Offers", route: "/(tabs)/deals" },
  { name: "messages", icon: Message01, label: "Messages", route: "/(tabs)/messages" },
  { name: "notifications", icon: BellNotificationRegular, label: "Notifications", route: "/(tabs)/notifications" },
  { name: "profile", icon: User, label: "Profile", route: "/(tabs)/profile" },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isWeb = Platform.OS === "web";
  const isWideScreen = width > 1280;
  const currentPath = usePathname();
  const isMobile = width <= 768;

  // Sync activeIndex with current path and handle browser history
  React.useEffect(() => {
    let matchedIndex = -1;
    
    // Check for exact match first
    if (currentPath === "/" || currentPath === "/(tabs)" || currentPath === "/(tabs)/index") {
      matchedIndex = 0; // Explore tab
    } else {
      // Check other tabs with more comprehensive matching
      const currentTabIndex = TABS.findIndex(tab => {
        const tabRoutes = [
          tab.route,
          `/(tabs)/${tab.name}`,
          `/${tab.name}`,
          tab.name === "index" ? "/" : null
        ].filter(Boolean);
        
        return tabRoutes.some(route => currentPath === route || currentPath.startsWith(route + "/"));
      });
      
      if (currentTabIndex !== -1) {
        matchedIndex = currentTabIndex;
      }
    }
    
    // Always update activeIndex to match current path, including when navigating from non-tab routes
    if (matchedIndex !== -1) {
      setActiveIndex(matchedIndex);
    } else {
      // If currentPath doesn't match any tab, but we're in a browser back/forward scenario,
      // reset to explore tab to ensure content syncs with bottom navigation
      if (currentPath.startsWith("/") && !currentPath.includes("payments") && !currentPath.includes("settings")) {
        setActiveIndex(0);
      }
    }
  }, [currentPath]);

  const handleTabPress = (index: number) => {
    const tab = TABS[index];
    setActiveIndex(index);
    
    // Use replace for better browser history behavior when coming from non-tab routes
    const isCurrentlyOnTabRoute = TABS.some(t => 
      currentPath === t.route || 
      currentPath === `/(tabs)/${t.name}` || 
      currentPath === `/${t.name}`
    );
    
    if (isCurrentlyOnTabRoute) {
      router.push(tab.route);
    } else {
      // Coming from a non-tab route (like payments), use replace for better UX
      router.replace(tab.route);
    }
  };


  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarStyle: {
            backgroundColor: BrandColors.primary[500],
            borderTopWidth: 0,
            height: Platform.select({
              ios: 65 + insets.bottom,
              android: 65,
              web: 100,
            }),
            paddingBottom: Platform.select({
              ios: insets.bottom,
              default: 20,
            }),
            paddingHorizontal: 0,
            width: "100vw",
            maxWidth: "100vw",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            display: "flex"
          },
          headerShown: false,
        })}
      >
        {TABS.map((tab, index) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              tabBarButton: (props) => (
                <TabButton
                  {...props}
                  icon={
                    <tab.icon
                      width={isWideScreen ? 40 : 24}
                      height={isWideScreen ? 40 : 24}
                    />
                  }
                  label={tab.label}
                  isActive={index === activeIndex}
                  onPress={() => handleTabPress(index)}
                />
              ),
            }}
          />
        ))}
      </Tabs>
      <Indicator activeIndex={activeIndex} totalTabs={TABS.length} />
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </>
  );
}
