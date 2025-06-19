import type React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Color, FontFamily, FontSize, Padding, Gap } from "../GlobalStyles";
import { useWindowDimensions } from "react-native";
import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  const window = useWindowDimensions();

  const [notifications, setNotifications] = useState<any[]>([]);

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

  return (
    <Pressable
      style={[styles.parentFlexBox, isActive && styles.activeTab]}
      onPress={onPress}
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
      <Text style={styles.label}>{label}</Text>
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
  activeTab: {
    opacity: 1,
    borderColor: Color.backgroundsPrimary,
    borderBottomWidth: 3,
    borderStyle: "solid",
  },
  label: {
    color: Color.backgroundsPrimary,
    textAlign: "center",
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_xs,
    textTransform: "capitalize",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    backgroundColor: "#FF0000",
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
    color: "#FFFFFF",
  },
});
