import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  isRead: boolean;
}

export interface MessagesContextType {
  messages: Message[];
  unreadCount: number;
  markAsRead: (messageId: string) => void;
  addMessage: (message: Message) => void;
  loadMessages: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);

  const markAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    if (!message.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const loadMessages = async () => {
    // Placeholder implementation
    // In real app, this would fetch from API
  };

  useEffect(() => {
    const unread = messages.filter(msg => !msg.isRead).length;
    setUnreadCount(unread);
  }, [messages]);

  return {
    messages,
    unreadCount,
    markAsRead,
    addMessage,
    loadMessages,
  };
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}