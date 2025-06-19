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
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/demo/DemoMode';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Demo mode login
      if (DEMO_MODE) {
        // Check for demo credentials
        const demoUsers = {
          'sarah@techstyle.com': {
            id: 'demo-marketer-001',
            email: 'sarah@techstyle.com',
            name: 'Sarah Martinez',
            userType: 'marketer' as const,
            company: 'TechStyle Brand',
          },
          'emma@creativestudio.com': {
            id: 'demo-creator-001',
            email: 'emma@creativestudio.com',
            name: 'Emma Thompson',
            userType: 'creator' as const,
            username: '@emmastyle',
          }
        };

        const user = demoUsers[email];
        if (user && password === 'demo123') {
          await login(user, 'demo-token');
          router.replace('/(tabs)');
        } else {
          Alert.alert('Invalid Credentials', 'Use demo credentials:\n\nMarketer: sarah@techstyle.com\nCreator: emma@creativestudio.com\nPassword: demo123');
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
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
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
                  <Text style={styles.demoValue}>sarah@techstyle.com</Text>
                </View>
                <View style={styles.demoCredential}>
                  <Text style={styles.demoLabel}>Creator:</Text>
                  <Text style={styles.demoValue}>emma@creativestudio.com</Text>
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
    backgroundColor: '#fff',
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
    backgroundColor: Color.cSK430B92500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  demoCredential: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  demoLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  demoValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
});

export default LoginScreen;