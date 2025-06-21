import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface ChatParticipant {
  id: string;
  name: string;
  role: 'creator' | 'marketer';
  avatar?: string;
}

const ChatScreen: React.FC = () => {
  const { id: chatId, dealId, otherUserId, otherUserName } = useLocalSearchParams();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Demo chat participant
  const otherParticipant: ChatParticipant = {
    id: otherUserId as string || 'other-user',
    name: otherUserName as string || 'Sarah Martinez',
    role: user?.userType === 'creator' ? 'marketer' : 'creator',
  };

  useEffect(() => {
    // Load demo messages
    const demoMessages: Message[] = [
      {
        id: '1',
        text: 'Chat room created for deal discussion',
        senderId: 'system',
        senderName: 'System',
        timestamp: new Date(Date.now() - 3600000),
        type: 'system',
      },
      {
        id: '2',
        text: 'Hi! I\'m excited about this collaboration opportunity. The offer looks great!',
        senderId: otherParticipant.id,
        senderName: otherParticipant.name,
        timestamp: new Date(Date.now() - 3000000),
        type: 'text',
      },
      {
        id: '3',
        text: 'Thank you! I think we can create something amazing together. Do you have any initial ideas for the content?',
        senderId: user?.id || 'current-user',
        senderName: user?.name || 'You',
        timestamp: new Date(Date.now() - 2700000),
        type: 'text',
      },
      {
        id: '4',
        text: 'Yes! I was thinking we could showcase the product in a lifestyle setting. Maybe a morning routine video?',
        senderId: otherParticipant.id,
        senderName: otherParticipant.name,
        timestamp: new Date(Date.now() - 2400000),
        type: 'text',
      },
    ];
    
    setMessages(demoMessages);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      senderId: user?.id || 'current-user',
      senderName: user?.name || 'You',
      timestamp: new Date(),
      type: 'text',
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simulate response after a delay
    setTimeout(() => {
      const responses = [
        'That sounds perfect! I love that idea.',
        'Great! When would you like to start working on this?',
        'I can have the first draft ready by the end of the week.',
        'Let me know if you need any specific angles or shots.',
      ];
      
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        senderId: otherParticipant.id,
        senderName: otherParticipant.name,
        timestamp: new Date(),
        type: 'text',
      };
      
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === user?.id || message.senderId === 'current-user';
    const showDateHeader = index === 0 || 
      new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString();
    
    return (
      <View key={message.id}>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{formatDate(message.timestamp)}</Text>
          </View>
        )}
        
        {message.type === 'system' ? (
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{message.text}</Text>
          </View>
        ) : (
          <View style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
          ]}>
            <View style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
            ]}>
              <Text style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft width={24} height={24} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherParticipant.name}</Text>
          <Text style={styles.headerStatus}>Active now</Text>
        </View>
        
        {dealId && (
          <TouchableOpacity 
            style={styles.dealButton}
            onPress={() => router.push({
              pathname: '/deals/[id]',
              params: { id: dealId }
            })}
          >
            <Text style={styles.dealButtonText}>View Deal</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => renderMessage(message, index))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            accessible={true}
            accessibilityLabel="Message input"
            accessibilityHint={`Type your message to ${otherParticipant.name}. Maximum 500 characters.`}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  dealButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Color.cSK430B92500,
  },
  dealButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: Color.cSK430B92500,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#ffffffcc',
  },
  otherMessageTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatScreen;