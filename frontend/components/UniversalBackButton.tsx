import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import ArrowLeft from '@/assets/arrowleft021.svg';

interface UniversalBackButtonProps {
  style?: ViewStyle;
  iconSize?: number;
  onPress?: () => void;
  fallbackRoute?: string;
}

export const UniversalBackButton: React.FC<UniversalBackButtonProps> = ({
  style,
  iconSize = 28, // Increased from 24 for better visibility on high-DPI
  onPress,
  fallbackRoute = '/'
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleBackPress = () => {
    // Prevent multiple rapid clicks with a much shorter timeout
    if ((window as any).__navigating) {
      return;
    }
    (window as any).__navigating = true;
    setTimeout(() => {
      (window as any).__navigating = false;
    }, 100); // Reduced from 500ms to 100ms

    if (onPress) {
      onPress();
      return;
    }

    // Determine best navigation method based on route
    const isModalRoute = pathname.includes('counter') || pathname.includes('verification');
    const isChatRoute = pathname.includes('/chat/');
    
    // For web platform
    if (Platform.OS === 'web') {
      // For chat routes, always go back to messages
      if (isChatRoute) {
        router.push(fallbackRoute);
        return;
      }
      
      // For modal-like routes, use router.back()
      if (isModalRoute || router.canGoBack()) {
        router.back();
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        router.push(fallbackRoute);
      }
      return;
    }

    // For native platforms
    try {
      // For chat routes, always go back to messages
      if (isChatRoute) {
        router.push(fallbackRoute);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.push(fallbackRoute);
      }
    } catch (error) {
      console.warn('Navigation error:', error);
      router.push(fallbackRoute);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.backButton, style]}
      onPress={handleBackPress}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} // Reduced since button is now larger
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Navigate to previous screen"
    >
      <ArrowLeft width={iconSize} height={iconSize} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 44, // Ensures minimum 44×44 touch target (even larger than 40×40)
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // Slight rounding for better visual appeal
    zIndex: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        ':focus': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          outline: '2px solid #430B92',
          outlineOffset: '2px',
        },
        ':hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }
      }
    }),
  },
});