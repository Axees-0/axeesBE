import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ApiClient } from '@/utils/errorHandler';

interface ConnectionStatusProps {
  onRetry?: () => void;
}

export default function ConnectionStatus({ onRetry }: ConnectionStatusProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  useEffect(() => {
    const checkConnection = () => {
      const backendStatus = ApiClient.getConnectionStatus();
      const isNavigatorOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      
      setIsOffline(backendStatus === false || isNavigatorOffline);
    };

    // Check initially
    checkConnection();

    // Set up interval to check connection status
    const interval = setInterval(checkConnection, 5000);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      ApiClient.resetConnectionStatus();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Reset connection status and check again
      ApiClient.resetConnectionStatus();
      
      // Wait a moment for the reset to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trigger external retry if provided
      if (onRetry) {
        onRetry();
      }
      
      // Check connection status after retry
      setTimeout(() => {
        const newStatus = ApiClient.getConnectionStatus();
        if (newStatus !== false) {
          setIsOffline(false);
        }
      }, 2000);
      
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.icon}>📶</Text>
        <View style={styles.content}>
          <Text style={styles.title}>Connection Issue</Text>
          <Text style={styles.message}>
            Unable to connect to server. Some features may not work properly.
          </Text>
        </View>
        <Pressable 
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]} 
          onPress={handleRetry}
          disabled={isRetrying}
        >
          <Text style={styles.retryText}>
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#F59E0B',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});