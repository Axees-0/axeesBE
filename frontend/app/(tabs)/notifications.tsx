import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  FlatList,
  Image,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Navbar from "@/components/web/navbar";
import { WebSEO } from "../web-seo";

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

type Notification = {
  id: string;
  type: "message" | "post" | "delivery" | "follow";
  title: string;
  subtitle: string;
  time: string;
  avatar?: string;
  unread?: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "Robert Lescure",
    subtitle:
      "Message : Ok, pense à apporter l'attestation au cas où, je suis ...",
    time: "1h20",
    avatar: require("../../assets/rectangle-5.png"),
    unread: true,
  },
  {
    id: "2",
    type: "post",
    title: "Neurchi d'oss 117",
    subtitle:
      'La page à publié un nouveau post : "Quand tu dois inventer une nouvelle..."',
    time: "3h44",
  },
  {
    id: "3",
    type: "delivery",
    title: "Nike Store",
    subtitle:
      "Livraison : Bonjour, votre paire de air max requin à double rotors va arriver...",
    time: "5h",
    avatar: require("../../assets/rectangle-5.png"),
  },
  {
    id: "4",
    type: "follow",
    title: "Samantha Lopette",
    subtitle: "à commencé à vous suivre",
    time: "7h",
    avatar: require("../../assets/rectangle-5.png"),
    unread: true,
  },
];

const NotificationItem = ({ item }: { item: Notification }) => (
  <Pressable style={styles.notificationItem}>
    <View style={styles.notificationContent}>
      {item.unread && <View style={styles.unreadDot} />}
      {item.avatar && <Image source={item.avatar} style={styles.avatar} />}
      <View style={styles.textContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
    </View>
    <Text style={styles.time}>{item.time}</Text>
  </Pressable>
);

export default function NotificationsScreen() {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;

  return (
    <>
      <WebSEO 
        title="Notifications" 
        description="Stay updated with your latest activities, offers, and campaign updates on Axees." 
        keywords="notifications, updates, alerts, campaign updates, offers"
      />
      <SafeAreaView
        style={[styles.container, isWeb && isWideScreen && styles.webContainer]}
      >
        {/* <Navbar pageTitle="Notifications" /> */}
        <StatusBar style="auto" />

      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {isWeb && isWideScreen && (
          <View style={styles.unreadCount}>
            <Text style={styles.unreadCountText}>2</Text>
          </View>
        )}
      </View> */}

      <FlatList
        data={MOCK_NOTIFICATIONS}
        renderItem={({ item }) => <NotificationItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
    marginHorizontal: "auto",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: Platform.select({
      ios: "sFProDisplaySemibold",
      android: "interSemiBold",
      default: "interSemiBold",
    }),
  },
  unreadCount: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -10 }],
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "sFProDisplaySemibold",
      android: "interSemiBold",
      default: "interSemiBold",
    }),
  },
  listContent: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "sFProDisplaySemibold",
      android: "interSemiBold",
      default: "interSemiBold",
    }),
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "sFPro",
      android: "interRegular",
      default: "interRegular",
    }),
  },
  time: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: Platform.select({
      ios: "sFPro",
      android: "interRegular",
      default: "interRegular",
    }),
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginVertical: 8,
  },
});
