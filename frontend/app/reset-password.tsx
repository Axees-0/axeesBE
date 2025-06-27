import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { UniversalBackButton } from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

const ResetPasswordScreen: React.FC = () => {
  const { email, verified } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing Information', 'Please enter and confirm your new password.');
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    if (verified !== 'true') {
      Alert.alert('Verification Required', 'Please complete email verification first.');
      return;
    }

    setIsLoading(true);

    try {
      // Demo mode - simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Password Reset Successful!',
        'Your password has been successfully reset. You can now log in with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              router.replace('/login');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Reset Failed', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not verified
  if (verified !== 'true') {
    Alert.alert('Verification Required', 'Please complete email verification first.');
    router.replace('/forgot-password');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/login" />
          
          <Text style={styles.headerTitle}>Set New Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔒</Text>
            </View>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.description}>
              Please create a strong new password for your account
            </Text>
            <Text style={styles.emailText}>for {email}</Text>
          </View>

          {/* Password Inputs */}
          <View style={styles.inputSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
              <Text style={styles.inputHelp}>
                Must be at least 6 characters long
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Password Strength Indicator */}
          <View style={styles.strengthSection}>
            <Text style={styles.strengthTitle}>Password Strength:</Text>
            <View style={styles.strengthIndicator}>
              <View style={[
                styles.strengthBar,
                newPassword.length >= 6 ? styles.strengthBarGood : styles.strengthBarWeak
              ]} />
              <Text style={[
                styles.strengthText,
                newPassword.length >= 6 ? styles.strengthTextGood : styles.strengthTextWeak
              ]}>
                {newPassword.length >= 6 ? 'Good' : 'Too Short'}
              </Text>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity 
            style={[
              styles.resetButton,
              (validatePassword(newPassword) && newPassword === confirmPassword) ? 
                styles.resetButtonActive : styles.resetButtonInactive
            ]}
            onPress={handleResetPassword}
            disabled={isLoading || !validatePassword(newPassword) || newPassword !== confirmPassword}
          >
            <Text style={[
              styles.resetButtonText,
              (validatePassword(newPassword) && newPassword === confirmPassword) ? 
                styles.resetButtonTextActive : styles.resetButtonTextInactive
            ]}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityText}>
              For your security, you'll be logged out from all devices after your password is reset.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0e7fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Color.cSK430B92950,
    backgroundColor: '#f8f9fa',
  },
  inputHelp: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  strengthSection: {
    marginBottom: 32,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  strengthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    flex: 1,
  },
  strengthBarWeak: {
    backgroundColor: '#ffcccb',
  },
  strengthBarGood: {
    backgroundColor: '#90ee90',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  strengthTextWeak: {
    color: '#d32f2f',
  },
  strengthTextGood: {
    color: '#4caf50',
  },
  resetButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButtonActive: {
    backgroundColor: Color.cSK430B92500,
  },
  resetButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButtonTextActive: {
    color: '#fff',
  },
  resetButtonTextInactive: {
    color: '#999',
  },
  securityNote: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: '#ffc107',
  },
  securityText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
});

export default ResetPasswordScreen;