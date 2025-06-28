/**
 * Axees Design System - Visual QA Standards
 * Addresses VISQA‑20250624‑AXEES findings for consistent UI components
 */

import { Platform } from 'react-native';
import { Color, Border, Padding, FontSize, FontFamily } from '@/GlobalStyles';
import { BrandColors, Colors, withOpacity } from '@/constants/Colors';

// WCAG AA Compliant Colors
export const AccessibleColors = {
  // Updated colors for better contrast ratios
  textSecondary: BrandColors.neutral[500], // #6B7280
  textMuted: BrandColors.neutral[400], // #9CA3AF
  backgroundSubtle: BrandColors.neutral[50], // #F9FAFB
  borderLight: BrandColors.neutral[200], // #E5E7EB
  borderMedium: BrandColors.neutral[300], // #D1D5DB
  
  // Status colors with proper contrast
  success: BrandColors.semantic.success, // #10B981
  warning: BrandColors.semantic.warning, // #F59E0B
  error: BrandColors.semantic.error, // #EF4444
  info: BrandColors.semantic.info, // #3B82F6
  
  // Purple variants with proper contrast
  purplePrimary: BrandColors.primary[500], // #430B92
  purpleLight: BrandColors.primary[400], // #7E3FD3
  purpleLighter: BrandColors.primary[300], // #A979E6
  purpleSubtle: BrandColors.primary[50], // #F3EBFC
};

// Standardized Button Styles
export const ButtonStyles = {
  primary: {
    height: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: BrandColors.primary[500],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  secondary: {
    height: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: AccessibleColors.borderMedium,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  success: {
    height: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AccessibleColors.success,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  small: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: BrandColors.primary[500],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  large: {
    height: 52,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: BrandColors.primary[500],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
};

// Standardized Button Text Styles
export const ButtonTextStyles = {
  primary: {
    color: '#ffffff',
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interSemiBold,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  
  secondary: {
    color: BrandColors.primary[500],
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interSemiBold,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  
  small: {
    color: '#ffffff',
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  
  large: {
    color: '#ffffff',
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.interSemiBold,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
};

// Standardized Pill/Badge Styles
export const PillStyles = {
  default: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AccessibleColors.backgroundSubtle,
    borderWidth: 1,
    borderColor: AccessibleColors.borderLight,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 28,
  },
  
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 24,
  },
  
  counter: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: BrandColors.primary[500],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 20,
    minWidth: 20,
  },
  
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: AccessibleColors.purpleSubtle,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 24,
  },
  
  unread: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: AccessibleColors.error,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 16,
    minWidth: 16,
  },
};

// Standardized Pill Text Styles
export const PillTextStyles = {
  default: {
    color: AccessibleColors.textSecondary,
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  
  status: {
    color: AccessibleColors.textSecondary,
    fontSize: FontSize.size_xs,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  
  counter: {
    color: '#ffffff',
    fontSize: FontSize.size_xs,
    fontFamily: FontFamily.interSemiBold,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  
  tag: {
    color: BrandColors.primary[500],
    fontSize: FontSize.size_xs,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  
  unread: {
    color: '#ffffff',
    fontSize: FontSize.size_3xs,
    fontFamily: FontFamily.interSemiBold,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
};

// Icon Alignment Utilities
export const IconAlignment = {
  // Utility for centering icons with text
  iconWithText: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Icon button wrapper
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Small icon with text
  smallIconText: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  
  // Medium icon with text
  mediumIconText: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  
  // Large icon with text
  largeIconText: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  
  // Vertical icon with text (for bottom nav)
  verticalIconText: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
  },
};

// Responsive Spacing System
export const ResponsiveSpacing = {
  // Container margins that prevent overflow
  containerHorizontal: Platform.select({
    web: 16,
    default: 16,
  }),
  
  // Safe margins for buttons to prevent edge touching
  buttonMargin: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  
  // Card padding standards
  cardPadding: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Section spacing
  sectionSpacing: {
    marginBottom: 20,
  },
  
  // Row spacing
  rowSpacing: {
    marginBottom: 12,
  },
  
  // Content spacing from edges
  contentInset: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
};

// Stat Card Styles (for consistent alignment)
export const StatCardStyles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AccessibleColors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 80,
    justifyContent: 'center' as const,
  },
  
  value: {
    fontSize: FontSize.size_5xl,
    fontFamily: FontFamily.interBold,
    fontWeight: '700' as const,
    color: BrandColors.neutral[900],
    marginBottom: 4,
  },
  
  label: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    color: AccessibleColors.textSecondary,
  },
  
  change: {
    fontSize: FontSize.size_xs,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  
  changePositive: {
    color: AccessibleColors.success,
  },
  
  changeNegative: {
    color: AccessibleColors.error,
  },
};

// Typography Hierarchy
export const Typography = {
  h1: {
    fontSize: FontSize.size_13xl,
    fontFamily: FontFamily.interBold,
    fontWeight: '700' as const,
    color: BrandColors.neutral[900],
    lineHeight: 40,
  },
  
  h2: {
    fontSize: FontSize.size_5xl,
    fontFamily: FontFamily.interBold,
    fontWeight: '700' as const,
    color: BrandColors.neutral[900],
    lineHeight: 32,
  },
  
  h3: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.interSemiBold,
    fontWeight: '600' as const,
    color: BrandColors.neutral[900],
    lineHeight: 28,
  },
  
  h4: {
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.interSemiBold,
    fontWeight: '600' as const,
    color: BrandColors.neutral[900],
    lineHeight: 24,
  },
  
  body: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interRegular,
    fontWeight: '400' as const,
    color: BrandColors.neutral[900],
    lineHeight: 24,
  },
  
  bodyMedium: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    color: BrandColors.neutral[900],
    lineHeight: 24,
  },
  
  caption: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.interRegular,
    fontWeight: '400' as const,
    color: AccessibleColors.textSecondary,
    lineHeight: 20,
  },
  
  captionMedium: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.interMedium,
    fontWeight: '500' as const,
    color: AccessibleColors.textSecondary,
    lineHeight: 20,
  },
  
  small: {
    fontSize: FontSize.size_xs,
    fontFamily: FontFamily.interRegular,
    fontWeight: '400' as const,
    color: AccessibleColors.textMuted,
    lineHeight: 16,
  },
};

