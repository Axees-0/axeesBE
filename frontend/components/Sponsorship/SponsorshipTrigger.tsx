import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';
import { BuyNowOverlay } from '../Channel/BuyNowOverlay';

interface SponsorshipRule {
  id: string;
  creatorId?: string;
  brandId?: string;
  keywords?: string[];
  mentionCount?: number;
  viewDuration?: number; // in seconds
  scrollDepth?: number; // percentage
  productIds?: string[];
  triggerType: 'keyword' | 'mention' | 'duration' | 'scroll' | 'engagement';
  priority: 'high' | 'medium' | 'low';
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  brand?: string;
  description?: string;
}

interface SponsorshipTriggerProps {
  rules: SponsorshipRule[];
  content: string;
  currentTime?: number; // For video content
  scrollPosition?: number; // For scrollable content
  onProductShow: (product: Product) => void;
  onEngagement?: (ruleId: string, engagement: string) => void;
}

export const SponsorshipTrigger: React.FC<SponsorshipTriggerProps> = ({
  rules,
  content,
  currentTime = 0,
  scrollPosition = 0,
  onProductShow,
  onEngagement,
}) => {
  const [triggeredRules, setTriggeredRules] = useState<Set<string>>(new Set());
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const viewTimer = useRef<NodeJS.Timeout | null>(null);
  const notificationAnim = new Animated.Value(0);

  // Mock product database
  const products: Record<string, Product> = {
    'prod-nike-001': {
      id: 'prod-nike-001',
      name: 'Nike Air Max 2024',
      price: 179.99,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      brand: 'Nike',
      description: 'Latest Air Max technology for ultimate comfort',
    },
    'prod-fashion-001': {
      id: 'prod-fashion-001',
      name: 'Summer Collection Dress',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      brand: 'Fashion Nova',
      description: 'Perfect for summer occasions',
    },
  };

  // Check keyword triggers
  useEffect(() => {
    rules.forEach(rule => {
      if (rule.triggerType === 'keyword' && rule.keywords && !triggeredRules.has(rule.id)) {
        const contentLower = content.toLowerCase();
        const keywordMatch = rule.keywords.some(keyword => 
          contentLower.includes(keyword.toLowerCase())
        );

        if (keywordMatch) {
          triggerSponsorship(rule);
        }
      }
    });
  }, [content]);

  // Check duration triggers for video
  useEffect(() => {
    rules.forEach(rule => {
      if (rule.triggerType === 'duration' && rule.viewDuration && !triggeredRules.has(rule.id)) {
        if (currentTime >= rule.viewDuration) {
          triggerSponsorship(rule);
        }
      }
    });
  }, [currentTime]);

  // Check scroll depth triggers
  useEffect(() => {
    rules.forEach(rule => {
      if (rule.triggerType === 'scroll' && rule.scrollDepth && !triggeredRules.has(rule.id)) {
        if (scrollPosition >= rule.scrollDepth) {
          triggerSponsorship(rule);
        }
      }
    });
  }, [scrollPosition]);

  const triggerSponsorship = (rule: SponsorshipRule) => {
    setTriggeredRules(prev => new Set([...prev, rule.id]));
    
    // Get product to show
    const productId = rule.productIds?.[0] || 'prod-nike-001';
    const product = products[productId];
    
    if (product) {
      showSponsoredProduct(product, rule.priority);
      onEngagement?.(rule.id, 'triggered');
    }

    // Show notification
    showTriggerNotification();
  };

  const showSponsoredProduct = (product: Product, priority: string) => {
    // Higher priority products override current ones
    if (!activeProduct || priority === 'high') {
      setActiveProduct(product);
      
      // Auto-hide after duration based on priority
      const duration = priority === 'high' ? 8000 : priority === 'medium' ? 6000 : 4000;
      
      if (viewTimer.current) {
        clearTimeout(viewTimer.current);
      }
      
      viewTimer.current = setTimeout(() => {
        setActiveProduct(null);
      }, duration);
    }
  };

  const showTriggerNotification = () => {
    setShowNotification(true);
    
    Animated.sequence([
      Animated.timing(notificationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNotification(false);
    });
  };

  const handleProductBuy = (product: Product) => {
    onProductShow(product);
    setActiveProduct(null);
    onEngagement?.(Array.from(triggeredRules)[0], 'purchased');
  };

  const handleProductDismiss = () => {
    setActiveProduct(null);
    onEngagement?.(Array.from(triggeredRules)[0], 'dismissed');
  };

  // Mention counter component
  const MentionCounter = ({ mentions }: { mentions: number }) => (
    <View style={styles.mentionCounter}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.mentionGradient}
      >
        <MaterialIcons name="campaign" size={16} color="#fff" />
        <Text style={styles.mentionText}>{mentions} mentions detected</Text>
      </LinearGradient>
    </View>
  );

  // Engagement prompt component
  const EngagementPrompt = () => (
    <TouchableOpacity
      style={styles.engagementPrompt}
      onPress={() => {
        onEngagement?.(Array.from(triggeredRules)[0], 'engaged');
      }}
    >
      <LinearGradient
        colors={['#F59E0B', '#EF4444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.engagementGradient}
      >
        <FontAwesome5 name="hand-sparkles" size={20} color="#fff" />
        <Text style={styles.engagementText}>Tap for exclusive offer!</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Sponsored Product Overlay */}
      {activeProduct && (
        <BuyNowOverlay
          product={activeProduct}
          position="bottom"
          onBuyNow={handleProductBuy}
          onDismiss={handleProductDismiss}
          style="compact"
          autoHide={false}
        />
      )}

      {/* Trigger Notification */}
      {showNotification && (
        <Animated.View
          style={[
            styles.notification,
            {
              opacity: notificationAnim,
              transform: [{
                translateY: notificationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.notificationContent}>
            <MaterialIcons name="auto-awesome" size={16} color="#8B5CF6" />
            <Text style={styles.notificationText}>
              Sponsored content matched!
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Mention Counter (if applicable) */}
      {rules.some(r => r.triggerType === 'mention' && r.mentionCount) && (
        <MentionCounter 
          mentions={rules.find(r => r.triggerType === 'mention')?.mentionCount || 0} 
        />
      )}

      {/* Engagement Prompt (for high-priority rules) */}
      {triggeredRules.size > 0 && 
       rules.some(r => triggeredRules.has(r.id) && r.priority === 'high') && (
        <EngagementPrompt />
      )}
    </>
  );
};

// Analytics hook for tracking sponsorship performance
export const useSponsorshipAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    impressions: 0,
    engagements: 0,
    conversions: 0,
    revenue: 0,
  });

  const trackImpression = (ruleId: string) => {
    setAnalytics(prev => ({
      ...prev,
      impressions: prev.impressions + 1,
    }));
  };

  const trackEngagement = (ruleId: string, type: string) => {
    setAnalytics(prev => ({
      ...prev,
      engagements: prev.engagements + 1,
    }));
  };

  const trackConversion = (ruleId: string, amount: number) => {
    setAnalytics(prev => ({
      ...prev,
      conversions: prev.conversions + 1,
      revenue: prev.revenue + amount,
    }));
  };

  return {
    analytics,
    trackImpression,
    trackEngagement,
    trackConversion,
  };
};

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  notificationText: {
    ...DesignSystem.Typography.caption,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  mentionCounter: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 999,
  },
  mentionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  mentionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  engagementPrompt: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 999,
  },
  engagementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  engagementText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});

export default SponsorshipTrigger;