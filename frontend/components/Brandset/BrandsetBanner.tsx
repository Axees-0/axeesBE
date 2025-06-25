import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';

interface Brand {
  id: string;
  name: string;
  logo?: string;
  color: string;
  sponsorshipType: 'featured' | 'standard' | 'premium';
  ctaText?: string;
  ctaAction?: () => void;
}

interface BrandsetBannerProps {
  brands: Brand[];
  creatorId: string;
  onBrandClick?: (brand: Brand) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const BrandsetBanner: React.FC<BrandsetBannerProps> = ({
  brands,
  creatorId,
  onBrandClick,
}) => {
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  // Auto-rotate through brands
  useEffect(() => {
    if (brands.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out current brand
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update index
        setActiveBrandIndex((prev) => (prev + 1) % brands.length);
        
        // Reset position and fade in new brand
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [brands.length]);

  if (!brands || brands.length === 0) return null;

  const activeBrand = brands[activeBrandIndex];

  const handleBrandPress = () => {
    if (onBrandClick) {
      onBrandClick(activeBrand);
    }
    if (activeBrand.ctaAction) {
      activeBrand.ctaAction();
    }
  };

  const getBannerStyle = () => {
    switch (activeBrand.sponsorshipType) {
      case 'premium':
        return styles.premiumBanner;
      case 'featured':
        return styles.featuredBanner;
      default:
        return styles.standardBanner;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, getBannerStyle()]}
      onPress={handleBrandPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[activeBrand.color + 'DD', activeBrand.color + '99']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.brandInfo}>
            <View style={styles.sponsorshipBadge}>
              <MaterialIcons name="verified" size={16} color="#fff" />
              <Text style={styles.sponsorshipText}>SPONSORED</Text>
            </View>
            
            <Text style={styles.brandName}>{activeBrand.name}</Text>
            
            {activeBrand.ctaText && (
              <View style={styles.ctaContainer}>
                <Text style={styles.ctaText}>{activeBrand.ctaText}</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </View>

          {brands.length > 1 && (
            <View style={styles.pagination}>
              {brands.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeBrandIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Sparkle effect for premium sponsors */}
        {activeBrand.sponsorshipType === 'premium' && (
          <View style={styles.sparkleContainer}>
            <FontAwesome5 name="star" size={12} color="#FFD700" style={styles.sparkle1} />
            <FontAwesome5 name="star" size={8} color="#FFD700" style={styles.sparkle2} />
            <FontAwesome5 name="star" size={10} color="#FFD700" style={styles.sparkle3} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradient: {
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandInfo: {
    flex: 1,
  },
  sponsorshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  sponsorshipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  brandName: {
    ...DesignSystem.Typography.h2,
    color: '#fff',
    fontSize: 28,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -12,
    right: 0,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
  standardBanner: {
    minHeight: 100,
  },
  featuredBanner: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  premiumBanner: {
    minHeight: 140,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 20,
    opacity: 0.8,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    opacity: 0.6,
  },
  sparkle3: {
    position: 'absolute',
    top: '50%',
    right: '40%',
    opacity: 0.7,
  },
});

export default BrandsetBanner;