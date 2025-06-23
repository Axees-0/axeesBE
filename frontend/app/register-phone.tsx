import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';
import { UniversalBackButton } from '@/components/UniversalBackButton';

const PhoneRegistrationScreen: React.FC = () => {
  const { role } = useLocalSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    // Simple phone validation - must be 10 digits
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

  const handlePhoneChange = (text: string) => {
    // Only allow digits
    const digitsOnly = text.replace(/\D/g, '');
    
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    const formatted = formatPhoneNumber(digitsOnly);
    if (digitsOnly.length <= 10) {
      setPhoneNumber(formatted);
      
      // Show error if invalid after interaction
      if (hasInteracted && digitsOnly.length > 0 && digitsOnly.length < 10) {
        setShowError(true);
      } else {
        setShowError(false);
      }
    }
  };

  const handleSendOTP = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (!validatePhoneNumber(cleanPhone)) {
      setShowError(true);
      setHasInteracted(true);
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setIsLoading(true);

    try {
      // Demo mode - simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Verification Code Sent',
        `We've sent a 6-digit verification code to ${phoneNumber}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              router.push({
                pathname: '/register-otp',
                params: { 
                  role: role,
                  phone: phoneNumber
                }
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
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
          <UniversalBackButton fallbackRoute="/register" />
          
          <Text style={styles.headerTitle}>Phone Verification</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📱</Text>
            </View>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.description}>
              We'll send you a verification code to confirm your phone number and keep your account secure.
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+1</Text>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                maxLength={14} // Formatted length
                placeholderTextColor="#999"
              />
            </View>
            {showError && (
              <Text style={styles.errorText}>
                Please enter a valid 10-digit phone number
              </Text>
            )}
            {!showError && (
              <Text style={styles.inputHelp}>
                We'll only use this to verify your account and send important updates
              </Text>
            )}
          </View>

          {/* Demo Info */}
          <View style={styles.demoInfo}>
            <Text style={styles.demoText}>
              Demo Mode: Any 10-digit number works
            </Text>
          </View>

          {/* Send Code Button */}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              validatePhoneNumber(phoneNumber.replace(/\D/g, '')) ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendOTP}
            disabled={isLoading || !validatePhoneNumber(phoneNumber.replace(/\D/g, ''))}
          >
            <Text style={[
              styles.sendButtonText,
              validatePhoneNumber(phoneNumber.replace(/\D/g, '')) ? styles.sendButtonTextActive : styles.sendButtonTextInactive
            ]}>
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              By continuing, you agree to receive SMS messages for verification. Message and data rates may apply.
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
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: Color.cSK430B92950,
    paddingVertical: 16,
  },
  inputHelp: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 8,
    lineHeight: 16,
    fontWeight: '500',
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
    backgroundColor: Color.cSK430B92500,
  },
  sendButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextActive: {
    color: '#fff',
  },
  sendButtonTextInactive: {
    color: '#999',
  },
  termsSection: {
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default PhoneRegistrationScreen;