import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import { Fragment } from "react";
import { Platform, useWindowDimensions, ScrollView, View, Text, StyleSheet } from "react-native";
import { WebSEO } from "../web-seo";
import { Color } from "@/GlobalStyles";

const BREAKPOINTS = {
  mobile: 768,
};

const MessagesPage = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  // Demo content for messages
  const renderDemoMessages = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Connect with brands and creators</Text>
      
      <View style={styles.messagesList}>
        <View style={styles.messageItem}>
          <Text style={styles.senderName}>TechStyle Brand</Text>
          <Text style={styles.messageText}>Hi! We're interested in your summer collection proposal...</Text>
          <Text style={styles.timestamp}>2 minutes ago</Text>
        </View>
        
        <View style={styles.messageItem}>
          <Text style={styles.senderName}>Emma Thompson (@emmastyle)</Text>
          <Text style={styles.messageText}>Thanks for the opportunity! I'd love to discuss the campaign details...</Text>
          <Text style={styles.timestamp}>1 hour ago</Text>
        </View>
        
        <View style={styles.messageItem}>
          <Text style={styles.senderName}>Marcus Johnson (@techmarc)</Text>
          <Text style={styles.messageText}>The tech product review is ready for your approval...</Text>
          <Text style={styles.timestamp}>3 hours ago</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <>
      <WebSEO 
        title="Messages - Axees"
        description="Connect and communicate with brands and creators on Axees. Manage your campaign discussions and partnerships."
        keywords="messages, communication, brand partnerships, creator collaboration"
      />
      {renderDemoMessages()}
    </>
  );
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
  messagesList: {
    gap: 16,
  },
  messageItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});

export default MessagesPage;