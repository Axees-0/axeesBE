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
import { UniversalBackButton } from '@/components/UniversalBackButton';

interface CounterOfferDetails {
  id: string;
  originalOfferId: string;
  creator: {
    id: string;
    name: string;
    handle: string;
  };
  originalOffer: {
    amount: number;
    deliveryDays: number;
    offerType: string;
    deliverables: string[];
  };
  counterOffer: {
    amount: number;
    deliveryDays: number;
    adjustedDeliverables: string[];
    message: string;
    additionalRequirements?: string;
  };
  changes: {
    amountDiff: number;
    daysDiff: number;
    deliverablesChanged: boolean;
  };
  submittedDate: string;
}

const HandleCounterOfferPage: React.FC = () => {
  const { counterId } = useLocalSearchParams();
  const isWeb = Platform?.OS === 'web';
  const { user } = useAuth();
  
  // Demo counter offer data
  const [counterOffer] = useState<CounterOfferDetails>({
    id: counterId as string || 'counter-001',
    originalOfferId: 'offer-001',
    creator: {
      id: 'creator-001',
      name: 'Emma Thompson',
      handle: '@emmastyle',
    },
    originalOffer: {
      amount: 1500,
      deliveryDays: 5,
      offerType: 'Instagram Post Campaign',
      deliverables: [
        '1 Instagram feed post with 3-5 images',
        '2-3 Instagram stories',
        'Story highlight saved for 7 days',
        'Caption with brand messaging and hashtags',
        'Performance metrics after 48 hours'
      ]
    },
    counterOffer: {
      amount: 1800,
      deliveryDays: 7,
      adjustedDeliverables: [
        '1 Instagram feed post with 3-5 images',
        '2-3 Instagram stories',
        'Story highlight saved for 7 days',
        'Caption with brand messaging and hashtags',
        'Performance metrics after 48 hours',
        'Additional Instagram Reel (30-60 seconds)'
      ],
      message: "Thank you for considering me for this campaign! I'm excited about the opportunity to work with TechStyle Brand. Based on my experience and engagement rates (average 8.5% on similar campaigns), I believe this counter offer reflects the value I can provide. I've also included an additional Reel which typically drives 3x more engagement than static posts. Looking forward to creating amazing content together!",
      additionalRequirements: "I'd need the products shipped at least 3 days before the content creation deadline to ensure quality shots.",
    },
    changes: {
      amountDiff: 300,
      daysDiff: 2,
      deliverablesChanged: true,
    },
    submittedDate: '2024-06-18',
  });

  const handleAction = (action: 'accept' | 'reject' | 'negotiate') => {
    switch (action) {
      case 'accept':
        if (isWeb) {
          const confirmed = window.confirm(`Accept the counter offer from ${counterOffer.creator.name} for $${counterOffer.counterOffer.amount}?`);
          if (confirmed) {
            // Send notification and navigate
            notificationService.notifyCreator(counterOffer.creator.id, {
              type: 'deal',
              title: 'Counter Offer Accepted!',
              message: `${user?.name || user?.company || 'Marketer'} accepted your counter offer for ${counterOffer.originalOffer.offerType}`,
              actionType: 'view_deal',
              actionParams: { dealId: `DEAL-${Date.now()}` }
            }).catch(console.error);
            
            // Dispatch event to hide the banner
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('offerAccepted', {
                detail: { offerId: counterOffer.id }
              }));
            }
            
            window.alert('Counter Offer Accepted! Let\'s set up milestones for this deal.');
            router.replace({
              pathname: '/milestones/setup',
              params: { 
                dealId: `DEAL-${Date.now()}`,
                totalAmount: counterOffer.counterOffer.amount.toString(),
                offerTitle: counterOffer.originalOffer.offerType,
                creatorName: counterOffer.creator.name
              }
            });
          }
        } else {
          Alert.alert(
            'Accept Counter Offer',
            `Accept the counter offer from ${counterOffer.creator.name} for $${counterOffer.counterOffer.amount}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Accept', 
              onPress: async () => {
                // Send notification to creator (NOTIFY_C)
                await notificationService.notifyCreator(counterOffer.creator.id, {
                  type: 'deal',
                  title: 'Counter Offer Accepted!',
                  message: `${user?.name || user?.company || 'Marketer'} accepted your counter offer for ${counterOffer.originalOffer.offerType}`,
                  actionType: 'view_deal',
                  actionParams: { dealId: `DEAL-${Date.now()}` }
                });
                
                // Dispatch event to hide the banner
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('offerAccepted', {
                    detail: { offerId: counterOffer.id }
                  }));
                }
                
                Alert.alert(
                  'Counter Offer Accepted!',
                  'Great! Let\'s set up milestones for this deal.',
                  [
                    { 
                      text: 'Set Up Milestones', 
                      onPress: () => router.replace({
                        pathname: '/milestones/setup',
                        params: { 
                          dealId: `DEAL-${Date.now()}`,
                          totalAmount: counterOffer.counterOffer.amount.toString(),
                          offerTitle: counterOffer.originalOffer.offerType,
                          creatorName: counterOffer.creator.name
                        }
                      })
                    }
                  ]
                );
              }
            }
          ]
        );
        }
        break;
        
      case 'reject':
        if (isWeb) {
          const confirmed = window.confirm('Are you sure you want to reject this counter offer?');
          if (confirmed) {
            // Send notification
            notificationService.notifyCreator(counterOffer.creator.id, {
              type: 'offer',
              title: 'Counter Offer Declined',
              message: `${user?.name || user?.company || 'Marketer'} declined your counter offer for ${counterOffer.originalOffer.offerType}`,
              actionType: 'view_offer',
              actionParams: { offerId: counterOffer.originalOfferId }
            }).catch(console.error);
            
            window.alert('Counter Offer Rejected. The creator has been notified.');
            router.push('/deals');
          }
        } else {
          Alert.alert(
            'Reject Counter Offer',
            'Are you sure you want to reject this counter offer?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reject', 
              style: 'destructive',
              onPress: async () => {
                // Send notification to creator (NOTIFY_C)
                await notificationService.notifyCreator(counterOffer.creator.id, {
                  type: 'offer',
                  title: 'Counter Offer Declined',
                  message: `${user?.name || user?.company || 'Marketer'} declined your counter offer for ${counterOffer.originalOffer.offerType}`,
                  actionType: 'view_offer',
                  actionParams: { offerId: counterOffer.originalOfferId }
                });
                
                Alert.alert(
                  'Counter Offer Rejected',
                  'The creator has been notified.',
                  [
                    { text: 'OK', onPress: () => router.push('/deals') }
                  ]
                );
              }
            }
          ]
        );
        }
        break;
        
      case 'negotiate':
        if (isWeb) {
          const choice = window.confirm('Continue negotiation?\n\nClick OK to open chat, or Cancel to make a counter offer.');
          if (choice) {
            // Open chat
            notificationService.notifyCreator(counterOffer.creator.id, {
              type: 'message',
              title: 'Negotiation Continues',
              message: `${user?.name || user?.company || 'Marketer'} wants to discuss your counter offer`,
              actionType: 'open_chat',
              actionParams: { chatId: `chat-${counterOffer.originalOfferId}` }
            }).catch(console.error);
            
            router.push({
              pathname: '/chat/[id]',
              params: { id: `chat-${counterOffer.originalOfferId}` }
            });
          } else {
            // Make counter offer
            router.push({
              pathname: '/offers/counter',
              params: { 
                originalOfferId: counterOffer.originalOfferId,
                creatorId: counterOffer.creator.id,
                previousAmount: counterOffer.counterOffer.amount.toString()
              }
            });
          }
        } else {
          Alert.alert(
            'Continue Negotiation',
            'How would you like to proceed?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Chat', 
              onPress: async () => {
                // Send notification to creator about negotiation
                await notificationService.notifyCreator(counterOffer.creator.id, {
                  type: 'message',
                  title: 'Negotiation Continues',
                  message: `${user?.name || user?.company || 'Marketer'} wants to discuss your counter offer`,
                  actionType: 'open_chat',
                  actionParams: { chatId: `chat-${counterOffer.originalOfferId}` }
                });
                
                // Navigate to chat
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: `chat-${counterOffer.originalOfferId}` }
                });
              }
            },
            { 
              text: 'Make Counter Offer', 
              onPress: () => {
                // Navigate to counter offer creation
                router.push({
                  pathname: '/offers/counter',
                  params: { 
                    originalOfferId: counterOffer.originalOfferId,
                    creatorId: counterOffer.creator.id,
                    previousAmount: counterOffer.counterOffer.amount.toString()
                  }
                });
              }
            }
          ]
        );
        }
        break;
    }
  };

  const getChangeSummary = () => {
    const changes = [];
    if (counterOffer.changes.amountDiff > 0) {
      changes.push(`+$${counterOffer.changes.amountDiff} increase (${((counterOffer.changes.amountDiff / counterOffer.originalOffer.amount) * 100).toFixed(0)}%)`);
    }
    if (counterOffer.changes.daysDiff > 0) {
      changes.push(`+${counterOffer.changes.daysDiff} days extension`);
    }
    if (counterOffer.changes.deliverablesChanged) {
      changes.push('Modified deliverables');
    }
    return changes;
  };

  return (
    <>
      <WebSEO 
        title="Review Counter Offer | Axees"
        description="Review and respond to creator counter offers"
        keywords="counter offer, negotiation, marketer"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton 
            style={styles.backButton}
            fallbackRoute="/deals"
            iconSize={24}
          />
          
          <Text style={styles.headerTitle}>Counter Offer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Creator Info */}
          <View style={styles.creatorSection}>
            <Text style={styles.creatorName}>{counterOffer.creator.name}</Text>
            <Text style={styles.creatorHandle}>{counterOffer.creator.handle}</Text>
          </View>

          {/* Counter Offer Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Counter Offer Summary</Text>
            
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Amount</Text>
                <View style={styles.comparisonValues}>
                  <Text style={styles.originalValue}>${counterOffer.originalOffer.amount}</Text>
                  <Text style={styles.arrow}>→</Text>
                  <Text style={styles.counterValue}>${counterOffer.counterOffer.amount}</Text>
                  <Text style={styles.changeBadge}>+${counterOffer.changes.amountDiff}</Text>
                </View>
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Timeline</Text>
                <View style={styles.comparisonValues}>
                  <Text style={styles.originalValue}>{counterOffer.originalOffer.deliveryDays} days</Text>
                  <Text style={styles.arrow}>→</Text>
                  <Text style={styles.counterValue}>{counterOffer.counterOffer.deliveryDays} days</Text>
                  <Text style={styles.changeBadge}>+{counterOffer.changes.daysDiff}</Text>
                </View>
              </View>
            </View>

            {/* Change Summary */}
            <View style={styles.changesSummary}>
              <Text style={styles.changesTitle}>Key Changes:</Text>
              {getChangeSummary().map((change, index) => (
                <Text key={index} style={styles.changeItem}>• {change}</Text>
              ))}
            </View>
          </View>

          {/* Creator's Message */}
          <View style={styles.messageSection}>
            <Text style={styles.sectionTitle}>Creator's Message</Text>
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{counterOffer.counterOffer.message}</Text>
            </View>
          </View>

          {/* Additional Requirements */}
          {counterOffer.counterOffer.additionalRequirements && (
            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>Additional Requirements</Text>
              <View style={styles.requirementsCard}>
                <Text style={styles.requirementsText}>
                  {counterOffer.counterOffer.additionalRequirements}
                </Text>
              </View>
            </View>
          )}

          {/* Deliverables Comparison */}
          <View style={styles.deliverablesSection}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            
            {counterOffer.counterOffer.adjustedDeliverables.map((deliverable, index) => {
              const isNew = index >= counterOffer.originalOffer.deliverables.length;
              return (
                <View key={index} style={[styles.deliverableItem, isNew && styles.newDeliverable]}>
                  <Text style={styles.deliverableText}>
                    {isNew && '✨ '}{deliverable}
                  </Text>
                  {isNew && <Text style={styles.newBadge}>NEW</Text>}
                </View>
              );
            })}
          </View>

          {/* Value Proposition */}
          <View style={styles.valueSection}>
            <View style={styles.valueCard}>
              <Text style={styles.valueIcon}>💡</Text>
              <Text style={styles.valueTitle}>Consider the Value</Text>
              <Text style={styles.valueText}>
                The creator is offering additional deliverables and has demonstrated strong engagement rates. 
                The extra investment may yield better ROI through increased reach and engagement.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleAction('reject')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Reject counter offer from ${counterOffer.creator.name}`}
            accessibilityHint="Declines the counter offer and notifies the creator"
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.negotiateButton}
            onPress={() => handleAction('negotiate')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Continue negotiating with ${counterOffer.creator.name}`}
            accessibilityHint="Opens chat or allows making a counter offer"
          >
            <Text style={styles.negotiateButtonText}>Negotiate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAction('accept')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Accept counter offer for $${counterOffer.counterOffer.amount}`}
            accessibilityHint="Accepts the terms and starts setting up deal milestones"
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
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
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  creatorSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  creatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  creatorHandle: {
    fontSize: 16,
    color: '#666',
  },
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  comparisonCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalValue: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: 14,
    color: '#999',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  changeBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changesSummary: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  changesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  changeItem: {
    fontSize: 14,
    color: '#0369A1',
    marginBottom: 4,
  },
  messageSection: {
    padding: 20,
    paddingTop: 0,
  },
  messageCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  requirementsSection: {
    padding: 20,
    paddingTop: 0,
  },
  requirementsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  requirementsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  deliverablesSection: {
    padding: 20,
    paddingTop: 0,
  },
  deliverableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  newDeliverable: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  deliverableText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  newBadge: {
    backgroundColor: '#10B981',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  valueSection: {
    padding: 20,
  },
  valueCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  valueIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20,
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
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        ':focus': {
          borderColor: '#DC2626',
          borderWidth: 2,
          shadowColor: '#DC2626',
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }
      }
    }),
  },
  rejectButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  negotiateButton: {
    flex: 1,
    backgroundColor: '#ddd6fe',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a78bfa',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        ':focus': {
          borderColor: '#5b21b6',
          borderWidth: 2,
          shadowColor: '#5b21b6',
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }
      }
    }),
  },
  negotiateButtonText: {
    color: '#5b21b6',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        ':focus': {
          borderColor: '#FFFFFF',
          borderWidth: 2,
          shadowColor: Color.cSK430B92500,
          shadowOpacity: 0.4,
          shadowRadius: 4,
        }
      }
    }),
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HandleCounterOfferPage;