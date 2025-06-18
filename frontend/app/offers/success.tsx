import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { DemoData } from '@/demo/DemoData';

const SuccessPage: React.FC = () => {
  const { creatorId, offerId, offerType, totalPrice } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  // Find creator from demo data
  const creator = useMemo(() => {
    return DemoData.creators.find(c => c._id === creatorId);
  }, [creatorId]);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleViewOffers = () => {
    router.replace('/deals');
  };

  const handleBackToExplore = () => {
    router.push('/');
  };

  const generateOfferNumber = () => {
    // Generate a demo offer number
    return `OFF-${Date.now().toString().slice(-6)}`;
  };

  return (
    <>
      <WebSEO 
        title="Offer Sent Successfully | Axees"
        description="Your offer has been sent to the creator"
        keywords="offer sent, collaboration started, creator partnership"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Success Icon */}
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>

          {/* Success Message */}
          <Text style={styles.successTitle}>Offer Sent Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your collaboration offer has been sent to {creator?.name}
          </Text>

          {/* Offer Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Offer Number</Text>
              <Text style={styles.detailValue}>{generateOfferNumber()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Creator</Text>
              <Text style={styles.detailValue}>{creator?.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.detailValuePrice}>${totalPrice}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending Response</Text>
              </View>
            </View>
          </View>

          {/* What's Next */}
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>What happens next?</Text>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                {creator?.name} will review your offer and respond within 48 hours
              </Text>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                You'll receive a notification when they accept, counter, or decline
              </Text>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Once accepted, work begins and you can track progress in your deals
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleViewOffers}
            >
              <Text style={styles.primaryButtonText}>View My Offers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleBackToExplore}
            >
              <Text style={styles.secondaryButtonText}>Explore More Creators</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Pro Tip</Text>
            <Text style={styles.infoText}>
              Creators are more likely to accept offers with clear campaign goals and creative freedom. 
              Your detailed brief helps them deliver exactly what you need!
            </Text>
          </View>
        </Animated.View>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={0} />}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  detailValuePrice: {
    fontSize: 16,
    color: Color.cSK430B92500,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  nextStepsCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Color.cSK430B92500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SuccessPage;