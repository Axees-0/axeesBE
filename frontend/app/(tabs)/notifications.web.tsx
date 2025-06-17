// /apps/axees/app/(tabs)/notifications.web.tsx
// Cosmetic‑only refactor – keeps **all original business logic** but updates
// the JSX structure + styles to match the Figma‑style screenshot.
// • Still uses Navbar component (no custom headerBar logic added)
// • Pure flexbox, no absolute positioning
// • FlatList remains for dynamic notifications

import React, { useEffect, useMemo, useState } from "react";
import type { PressableStateCallbackType } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import Toast from "react-native-toast-message";

// shared components / contexts
import Navbar from "@/components/web/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Color, FontFamily } from "@/GlobalStyles";

// SVG assets  – keep only what really exists
import TickDouble01 from "@/assets/tickdouble01.svg"; // ✅ points at assets/tickdouble01.svg
// Unread dot will be rendered with a plain <View> (see §4)

/* --------------------------------------------------------------------------
   Types & helpers
   -------------------------------------------------------------------------- */

type Notification = {
  _id: string;
  type: string;
  step?: string;
  title: string;
  subtitle?: string;
  unread?: boolean;
  createdAt?: string;
  data?: {
    targetScreen?: string;
    offerId?: string;
    amount?: string;
    postDate?: string;
    offerName?: string;
    dealNumber?: string;
  };
};

const notificationToScreen: Record<string, string> = {
  name_step: "URM02Name",
  username_step: "URM03Username",
  email_step: "URM05SetEmail",
  password_step: "URM06SetPassword",
  new_offer: "UOM10CreatorOfferDetails",
  counter_offer: "UOM05MarketerOfferCounter",
  offer_accepted: "UOM08MarketerDealHistoryList",
  offer_rejected: "UOM07MarketerOfferHistoryList",
  offer_cancelled: "UOM07MarketerOfferHistoryList",
  offer_in_review: "UOM10CreatorOfferDetails",
};

/* --------------------------------------------------------------------------
   Main screen component (logic unchanged)
   -------------------------------------------------------------------------- */
