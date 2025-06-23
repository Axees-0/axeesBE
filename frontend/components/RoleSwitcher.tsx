import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Color, Focus } from '@/GlobalStyles';
import { router } from 'expo-router';
import { useConfirmModal, useAlertModal } from '@/components/ConfirmModal';

interface RoleSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ visible, onClose }) => {
  const { user, updateUser } = useAuth();
  // Default to the opposite role (the one they can switch TO)
  const oppositeRole = user?.userType === 'creator' ? 'marketer' : 'creator';
  const [selectedRole, setSelectedRole] = useState<'creator' | 'marketer'>(oppositeRole);
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  const { showAlert, AlertModalComponent } = useAlertModal();

  // Reset to opposite role when modal opens
  useEffect(() => {
    if (visible) {
      const currentOppositeRole = user?.userType === 'creator' ? 'marketer' : 'creator';
      setSelectedRole(currentOppositeRole);
    }
  }, [visible, user?.userType]);

  // Add Esc key support for web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [visible, onClose]);

  const roleProfiles = {
    creator: {
      id: 'demo-creator-001',
      email: 'emma@creativestudio.com',
      name: 'Emma Thompson',
      userType: 'creator' as const,
      isEmailVerified: true,
      profilePicture: '/assets/emma-profile.jpg',
      followers: 45000,
      engagementRate: 5.8,
      platforms: ['Instagram', 'TikTok'],
    },
    marketer: {
      id: 'demo-marketer-001',
      email: 'sarah@techstyle.com',
      name: 'Sarah Martinez',
      userType: 'marketer' as const,
      isEmailVerified: true,
      profilePicture: '/assets/sarah-profile.jpg',
      company: 'TechStyle Brand',
      campaignsManaged: 127,
      totalBudget: 450000,
    }
  };

  const handleRoleSwitch = () => {
    const newProfile = roleProfiles[selectedRole];
    const roleDisplayName = selectedRole === 'creator' ? 'Creator' : 'Marketer';
    
    // Use styled confirm modal for all platforms
    showConfirm(
      'Switch Role',
      `Switch to ${roleDisplayName} role?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch', 
          style: 'default',
          onPress: () => {
            updateUser(newProfile);
            
            // Navigate to appropriate home screen
            if (selectedRole === 'creator') {
              router.replace('/(tabs)/deals');
            } else {
              router.replace('/'); // Root route is the explore page
            }
            
            onClose();
            
            // Success notification
            showAlert(
              'Success',
              `Role switched successfully! You are now viewing the app as a ${roleDisplayName}.`,
              'OK'
            );
          }
        }
      ]
    );
    
    // Legacy code for reference - can be removed after testing
    if (false && Platform.OS === 'web') {
      // Native React Native Alert for mobile
      Alert.alert(
        'Switch Role',
        `Switch to ${roleDisplayName} role?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              // User cancelled - close the modal
              onClose();
            }
          },
          {
            text: 'Switch',
            onPress: () => {
              updateUser(newProfile);
              
              // Navigate to appropriate home screen
              if (selectedRole === 'creator') {
                router.replace('/(tabs)/deals');
              } else {
                router.replace('/'); // Root route is the explore page
              }
              
              onClose();
              
              Alert.alert(
                'Success',
                `Role switched successfully! You are now viewing the app as a ${roleDisplayName}.`,
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Switch Role</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Experience the app from different perspectives by switching between Creator and Marketer roles.
          </Text>

          <View style={styles.roleOptions}>
            {/* Creator Option */}
            <TouchableOpacity
              style={({ focused }) => [
                styles.roleCard,
                selectedRole === 'creator' && styles.selectedRoleCard,
                focused && styles.roleCardFocused,
              ]}
              onPress={() => setSelectedRole('creator')}
              accessible={true}
              accessibilityRole="radio"
              accessibilityState={{ 
                selected: selectedRole === 'creator',
                checked: selectedRole === 'creator' 
              }}
              accessibilityLabel="Creator role"
              accessibilityHint="Select Creator role - Content creator with 45K followers. Receive offers, submit content, track earnings."
            >
              <Text style={styles.roleEmoji}>🎨</Text>
              <Text style={styles.roleName}>Creator</Text>
              <Text style={styles.roleDescription}>
                Content creator with 45K followers
              </Text>
              
              <View style={styles.roleFeatures}>
                <Text style={styles.featureItem}>• Receive & manage offers</Text>
                <Text style={styles.featureItem}>• Submit content for approval</Text>
                <Text style={styles.featureItem}>• Track earnings & withdraw</Text>
                <Text style={styles.featureItem}>• View deal milestones</Text>
              </View>

              {selectedRole === 'creator' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Marketer Option */}
            <TouchableOpacity
              style={({ focused }) => [
                styles.roleCard,
                selectedRole === 'marketer' && styles.selectedRoleCard,
                focused && styles.roleCardFocused,
              ]}
              onPress={() => setSelectedRole('marketer')}
              accessible={true}
              accessibilityRole="radio"
              accessibilityState={{ 
                selected: selectedRole === 'marketer',
                checked: selectedRole === 'marketer' 
              }}
              accessibilityLabel="Marketer role"
              accessibilityHint="Select Marketer role - Brand manager at TechStyle. Discover creators, send offers, manage campaigns."
            >
              <Text style={styles.roleEmoji}>💼</Text>
              <Text style={styles.roleName}>Marketer</Text>
              <Text style={styles.roleDescription}>
                Brand manager at TechStyle
              </Text>
              
              <View style={styles.roleFeatures}>
                <Text style={styles.featureItem}>• Discover creators</Text>
                <Text style={styles.featureItem}>• Send collaboration offers</Text>
                <Text style={styles.featureItem}>• Manage campaigns</Text>
                <Text style={styles.featureItem}>• Approve content & release payments</Text>
              </View>

              {selectedRole === 'marketer' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.currentRoleInfo}>
            <Text style={styles.currentRoleLabel}>Currently viewing as:</Text>
            <Text style={styles.currentRoleName}>
              {user?.userType === 'creator' ? 'Creator' : 'Marketer'}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityHint="Close the role switcher dialog"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.switchButton,
                selectedRole === user?.userType && styles.disabledButton
              ]}
              onPress={handleRoleSwitch}
              disabled={selectedRole === user?.userType}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={selectedRole === user?.userType ? 'Already in this role' : `Switch to ${selectedRole === 'creator' ? 'Creator' : 'Marketer'}`}
              accessibilityState={{ disabled: selectedRole === user?.userType }}
            >
              <Text style={[
                styles.switchButtonText,
                selectedRole === user?.userType && styles.disabledButtonText
              ]}>
                {selectedRole === user?.userType ? 'Already in this role' : `Switch to ${selectedRole === 'creator' ? 'Creator' : 'Marketer'}`}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            This is a demo feature for testing purposes only. In production, users have fixed roles.
          </Text>
        </View>
      </View>
    </Modal>
    
    <ConfirmModalComponent />
    <AlertModalComponent />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  roleOptions: {
    gap: 16,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedRoleCard: {
    borderColor: Color.cSK430B92500,
    backgroundColor: Color.cSK430B92500 + '10',
  },
  roleCardFocused: {
    ...Focus.primary,
    borderRadius: 12,
  },
  roleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleFeatures: {
    gap: 4,
  },
  featureItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  currentRoleInfo: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  currentRoleLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentRoleName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    flex: 1,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RoleSwitcher;