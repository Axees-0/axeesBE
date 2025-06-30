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
import { useAuth } from '@/contexts/AuthContext';
import { UniversalBackButton } from '@/components/UniversalBackButton';

interface NegotiationEvent {
  id: string;
  type: 'initial_offer' | 'counter_offer' | 'acceptance' | 'rejection' | 'message';
  amount?: number;
  terms?: {
    deliveryDays?: number;
    deliverables?: string[];
    additionalRequirements?: string;
  };
  message?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    userType: 'creator' | 'marketer';
  };
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
}

interface NegotiationHistory {
  dealId: string;
  dealTitle: string;
  creator: {
    id: string;
    name: string;
    handle: string;
  };
  marketer: {
    id: string;
    name: string;
    company: string;
  };
  currentStatus: 'negotiating' | 'accepted' | 'cancelled';
  finalAmount?: number;
  events: NegotiationEvent[];
}

const NegotiationHistoryPage: React.FC = () => {
  const { dealId } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  const [negotiationHistory, setNegotiationHistory] = useState<NegotiationHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (dealId) {
      fetchNegotiationHistory();
    }
  }, [dealId]);

  const fetchNegotiationHistory = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/negotiation/deals/${dealId}/history`, {
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNegotiationHistory(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load negotiation history');
        router.back();
      }
      
    } catch (error) {
      console.error('Error fetching negotiation history:', error);
      Alert.alert('Error', 'Failed to load negotiation history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNegotiationHistory();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'initial_offer': return '💼';
      case 'counter_offer': return '🔄';
      case 'acceptance': return '✅';
      case 'rejection': return '❌';
      case 'message': return '💬';
      default: return '📝';
    }
  };

  const getEventTitle = (event: NegotiationEvent) => {
    switch (event.type) {
      case 'initial_offer':
        return `${event.user.userType === 'creator' ? 'Creator' : 'Marketer'} made initial offer`;
      case 'counter_offer':
        return `${event.user.userType === 'creator' ? 'Creator' : 'Marketer'} made counter offer`;
      case 'acceptance':
        return `${event.user.userType === 'creator' ? 'Creator' : 'Marketer'} accepted offer`;
      case 'rejection':
        return `${event.user.userType === 'creator' ? 'Creator' : 'Marketer'} rejected offer`;
      case 'message':
        return `${event.user.userType === 'creator' ? 'Creator' : 'Marketer'} sent message`;
      default:
        return 'Negotiation event';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return BrandColors.semantic.warning;
      case 'accepted': return BrandColors.semantic.success;
      case 'rejected': return BrandColors.semantic.error;
      case 'superseded': return BrandColors.neutral[400];
      default: return BrandColors.neutral[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Response';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'superseded': return 'Superseded';
      default: return status;
    }
  };

  const handleMakeCounterOffer = () => {
    if (!negotiationHistory) return;
    
    router.push({
      pathname: '/offers/counter',
      params: { 
        dealId: negotiationHistory.dealId,
        creatorId: negotiationHistory.creator.id,
        marketerId: negotiationHistory.marketer.id
      }
    });
  };

  const handleOpenChat = () => {
    if (!negotiationHistory) return;
    
    const otherParty = user?.userType === 'creator' ? negotiationHistory.marketer : negotiationHistory.creator;
    const chatId = `chat-${negotiationHistory.dealId}`;
    
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: chatId,
        dealId: negotiationHistory.dealId,
        otherUserId: otherParty.id,
        otherUserName: otherParty.name,
      }
    });
  };

  // Loading state
  if (loading && !negotiationHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/deals" />
          <Text style={styles.headerTitle}>Negotiation History</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.cSK430B92500} />
          <Text style={styles.loadingText}>Loading negotiation history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!negotiationHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/deals" />
          <Text style={styles.headerTitle}>Negotiation History</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No negotiation history found</Text>
          <Text style={styles.emptyStateSubtext}>This deal may not have any negotiations yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <WebSEO 
        title={`Negotiation History: ${negotiationHistory.dealTitle} | Axees`}
        description="View complete negotiation timeline and history for this deal"
        keywords="negotiation, history, timeline, offers, deal"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/deals" />
          <Text style={styles.headerTitle}>Negotiation History</Text>
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
          {/* Deal Overview */}
          <View style={styles.dealOverview}>
            <Text style={styles.dealTitle}>{negotiationHistory.dealTitle}</Text>
            
            <View style={styles.dealParties}>
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Creator</Text>
                <Text style={styles.partyName}>{negotiationHistory.creator.name}</Text>
                <Text style={styles.partyHandle}>{negotiationHistory.creator.handle}</Text>
              </View>
              
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Marketer</Text>
                <Text style={styles.partyName}>{negotiationHistory.marketer.name}</Text>
                <Text style={styles.partyCompany}>{negotiationHistory.marketer.company}</Text>
              </View>
            </View>

            <View style={styles.statusSection}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Current Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(negotiationHistory.currentStatus) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(negotiationHistory.currentStatus) }]}>
                    {negotiationHistory.currentStatus.charAt(0).toUpperCase() + negotiationHistory.currentStatus.slice(1)}
                  </Text>
                </View>
              </View>
              
              {negotiationHistory.finalAmount && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Final Amount</Text>
                  <Text style={styles.finalAmount}>{formatCurrency(negotiationHistory.finalAmount)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionHeader}>Negotiation Timeline</Text>
            
            <View style={styles.timeline}>
              {negotiationHistory.events.map((event, index) => (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <Text style={styles.timelineIcon}>{getEventIcon(event.type)}</Text>
                    {index < negotiationHistory.events.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{getEventTitle(event)}</Text>
                      <View style={[styles.eventStatusBadge, { backgroundColor: getStatusColor(event.status) + '20' }]}>
                        <Text style={[styles.eventStatusText, { color: getStatusColor(event.status) }]}>
                          {getStatusLabel(event.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.eventDate}>{formatDate(event.createdAt)}</Text>
                    <Text style={styles.eventUser}>by {event.user.name}</Text>
                    
                    {event.amount && (
                      <View style={styles.eventDetails}>
                        <Text style={styles.eventAmount}>Amount: {formatCurrency(event.amount)}</Text>
                      </View>
                    )}
                    
                    {event.terms && (
                      <View style={styles.eventDetails}>
                        {event.terms.deliveryDays && (
                          <Text style={styles.eventTerm}>Delivery: {event.terms.deliveryDays} days</Text>
                        )}
                        {event.terms.deliverables && event.terms.deliverables.length > 0 && (
                          <View style={styles.deliverablesSection}>
                            <Text style={styles.deliverablesTitle}>Deliverables:</Text>
                            {event.terms.deliverables.map((deliverable, idx) => (
                              <Text key={idx} style={styles.deliverableItem}>• {deliverable}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                    
                    {event.message && (
                      <View style={styles.messageSection}>
                        <Text style={styles.messageText}>"{event.message}"</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionHeader}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Events</Text>
                <Text style={styles.summaryValue}>{negotiationHistory.events.length}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Counter Offers</Text>
                <Text style={styles.summaryValue}>
                  {negotiationHistory.events.filter(e => e.type === 'counter_offer').length}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>
                  {Math.ceil((new Date(negotiationHistory.events[negotiationHistory.events.length - 1].createdAt).getTime() - 
                    new Date(negotiationHistory.events[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {negotiationHistory.currentStatus === 'negotiating' && (
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={handleOpenChat}
            >
              <Text style={styles.chatButtonText}>Open Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.counterOfferButton}
              onPress={handleMakeCounterOffer}
            >
              <Text style={styles.counterOfferButtonText}>Make Counter Offer</Text>
            </TouchableOpacity>
          </View>
        )}
        
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[200],
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContainer: {
    flex: 1,
  },
  dealOverview: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[200],
  },
  dealTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  dealParties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  partyInfo: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 12,
    color: BrandColors.neutral[600],
    fontWeight: '500',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 2,
  },
  partyHandle: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  partyCompany: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: BrandColors.neutral[600],
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  finalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  timelineSection: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    fontSize: 24,
    width: 40,
    height: 40,
    lineHeight: 40,
    textAlign: 'center',
    backgroundColor: BrandColors.neutral[100],
    borderRadius: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: BrandColors.neutral[200],
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    flex: 1,
  },
  eventStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    marginBottom: 2,
  },
  eventUser: {
    fontSize: 14,
    color: BrandColors.neutral[600],
    marginBottom: 8,
  },
  eventDetails: {
    marginTop: 8,
  },
  eventAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  eventTerm: {
    fontSize: 14,
    color: BrandColors.neutral[600],
    marginBottom: 4,
  },
  deliverablesSection: {
    marginTop: 8,
  },
  deliverablesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  deliverableItem: {
    fontSize: 14,
    color: BrandColors.neutral[600],
    marginBottom: 2,
  },
  messageSection: {
    marginTop: 8,
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 8,
    padding: 12,
  },
  messageText: {
    fontSize: 14,
    color: BrandColors.neutral[700],
    fontStyle: 'italic',
    lineHeight: 20,
  },
  summarySection: {
    padding: 20,
    backgroundColor: BrandColors.neutral[50],
  },
  summaryCard: {
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  actionSection: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BrandColors.neutral[200],
    gap: 12,
  },
  chatButton: {
    flex: 1,
    backgroundColor: BrandColors.neutral[100],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
  },
  chatButtonText: {
    color: BrandColors.neutral[700],
    fontSize: 16,
    fontWeight: '600',
  },
  counterOfferButton: {
    flex: 1,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  counterOfferButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NegotiationHistoryPage;