// Centralized breakpoints for consistent responsive design across the app
export const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
  ULTRA_WIDE: 1440,
} as const;

// Helper functions for responsive design
export const getDeviceType = (width: number) => {
  if (width < BREAKPOINTS.TABLET) return 'mobile';
  if (width < BREAKPOINTS.DESKTOP) return 'tablet';
  if (width < BREAKPOINTS.ULTRA_WIDE) return 'desktop';
  return 'ultra-wide';
};

export const isMobile = (width: number) => width < BREAKPOINTS.TABLET;
export const isTablet = (width: number) => width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP;
export const isDesktop = (width: number) => width >= BREAKPOINTS.DESKTOP && width < BREAKPOINTS.ULTRA_WIDE;
export const isUltraWide = (width: number) => width >= BREAKPOINTS.ULTRA_WIDE;
export const isWideScreen = (width: number) => width >= BREAKPOINTS.TABLET;
export const isLargeScreen = (width: number) => width >= BREAKPOINTS.DESKTOP;

// Demo-specific responsive settings
export const DEMO_BREAKPOINTS = {
  ...BREAKPOINTS,
  // Ensure demo works well on all common device sizes
  MIN_CONTENT_WIDTH: 320, // iPhone SE minimum
  MAX_CONTENT_WIDTH: 1920, // Large desktop maximum (increased for ultra-wide support)
} as const;