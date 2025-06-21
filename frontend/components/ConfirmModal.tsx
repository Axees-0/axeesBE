import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Color } from '@/GlobalStyles';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'default',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
      accessibilityLabel={`${title} confirmation dialog`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onCancel}
          accessibilityLabel="Close dialog"
          accessibilityRole="button"
        />
        
        <View 
          style={styles.modalContent}
          accessibilityRole="dialog"
          accessibilityLiveRegion="assertive"
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.confirmButton,
                confirmStyle === 'destructive' && styles.destructiveButton
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              <Text style={[
                styles.confirmButtonText,
                confirmStyle === 'destructive' && styles.destructiveButtonText
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: Color.cSK430B92500,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
  },
  destructiveButtonText: {
    color: '#fff',
  },
});

// Helper hook to replace Alert.alert with ConfirmModal
export const useConfirmModal = () => {
  const [modalState, setModalState] = React.useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    confirmStyle: 'default' as 'default' | 'destructive',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showConfirm = (
    title: string,
    message: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    const cancelButton = buttons?.find(b => b.style === 'cancel');
    const confirmButton = buttons?.find(b => b.style !== 'cancel');

    setModalState({
      visible: true,
      title,
      message,
      confirmText: confirmButton?.text || 'OK',
      cancelText: cancelButton?.text || 'Cancel',
      confirmStyle: confirmButton?.style === 'destructive' ? 'destructive' : 'default',
      onConfirm: () => {
        confirmButton?.onPress?.();
        setModalState(prev => ({ ...prev, visible: false }));
      },
      onCancel: () => {
        cancelButton?.onPress?.();
        setModalState(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const hideConfirm = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  return {
    showConfirm,
    hideConfirm,
    ConfirmModalComponent: () => (
      <ConfirmModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        confirmStyle={modalState.confirmStyle}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    ),
  };
};