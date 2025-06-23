import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { useAuth } from '@/contexts/AuthContext';

const RegisterSuccessScreen: React.FC = () => {
  const { user } = useAuth();
  const isCreator = user?.userType === 'creator';
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    // Animate success icon
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/(tabs)');
  };

  const handleCompleteProfile = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View 
          style={[
            styles.successContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.successTitle}>Welcome to Axees!</Text>
          <Text style={styles.successSubtitle}>
            Your account has been created successfully
          </Text>
        </Animated.View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Hi {user?.name?.split(' ')[0] || 'there'}! 👋
          </Text>
          <Text style={styles.welcomeText}>
            {isCreator 
              ? "You're all set to start receiving offers from brands and building amazing partnerships!"
              : "You're ready to discover talented creators and launch successful campaigns!"
            }
          </Text>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>What's Next?</Text>
          
          <View style={styles.stepsList}>
            {isCreator ? (
              <>
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>1</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Complete Your Profile</Text>
                    <Text style={styles.stepDescription}>
                      Add your portfolio, social media links, and rates
                    </Text>
                  </View>
                </View>
                
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>2</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Wait for Offers</Text>
                    <Text style={styles.stepDescription}>
                      Brands will discover you and send collaboration offers
                    </Text>
                  </View>
                </View>
                
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>3</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Create & Earn</Text>
                    <Text style={styles.stepDescription}>
                      Accept offers, create content, and get paid
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>1</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Explore Creators</Text>
                    <Text style={styles.stepDescription}>
                      Browse our curated list of talented content creators
                    </Text>
                  </View>
                </View>
                
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>2</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Send Offers</Text>
                    <Text style={styles.stepDescription}>
                      Create custom offers or use templates
                    </Text>
                  </View>
                </View>
                
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>3</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Manage Campaigns</Text>
                    <Text style={styles.stepDescription}>
                      Track progress and approve content
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>
              {isCreator ? 'Explore Dashboard' : 'Find Creators'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleCompleteProfile}
          >
            <Text style={styles.secondaryButtonText}>
              Complete Profile
            </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Color.cSK430B92500 + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  welcomeSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  nextStepsSection: {
    marginBottom: 40,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 20,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Color.cSK430B92500,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionSection: {
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterSuccessScreen;