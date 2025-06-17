import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Slot, Tabs, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

import Logo from "@/assets/Logo.svg";
export default function TabLayout() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const currentPath = usePathname();
  const isMobile = window.width <= 768;

  if (isMobile) {
    return (
      <>
        <Slot />
      </>
    );
  }

  return <Slot />;
}
