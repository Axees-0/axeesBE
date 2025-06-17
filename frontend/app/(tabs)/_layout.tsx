import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { TabButton } from "@/components/TabButton";
import { Indicator } from "@/components/Indicator";

// Import tab icons
import Discoveryiconlypro from "../../assets/discovery--iconly-pro.svg";
import Hotprice from "../../assets/hotprice.svg";
import Message01 from "../../assets/message01.svg";
import Notification02 from "../../assets/notification02.svg";
import User from "../../assets/user.svg";

const TABS = [
  { name: "index", icon: Discoveryiconlypro, label: "Explore" },
  { name: "deals", icon: Hotprice, label: "Deals/Offers" },
  { name: "messages", icon: Message01, label: "Messages" },
  { name: "notifications", icon: Notification02, label: "Notifications" },
  { name: "profile", icon: User, label: "Profile" },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isWeb = Platform.OS === "web";
  const isWideScreen = width > 1280;

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarStyle: {
            backgroundColor: "#430B92",
            borderTopWidth: 0,
            height: Platform.select({
              ios: 65 + insets.bottom,
              android: 65,
              web: isWideScreen ? 100 : 85,
            }),
            paddingBottom: Platform.select({
              ios: insets.bottom,
              default: 20,
            }),
            width: Platform.select({
              default: width,
            }),
            minWidth: 1280,
            justifyContent: "center",
            alignItems: "center",
            display: TABS.some((tab) => tab.name === route.name)
              ? "flex"
              : "none",
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
                  onPress={() => setActiveIndex(index)}
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
