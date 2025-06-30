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
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { BrandColors } from '@/constants/Colors';
import UniversalBackButton from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

const ForgotPasswordScreen: React.FC = () => {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 6) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6, 10)}`;
    } else if (cleanPhone.length >= 3) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3)}`;
    }
    return cleanPhone;
  };

  const handleSendReset = async () => {
    const fullPhoneNumber = countryCode + phoneNumber.replace(/\D/g, '');
    if (!phoneNumber) {
      Alert.alert('Missing Phone Number', 'Please enter your phone number.');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setIsLoading(true);

    try {
      // Demo mode - simulate sending reset code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Reset Code Sent',
        `We've sent a password reset code to ${fullPhoneNumber}. Please check your SMS messages and enter the code on the next screen.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              router.push({
                pathname: '/reset-password-otp',
                params: { phone: fullPhoneNumber }
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔑</Text>
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.description}>
              No worries! Enter your phone number and we'll send you a code to reset your password.
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeContainer}>
                <TextInput
                  style={styles.countryCodeInput}
                  value={countryCode}
                  onChangeText={setCountryCode}
                  placeholder="+1"
                  placeholderTextColor={BrandColors.neutral[400]}
                  keyboardType="phone-pad"
                />
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text.replace(/\D/g, ''));
                  if (text.replace(/\D/g, '').length <= 10) {
                    setPhoneNumber(formatted);
                  }
                }}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                autoCorrect={false}
                placeholderTextColor={BrandColors.neutral[400]}
                maxLength={14}
              />
            </View>
          </View>

          {/* Demo Info */}
          <View style={styles.demoInfo}>
            <Text style={styles.demoText}>
              Demo Mode: Use any valid 10-digit phone number
            </Text>
          </View>

          {/* Send Reset Button */}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              validatePhoneNumber(phoneNumber) ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendReset}
            disabled={isLoading || !validatePhoneNumber(phoneNumber)}
          >
            <Text style={[
              styles.sendButtonText,
              validatePhoneNumber(phoneNumber) ? styles.sendButtonTextActive : styles.sendButtonTextInactive
            ]}>
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.backToLoginSection}>
            <Text style={styles.backToLoginText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.backToLoginLink}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[0],
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
    borderBottomColor: BrandColors.neutral[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandColors.primary[900],
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
    color: BrandColors.primary[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: BrandColors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.primary[900],
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeContainer: {
    width: 80,
  },
  countryCodeInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    color: BrandColors.primary[900],
    backgroundColor: BrandColors.neutral[50],
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: BrandColors.primary[900],
    backgroundColor: BrandColors.neutral[50],
  },
  demoInfo: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 32,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  sendButtonActive: {
    backgroundColor: BrandColors.primary[500],
  },
  sendButtonInactive: {
    backgroundColor: BrandColors.neutral[100],
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextActive: {
    color: BrandColors.neutral[0],
  },
  sendButtonTextInactive: {
    color: BrandColors.neutral[400],
  },
  backToLoginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
  },
  backToLoginLink: {
    fontSize: 14,
    color: BrandColors.primary[500],
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;