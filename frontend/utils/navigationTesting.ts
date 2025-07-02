import { useWindowDimensions } from 'react-native';

// Breakpoints for responsive testing
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

// Helper to determine current device type
export const useDeviceType = () => {
  const { width } = useWindowDimensions();
  
  if (width < BREAKPOINTS.mobile) {
    return 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    return 'tablet';
  } else if (width < BREAKPOINTS.desktop) {
    return 'desktop';
  } else {
    return 'wide';
  }
};

// Tab visibility configuration
export const getTabVisibility = (deviceType: string) => {
  switch (deviceType) {
    case 'mobile':
      return {
        showBottomTabs: true,
        showSidebar: false,
        maxTabsVisible: 5,
        tabIconSize: 24,
        tabLabelVisible: true,
        tabSpacing: 'compact',
      };
    case 'tablet':
      return {
        showBottomTabs: true,
        showSidebar: false,
        maxTabsVisible: 5,
        tabIconSize: 28,
        tabLabelVisible: true,
        tabSpacing: 'normal',
      };
    case 'desktop':
    case 'wide':
      return {
        showBottomTabs: false,
        showSidebar: true,
        maxTabsVisible: 5,
        tabIconSize: 32,
        tabLabelVisible: true,
        tabSpacing: 'spacious',
      };
    default:
      return {
        showBottomTabs: true,
        showSidebar: false,
        maxTabsVisible: 5,
        tabIconSize: 24,
        tabLabelVisible: true,
        tabSpacing: 'normal',
      };
  }
};

// Test data for navigation scenarios
export const navigationTestCases = [
  {
    name: 'Mobile Portrait (360px)',
    width: 360,
    height: 640,
    expectedBehavior: 'Bottom tabs visible, 5 tabs compact spacing, small icons',
  },
  {
    name: 'Mobile Landscape (640px)',
    width: 640,
    height: 360,
    expectedBehavior: 'Bottom tabs visible, 5 tabs with more spacing',
  },
  {
    name: 'Tablet Portrait (768px)',
    width: 768,
    height: 1024,
    expectedBehavior: 'Bottom tabs visible, larger icons and spacing',
  },
  {
    name: 'Tablet Landscape (1024px)',
    width: 1024,
    height: 768,
    expectedBehavior: 'Transition point - no bottom tabs on desktop',
  },
  {
    name: 'Desktop (1280px)',
    width: 1280,
    height: 800,
    expectedBehavior: 'No bottom tabs, main navigation only',
  },
  {
    name: 'Wide Desktop (1920px)',
    width: 1920,
    height: 1080,
    expectedBehavior: 'No bottom tabs, spacious layout',
  },
];

// Accessibility testing helpers
export const getTabAccessibility = (tabName: string, isActive: boolean) => ({
  accessible: true,
  accessibilityRole: 'tab',
  accessibilityState: { selected: isActive },
  accessibilityLabel: `${tabName} tab${isActive ? ', selected' : ''}`,
  accessibilityHint: `Navigate to ${tabName}`,
});