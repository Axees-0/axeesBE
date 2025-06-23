import React from 'react';
import { StyleSheet, Platform } from 'react-native';

// Banner text fix styles for 375px screen width
export const bannerTextFixStyles = StyleSheet.create({
  // Generic banner text fixes
  bannerTextWrap: {
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  
  // Connection status banner fixes
  connectionBannerContent: {
    flex: 1,
    minWidth: 0, // Allow content to shrink below intrinsic width
  },
  connectionBannerMessage: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  
  // Counter offer alert fixes
  counterOfferInfo: {
    flex: 1,
    minWidth: 0, // Prevent text from pushing beyond container
    paddingRight: 8, // Add some space before action button
  },
  counterOfferText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
    // Remove any numberOfLines restriction
  },
  
  // Notification banner fixes
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationText: {
    flexWrap: 'wrap',
    flexShrink: 1,
    lineHeight: 18, // Improve readability
  },
  
  // Small screen specific fixes (375px and below)
  smallScreenBanner: {
    ...(Platform.OS === 'web' && {
      '@media (max-width: 375px)': {
        paddingHorizontal: 12, // Reduce padding on small screens
      }
    }),
  },
  smallScreenText: {
    ...(Platform.OS === 'web' && {
      '@media (max-width: 375px)': {
        fontSize: 12, // Slightly smaller text on very small screens
      }
    }),
  },
  
  // Action button fixes for small screens
  smallScreenAction: {
    minWidth: 60, // Reduce minimum width on small screens
    paddingHorizontal: 8,
    ...(Platform.OS === 'web' && {
      '@media (max-width: 375px)': {
        minWidth: 50,
        paddingHorizontal: 6,
      }
    }),
  },
});

// Responsive text size helper
export const getResponsiveFontSize = (baseSize: number, screenWidth: number): number => {
  if (screenWidth <= 375) {
    return Math.max(baseSize * 0.9, 11); // Reduce by 10% but not below 11px
  }
  return baseSize;
};

// Banner container helper for consistent spacing
export const getBannerPadding = (screenWidth: number): number => {
  if (screenWidth <= 375) {
    return 12;
  } else if (screenWidth <= 414) {
    return 14;
  }
  return 16;
};