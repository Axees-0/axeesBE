import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Image } from 'expo-image';

interface ShareModalProps {
  visible?: boolean;
  onClose?: () => void;
  content?: string;
  title?: string;
  profileUrl?: string;
  [key: string]: any;
}

// Enhanced share modal for demo mode
const ShareModal: React.FC<ShareModalProps> = ({ 
  visible = false, 
  onClose, 
  content = '',
  title = 'Share Creator Profile',
  profileUrl = '',
  ...props 
}) => {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const shareOptions = [
    { 
      name: 'Copy Link', 
      icon: '🔗', 
      action: () => {
        if (Platform.OS === 'web') {
          navigator.clipboard.writeText(profileUrl || 'https://axees.app/profile/creator-001');
        }
        showToast('Link copied to clipboard!');
      }
    },
    { 
      name: 'Email', 
      icon: '✉️', 
      action: () => showToast('Opening email client...')
    },
    { 
      name: 'Messages', 
      icon: '💬', 
      action: () => showToast('Opening messages...')
    },
    { 
      name: 'Social Media', 
      icon: '📱', 
      action: () => showToast('Opening share options...')
    },
  ];

  // Add Esc key support for web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeX}>×</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.description}>
            Share this creator's profile with your team or collaborators
          </Text>

          <View style={styles.optionsContainer}>
            {shareOptions.map((option, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.shareOption}
                onPress={() => {
                  option.action();
                  // Don't close modal immediately to show toast
                }}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>Profile URL:</Text>
            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={1}>
                {profileUrl || 'https://axees.app/profile/creator-001'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View 
          style={[
            styles.toast,
            { opacity: fadeAnim }
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 4,
  },
  closeX: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  shareOption: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  urlContainer: {
    marginBottom: 24,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  urlBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  urlText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  doneButton: {
    backgroundColor: '#430B92',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ShareModal;