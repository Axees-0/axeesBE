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
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { useAuth } from '@/contexts/AuthContext';
import { UniversalBackButton } from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

const RegisterDetailsScreen: React.FC = () => {
  const { role } = useLocalSearchParams();
  const { login } = useAuth();
  const isCreator = role === 'creator';
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    company: '',
    phone: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.fullName || !formData.email) {
          Alert.alert('Missing Information', 'Please fill in all required fields.');
          return false;
        }
        if (!formData.email.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          return false;
        }
        break;
      case 2:
        if (!formData.password || !formData.confirmPassword) {
          Alert.alert('Missing Information', 'Please enter and confirm your password.');
          return false;
        }
        if (formData.password.length < 6) {
          Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          Alert.alert('Password Mismatch', 'Passwords do not match.');
          return false;
        }
        break;
      case 3:
        if (isCreator && !formData.username) {
          Alert.alert('Missing Username', 'Please choose a username for your profile.');
          return false;
        }
        if (!isCreator && !formData.company) {
          Alert.alert('Missing Company', 'Please enter your company name.');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    
    try {
      // In demo mode, simulate registration
      const newUser = {
        id: `demo-${role}-${Date.now()}`,
        email: formData.email,
        name: formData.fullName,
        userType: role as 'creator' | 'marketer',
        ...(isCreator ? { username: formData.username } : { company: formData.company }),
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };
      
      // Auto-login after registration
      await login(newUser, 'demo-token');
      
      // Navigate to success screen
      router.replace('/register-success');
    } catch (error) {
      Alert.alert('Registration Failed', 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Let's start with your basic details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={(text) => updateFormData('fullName', text)}
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </>
        );
        
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Create Password</Text>
            <Text style={styles.stepSubtitle}>Choose a secure password for your account</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>Must be at least 6 characters</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </>
        );
        
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Profile Details</Text>
            <Text style={styles.stepSubtitle}>
              {isCreator ? 'Set up your creator profile' : 'Tell us about your company'}
            </Text>
            
            {isCreator ? (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="@username"
                  placeholderTextColor="#999"
                  value={formData.username}
                  onChangeText={(text) => updateFormData('username', text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.inputHint}>This will be your unique profile handle</Text>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Company Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your company name"
                  placeholderTextColor="#999"
                  value={formData.company}
                  onChangeText={(text) => updateFormData('company', text)}
                  autoCorrect={false}
                />
              </View>
            )}
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <ArrowLeft width={24} height={24} />
          </TouchableOpacity>
        ) : (
          <UniversalBackButton fallbackRoute="/register-otp" />
        )}
        
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((num) => (
          <View
            key={num}
            style={[
              styles.progressDot,
              num === step && styles.activeDot,
              num < step && styles.completedDot,
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Role Badge */}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {isCreator ? '🎨 Content Creator' : '💼 Brand Marketer'}
              </Text>
            </View>

            {/* Form Steps */}
            <View style={styles.form}>
              {renderStep()}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={[styles.continueButton, isLoading && styles.disabledButton]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Please wait...' : step === 3 ? 'Complete Registration' : 'Continue'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.stepIndicator}>Step {step} of 3</Text>
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
  header: {
    flexDirection: 'row',
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
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  activeDot: {
    backgroundColor: Color.cSK430B92500,
    width: 24,
  },
  completedDot: {
    backgroundColor: Color.cSK430B92500,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  roleBadge: {
    backgroundColor: Color.cSK430B92500 + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 32,
  },
  roleBadgeText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
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
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default RegisterDetailsScreen;