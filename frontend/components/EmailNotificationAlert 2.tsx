import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable
} from 'react-native';
import { AlertCircle, CheckCircle, X, Mail, Settings } from 'lucide-react-native';
import { router } from 'expo-router';

interface EmailNotificationAlertProps {
  visible: boolean;
  onClose: () => void;
  onProceed?: () => void;
  issues: string[];
  recipientDetails?: {
    creator: { hasEmail: boolean; email?: string; notificationEnabled?: boolean };
    marketer: { hasEmail: boolean; email?: string; notificationEnabled?: boolean };
  };
  canProceed: boolean;
}

export default function EmailNotificationAlert({
  visible,
  onClose,
  onProceed,
  issues,
  recipientDetails,
  canProceed
}: EmailNotificationAlertProps) {
  const hasCreatorEmail = recipientDetails?.creator?.hasEmail || false;
  const hasMarketerEmail = recipientDetails?.marketer?.hasEmail || false;
  const creatorNotificationsEnabled = recipientDetails?.creator?.notificationEnabled !== false;
  const marketerNotificationsEnabled = recipientDetails?.marketer?.notificationEnabled !== false;

  const handleGoToSettings = () => {
    onClose();
    router.push('/UAM003NotificationSettings');
  };

  const handleGoToProfile = () => {
    onClose();
    router.push('/profile');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Mail width={24} height={24} color="#430B92" />
              <Text style={styles.title}>Email Notification Status</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X width={24} height={24} color="#6C6C6C" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Summary */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Notification Recipients</Text>
              
              <View style={styles.statusItem}>
                <View style={styles.statusRow}>
                  {hasCreatorEmail && creatorNotificationsEnabled ? (
                    <CheckCircle width={20} height={20} color="#4CAF50" />
                  ) : (
                    <AlertCircle width={20} height={20} color="#F44336" />
                  )}
                  <Text style={styles.statusLabel}>Creator</Text>
                </View>
                {recipientDetails?.creator?.email && (
                  <Text style={styles.emailText}>{recipientDetails.creator.email}</Text>
                )}
                {!hasCreatorEmail && (
                  <Text style={styles.warningText}>No email address on file</Text>
                )}
                {hasCreatorEmail && !creatorNotificationsEnabled && (
                  <Text style={styles.warningText}>Email notifications disabled</Text>
                )}
              </View>

              <View style={styles.statusItem}>
                <View style={styles.statusRow}>
                  {hasMarketerEmail && marketerNotificationsEnabled ? (
                    <CheckCircle width={20} height={20} color="#4CAF50" />
                  ) : (
                    <AlertCircle width={20} height={20} color="#F44336" />
                  )}
                  <Text style={styles.statusLabel}>You (Marketer)</Text>
                </View>
                {recipientDetails?.marketer?.email && (
                  <Text style={styles.emailText}>{recipientDetails.marketer.email}</Text>
                )}
                {!hasMarketerEmail && (
                  <Text style={styles.warningText}>No email address on file</Text>
                )}
                {hasMarketerEmail && !marketerNotificationsEnabled && (
                  <Text style={styles.warningText}>Email notifications disabled</Text>
                )}
              </View>
            </View>

            {/* Issues List */}
            {issues.length > 0 && (
              <View style={styles.issuesSection}>
                <Text style={styles.sectionTitle}>Issues Found</Text>
                {issues.map((issue, index) => (
                  <View key={index} style={styles.issueItem}>
                    <AlertCircle width={16} height={16} color="#F44336" />
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Information Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                {canProceed ? 'Email Notifications Ready' : 'Action Required'}
              </Text>
              <Text style={styles.infoText}>
                {canProceed
                  ? 'Both parties will receive email notifications about this offer.'
                  : 'Email notifications cannot be sent due to the issues above. The offer will still be created but notifications will be limited to in-app only.'}
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {!canProceed && (
              <View style={styles.fixButtonsContainer}>
                {!hasMarketerEmail && (
                  <TouchableOpacity
                    style={styles.fixButton}
                    onPress={handleGoToProfile}
                  >
                    <Settings width={16} height={16} color="#430B92" />
                    <Text style={styles.fixButtonText}>Update Profile</Text>
                  </TouchableOpacity>
                )}
                {hasMarketerEmail && !marketerNotificationsEnabled && (
                  <TouchableOpacity
                    style={styles.fixButton}
                    onPress={handleGoToSettings}
                  >
                    <Settings width={16} height={16} color="#430B92" />
                    <Text style={styles.fixButtonText}>Enable Notifications</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <View style={styles.mainButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <Pressable
                style={[
                  styles.proceedButton,
                  !canProceed && styles.proceedButtonWarning
                ]}
                onPress={onProceed}
              >
                <Text style={styles.proceedButtonText}>
                  {canProceed ? 'Send Offer' : 'Send Without Email'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    ...Platform.select({
      ios: {        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2D0FB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C6C6C',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  statusItem: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  emailText: {
    fontSize: 14,
    color: '#6C6C6C',
    marginLeft: 28,
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 28,
    fontStyle: 'italic',
  },
  issuesSection: {
    marginBottom: 24,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  issueText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
  },
  infoBox: {
    backgroundColor: '#F0E7FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#430B92',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6C6C6C',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2D0FB',
    gap: 12,
  },
  fixButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fixButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#430B92',
    borderRadius: 8,
  },
  fixButtonText: {
    fontSize: 14,
    color: '#430B92',
    fontWeight: '500',
  },
  mainButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2D0FB',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6C6C6C',
    fontWeight: '500',
  },
  proceedButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#430B92',
    borderRadius: 8,
  },
  proceedButtonWarning: {
    backgroundColor: '#FF9800',
  },
  proceedButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});