/**
 * Unified Theme Configuration
 * Based on user feedback: "this color... it's not looking too good", "make the button maybe a little one"
 * Implements 8px grid system and reduced visual weight
 */

export const Theme = {
  // Color palette with reduced intensity
  colors: {
    // Primary brand colors (less aggressive)
    primary: {
      main: '#430B92',
      light: '#6B3AA0',
      lighter: '#8B5AC0',
      lightest: '#F0E7FD',
      dark: '#2A0A5C',
    },
    
    // Semantic colors for status
    status: {
      success: '#4CAF50',
      successLight: '#E8F5E9',
      warning: '#FF9800',
      warningLight: '#FFF3E0',
      error: '#F44336',
      errorLight: '#FFEBEE',
      info: '#2196F3',
      infoLight: '#E3F2FD',
    },
    
    // Neutral palette
    neutral: {
      white: '#FFFFFF',
      gray50: '#FAFAFA',
      gray100: '#F5F5F5',
      gray200: '#EEEEEE',
      gray300: '#E0E0E0',
      gray400: '#BDBDBD',
      gray500: '#9E9E9E',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#424242',
      gray900: '#212121',
      black: '#000000',
    },
    
    // Background colors
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
      elevated: '#FFFFFF',
    },
    
    // Text colors
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
      hint: '#9E9E9E',
      white: '#FFFFFF',
    },
  },
  
  // Spacing based on 8px grid
  spacing: {
    xxs: 4,   // 0.5x
    xs: 8,    // 1x
    sm: 12,   // 1.5x
    md: 16,   // 2x
    lg: 24,   // 3x
    xl: 32,   // 4x
    xxl: 48,  // 6x
    xxxl: 64, // 8x
  },
  
  // Typography system
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    
    // Type scale
    h1: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '600',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500',
      letterSpacing: 0,
    },
    body1: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0,
    },
    body2: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.1,
    },
    overline: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '500',
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Shadows (reduced intensity per feedback)
  shadows: {
    none: {},
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  
  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  // Breakpoints
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
  },
  
  // Component-specific tokens
  components: {
    button: {
      height: {
        small: 28,   // Reduced from typical 32
        medium: 32,  // Reduced from typical 40
        large: 40,   // Reduced from typical 48
      },
      padding: {
        small: { horizontal: 12, vertical: 4 },
        medium: { horizontal: 16, vertical: 6 },
        large: { horizontal: 24, vertical: 8 },
      },
      iconSize: {
        small: 16,
        medium: 20,
        large: 24,
      },
    },
    
    card: {
      padding: 12,  // Reduced from 20 per feedback
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    
    input: {
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    
    badge: {
      height: 20,
      minWidth: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      fontSize: 11,
    },
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    elevated: 1,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    notification: 1700,
  },
};

// Helper functions
export const getSpacing = (multiplier: number) => multiplier * 8;

export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = Theme.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};