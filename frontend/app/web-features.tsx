import React from 'react';
import { Platform } from 'react-native';
import { useBrowserHistory } from '@/hooks/useBrowserHistory';
import { useConsoleErrorHandler } from '@/hooks/useConsoleErrorHandler';

interface WebFeaturesProps {
  children?: React.ReactNode;
}

// Web-specific features and polyfills for the demo
export function WebFeatures({ children }: WebFeaturesProps) {
  // Use browser history hook for web platform
  if (Platform.OS === 'web') {
    useBrowserHistory();
    useConsoleErrorHandler();
  }
  
  return <>{children}</>;
}

// Default export required for Expo Router
export default WebFeatures;