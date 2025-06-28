import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { BrandColors } from '@/constants/Colors';
import { UniversalBackButton } from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

const RegisterPreviewScreen: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'creator' | 'marketer' | null>(null);

  const handleContinue = () => {
    if (!selectedRole) {
      Alert.alert('Select Role', 'Please select whether you are a Creator or Marketer to continue.');
      return;
    }
    
    router.push({
      pathname: '/register-phone',
      params: { role: selectedRole }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <UniversalBackButton fallbackRoute="/" />
        
        <Text style={styles.headerTitle}>Join Axees</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to Axees!</Text>
            <Text style={styles.welcomeSubtitle}>
              Connect, collaborate, and create amazing content partnerships
            </Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.sectionTitle}>I am a...</Text>
            
            {/* Creator Option */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'creator' && styles.selectedRoleCard
              ]}
              onPress={() => setSelectedRole('creator')}
            >
              <View style={styles.roleIconContainer}>
                <Text style={styles.roleIcon}>🎨</Text>
              </View>
              
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Content Creator</Text>
                <Text style={styles.roleDescription}>
                  I create content and want to collaborate with brands
                </Text>
                
                <View style={styles.roleFeatures}>
                  <Text style={styles.roleFeature}>• Receive collaboration offers</Text>
                  <Text style={styles.roleFeature}>• Showcase your portfolio</Text>
                  <Text style={styles.roleFeature}>• Manage deals & earnings</Text>
                  <Text style={styles.roleFeature}>• Build brand relationships</Text>
                </View>
              </View>
              
              {selectedRole === 'creator' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Marketer Option */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'marketer' && styles.selectedRoleCard
              ]}
              onPress={() => setSelectedRole('marketer')}
            >
              <View style={styles.roleIconContainer}>
                <Text style={styles.roleIcon}>💼</Text>
              </View>
              
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Brand Marketer</Text>
                <Text style={styles.roleDescription}>
                  I represent a brand looking for content creators
                </Text>
                
                <View style={styles.roleFeatures}>
                  <Text style={styles.roleFeature}>• Discover talented creators</Text>
                  <Text style={styles.roleFeature}>• Send collaboration offers</Text>
                  <Text style={styles.roleFeature}>• Manage campaigns</Text>
                  <Text style={styles.roleFeature}>• Track performance</Text>
                </View>
              </View>
              
              {selectedRole === 'marketer' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Why Join Axees?</Text>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🤝</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Trusted Partnerships</Text>
                  <Text style={styles.benefitDescription}>
                    Secure deals with milestone-based payments
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💰</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Fair Compensation</Text>
                  <Text style={styles.benefitDescription}>
                    Transparent pricing and timely payments
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📈</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Growth Opportunities</Text>
                  <Text style={styles.benefitDescription}>
                    Connect with brands and creators worldwide
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            !selectedRole && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedRole && styles.disabledButtonText
          ]}>
            Continue as {selectedRole === 'creator' ? 'Creator' : selectedRole === 'marketer' ? 'Marketer' : 'Selected Role'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.primary[900],
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandColors.primary[900],
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: BrandColors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  roleSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.primary[900],
    marginBottom: 16,
  },
  roleCard: {
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    position: 'relative',
  },
  selectedRoleCard: {
    borderColor: BrandColors.primary[500],
    backgroundColor: BrandColors.primary[50],
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleIcon: {
    fontSize: 32,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandColors.primary[900],
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    marginBottom: 12,
    lineHeight: 20,
  },
  roleFeatures: {
    gap: 4,
  },
  roleFeature: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    lineHeight: 18,
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: 'bold',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.primary[900],
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[800],
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    lineHeight: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BrandColors.neutral[0],
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: BrandColors.neutral[100],
  },
  continueButton: {
    backgroundColor: BrandColors.primary[500],
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: BrandColors.neutral[400],
  },
  continueButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: BrandColors.neutral[400],
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
  },
  loginLink: {
    fontSize: 14,
    color: BrandColors.primary[500],
    fontWeight: '600',
  },
});

export default RegisterPreviewScreen;