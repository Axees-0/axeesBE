import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { BrandColors } from '@/constants/Colors';
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
  const { counterId, dealId } = useLocalSearchParams();
  const isWeb = Platform?.OS === 'web';
  const { user } = useAuth();
  
  const [counterOffer, setCounterOffer] = useState<CounterOfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCounterOfferDetails();
  }, [counterId, dealId]);

  const fetchCounterOfferDetails = async () => {
    try {
      setLoading(true);
      
      // First try to get counter offer by ID if available
      if (counterId) {
        const response = await fetch(`/api/negotiation/counter-offers/${counterId}`, {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setCounterOffer(formatCounterOfferData(result.data));
          return;
        }
      }
      
      // Fallback: Get latest counter offer for deal
      if (dealId) {
        const response = await fetch(`/api/negotiation/deals/${dealId}/latest-counter-offer`, {
          headers: { 'Authorization': `Bearer ${user?.token || ''}` }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setCounterOffer(formatCounterOfferData(result.data));
        } else {
          Alert.alert('Error', 'Counter offer not found');
          router.back();
        }
      }
      
    } catch (error) {
      console.error('Error fetching counter offer:', error);
      Alert.alert('Error', 'Failed to load counter offer details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCounterOfferData = (apiData: any): CounterOfferDetails => {
    const originalOffer = apiData.originalOffer || {};
    const counterOfferData = apiData.counterOffer || apiData;
    
    return {
      id: apiData.id || counterId as string,
      originalOfferId: apiData.originalOfferId || apiData.dealId,
      creator: {
        id: apiData.creator?.id || apiData.userId,
        name: apiData.creator?.name || 'Creator',
        handle: apiData.creator?.handle || `@${apiData.creator?.username || 'creator'}`,
      },
      originalOffer: {
        amount: originalOffer.amount || apiData.originalAmount || 1500,
        deliveryDays: originalOffer.deliveryDays || 5,
        offerType: originalOffer.offerType || apiData.dealTitle || 'Campaign',
        deliverables: originalOffer.deliverables || ['Original deliverables']
      },
      counterOffer: {
        amount: counterOfferData.amount || apiData.offerAmount || 1800,
        deliveryDays: counterOfferData.deliveryDays || apiData.terms?.deliveryDays || 7,
        adjustedDeliverables: counterOfferData.adjustedDeliverables || counterOfferData.deliverables || ['Updated deliverables'],
        message: counterOfferData.message || apiData.message || 'Counter offer message',
        additionalRequirements: counterOfferData.additionalRequirements || apiData.terms?.additionalRequirements,
      },
      changes: {
        amountDiff: (counterOfferData.amount || apiData.offerAmount || 1800) - (originalOffer.amount || apiData.originalAmount || 1500),
        daysDiff: (counterOfferData.deliveryDays || apiData.terms?.deliveryDays || 7) - (originalOffer.deliveryDays || 5),
        deliverablesChanged: true,
      },
      submittedDate: apiData.createdAt ? new Date(apiData.createdAt).toISOString().split('T')[0] : '2024-06-18',
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCounterOfferDetails();
  };

  const handleAction = async (action: 'accept' | 'reject' | 'negotiate') => {
    if (!counterOffer) return;
    
    switch (action) {
      case 'accept':
        const confirmMessage = `Accept the counter offer from ${counterOffer.creator.name} for $${counterOffer.counterOffer.amount}?`;
        
        if (isWeb) {
          const confirmed = window.confirm(confirmMessage);
          if (!confirmed) return;
        } else {
          const confirmed = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Accept Counter Offer',
              confirmMessage,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Accept', onPress: () => resolve(true) }
              ]
            );
          });
          if (!confirmed) return;
        }

        setActionLoading('accept');
        try {
          // Accept the counter offer via API
          const response = await fetch(`/api/negotiation/counter-offers/${counterOffer.id}/accept`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.token || ''}`,
            },
          });

          const result = await response.json();

          if (result.success) {
            // Send notification to creator
            try {
              await notificationService.notifyCreator(counterOffer.creator.id, {
                type: 'deal',
                title: 'Counter Offer Accepted!',
                message: `${user?.name || user?.company || 'Marketer'} accepted your counter offer for ${counterOffer.originalOffer.offerType}`,
                actionType: 'view_deal',
                actionParams: { dealId: result.data.dealId }
              });
            } catch (notifError) {
              console.log('Notification error (non-critical):', notifError);
            }
            
            // Dispatch event to hide the banner
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('offerAccepted', {
                detail: { offerId: counterOffer.id }
              }));
            }
            
            const successMessage = 'Counter Offer Accepted! Let\'s set up milestones for this deal.';
            
            if (isWeb) {
              const setupMilestones = window.confirm(successMessage + '\n\nSet up milestones now?');
              if (setupMilestones) {
                router.replace({
                  pathname: '/milestones/setup',
                  params: { 
                    dealId: result.data.dealId,
                    totalAmount: counterOffer.counterOffer.amount.toString(),
                    offerTitle: counterOffer.originalOffer.offerType,
                    creatorName: counterOffer.creator.name
                  }
                });
              } else {
                router.push('/deals');
              }
            } else {
              Alert.alert(
                'Counter Offer Accepted!',
                'Great! Let\'s set up milestones for this deal.',
                [
                  { 
                    text: 'Set Up Milestones', 
                    onPress: () => router.replace({
                      pathname: '/milestones/setup',
                      params: { 
                        dealId: result.data.dealId,
                        totalAmount: counterOffer.counterOffer.amount.toString(),
                        offerTitle: counterOffer.originalOffer.offerType,
                        creatorName: counterOffer.creator.name
                      }
                    })
                  },
                  { 
                    text: 'View Deals', 
                    onPress: () => router.push('/deals')
                  }
                ]
              );
            }
          } else {
            Alert.alert('Error', result.message || 'Failed to accept counter offer. Please try again.');
          }
        } catch (error) {
          console.error('Error accepting counter offer:', error);
          Alert.alert('Error', 'Failed to accept counter offer. Please try again.');
        } finally {
          setActionLoading(null);
        }
        break;
        
      case 'reject':
        const rejectMessage = 'Are you sure you want to reject this counter offer?';
        
        if (isWeb) {
          const confirmed = window.confirm(rejectMessage);
          if (!confirmed) return;
        } else {
          const confirmed = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Reject Counter Offer',
              rejectMessage,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Reject', style: 'destructive', onPress: () => resolve(true) }
              ]
            );
          });
          if (!confirmed) return;
        }

        setActionLoading('reject');
        try {
          // Reject the counter offer via API
          const response = await fetch(`/api/negotiation/counter-offers/${counterOffer.id}/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.token || ''}`,
            },
          });

          const result = await response.json();

          if (result.success) {
            // Send notification to creator
            try {
              await notificationService.notifyCreator(counterOffer.creator.id, {
                type: 'offer',
                title: 'Counter Offer Declined',
                message: `${user?.name || user?.company || 'Marketer'} declined your counter offer for ${counterOffer.originalOffer.offerType}`,
                actionType: 'view_offer',
                actionParams: { offerId: counterOffer.originalOfferId }
              });
            } catch (notifError) {
              console.log('Notification error (non-critical):', notifError);
            }
            
            if (isWeb) {
              window.alert('Counter Offer Rejected. The creator has been notified.');
              router.push('/deals');
            } else {
              Alert.alert(
                'Counter Offer Rejected',
                'The creator has been notified.',
                [
                  { text: 'OK', onPress: () => router.push('/deals') }
                ]
              );
            }
          } else {
            Alert.alert('Error', result.message || 'Failed to reject counter offer. Please try again.');
          }
        } catch (error) {
          console.error('Error rejecting counter offer:', error);
          Alert.alert('Error', 'Failed to reject counter offer. Please try again.');
        } finally {
          setActionLoading(null);
        }
        break;
        
      case 'negotiate':
        if (isWeb) {
          const choice = window.confirm('Continue negotiation?\n\nClick OK to open chat, or Cancel to make a counter offer.');
          if (choice) {
            // Open chat
            try {
              await notificationService.notifyCreator(counterOffer.creator.id, {
                type: 'message',
                title: 'Negotiation Continues',
                message: `${user?.name || user?.company || 'Marketer'} wants to discuss your counter offer`,
                actionType: 'open_chat',
                actionParams: { chatId: `chat-${counterOffer.originalOfferId}` }
              });
            } catch (notifError) {
              console.log('Notification error (non-critical):', notifError);
            }
            
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
                try {
                  await notificationService.notifyCreator(counterOffer.creator.id, {
                    type: 'message',
                    title: 'Negotiation Continues',
                    message: `${user?.name || user?.company || 'Marketer'} wants to discuss your counter offer`,
                    actionType: 'open_chat',
                    actionParams: { chatId: `chat-${counterOffer.originalOfferId}` }
                  });
                } catch (notifError) {
                  console.log('Notification error (non-critical):', notifError);
                }
                
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
    if (!counterOffer) return [];
    
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

  // Loading state
  if (loading && !counterOffer) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton 
            style={styles.backButton}
            fallbackRoute="/deals"
            iconSize={24}
          />
          <Text style={styles.headerTitle}>Counter Offer</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.cSK430B92500} />
          <Text style={styles.loadingText}>Loading counter offer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!counterOffer) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton 
            style={styles.backButton}
            fallbackRoute="/deals"
            iconSize={24}
          />
          <Text style={styles.headerTitle}>Counter Offer</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Counter offer not found</Text>
          <Text style={styles.emptyStateSubtext}>Please check your notifications or deals list</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Color.cSK430B92500]}
            />
          }
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
            style={[styles.rejectButton, actionLoading ? styles.disabledButton : null]}
            onPress={() => handleAction('reject')}
            disabled={!!actionLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Reject counter offer from ${counterOffer.creator.name}`}
            accessibilityHint="Declines the counter offer and notifies the creator"
          >
            {actionLoading === 'reject' ? (
              <ActivityIndicator size="small" color={BrandColors.semantic.errorDark} />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.negotiateButton, actionLoading ? styles.disabledButton : null]}
            onPress={() => handleAction('negotiate')}
            disabled={!!actionLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Continue negotiating with ${counterOffer.creator.name}`}
            accessibilityHint="Opens chat or allows making a counter offer"
          >
            <Text style={styles.negotiateButtonText}>Negotiate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.acceptButton, actionLoading ? styles.disabledButton : null]}
            onPress={() => handleAction('accept')}
            disabled={!!actionLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Accept counter offer for $${counterOffer.counterOffer.amount}`}
            accessibilityHint="Accepts the terms and starts setting up deal milestones"
          >
            {actionLoading === 'accept' ? (
              <ActivityIndicator size="small" color={BrandColors.neutral[0]} />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
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
    backgroundColor: BrandColors.neutral[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
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
    borderBottomColor: BrandColors.neutral[100],
  },
  creatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  creatorHandle: {
    fontSize: 16,
    color: BrandColors.neutral[500],
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
    backgroundColor: BrandColors.neutral[50],
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
    color: BrandColors.neutral[500],
    fontWeight: '500',
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalValue: {
    fontSize: 14,
    color: BrandColors.neutral[400],
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: 14,
    color: BrandColors.neutral[400],
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  changeBadge: {
    backgroundColor: BrandColors.semantic.warningLight,
    color: BrandColors.semantic.warningDark,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changesSummary: {
    backgroundColor: BrandColors.semantic.infoLight,
    borderRadius: 8,
    padding: 12,
  },
  changesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.semantic.infoDark,
    marginBottom: 8,
  },
  changeItem: {
    fontSize: 14,
    color: BrandColors.semantic.infoDark,
    marginBottom: 4,
  },
  messageSection: {
    padding: 20,
    paddingTop: 0,
  },
  messageCard: {
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
    padding: 16,
  },
  messageText: {
    fontSize: 14,
    color: BrandColors.neutral[800],
    lineHeight: 22,
  },
  requirementsSection: {
    padding: 20,
    paddingTop: 0,
  },
  requirementsCard: {
    backgroundColor: BrandColors.semantic.warningLight,
    borderRadius: 8,
    padding: 12,
  },
  requirementsText: {
    fontSize: 14,
    color: BrandColors.semantic.warningDark,
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
    borderBottomColor: BrandColors.neutral[100],
  },
  newDeliverable: {
    backgroundColor: BrandColors.semantic.successLight,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  deliverableText: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.neutral[800],
    lineHeight: 20,
  },
  newBadge: {
    backgroundColor: BrandColors.semantic.success,
    color: BrandColors.neutral[0],
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
    backgroundColor: BrandColors.semantic.infoLight,
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
    color: BrandColors.semantic.infoDark,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: BrandColors.semantic.infoDark,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BrandColors.neutral[100],
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: BrandColors.semantic.errorLight,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.semantic.errorLight,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        ':focus': {
          borderColor: BrandColors.semantic.errorDark,
          borderWidth: 2,
          shadowColor: BrandColors.semantic.errorDark,
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }
      }
    }),
  },
  rejectButtonText: {
    color: BrandColors.semantic.errorDark,
    fontSize: 16,
    fontWeight: '600',
  },
  negotiateButton: {
    flex: 1,
    backgroundColor: BrandColors.primary[200],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.primary[300],
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        ':focus': {
          borderColor: BrandColors.primary[700],
          borderWidth: 2,
          shadowColor: BrandColors.primary[700],
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }
      }
    }),
  },
  negotiateButtonText: {
    color: BrandColors.primary[700],
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
          borderColor: BrandColors.neutral[0],
          borderWidth: 2,
          shadowColor: Color.cSK430B92500,
          shadowOpacity: 0.4,
          shadowRadius: 4,
        }
      }
    }),
  },
  acceptButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HandleCounterOfferPage;