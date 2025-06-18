// Centralized breakpoints for consistent responsive design across the app
export const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
} as const;

// Helper functions for responsive design
export const getDeviceType = (width: number) => {
  if (width < BREAKPOINTS.TABLET) return 'mobile';
  if (width < BREAKPOINTS.DESKTOP) return 'tablet';
  return 'desktop';
};

export const isMobile = (width: number) => width < BREAKPOINTS.TABLET;
export const isTablet = (width: number) => width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP;
export const isDesktop = (width: number) => width >= BREAKPOINTS.DESKTOP;
export const isWideScreen = (width: number) => width >= BREAKPOINTS.TABLET;

// Demo-specific responsive settings
export const DEMO_BREAKPOINTS = {
  ...BREAKPOINTS,
  // Ensure demo works well on all common device sizes
  MIN_CONTENT_WIDTH: 320, // iPhone SE minimum
  MAX_CONTENT_WIDTH: 1440, // Large desktop maximum
} as const;