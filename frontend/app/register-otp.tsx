import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { UniversalBackButton } from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

const OTPVerificationScreen: React.FC = () => {
  const { phone, role } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = `otp-${index + 1}`;
      // In a real implementation, you'd use refs to focus
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      // Demo OTP verification - accept 123456 as valid
      if (otpCode === '123456') {
        Alert.alert(
          'Phone Verified!',
          'Your phone number has been successfully verified.',
          [
            {
              text: 'Continue',
              onPress: () => {
                router.push({
                  pathname: '/register-details',
                  params: { 
                    role: role,
                    phone: phone,
                    phoneVerified: 'true'
                  }
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Invalid OTP', 'The verification code you entered is incorrect. Please try again.');
      }
    } catch (error) {
      Alert.alert('Verification Failed', 'An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      // Demo resend - just reset timer
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      
      Alert.alert('OTP Sent', `A new verification code has been sent to ${phone}`);
      
      // Restart timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      Alert.alert('Resend Failed', 'Could not resend verification code. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
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
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.description}>
            We've sent a 6-digit verification code to
          </Text>
          <Text style={styles.phoneNumber}>{phone}</Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              keyboardType="numeric"
              maxLength={1}
              placeholder="•"
              placeholderTextColor="#ccc"
              textAlign="center"
            />
          ))}
        </View>

        {/* Timer and Resend */}
        <View style={styles.resendSection}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend code in {formatTime(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendText}>Resend verification code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Demo Info */}
        <View style={styles.demoInfo}>
          <Text style={styles.demoText}>Demo Mode: Use code 123456</Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity 
          style={[
            styles.verifyButton,
            otp.join('').length === 6 ? styles.verifyButtonActive : styles.verifyButtonInactive
          ]}
          onPress={handleVerifyOTP}
          disabled={isLoading || otp.join('').length !== 6}
        >
          <Text style={[
            styles.verifyButtonText,
            otp.join('').length === 6 ? styles.verifyButtonTextActive : styles.verifyButtonTextInactive
          ]}>
            {isLoading ? 'Verifying...' : 'Verify Phone Number'}
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            Didn't receive the code?{' '}
          </Text>
          <TouchableOpacity onPress={() => Alert.alert('Support', 'Contact support for help with verification')}>
            <Text style={styles.helpLink}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    backgroundColor: '#f8f9fa',
  },
  otpInputFilled: {
    borderColor: Color.cSK430B92500,
    backgroundColor: '#fff',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
  },
  resendText: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '600',
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
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonActive: {
    backgroundColor: Color.cSK430B92500,
  },
  verifyButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonTextActive: {
    color: '#fff',
  },
  verifyButtonTextInactive: {
    color: '#999',
  },
  helpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
  },
  helpLink: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;