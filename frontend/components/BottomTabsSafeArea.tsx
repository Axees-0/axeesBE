import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BOTTOM_TAB_SAFE_PADDING } from '@/hooks/useBottomTabsPadding';

interface BottomTabsSafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
  enabled?: boolean;
}

/**
 * Wrapper component that adds padding to account for bottom navigation tabs
 * Only applies padding on web platform by default
 */
export const BottomTabsSafeArea: React.FC<BottomTabsSafeAreaProps> = ({
  children,
  style,
  enabled = true,
}) => {
  const isWeb = Platform.OS === 'web';
  const shouldApplyPadding = enabled && isWeb;

  return (
    <View 
      style={[
        styles.container,
        shouldApplyPadding && styles.withPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  withPadding: {
    paddingBottom: BOTTOM_TAB_SAFE_PADDING,
  },
});