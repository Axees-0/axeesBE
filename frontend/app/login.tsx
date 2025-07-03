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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { BrandColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/demo/DemoMode';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const fullPhoneNumber = countryCode + phoneNumber;
    if (!phoneNumber || !password) {
      Alert.alert('Missing Information', 'Please enter both phone number and password.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Demo mode login
      if (DEMO_MODE) {
        // Check for demo credentials
        const demoUsers = {
          '+15551234567': {
            id: 'demo-marketer-001',
            phone: '+15551234567',
            name: 'Sarah Martinez',
            userType: 'marketer' as const,
            company: 'TechStyle Brand',
          },
          '+15557654321': {
            id: 'demo-creator-001',
            phone: '+15557654321',
            name: 'Emma Thompson',
            userType: 'creator' as const,
            username: '@emmastyle',
          }
        };

        const user = demoUsers[fullPhoneNumber];
        if (user && password === 'demo123') {
          await login(user, 'demo-token');
          router.push('/(tabs)');
        } else {
          Alert.alert('Invalid Credentials', 'Use demo credentials:\n\nMarketer: +1 555-123-4567\nCreator: +1 555-765-4321\nPassword: demo123');
        }
      } else {
        // Production login would go here
        Alert.alert('Production Login', 'Would authenticate with backend');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>AXEES</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <TextInput
                    style={styles.countryCodeInput}
                    value={countryCode}
                    onChangeText={setCountryCode}
                    placeholder="+1"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="555-123-4567"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Demo Mode Info */}
            {DEMO_MODE && (
              <View style={styles.demoInfo}>
                <Text style={styles.demoTitle}>Demo Credentials:</Text>
                <View style={styles.demoCredential}>
                  <Text style={styles.demoLabel}>Marketer:</Text>
                  <Text style={styles.demoValue}>+1 555-123-4567</Text>
                </View>
                <View style={styles.demoCredential}>
                  <Text style={styles.demoLabel}>Creator:</Text>
                  <Text style={styles.demoValue}>+1 555-765-4321</Text>
                </View>
                <View style={styles.demoCredential}>
                  <Text style={styles.demoLabel}>Password:</Text>
                  <Text style={styles.demoValue}>demo123</Text>
                </View>
              </View>
            )}
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Sign Up</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: BrandColors.neutral[0],
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandColors.primary[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: BrandColors.neutral[500],
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.primary[900],
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.neutral[800],
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeContainer: {
    width: 80,
  },
  countryCodeInput: {
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.neutral[800],
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.neutral[800],
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: BrandColors.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: BrandColors.primary[500],
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  demoInfo: {
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.neutral[800],
    marginBottom: 8,
  },
  demoCredential: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  demoLabel: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    width: 80,
  },
  demoValue: {
    fontSize: 12,
    color: BrandColors.neutral[800],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
  },
  registerLink: {
    fontSize: 14,
    color: BrandColors.primary[500],
    fontWeight: '600',
  },
});

export default LoginScreen;