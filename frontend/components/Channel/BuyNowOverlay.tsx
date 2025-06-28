import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description?: string;
  discount?: number;
  brand?: string;
}

interface BuyNowOverlayProps {
  product: Product;
  position?: 'top' | 'bottom' | 'center';
  onBuyNow: (product: Product) => void;
  onDismiss?: () => void;
  duration?: number;
  autoHide?: boolean;
  style?: 'minimal' | 'full' | 'compact';
}

export const BuyNowOverlay: React.FC<BuyNowOverlayProps> = ({
  product,
  position = 'bottom',
  onBuyNow,
  onDismiss,
  duration = 5000,
  autoHide = true,
  style = 'full',
}) => {
  const slideAnim = new Animated.Value(position === 'bottom' ? 100 : -100);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'bottom' ? 100 : -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss && onDismiss();
    });
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: 20 };
      case 'center':
        return { top: '50%', transform: [{ translateY: -50 }] };
      default:
        return { bottom: 20 };
    }
  };

  const renderMinimalStyle = () => (
    <Animated.View
      style={[
        styles.minimalContainer,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(67, 11, 146, 0.98)', 'rgba(139, 92, 246, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.minimalGradient}
      >
        <Image source={{ uri: product.image }} style={styles.minimalImage} />
        
        <View style={styles.minimalInfo}>
          <Text style={styles.minimalName} numberOfLines={1}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.minimalPrice}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.minimalButton}
          onPress={() => onBuyNow(product)}
        >
          <MaterialIcons name="shopping-cart" size={20} color="#fff" />
        </TouchableOpacity>

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );

  const renderCompactStyle = () => (
    <Animated.View
      style={[
        styles.compactContainer,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.compactContent}
        onPress={() => onBuyNow(product)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: product.image }} style={styles.compactImage} />
        
        <View style={styles.compactInfo}>
          <Text style={styles.compactBrand}>{product.brand || 'Featured'}</Text>
          <Text style={styles.compactName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.compactPrice}>${product.price}</Text>
        </View>

        <View style={styles.compactAction}>
          <Text style={styles.compactActionText}>Shop Now</Text>
          <MaterialIcons name="arrow-forward" size={16} color={DesignSystem.AccessibleColors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFullStyle = () => (
    <Animated.View
      style={[
        styles.fullContainer,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.fullGradient}
      >
        {/* Header */}
        <View style={styles.fullHeader}>
          <View style={styles.featuredBadge}>
            <MaterialIcons name="local-offer" size={14} color="#fff" />
            <Text style={styles.featuredText}>Featured Product</Text>
          </View>
          {onDismiss && (
            <TouchableOpacity onPress={handleDismiss}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Product Content */}
        <View style={styles.fullContent}>
          <Image source={{ uri: product.image }} style={styles.fullImage} />
          
          <View style={styles.fullInfo}>
            {product.brand && (
              <Text style={styles.brandName}>{product.brand}</Text>
            )}
            <Text style={styles.fullName}>{product.name}</Text>
            
            {product.description && (
              <Text style={styles.description} numberOfLines={2}>
                {product.description}
              </Text>
            )}

            <View style={styles.fullPriceRow}>
              <View>
                <Text style={styles.fullPrice}>${product.price}</Text>
                {product.originalPrice && (
                  <Text style={styles.fullOriginalPrice}>
                    ${product.originalPrice}
                  </Text>
                )}
              </View>
              
              {product.discount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{product.discount}%</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.fullButton}
              onPress={() => onBuyNow(product)}
            >
              <MaterialIcons name="shopping-cart" size={20} color="#fff" />
              <Text style={styles.fullButtonText}>Add to Cart</Text>
            </TouchableOpacity>

            {/* Trust badges */}
            <View style={styles.trustBadges}>
              <View style={styles.badge}>
                <MaterialIcons name="verified" size={12} color="#10B981" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
              <View style={styles.badge}>
                <MaterialIcons name="local-shipping" size={12} color="#10B981" />
                <Text style={styles.badgeText}>Free Shipping</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  switch (style) {
    case 'minimal':
      return renderMinimalStyle();
    case 'compact':
      return renderCompactStyle();
    default:
      return renderFullStyle();
  }
};

const styles = StyleSheet.create({
  // Minimal Style
  minimalContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  minimalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  minimalImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  minimalInfo: {
    flex: 1,
  },
  minimalName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimalPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  minimalButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Compact Style
  compactContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  compactImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactBrand: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactName: {
    ...DesignSystem.Typography.bodyMedium,
    fontWeight: '600',
    marginVertical: 2,
  },
  compactPrice: {
    ...DesignSystem.Typography.h3,
    color: DesignSystem.AccessibleColors.primary,
  },
  compactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactActionText: {
    ...DesignSystem.Typography.bodyMedium,
    color: DesignSystem.AccessibleColors.primary,
    fontWeight: '600',
  },

  // Full Style
  fullContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fullGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fullContent: {
    flexDirection: 'row',
    padding: 16,
  },
  fullImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  fullInfo: {
    flex: 1,
  },
  brandName: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fullName: {
    ...DesignSystem.Typography.h3,
    marginBottom: 6,
  },
  description: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginBottom: 12,
  },
  fullPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fullPrice: {
    ...DesignSystem.Typography.h2,
    color: DesignSystem.AccessibleColors.primary,
  },
  fullOriginalPrice: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fullButton: {
    ...DesignSystem.ButtonStyles.primary,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  fullButtonText: {
    ...DesignSystem.ButtonTextStyles.primary,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    ...DesignSystem.Typography.small,
    color: '#10B981',
  },
});

export default BuyNowOverlay;