import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  // Get button styles based on variant and size
  const getButtonStyles = (): ViewStyle[] => {
    const baseStyles = [styles.base];
    
    // Size styles
    const sizeStyles = {
      small: styles.small,
      medium: styles.medium,
      large: styles.large,
    };
    baseStyles.push(sizeStyles[size]);
    
    // Variant styles
    const variantStyles = {
      primary: styles.primaryVariant,
      secondary: styles.secondaryVariant,
      outline: styles.outlineVariant,
      text: styles.textVariant,
      danger: styles.dangerVariant,
    };
    baseStyles.push(variantStyles[variant]);
    
    // State styles
    if (isDisabled) {
      baseStyles.push(styles.disabled);
    }
    
    if (fullWidth) {
      baseStyles.push(styles.fullWidth);
    }
    
    return baseStyles;
  };
  
  // Get text styles based on variant and size
  const getTextStyles = (): TextStyle[] => {
    const baseTextStyles = [styles.text];
    
    // Size text styles
    const sizeTextStyles = {
      small: styles.smallText,
      medium: styles.mediumText,
      large: styles.largeText,
    };
    baseTextStyles.push(sizeTextStyles[size]);
    
    // Variant text styles
    const variantTextStyles = {
      primary: styles.primaryText,
      secondary: styles.secondaryText,
      outline: styles.outlineText,
      text: styles.textVariantText,
      danger: styles.dangerText,
    };
    baseTextStyles.push(variantTextStyles[variant]);
    
    if (isDisabled) {
      baseTextStyles.push(styles.disabledText);
    }
    
    return baseTextStyles;
  };
  
  // Get icon size based on button size
  const getIconSize = () => {
    const iconSizes = {
      small: Theme.components.button.iconSize.small,
      medium: Theme.components.button.iconSize.medium,
      large: Theme.components.button.iconSize.large,
    };
    return iconSizes[size];
  };
  
  // Get icon color based on variant
  const getIconColor = () => {
    if (isDisabled) return Theme.colors.text.disabled;
    
    const iconColors = {
      primary: Theme.colors.neutral.white,
      secondary: Theme.colors.primary.main,
      outline: Theme.colors.primary.main,
      text: Theme.colors.primary.main,
      danger: Theme.colors.neutral.white,
    };
    return iconColors[variant];
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
          style={styles.loader}
        />
      );
    }
    
    const iconElement = icon && (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
    
    return (
      <>
        {icon && iconPosition === 'left' && iconElement}
        <Text style={[...getTextStyles(), textStyle]} numberOfLines={1}>
          {children}
        </Text>
        {icon && iconPosition === 'right' && iconElement}
      </>
    );
  };
  
  return (
    <TouchableOpacity
      style={[...getButtonStyles(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.content}>
        {renderContent()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      },
    }),
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Size styles
  small: {
    height: Theme.components.button.height.small,
    paddingHorizontal: Theme.components.button.padding.small.horizontal,
  },
  
  medium: {
    height: Theme.components.button.height.medium,
    paddingHorizontal: Theme.components.button.padding.medium.horizontal,
  },
  
  large: {
    height: Theme.components.button.height.large,
    paddingHorizontal: Theme.components.button.padding.large.horizontal,
  },
  
  // Variant styles
  primaryVariant: {
    backgroundColor: Theme.colors.primary.main,
  },
  
  secondaryVariant: {
    backgroundColor: Theme.colors.primary.lightest,
  },
  
  outlineVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.primary.main,
  },
  
  textVariant: {
    backgroundColor: 'transparent',
  },
  
  dangerVariant: {
    backgroundColor: Theme.colors.status.error,
  },
  
  // State styles
  disabled: {
    opacity: 0.5,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Text styles
  text: {
    fontFamily: Theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  
  smallText: {
    fontSize: Theme.typography.caption.fontSize,
  },
  
  mediumText: {
    fontSize: Theme.typography.body1.fontSize,
  },
  
  largeText: {
    fontSize: Theme.typography.h4.fontSize,
  },
  
  primaryText: {
    color: Theme.colors.neutral.white,
  },
  
  secondaryText: {
    color: Theme.colors.primary.main,
  },
  
  outlineText: {
    color: Theme.colors.primary.main,
  },
  
  textVariantText: {
    color: Theme.colors.primary.main,
  },
  
  dangerText: {
    color: Theme.colors.neutral.white,
  },
  
  disabledText: {
    color: Theme.colors.text.disabled,
  },
  
  // Icon styles
  iconLeft: {
    marginRight: Theme.spacing.xs,
  },
  
  iconRight: {
    marginLeft: Theme.spacing.xs,
  },
  
  loader: {
    marginHorizontal: Theme.spacing.xs,
  },
});

// Export preset button styles for common use cases
export const ButtonPresets = {
  primarySmall: {
    variant: 'primary' as ButtonVariant,
    size: 'small' as ButtonSize,
  },
  primaryMedium: {
    variant: 'primary' as ButtonVariant,
    size: 'medium' as ButtonSize,
  },
  primaryLarge: {
    variant: 'primary' as ButtonVariant,
    size: 'large' as ButtonSize,
  },
  secondarySmall: {
    variant: 'secondary' as ButtonVariant,
    size: 'small' as ButtonSize,
  },
  secondaryMedium: {
    variant: 'secondary' as ButtonVariant,
    size: 'medium' as ButtonSize,
  },
  outlineSmall: {
    variant: 'outline' as ButtonVariant,
    size: 'small' as ButtonSize,
  },
  outlineMedium: {
    variant: 'outline' as ButtonVariant,
    size: 'medium' as ButtonSize,
  },
  textSmall: {
    variant: 'text' as ButtonVariant,
    size: 'small' as ButtonSize,
  },
  textMedium: {
    variant: 'text' as ButtonVariant,
    size: 'medium' as ButtonSize,
  },
  danger: {
    variant: 'danger' as ButtonVariant,
    size: 'medium' as ButtonSize,
  },
};