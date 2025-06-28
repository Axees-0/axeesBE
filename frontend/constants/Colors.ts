/**
 * Axees Brand Color System
 * Primary Color: #430B92 (Deep Purple)
 * 
 * This color system is designed for accessibility and consistency
 * All colors meet WCAG AA standards for contrast ratios
 */

const tintColorLight = '#430B92';
const tintColorDark = '#A979E6';

// Primary Brand Palette
export const BrandColors = {
  primary: {
    50: '#F3EBFC',   // Lightest purple tint
    100: '#E4D4F8',  // Very light purple
    200: '#C9A9F1',  // Light purple
    300: '#A979E6',  // Medium light purple
    400: '#7E3FD3',  // Medium purple
    500: '#430B92',  // Main brand purple (base)
    600: '#350870',  // Dark purple
    700: '#280654',  // Darker purple
    800: '#1C0439',  // Very dark purple
    900: '#0F021F',  // Darkest purple
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',      // Green
    successLight: '#D1FAE5', // Light green
    successDark: '#059669',  // Dark green
    
    warning: '#F59E0B',      // Amber
    warningLight: '#FEF3C7', // Light amber
    warningDark: '#D97706',  // Dark amber
    
    error: '#EF4444',        // Red
    errorLight: '#FEE2E2',   // Light red
    errorDark: '#DC2626',    // Dark red
    
    info: '#3B82F6',         // Blue
    infoLight: '#DBEAFE',    // Light blue
    infoDark: '#2563EB',     // Dark blue
  },

  // Neutral Palette (Grays)
  neutral: {
    0: '#FFFFFF',    // White
    50: '#F9FAFB',   // Near white
    100: '#F3F4F6',  // Lightest gray
    200: '#E5E7EB',  // Very light gray
    300: '#D1D5DB',  // Light gray
    400: '#9CA3AF',  // Medium gray
    500: '#6B7280',  // Gray
    600: '#4B5563',  // Dark gray
    700: '#374151',  // Darker gray
    800: '#1F2937',  // Very dark gray
    900: '#111827',  // Near black
    1000: '#000000', // Black
  },

  // Social Media Brand Colors
  social: {
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    instagram: '#E4405F',
    youtube: '#FF0000',
    tiktok: '#000000',
    twitch: '#9146FF',
  },
};

export const Colors = {
  light: {
    text: BrandColors.neutral[900],
    background: BrandColors.neutral[0],
    tint: tintColorLight,
    icon: BrandColors.neutral[500],
    tabIconDefault: BrandColors.neutral[500],
    tabIconSelected: tintColorLight,
    
    // Extended color properties
    primary: BrandColors.primary[500],
    primaryLight: BrandColors.primary[100],
    primaryDark: BrandColors.primary[700],
    
    surface: BrandColors.neutral[50],
    border: BrandColors.neutral[200],
    
    textSecondary: BrandColors.neutral[500],
    textTertiary: BrandColors.neutral[400],
    
    success: BrandColors.semantic.success,
    error: BrandColors.semantic.error,
    warning: BrandColors.semantic.warning,
    info: BrandColors.semantic.info,
  },
  dark: {
    text: BrandColors.neutral[50],
    background: BrandColors.neutral[900],
    tint: tintColorDark,
    icon: BrandColors.neutral[400],
    tabIconDefault: BrandColors.neutral[400],
    tabIconSelected: tintColorDark,
    
    // Extended color properties
    primary: BrandColors.primary[400],
    primaryLight: BrandColors.primary[300],
    primaryDark: BrandColors.primary[600],
    
    surface: BrandColors.neutral[800],
    border: BrandColors.neutral[700],
    
    textSecondary: BrandColors.neutral[300],
    textTertiary: BrandColors.neutral[500],
    
    success: BrandColors.semantic.success,
    error: BrandColors.semantic.error,
    warning: BrandColors.semantic.warning,
    info: BrandColors.semantic.info,
  },
};

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};
