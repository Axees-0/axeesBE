import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DesignSystem from '@/styles/DesignSystem';
import { WebSEO } from '../web-seo';
import { Color } from '@/GlobalStyles';

interface GhostProfile {
  id: string;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  email?: string;
  phone?: string;
  name?: string;
  isVerified: boolean;
  linkedAccounts: string[];
  permissions: string[];
}

const GHOST_PROFILE_KEY = '@axees_ghost_profile';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const GhostProfileCreate: React.FC = () => {
  const params = useLocalSearchParams();
  const { profileId, returnTo, action } = params;
  
  const [step, setStep] = useState<'intro' | 'quick' | 'email' | 'phone' | 'success'>('intro');
  const [ghostProfile, setGhostProfile] = useState<GhostProfile | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    checkExistingGhostProfile();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkExistingGhostProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(GHOST_PROFILE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as GhostProfile;
        // Check if profile is still valid
        if (new Date(profile.expiresAt) > new Date()) {
          setGhostProfile(profile);
          // Skip to success if already have a profile
          handleSuccess(profile);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking ghost profile:', error);
    }
  };

  const createGhostProfile = async (type: 'quick' | 'email' | 'phone') => {
    const profile: GhostProfile = {
      id: `ghost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: `session_${Date.now()}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_DURATION),
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? phone : undefined,
      name: name || 'Guest User',
      isVerified: type !== 'quick',
      linkedAccounts: [],
      permissions: ['view', 'offer', 'message'],
    };

    try {
      await AsyncStorage.setItem(GHOST_PROFILE_KEY, JSON.stringify(profile));
      setGhostProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error creating ghost profile:', error);
      throw error;
    }
  };

  const handleQuickStart = async () => {
    try {
      const profile = await createGhostProfile('quick');
      handleSuccess(profile);
    } catch (error) {
      Alert.alert('Error', 'Failed to create guest profile');
    }
  };

  const handleEmailVerification = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsVerifying(true);
    
    // Simulate sending verification code
    setTimeout(() => {
      Alert.alert('Verification Code Sent', `A code has been sent to ${email}`);
      setIsVerifying(false);
      setCountdown(60);
    }, 1500);
  };

  const handlePhoneVerification = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setIsVerifying(true);
    
    // Simulate sending verification code
    setTimeout(() => {
      Alert.alert('Verification Code Sent', `A code has been sent to ${phone}`);
      setIsVerifying(false);
      setCountdown(60);
    }, 1500);
  };

  const handleVerifyCode = async (type: 'email' | 'phone') => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    // Simulate verification (in real app, would verify with backend)
    if (verificationCode === '123456') {
      const profile = await createGhostProfile(type);
      handleSuccess(profile);
    } else {
      Alert.alert('Invalid Code', 'The verification code is incorrect');
    }
  };

  const handleSuccess = (profile: GhostProfile) => {
    setStep('success');
    
    // Navigate after short delay
    setTimeout(() => {
      if (returnTo) {
        router.replace(returnTo as string);
      } else {
        router.replace('/explore');
      }
    }, 2000);
  };

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          style={styles.iconGradient}
        >
          <MaterialIcons name="person-outline" size={48} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Welcome to Axees!</Text>
      <Text style={styles.subtitle}>
        Create a temporary profile to start exploring and making offers instantly
      </Text>

      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>No account required</Text>
        </View>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>Make offers instantly</Text>
        </View>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>Valid for 24 hours</Text>
        </View>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>Upgrade anytime</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleQuickStart}
      >
        <MaterialIcons name="flash-on" size={20} color="#fff" />
        <Text style={styles.primaryButtonText}>Quick Start - No Signup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('email')}
      >
        <MaterialIcons name="email" size={20} color={Color.cSK430B92500} />
        <Text style={styles.secondaryButtonText}>Continue with Email</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('phone')}
      >
        <MaterialIcons name="phone" size={20} color={Color.cSK430B92500} />
        <Text style={styles.secondaryButtonText}>Continue with Phone</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmailStep = () => (
    <View style={styles.formContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('intro')}
      >
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.formTitle}>Enter your email</Text>
      <Text style={styles.formSubtitle}>
        We'll send you a verification code to secure your temporary profile
      </Text>

      <TextInput
        style={styles.input}
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
      />

      <TextInput
        style={styles.input}
        placeholder="Your name (optional)"
        value={name}
        onChangeText={setName}
      />

      {countdown === 0 ? (
        <TouchableOpacity
          style={[styles.primaryButton, isVerifying && styles.disabledButton]}
          onPress={handleEmailVerification}
          disabled={isVerifying}
        >
          <Text style={styles.primaryButtonText}>
            {isVerifying ? 'Sending...' : 'Send Verification Code'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleVerifyCode('email')}
          >
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
          </TouchableOpacity>
          
          <Text style={styles.resendText}>
            Resend code in {countdown}s
          </Text>
        </View>
      )}
    </View>
  );

  const renderPhoneStep = () => (
    <View style={styles.formContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('intro')}
      >
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.formTitle}>Enter your phone number</Text>
      <Text style={styles.formSubtitle}>
        We'll send you a verification code via SMS
      </Text>

      <TextInput
        style={styles.input}
        placeholder="+1 (555) 123-4567"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoFocus
      />

      <TextInput
        style={styles.input}
        placeholder="Your name (optional)"
        value={name}
        onChangeText={setName}
      />

      {countdown === 0 ? (
        <TouchableOpacity
          style={[styles.primaryButton, isVerifying && styles.disabledButton]}
          onPress={handlePhoneVerification}
          disabled={isVerifying}
        >
          <Text style={styles.primaryButtonText}>
            {isVerifying ? 'Sending...' : 'Send Verification Code'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleVerifyCode('phone')}
          >
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
          </TouchableOpacity>
          
          <Text style={styles.resendText}>
            Resend code in {countdown}s
          </Text>
        </View>
      )}
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <MaterialIcons name="check-circle" size={80} color="#10B981" />
      </View>
      
      <Text style={styles.successTitle}>You're all set!</Text>
      <Text style={styles.successSubtitle}>
        Your temporary profile has been created
      </Text>

      {ghostProfile && (
        <View style={styles.profileInfo}>
          <Text style={styles.profileId}>Profile ID: {ghostProfile.id.slice(0, 12)}...</Text>
          <Text style={styles.profileExpiry}>
            Valid until: {new Date(ghostProfile.expiresAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.loadingContainer}>
        <Text style={styles.redirectText}>Redirecting...</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <WebSEO 
        title="Quick Start - Axees"
        description="Create a temporary profile to start exploring instantly"
      />

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 'intro' && renderIntro()}
          {step === 'email' && renderEmailStep()}
          {step === 'phone' && renderPhoneStep()}
          {step === 'success' && renderSuccess()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  introContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...DesignSystem.Typography.h1,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.AccessibleColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  benefitsList: {
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    ...DesignSystem.Typography.bodyMedium,
    marginLeft: 12,
  },
  primaryButton: {
    ...DesignSystem.ButtonStyles.primary,
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    ...DesignSystem.ButtonTextStyles.primary,
  },
  secondaryButton: {
    ...DesignSystem.ButtonStyles.secondary,
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  secondaryButtonText: {
    ...DesignSystem.ButtonTextStyles.secondary,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    ...DesignSystem.Typography.caption,
    color: Color.cSK430B92500,
    textDecorationLine: 'underline',
  },
  formContainer: {
    width: '100%',
  },
  backButton: {
    marginBottom: 24,
  },
  formTitle: {
    ...DesignSystem.Typography.h2,
    marginBottom: 8,
  },
  formSubtitle: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginBottom: 32,
  },
  input: {
    ...DesignSystem.InputStyles.default,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendText: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    ...DesignSystem.Typography.h2,
    marginBottom: 8,
  },
  successSubtitle: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginBottom: 24,
  },
  profileInfo: {
    backgroundColor: DesignSystem.AccessibleColors.backgroundSubtle,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  profileId: {
    ...DesignSystem.Typography.caption,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginBottom: 4,
  },
  profileExpiry: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  redirectText: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
});

export default GhostProfileCreate;