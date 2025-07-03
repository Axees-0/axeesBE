import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Color } from '@/GlobalStyles';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  color?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 'large',
  fullScreen = false,
  color = Color.cSK430B92500, // Purple theme color
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.inlineContainer;

  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

// Skeleton loader for creator cards
export const CreatorCardSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '90%' }]} />
        <View style={[styles.skeletonLine, { width: '50%' }]} />
      </View>
    </View>
  );
};

// Loading overlay for transitions
export const LoadingOverlay: React.FC<{ visible: boolean; message?: string }> = ({
  visible,
  message = 'Processing...',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.overlayMessage}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  inlineContainer: {
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'interMedium',
  },
  // Skeleton styles
  skeletonCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
  // Overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  overlayMessage: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'interMedium',
  },
});

export default LoadingIndicator;