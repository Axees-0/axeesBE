import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import ArrowLeft from '@/assets/arrowleft021.svg';

// Navigation hierarchy mapping - defines where each route should go back to
const NAVIGATION_HIERARCHY: Record<string, string> = {
  // Main dashboard routes go back to dashboard
  '/analytics': '/',
  '/campaigns': '/',
  '/discover': '/',
  '/payments': '/',
  '/creative': '/',
  '/network': '/',
  
  // Sub-routes go back to their parent
  '/campaigns/create': '/campaigns',
  '/payments/index': '/',
  '/payments/marketer': '/payments',
  '/payments/creator': '/payments',
  '/earnings/index': '/',
  '/earnings/withdraw': '/earnings',
  
  // Offer flow - updated to match actual usage
  '/offers/details': '/offers',
  '/offers/custom': '/offers', 
  '/offers/premade': '/offers',
  '/offers/preview': '/offers',
  '/offers/review': '/offers',
  '/offers/counter': '/offers/review',
  '/offers/handle-counter': '/deals',
  
  // Deal flow
  '/deals/submit': '/deals',
  '/deals/proof': '/deals',
  '/milestones/setup': '/deals',
  
  // Authentication flow - updated to match actual usage
  '/register': '/',
  '/register-phone': '/register',
  '/register-otp': '/register-phone', 
  '/register-details': '/register-otp',
  '/forgot-password': '/login',
  '/reset-password-otp': '/forgot-password',
  '/reset-password': '/login',
  
  // Other flows
  '/notifications/center': '/',
  '/payment/instant': '/',
  '/qr/scan': '/',
};

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

  const getBackRoute = () => {
    // Check if we have a specific route mapping
    if (NAVIGATION_HIERARCHY[pathname]) {
      return NAVIGATION_HIERARCHY[pathname];
    }
    
    // Handle dynamic routes (like /deals/[id], /chat/[id], /profile/[id])
    if (pathname.includes('/deals/') && pathname !== '/deals/submit' && pathname !== '/deals/proof') {
      return '/deals';
    }
    if (pathname.includes('/chat/')) {
      return '/'; // Go to dashboard from chat
    }
    if (pathname.includes('/profile/')) {
      return '/discover'; // Go back to discover from profile
    }
    if (pathname.includes('/channel/')) {
      return '/discover'; // Go back to discover from channel
    }
    
    // Default fallback
    return fallbackRoute;
  };

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

    const targetRoute = getBackRoute();
    
    // For critical navigation paths, always use direct routing to avoid glitches
    const shouldUseDirectRouting = 
      pathname.includes('/analytics') ||
      pathname.includes('/campaigns') ||
      pathname.includes('/discover') ||
      pathname.includes('/payments') ||
      pathname.includes('/creative') ||
      pathname.includes('/network') ||
      pathname.includes('/chat/') ||
      pathname.includes('/offers/') ||
      pathname.includes('/deals/');
    
    if (shouldUseDirectRouting) {
      router.push(targetRoute);
      return;
    }
    
    // For other routes, try router.back() first, then fallback to direct routing
    if (Platform.OS === 'web') {
      if (router.canGoBack() && window.history.length > 1) {
        router.back();
      } else {
        router.push(targetRoute);
      }
    } else {
      // Native platforms
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push(targetRoute);
        }
      } catch (error) {
        // Fallback to direct navigation if error occurs
        router.push(targetRoute);
      }
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