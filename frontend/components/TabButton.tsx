import type React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Color, FontFamily, FontSize, Padding, Gap, Focus } from "../GlobalStyles";
import { BrandColors } from "@/constants/Colors";
import { useWindowDimensions } from "react-native";
import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/messagesContext";
import { BREAKPOINTS } from "@/constants/breakpoints";
import axios from "axios";

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onPress?: () => void;
}

export function TabButton({
  icon,
  label,
  isActive = false,
  onPress,
}: TabButtonProps) {
  const { width } = useWindowDimensions();
  const isUltraWide = width >= BREAKPOINTS.ULTRA_WIDE;
  const isWideScreen = width >= BREAKPOINTS.DESKTOP;

  const [notifications, setNotifications] = useState<any[]>([]);
  const { unreadCount: messagesUnreadCount } = useUnreadMessages();

  const { user } = useAuth();

  useEffect(() => {
    if (!user?._id) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/notifications?userId=${user._id}`
        );
        setNotifications(res.data.notifications || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const unreadNotifications = notifications.filter(
    (notification) => notification.unread === true
  );

  // Create dynamic accessibility label based on notifications and messages
  const getAccessibilityLabel = () => {
    if (label.toLowerCase() === "notifications" && unreadNotifications.length > 0) {
      return `${label} tab, ${unreadNotifications.length} unread`;
    }
    if (label.toLowerCase() === "messages" && messagesUnreadCount > 0) {
      return `${label} tab, ${messagesUnreadCount} unread`;
    }
    return `${label} tab`;
  };

  return (
    <Pressable
      style={({ pressed, focused }) => [
        styles.parentFlexBox, 
        isUltraWide && styles.parentFlexBoxUltraWide,
        isWideScreen && styles.parentFlexBoxWide,
        isActive && styles.activeTab,
        focused && styles.focusedTab,
        pressed && styles.pressedTab
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="tab"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityState={{ selected: isActive }}
      accessibilityHint={`Navigate to ${label} page`}
      {...(Platform.OS === 'web' && { tabIndex: -1 })}
    >
      {label.toLowerCase() === "notifications" &&
        unreadNotifications.length > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {unreadNotifications.length > 99
                ? "99+"
                : unreadNotifications.length}
            </Text>
          </View>
        )}
      {icon}
      <Text style={[styles.label, isUltraWide && styles.labelUltraWide, isWideScreen && styles.labelWide]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  parentFlexBox: {
    height: 83,
    paddingVertical: Padding.p_xs,
    gap: Gap.gap_6xs,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    opacity: 0.6,
  },
  parentFlexBoxWide: {
    height: 100,
    paddingVertical: Padding.p_base,
    gap: Gap.gap_2xs,
    paddingHorizontal: 12,
  },
  parentFlexBoxUltraWide: {
    height: 120,
    paddingVertical: Padding.p_xl,
    gap: Gap.gap_sm,
    paddingHorizontal: 16,
  },
  activeTab: {
    opacity: 1,
    borderColor: BrandColors.primary[500],
    borderBottomWidth: 3,
    borderStyle: "solid",
  },
  focusedTab: {
    ...Focus.primary,
    borderRadius: 8,
    opacity: 1,
  },
  pressedTab: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: BrandColors.neutral[700],
    textAlign: "center",
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_xs,
    textTransform: "capitalize",
  },
  labelWide: {
    fontSize: FontSize.size_sm,
  },
  labelUltraWide: {
    fontSize: FontSize.size_base,
    fontWeight: "500",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    backgroundColor: BrandColors.semantic.error,
    borderRadius: 15,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 25,
  },
  notificationBadgeText: {
    fontFamily: FontFamily.inter,
    textTransform: "capitalize",
    color: BrandColors.neutral[0],
  },
});