export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const win = useWindowDimensions();
  const isWideScreen = win.width >= 1280; // desktop breakpoint
  const [isLoading, setIsLoading] = useState(false);

  // ───── Fetching (unchanged) ─────
  const fetchNotifications = async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/notifications?userId=${user._id}`
      );
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // ───── Helpers ─────
  const unreadCount = notifications.filter((n) => n.unread).length;

  const rows = useMemo(() => {
    const t = new Date();
    const startToday = new Date(
      t.getFullYear(),
      t.getMonth(),
      t.getDate()
    ).getTime();
    const startYesterday = startToday - 86_400_000;

    const inserted: Record<string, boolean> = {};
    const res: Array<{ header?: string; item?: Notification; key: string }> =
      [];
    [...notifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .forEach((n) => {
        const ts = new Date(n.createdAt || 0).getTime();
        let group: string;
        if (ts >= startToday) group = "Today";
        else if (ts >= startYesterday) group = "Yesterday";
        else group = new Date(ts).toLocaleDateString();
        if (!inserted[group]) {
          res.push({ header: group, key: `h-${group}` });
          inserted[group] = true;
        }
        res.push({ item: n, key: n._id });
      });
    return res;
  }, [notifications]);

  // ───── API actions (unchanged) ─────
  const markAllAsRead = async () => {
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/notifications/mark-read?userId=${user?._id}&type=all`
      );
      setNotifications((p) => p.map((n) => ({ ...n, unread: false })));
    } catch (e) {
      console.error("markAllAsRead", e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/notifications?id=${id}`
      );
      setNotifications((p) => p.filter((n) => n._id !== id));
      Toast.show({
        topOffset: 80,
        text1: "Success",
        text2: "Notification deleted",
        type: "customNotification",
      });
    } catch (e) {
      console.error("deleteNotification", e);
    }
  };

  const openNotification = async (n: Notification) => {
    const target = n.data?.targetScreen || notificationToScreen[n.type];
    if (!target) return;

    await axios.post(
      `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/notifications/mark-read?userId=${user?._id}&type=individual&notificationId=${n._id}`
    );

    const params: Record<string, string> = {};
    if (n.data?.offerId) params.offerId = n.data.offerId;
    if (n.data?.dealNumber) params.dealNumber = n.data.dealNumber;
    if (user?._id) params.userId = user._id;

    router.push({ pathname: `/${target}` as any, params });
  };

  // ───── Row renderer – mostly cosmetic tweaks ─────
  const renderRow = ({ item }: { item: any }) => {
    if (item.header) {
      return <Text style={styles.dayHeader}>{item.header}</Text>;
    }
    const n: Notification = item.item;
    const isAccepted = n.type === "offer_accepted";
    const isDeleted =
      n.type === "offer_cancelled" || n.type === "offer_rejected";
    const tagLabel = isAccepted
      ? "Offer Accepted"
      : isDeleted
      ? "Offer Deleted"
      : "";

    return (
      <Pressable
        onPress={() => openNotification(n)}
        style={({ pressed }: PressableStateCallbackType) => [
          styles.row,
          pressed && styles.rowPressed,
        ]}
        onMouseEnter={(e) =>
          Platform.OS === "web" &&
          (e.currentTarget.style.backgroundColor = "#F3F4F6")
        }
        onMouseLeave={(e) =>
          Platform.OS === "web" &&
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        {n.unread && <View style={styles.unreadDot} />}
        {/* <Ionicons name="notifications" size={56} color="#1F2937" style={{ marginRight: 12 }} /> */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            <Text style={styles.link}>{n.title}</Text>
            {n.subtitle ? ` ${n.subtitle}` : ""}
            {n.data?.amount && ` for $${n.data.amount}`}
          </Text>
          <Text style={styles.date}>
            {n.createdAt &&
              new Date(n.createdAt).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
          </Text>
        </View>
        {tagLabel !== "" && (
          <View
            style={[
              styles.tagBase,
              isAccepted ? styles.tagAccepted : styles.tagDeleted,
            ]}
          >
            <Text style={styles.tagText}>{tagLabel}</Text>
          </View>
        )}
        <Pressable
          onPress={() => deleteNotification(n._id)}
          style={{ marginLeft: 12 }}
        >
          <Ionicons name="trash" size={20} color="red" />
        </Pressable>
      </Pressable>
    );
  };

  /* ------------------------------------------------------------------
     UI
     ------------------------------------------------------------------ */
  return (
    <>
      <Navbar title="Notifications" unread={unreadCount > 0} />
      <SafeAreaView
        style={[styles.safeArea, isWideScreen && styles.safeAreaWide]}
      >
        <StatusBar style="dark" />

        {/* page heading */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Notifications</Text>
          <Text style={styles.pageSubtitle}>
            Stay updated with your latest notifications
          </Text>
        </View>

        {/* filter bar */}
        <View style={styles.filterBar}>
          <View style={styles.filterOpts}>
            <Text style={styles.filterActive}>All</Text>
            <Text
              style={styles.filterInactive}
            >{`Unread (${unreadCount})`}</Text>
          </View>
          <Pressable style={styles.markAllRead} onPress={markAllAsRead}>
            <TickDouble01 width={20} height={20} />
            <Text style={styles.markAllLabel}>Mark all as read</Text>
          </Pressable>
        </View>

        {/* list */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Color.cSK430B92500}
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(i) => i.key}
            renderItem={renderRow}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}

/* --------------------------------------------------------------------------
   Styles – flex‑box only, scales to any desktop size
   -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Color.white, marginTop: 20 },
  safeAreaWide: { maxWidth: 1280, alignSelf: "center", width: "100%" },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  /* page header */
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    gap: 4,
  },
  pageTitle: {
    fontFamily: FontFamily.degular,
    fontSize: 30,
    fontWeight: "600",
    color: Color.cSK430B92950,
  },
  pageSubtitle: {
    fontFamily: FontFamily.interMedium,
    fontSize: 18,
    color: Color.cSK430B92950,
    opacity: 0.6,
  },

  /* filter bar */
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  filterOpts: { flexDirection: "row", gap: 16, alignItems: "center" },
  filterActive: {
    fontFamily: FontFamily.interRegular,
    fontSize: 20,
    color: Color.cSK430B92950,
  },
  filterInactive: {
    fontFamily: FontFamily.interRegular,
    fontSize: 20,
    color: Color.cSK430B92950,
    opacity: 0.5,
  },
  markAllRead: { flexDirection: "row", gap: 6, alignItems: "center" },
  markAllLabel: {
    fontFamily: FontFamily.interRegular,
    fontSize: 20,
    color: Color.cSK430B92500,
  },

  /* day headers */
  dayHeader: {
    fontFamily: FontFamily.interRegular,
    fontSize: 20,
    color: Color.cSK430B92950,
    opacity: 0.5,
    marginTop: 32,
    marginBottom: 8,
  },

  /* rows */
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 12,
  },
  rowPressed: { backgroundColor: "#F3F4F6" },
  body: { flex: 1, gap: 4 },
  title: {
    fontFamily: FontFamily.interLight,
    fontSize: 20,
    color: Color.cSK430B92950,
  },
  link: { color: Color.cSK430B92500, textDecorationLine: "underline" },
  date: {
    fontFamily: FontFamily.interLight,
    fontSize: 16,
    color: Color.cSK430B92950,
    opacity: 0.7,
  },
  separator: { height: 1, backgroundColor: "rgba(0,0,0,0.05)" },

  /* tags */
  tagBase: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  tagAccepted: { backgroundColor: Color.cSK430B9250 },
  tagDeleted: { backgroundColor: "rgba(255, 184, 192, 0.33)" },
  tagText: {
    fontFamily: FontFamily.interLight,
    fontSize: 14,
    color: Color.cSK430B92500,
    textAlign: "center",
  },
});
