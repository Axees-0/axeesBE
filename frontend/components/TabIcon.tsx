import type React from "react";
import { View, StyleSheet } from "react-native";
import { useTabBarIcon } from "../hooks/useTabBarIcon";

interface TabIconProps {
  focused: boolean;
  Icon: React.ComponentType<{ width: number; height: number; color: string }>;
}

export function TabIcon({ focused, Icon }: TabIconProps) {
  const { style } = useTabBarIcon(focused);

  return (
    <View style={[styles.iconContainer, style]}>
      <Icon width={24} height={24} color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});
