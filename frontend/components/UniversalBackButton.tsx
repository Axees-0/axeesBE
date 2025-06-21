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
    if (onPress) {
      onPress();
      return;
    }

    // For web, try browser history first
    if (Platform.OS === 'web' && window.history.length > 1) {
      window.history.back();
      return;
    }

    // Try router.back() 
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        // If can't go back, navigate to fallback route
        router.push(fallbackRoute);
      }
    } catch (error) {
      console.warn('Navigation error:', error);
      // Fallback navigation
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