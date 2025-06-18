import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { DemoData } from '@/demo/DemoData';

// Icons
import ArrowLeft from '@/assets/arrowleft02.svg';

const PreviewPaymentPage: React.FC = () => {
  const { creatorId, offerId, offerType, config } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse configuration
  const offerConfig = useMemo(() => {
    try {
      return JSON.parse(config as string);
    } catch {
      return {};
    }
  }, [config]);

  // Find creator from demo data
  const creator = useMemo(() => {
    return DemoData.creators.find(c => c._id === creatorId);
  }, [creatorId]);

  // Demo offer data
  const offerTemplate = useMemo(() => {
    const offers: Record<string, any> = {
      'social-media-post': {
        id: 'social-media-post',
        title: 'Social Media Post',
        description: 'Single Instagram post with your product/service featuring professional photography',
        includes: ['1 Instagram post', 'Professional photos', 'Caption writing', 'Hashtag research'],
        category: 'Social Media',
      },
      'video-review': {
        id: 'video-review',
        title: 'Product Review Video',
        description: 'Detailed video review of your product with honest feedback and demonstration',
        includes: ['60-second video', 'Product demonstration', 'Honest review', 'Multiple takes'],
        category: 'Video Content',
      },
    };
    return offers[offerId as string] || offers['social-media-post'];
  }, [offerId]);

  const handleProceedToPayment = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Navigate to success page
      router.replace({
        pathname: '/offers/success',
        params: {
          creatorId,
          offerId,
          offerType,
          totalPrice: offerConfig.totalPrice
        }
      });
    }, 2000);
  };

  const handleEditOffer = () => {
    router.back();
  };

  const getTimelineText = (timeline: string) => {
    const options: Record<string, string> = {
      'rush': 'Rush Delivery (1-2 days)',
      'standard': 'Standard Delivery',
      'extended': 'Extended Timeline (14+ days)',
    };
    return options[timeline] || 'Standard Delivery';
  };

  return (
    <>
      <WebSEO 
        title="Review Your Offer | Axees"
        description="Review offer details before payment"
        keywords="offer review, payment preview, creator collaboration"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft width={24} height={24} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Review Offer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Creator Info */}
          <View style={styles.creatorSection}>
            <Text style={styles.sectionTitle}>Collaboration With</Text>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{creator?.name}</Text>
              <Text style={styles.creatorHandle}>{creator?.userName}</Text>
              <Text style={styles.creatorStats}>
                {creator?.creatorData?.totalFollowers?.toLocaleString()} followers
              </Text>
            </View>
          </View>

          {/* Offer Details */}
          <View style={styles.offerSection}>
            <Text style={styles.sectionTitle}>Offer Details</Text>
            
            <View style={styles.offerCard}>
              <Text style={styles.offerTitle}>{offerTemplate.title}</Text>
              <Text style={styles.offerDescription}>{offerTemplate.description}</Text>
              
              <View style={styles.includesContainer}>
                <Text style={styles.includesTitle}>Includes:</Text>
                {offerTemplate.includes.map((item: string, index: number) => (
                  <Text key={index} style={styles.includeItem}>• {item}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* Campaign Configuration */}
          <View style={styles.configSection}>
            <Text style={styles.sectionTitle}>Campaign Configuration</Text>
            
            <View style={styles.configCard}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Campaign Goal</Text>
                <Text style={styles.configValue}>{offerConfig.campaignGoal}</Text>
              </View>
              
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Target Audience</Text>
                <Text style={styles.configValue}>{offerConfig.targetAudience}</Text>
              </View>
              
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Key Message</Text>
                <Text style={styles.configValue}>{offerConfig.brandMessage}</Text>
              </View>
              
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Timeline</Text>
                <Text style={styles.configValue}>{getTimelineText(offerConfig.timeline)}</Text>
              </View>
              
              {offerConfig.additionalRequests && (
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Additional Requests</Text>
                  <Text style={styles.configValue}>{offerConfig.additionalRequests}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            
            <View style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Subtotal</Text>
                <Text style={styles.paymentValue}>${offerConfig.totalPrice?.toLocaleString()}</Text>
              </View>
              
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Platform Fee (5%)</Text>
                <Text style={styles.paymentValue}>${Math.round(offerConfig.totalPrice * 0.05).toLocaleString()}</Text>
              </View>
              
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Processing Fee</Text>
                <Text style={styles.paymentValue}>$5</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  ${(offerConfig.totalPrice + Math.round(offerConfig.totalPrice * 0.05) + 5).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.paymentNote}>
                <Text style={styles.paymentNoteText}>
                  Payment will be held in escrow until deliverables are approved
                </Text>
              </View>
            </View>
          </View>

          {/* Terms Preview */}
          <View style={styles.termsSection}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            
            <View style={styles.termsCard}>
              <Text style={styles.termsText}>
                • Payment will be held in escrow until deliverables are completed and approved
              </Text>
              <Text style={styles.termsText}>
                • Creator has up to {getTimelineText(offerConfig.timeline).toLowerCase()} to deliver
              </Text>
              <Text style={styles.termsText}>
                • You can request revisions within 7 days of delivery
              </Text>
              <Text style={styles.termsText}>
                • Refunds available if deliverables don't meet agreed specifications
              </Text>
              <Text style={styles.termsText}>
                • Both parties agree to Axees' Terms of Service and Creator Agreement
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditOffer}
          >
            <Text style={styles.editButtonText}>Edit Offer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.payButton, isProcessing && styles.processingButton]}
            onPress={handleProceedToPayment}
            disabled={isProcessing}
          >
            <Text style={styles.payButtonText}>
              {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </Text>
          </TouchableOpacity>
        </View>
        
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
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 12,
  },
  creatorSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  creatorInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  creatorHandle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  creatorStats: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '500',
  },
  offerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  offerCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  includesContainer: {
    marginTop: 8,
  },
  includesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 6,
  },
  includeItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  configSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  configItem: {
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  configValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  paymentSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  paymentNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  paymentNoteText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center',
  },
  termsSection: {
    padding: 20,
  },
  termsCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  bottomSection: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    flex: 2,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  processingButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PreviewPaymentPage;