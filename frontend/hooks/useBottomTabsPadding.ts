import { Platform, useWindowDimensions } from 'react-native';

export const BOTTOM_TAB_HEIGHT = 100;
export const BOTTOM_TAB_SAFE_PADDING = 120; // Extra 20px for safe area

/**
 * Hook to get the appropriate padding for content that might be covered by bottom tabs
 * @param isWebOnly - Whether to only apply padding on web platform
 * @returns Object with paddingBottom value
 */
export const useBottomTabsPadding = (isWebOnly = true) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  
  // Don't apply padding if not web and isWebOnly is true
  if (isWebOnly && !isWeb) {
    return { paddingBottom: 0 };
  }
  
  // On mobile web (narrower screens), we might want different padding
  const isMobileWeb = isWeb && width < 768;
  
  return {
    paddingBottom: isMobileWeb ? BOTTOM_TAB_SAFE_PADDING : BOTTOM_TAB_SAFE_PADDING,
  };
};

/**
 * Get scroll view content container style with bottom tabs padding
 * @param isWebOnly - Whether to only apply padding on web platform
 * @returns Style object for ScrollView contentContainerStyle
 */
export const getScrollViewBottomPadding = (isWebOnly = true) => {
  const isWeb = Platform.OS === 'web';
  
  if (isWebOnly && !isWeb) {
    return undefined;
  }
  
  return {
    paddingBottom: BOTTOM_TAB_SAFE_PADDING,
  };
};