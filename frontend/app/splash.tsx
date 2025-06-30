import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BrandColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const { user, isLoading } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after splash
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[BrandColors.primary[600], BrandColors.primary[400], BrandColors.primary[500]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.logo}>
              <Text style={styles.logoText}>AXEES</Text>
            </View>
            
            <Animated.View 
              style={[
                styles.taglineContainer,
                {
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim
                }
              ]}
            >
              <Text style={styles.tagline}>Connect. Create. Collaborate.</Text>
              <Text style={styles.subtitle}>
                Where brands meet creators
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Loading Indicator */}
          <Animated.View 
            style={[
              styles.loadingContainer,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.loadingBar}>
              <LinearGradient
                colors={[BrandColors.neutral[0], 'rgba(255,255,255,0.7)']}
                style={styles.loadingProgress}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.loadingText}>Loading your experience...</Text>
          </Animated.View>
        </View>

        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: BrandColors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    color: BrandColors.primary[500],
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    color: BrandColors.neutral[0],
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '400',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    width: width * 0.6,
    alignItems: 'center',
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingProgress: {
    width: '70%',
    height: '100%',
    borderRadius: 2,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -75,
  },
  circle3: {
    width: 120,
    height: 120,
    top: height * 0.3,
    right: -60,
  },
});

export default SplashScreen;