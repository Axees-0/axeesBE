import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";
import React from "react";
import { Platform, useWindowDimensions, ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { WebSEO } from "../web-seo";
import { Color } from "@/GlobalStyles";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

const BREAKPOINTS = {
  mobile: 768,
};

const MessagesPage = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;
  const { user } = useAuth();
  
  // Demo chat data - including auto-created chats from deals
  const chats = [
    {
      id: 'chat-DEAL-001',
      otherUserId: 'sarah-001',
      otherUserName: 'Sarah Martinez',
      otherUserRole: 'marketer',
      otherUserCompany: 'TechStyle Brand',
      lastMessage: 'Chat room created for deal discussion',
      lastMessageTime: new Date(Date.now() - 120000), // 2 minutes ago
      unreadCount: 2,
      dealId: 'DEAL-001',
      dealTitle: 'Instagram Post Campaign',
      isAutoCreated: true,
    },
    {
      id: 'chat-2', 
      otherUserId: 'david-002',
      otherUserName: 'David Chen',
      otherUserRole: 'marketer',
      otherUserCompany: 'FitTech Solutions',
      lastMessage: 'I love that idea! Let\'s discuss the timeline.',
      lastMessageTime: new Date(Date.now() - 3600000), // 1 hour ago
      unreadCount: 0,
      dealId: 'DEAL-002',
      dealTitle: 'Product Review Video',
    },
    {
      id: 'chat-3',
      otherUserId: 'lisa-003',
      otherUserName: 'Lisa Thompson',
      otherUserRole: 'marketer',
      otherUserCompany: 'Beauty Collective',
      lastMessage: 'Thanks for submitting the content. I\'ll review it today.',
      lastMessageTime: new Date(Date.now() - 86400000), // 1 day ago
      unreadCount: 0,
      dealId: 'DEAL-003',
      dealTitle: 'TikTok Series',
    },
    {
      id: 'chat-4',
      otherUserId: 'alex-004',
      otherUserName: 'Alex Rivera',
      otherUserRole: 'creator',
      otherUserCompany: '@alexcreates',
      lastMessage: 'Just uploaded the proof of posting. Let me know if you need anything else!',
      lastMessageTime: new Date(Date.now() - 172800000), // 2 days ago
      unreadCount: 1,
      dealId: 'DEAL-004',
      dealTitle: 'Summer Collection Promo',
    },
  ];
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  
  const handleChatPress = (chat: any) => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: chat.id,
        dealId: chat.dealId,
        otherUserId: chat.otherUserId,
        otherUserName: chat.otherUserName,
      }
    });
  };

  // Demo content for messages
  const renderDemoMessages = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Deal conversations</Text>
        </View>
        {chats.reduce((sum, chat) => sum + chat.unreadCount, 0) > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {chats.reduce((sum, chat) => sum + chat.unreadCount, 0)} unread
            </Text>
          </View>
        )}
      </View>
      
      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Your conversations will appear here when deals are created
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              onPress={() => handleChatPress(chat)}
            >
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>
                  {chat.otherUserName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <View>
                    <Text style={styles.chatName}>{chat.otherUserName}</Text>
                    <Text style={styles.chatCompany}>{chat.otherUserCompany}</Text>
                  </View>
                  <Text style={styles.chatTime}>{formatTime(chat.lastMessageTime)}</Text>
                </View>
                
                <Text style={styles.chatDeal}>{chat.dealTitle}</Text>
                
                <View style={styles.chatMessageRow}>
                  <Text 
                    style={[
                      styles.chatMessage,
                      chat.unreadCount > 0 && styles.unreadMessage
                    ]}
                    numberOfLines={1}
                  >
                    {chat.lastMessage}
                  </Text>
                  
                  {chat.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
    </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Color.cSK430B92500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatCompany: {
    fontSize: 12,
    color: '#999',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatDeal: {
    fontSize: 12,
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: Color.cSK430B92500,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default MessagesPage;