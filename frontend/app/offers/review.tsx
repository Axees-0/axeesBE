import React, { useState } from 'react';
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
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface OfferDetails {
  id: string;
  marketer: {
    name: string;
    company: string;
    avatar?: string;
    rating: number;
    completedDeals: number;
  };
  offerType: string;
  platform: string;
  amount: number;
  deliveryDays: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'negotiating';
  submittedDate: string;
  description: string;
  requirements: string[];
  deliverables: string[];
  additionalNotes?: string;
  campaignGoals: string[];
  targetAudience: string;
  contentGuidelines: string[];
  usageRights: string;
  paymentTerms: string;
}

const OfferReviewPage: React.FC = () => {
  const { offerId } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  // Demo offer data
  const [offer] = useState<OfferDetails>({
    id: offerId as string,
    marketer: {
      name: 'Sarah Martinez',
      company: 'TechStyle Brand',
      rating: 4.8,
      completedDeals: 127,
    },
    offerType: 'Instagram Post Campaign',
    platform: 'Instagram',
    amount: 1500,
    deliveryDays: 5,
    status: 'pending',
    submittedDate: '2024-06-18',
    description: 'We\'re looking for an authentic creator to showcase our summer collection through engaging Instagram content. This campaign focuses on lifestyle photography that resonates with our target demographic.',
    requirements: [
      'High-quality photos with professional lighting',
      'Include brand hashtags and mentions',
      'Story highlights for 24 hours',
      'Engage with comments for first 4 hours',
      'Post during peak engagement hours (6-8 PM EST)'
    ],
    deliverables: [
      '1 Instagram feed post with 3-5 images',
      '2-3 Instagram stories',
      'Story highlight saved for 7 days',
      'Caption with brand messaging and hashtags',
      'Performance metrics after 48 hours'
    ],
    campaignGoals: [
      'Increase brand awareness among Gen Z audience',
      'Drive traffic to summer collection landing page',
      'Generate authentic user-generated content',
      'Boost social media engagement'
    ],
    targetAudience: 'Fashion-forward millennials and Gen Z (18-28), primarily female, interested in sustainable fashion and lifestyle content',
    contentGuidelines: [
      'Natural, authentic styling - avoid overly posed shots',
      'Include lifestyle elements (coffee, plants, natural lighting)',
      'Brand products should feel integrated, not forced',
      'Use brand voice: friendly, approachable, sustainable'
    ],
    usageRights: 'TechStyle Brand reserves rights to repost content on official channels for 6 months',
    paymentTerms: '50% upfront upon acceptance, 50% upon completion and approval',
    additionalNotes: 'We love your aesthetic and think you\'d be perfect for this campaign! Open to creative input and collaboration.'
  });

  const handleOfferAction = (action: string) => {
    switch (action) {
      case 'accept':
        Alert.alert(
          'Accept Offer',
          `Accept this ${offer.offerType} offer from ${offer.marketer.company} for $${offer.amount}?\n\nThis will create an active deal and you'll need to complete the deliverables within ${offer.deliveryDays} days.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Accept Offer', 
              onPress: async () => {
                // Auto-create chat room with marketer
                const newChatId = `chat-${Date.now()}`;
                const newDealId = `DEAL-${Date.now()}`;
                
                // Send notification to marketer (NOTIFY_M)
                await notificationService.notifyMarketer('sarah-001', {
                  type: 'deal',
                  title: 'Offer Accepted!',
                  message: `${user?.name || 'Creator'} accepted your offer for ${offer.offerType}`,
                  actionType: 'view_deal',
                  actionParams: { dealId: newDealId }
                });
                
                Alert.alert(
                  'Offer Accepted!',
                  'Now let\'s set up milestones for this deal to ensure smooth delivery and payment.',
                  [
                    { 
                      text: 'Setup Milestones', 
                      onPress: () => router.replace({
                        pathname: '/milestones/setup',
                        params: { 
                          dealId: newDealId,
                          totalAmount: offer.amount.toString(),
                          offerTitle: offer.offerType
                        }
                      })
                    },
                    {
                      text: 'Skip Setup',
                      style: 'cancel',
                      onPress: () => router.replace({
                        pathname: '/deals/[id]',
                        params: { id: newDealId }
                      })
                    }
                  ]
                );
              }
            }
          ]
        );
        break;
      case 'reject':
        Alert.alert(
          'Decline Offer',
          `Are you sure you want to decline this offer from ${offer.marketer.company}?\n\nThis action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Decline', 
              style: 'destructive',
              onPress: async () => {
                // Send notification to marketer (NOTIFY_M)
                await notificationService.notifyMarketer('sarah-001', {
                  type: 'offer',
                  title: 'Offer Declined',
                  message: `${user?.name || 'Creator'} declined your offer for ${offer.offerType}`,
                  actionType: 'view_offer',
                  actionParams: { offerId: offer.id }
                });
                
                Alert.alert(
                  'Offer Declined',
                  'The marketer has been notified of your decision.',
                  [
                    { 
                      text: 'Back to Deals', 
                      onPress: () => router.replace('/(tabs)/deals')
                    }
                  ]
                );
              }
            }
          ]
        );
        break;
      case 'counter':
        router.push({
          pathname: '/offers/counter',
          params: { offerId: offer.id }
        });
        break;
      case 'message':
        Alert.alert('Start Conversation', 'This would open a chat with the marketer to discuss the offer details.');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <>
      <WebSEO 
        title={`Review Offer: ${offer.offerType} | Axees`}
        description="Review and respond to brand collaboration offers"
        keywords="offer review, brand collaboration, creator opportunities"
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
          
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => handleOfferAction('message')}
          >
            <Text style={styles.messageButtonText}>💬</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Offer Overview */}
          <View style={styles.overviewSection}>
            <View style={styles.offerHeader}>
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle}>{offer.offerType}</Text>
                <Text style={styles.platformTag}>{offer.platform}</Text>
              </View>
              <View style={styles.amountSection}>
                <Text style={styles.amount}>${offer.amount.toLocaleString()}</Text>
                <Text style={styles.timeline}>{offer.deliveryDays} days</Text>
              </View>
            </View>

            <View style={styles.marketerInfo}>
              <View style={styles.marketerDetails}>
                <Text style={styles.marketerName}>{offer.marketer.name}</Text>
                <Text style={styles.companyName}>{offer.marketer.company}</Text>
                <View style={styles.marketerStats}>
                  <Text style={styles.rating}>⭐ {offer.marketer.rating}</Text>
                  <Text style={styles.deals}>• {offer.marketer.completedDeals} deals</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campaign Description</Text>
            <Text style={styles.description}>{offer.description}</Text>
          </View>

          {/* Campaign Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campaign Goals</Text>
            <View style={styles.listContainer}>
              {offer.campaignGoals.map((goal, index) => (
                <Text key={index} style={styles.listItem}>🎯 {goal}</Text>
              ))}
            </View>
          </View>

          {/* Target Audience */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Audience</Text>
            <Text style={styles.description}>{offer.targetAudience}</Text>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <View style={styles.listContainer}>
              {offer.requirements.map((req, index) => (
                <Text key={index} style={styles.listItem}>✅ {req}</Text>
              ))}
            </View>
          </View>

          {/* Deliverables */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            <View style={styles.listContainer}>
              {offer.deliverables.map((deliverable, index) => (
                <Text key={index} style={styles.listItem}>📦 {deliverable}</Text>
              ))}
            </View>
          </View>

          {/* Content Guidelines */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Guidelines</Text>
            <View style={styles.listContainer}>
              {offer.contentGuidelines.map((guideline, index) => (
                <Text key={index} style={styles.listItem}>🎨 {guideline}</Text>
              ))}
            </View>
          </View>

          {/* Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            
            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Payment Terms:</Text>
              <Text style={styles.termValue}>{offer.paymentTerms}</Text>
            </View>
            
            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Usage Rights:</Text>
              <Text style={styles.termValue}>{offer.usageRights}</Text>
            </View>
          </View>

          {/* Additional Notes */}
          {offer.additionalNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <View style={styles.notesContainer}>
                <Text style={styles.notes}>{offer.additionalNotes}</Text>
              </View>
            </View>
          )}

          {/* Offer Metadata */}
          <View style={styles.metadataSection}>
            <Text style={styles.metadataText}>
              Offer #{offer.id} • Received {new Date(offer.submittedDate).toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleOfferAction('reject')}
          >
            <Text style={styles.rejectButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.counterButton}
            onPress={() => handleOfferAction('counter')}
          >
            <Text style={styles.counterButtonText}>Counter Offer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleOfferAction('accept')}
          >
            <Text style={styles.acceptButtonText}>Accept Offer</Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={1} />}
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
  },
  messageButton: {
    padding: 8,
  },
  messageButtonText: {
    fontSize: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  overviewSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 6,
  },
  platformTag: {
    backgroundColor: Color.cSK430B92500,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 2,
  },
  timeline: {
    fontSize: 14,
    color: '#666',
  },
  marketerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketerDetails: {
    flex: 1,
  },
  marketerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  marketerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#333',
  },
  deals: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  termItem: {
    marginBottom: 12,
  },
  termLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  termValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  notesContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  notes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  metadataSection: {
    padding: 20,
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
  },
  actionSection: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  counterButton: {
    flex: 1,
    backgroundColor: '#F3E8FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  counterButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OfferReviewPage;