import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { Color } from '@/GlobalStyles';

interface ErrorStateProps {
  type?: 'network' | 'not-found' | 'permission' | 'generic' | 'loading-failed';
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  message,
  onRetry,
  fullScreen = false,
  compact = false,
}) => {
  // Default content based on error type
  const getErrorContent = () => {
    switch (type) {
      case 'network':
        return {
          icon: '🌐',
          defaultTitle: 'Connection Error',
          defaultMessage: 'Please check your internet connection and try again.',
        };
      case 'not-found':
        return {
          icon: '🔍',
          defaultTitle: 'Not Found',
          defaultMessage: 'We couldn\'t find what you\'re looking for.',
        };
      case 'permission':
        return {
          icon: '🔒',
          defaultTitle: 'Access Denied',
          defaultMessage: 'You don\'t have permission to view this content.',
        };
      case 'loading-failed':
        return {
          icon: '⚠️',
          defaultTitle: 'Loading Failed',
          defaultMessage: 'Unable to load content. Please try again.',
        };
      default:
        return {
          icon: '❌',
          defaultTitle: 'Something Went Wrong',
          defaultMessage: 'An unexpected error occurred. Please try again.',
        };
    }
  };

  const { icon, defaultTitle, defaultMessage } = getErrorContent();
  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  const containerStyle = fullScreen 
    ? styles.fullScreenContainer 
    : compact 
    ? styles.compactContainer 
    : styles.inlineContainer;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={compact ? styles.compactIcon : styles.icon}>{icon}</Text>
      
      <Text style={compact ? styles.compactTitle : styles.title}>
        {displayTitle}
      </Text>
      
      {!compact && (
        <Text style={styles.message}>{displayMessage}</Text>
      )}
      
      {onRetry && !compact && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Empty state component for lists
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon = '📭', title, message, actionText, onAction }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Inline error message for form validation
export const InlineError: React.FC<{
  message: string;
  visible: boolean;
}> = ({ message, visible }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.inlineError}>
      <Text style={styles.inlineErrorText}>{message}</Text>
    </View>
  );
};

// Toast-style error notification
export const ErrorToast: React.FC<{
  message: string;
  visible: boolean;
  duration?: number;
  onDismiss?: () => void;
}> = ({ message, visible, duration = 3000, onDismiss }) => {
  React.useEffect(() => {
    if (visible && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.toastContainer}>
      <View style={styles.toast}>
        <Text style={styles.toastText}>{message}</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.toastClose}>
            <Text style={styles.toastCloseText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  inlineContainer: {
    paddingVertical: 48,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginVertical: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'interSemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  compactTitle: {
    fontSize: 14,
    fontFamily: 'interMedium',
    color: '#92400E',
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontFamily: 'interRegular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    maxWidth: 320,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Color.cSK430B92500,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'interMedium',
  },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'interSemiBold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'interRegular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    borderRadius: 8,
  },
  actionText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontFamily: 'interMedium',
  },
  // Inline error styles
  inlineError: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inlineErrorText: {
    fontSize: 12,
    fontFamily: 'interRegular',
    color: '#EF4444',
  },
  // Toast styles
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 400,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'interMedium',
    flex: 1,
  },
  toastClose: {
    marginLeft: 12,
    padding: 4,
  },
  toastCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'interMedium',
  },
});

export default ErrorState;