// Layout Utilities
export const LayoutUtils = {
  // Flex utilities
  row: {
    flexDirection: 'row' as const,
  },
  
  column: {
    flexDirection: 'column' as const,
  },
  
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  spaceBetween: {
    justifyContent: 'space-between' as const,
  },
  
  spaceAround: {
    justifyContent: 'space-around' as const,
  },
  
  alignCenter: {
    alignItems: 'center' as const,
  },
  
  alignStart: {
    alignItems: 'flex-start' as const,
  },
  
  alignEnd: {
    alignItems: 'flex-end' as const,
  },
  
  // Common flex patterns
  flexRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  flexRowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  
  flexRowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Grid utilities
  gridItem: {
    flex: 1,
    margin: 4,
  },
  
  // Table utilities
  tableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AccessibleColors.borderLight,
  },
  
  tableCell: {
    flex: 1,
    paddingRight: 12,
  },
  
  tableCellRight: {
    flex: 1,
    paddingRight: 12,
    alignItems: 'flex-end' as const,
  },
  
  tableCellCenter: {
    flex: 1,
    paddingRight: 12,
    alignItems: 'center' as const,
  },
};

// Form Input Styles
export const InputStyles = {
  default: {
    height: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AccessibleColors.borderMedium,
    backgroundColor: '#ffffff',
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interRegular,
    color: BrandColors.neutral[900],
  },
  
  focused: {
    borderColor: BrandColors.primary[500],
    borderWidth: 2,
    shadowColor: BrandColors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  error: {
    borderColor: AccessibleColors.error,
    borderWidth: 2,
  },
  
  disabled: {
    backgroundColor: AccessibleColors.backgroundSubtle,
    borderColor: AccessibleColors.borderLight,
    color: AccessibleColors.textMuted,
  },
};

export default {
  AccessibleColors,
  ButtonStyles,
  ButtonTextStyles,
  PillStyles,
  PillTextStyles,
  IconAlignment,
  ResponsiveSpacing,
  StatCardStyles,
  Typography,
  LayoutUtils,
  InputStyles,
};