import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import { Fragment } from "react";
import { Platform, useWindowDimensions, ScrollView, View, Text, StyleSheet } from "react-native";
import { WebSEO } from "../web-seo";
import { Color } from "@/GlobalStyles";

const BREAKPOINTS = {
  mobile: 768,
};

const NotificationsPage = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  // Demo content for notifications
  const renderDemoNotifications = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Stay updated on your campaigns</Text>
      
      <View style={styles.notificationsList}>
        {DemoData.notifications.map((notification) => (
          <View key={notification.id} style={[
            styles.notificationItem,
            notification.unread && styles.unreadNotification
          ]}>
            <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(notification.type) }]} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationText}>{notification.message}</Text>
              <Text style={styles.timestamp}>{notification.time}</Text>
            </View>
            {notification.unread && <View style={styles.unreadDot} />}
          </View>
        ))}
        
        {/* Additional demo notifications */}
        <View style={styles.notificationItem}>
          <View style={[styles.typeIndicator, { backgroundColor: '#28a745' }]} />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>Your Summer Collection offer has 5 new applications</Text>
            <Text style={styles.timestamp}>30 minutes ago</Text>
          </View>
        </View>
        
        <View style={styles.notificationItem}>
          <View style={[styles.typeIndicator, { backgroundColor: '#007bff' }]} />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>Sofia Rodriguez completed wellness campaign milestone</Text>
            <Text style={styles.timestamp}>2 hours ago</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <>
      <WebSEO 
        title="Notifications - Axees"
        description="Stay updated with real-time notifications about your campaigns, applications, and partnerships on Axees."
        keywords="notifications, updates, campaigns, brand partnerships, creator alerts"
      />
      {renderDemoNotifications()}
    </>
  );
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'application': return '#17a2b8';
    case 'milestone': return '#28a745';
    case 'payment': return '#ffc107';
    default: return '#6c757d';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: Color.cSK430B92500,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Color.cSK430B92500,
    marginLeft: 8,
    marginTop: 6,
  },
});

export default NotificationsPage;