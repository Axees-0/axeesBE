import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Color } from '@/GlobalStyles';
import { BREAKPOINTS, isTablet, isDesktop, isMobile } from '@/constants/breakpoints';
import { DealSkeleton, DealMetricsSkeleton } from '@/components/DealSkeleton';

interface Offer {
  id: string;
  marketer: {
    name: string;
    company: string;
    avatar?: string;
  };
  offerType: string;
  platform: string;
  amount: number;
  deliveryDays: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'negotiating';
  submittedDate: string;
  description: string;
  requirements: string[];
  dealId?: string;
}

interface CreatorDealsViewProps {
  userRole: 'creator' | 'marketer';
  isLoading?: boolean;
}

const CreatorDealsView: React.FC<CreatorDealsViewProps> = ({ userRole, isLoading = false }) => {
  // Get window dimensions for responsive layout
  const { width } = useWindowDimensions();

  // Demo creator offers data
  const [creatorOffers] = useState<Offer[]>([
    {
      id: 'OFF-234567',
      marketer: {
        name: 'Sarah Martinez',
        company: 'TechStyle Brand',
      },
      offerType: 'Instagram Post Campaign',
      platform: 'Instagram',
      amount: 1500,
      deliveryDays: 5,
      status: 'pending',
      submittedDate: '2024-06-18',
      description: 'Promote our summer collection with authentic styling content',
      requirements: ['High-quality photos', 'Story highlights', 'Engagement with comments'],
    },
    {
      id: 'OFF-345678',
      marketer: {
        name: 'David Chen',
        company: 'FitTech Solutions',
      },
      offerType: 'Product Review Video',
      platform: 'YouTube',
      amount: 2500,
      deliveryDays: 10,
      status: 'accepted',
      submittedDate: '2024-06-15',
      description: 'Create detailed review of our new fitness tracker',
      requirements: ['Unboxing footage', '7-day usage test', 'Honest review'],
      dealId: 'DEAL-001',
    },
    {
      id: 'OFF-456789',
      marketer: {
        name: 'Lisa Thompson',
        company: 'Beauty Collective',
      },
      offerType: 'TikTok Series',
      platform: 'TikTok',
      amount: 800,
      deliveryDays: 7,
      status: 'negotiating',
      submittedDate: '2024-06-16',
      description: 'Create 3-part makeup tutorial series featuring our products',
      requirements: ['Professional lighting', 'Brand mentions', 'Trending sounds'],
    },
    {
      id: 'OFF-567890',
      marketer: {
        name: 'Michael Roberts',
        company: 'GamerHub',
      },
      offerType: 'Gaming Stream',
      platform: 'Twitch',
      amount: 1200,
      deliveryDays: 3,
      status: 'rejected',
      submittedDate: '2024-06-12',
      description: 'Live stream gameplay featuring our new gaming accessories',
      requirements: ['4-hour stream', 'Product showcases', 'Viewer interaction'],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'accepted': return '#66BB6A';
      case 'rejected': return '#EF5350';
      case 'countered': return '#AB47BC';
      case 'negotiating': return '#42A5F5';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Review Needed';
      case 'accepted': return 'Deal Active';
      case 'rejected': return 'Declined';
      case 'countered': return 'Counter Sent';
      case 'negotiating': return 'Negotiating';
      default: return status;
    }
  };

  // Get responsive styles for offer cards
  const getOfferCardStyles = () => {
    const baseStyle = styles.offerCard;
    
    if (Platform.OS !== 'web') {
      return baseStyle;
    }

    // Responsive styles for web
    if (isMobile(width)) {
      return [
        baseStyle,
        {
          marginHorizontal: 0,
          width: '100%',
        }
      ];
    } else if (isTablet(width)) {
      return [
        baseStyle,
        {
          marginHorizontal: 0,
          width: '100%',
          maxWidth: '100%', // Fluid width on tablet
          padding: 20, // Increased padding for better readability on tablet
        }
      ];
    } else {
      return [
        baseStyle,
        {
          marginHorizontal: 0,
          width: '100%',
          maxWidth: 800, // Max width for desktop
        }
      ];
    }
  };

  // Get responsive styles for summary cards
  const getSummaryRowStyles = () => {
    if (Platform.OS !== 'web') {
      return styles.summaryRow;
    }

    if (isMobile(width)) {
      return [
        styles.summaryRow,
        {
          flexDirection: 'column',
          gap: 12,
        }
      ];
    } else if (isTablet(width)) {
      return [
        styles.summaryRow,
        {
          flexDirection: 'row',
          gap: 16,
          justifyContent: 'space-between',
        }
      ];
    } else {
      return styles.summaryRow;
    }
  };

  // Get responsive styles for action buttons
  const getActionButtonsStyles = () => {
    if (Platform.OS !== 'web') {
      return styles.actionButtons;
    }

    if (isMobile(width)) {
      return [
        styles.actionButtons,
        {
          flexDirection: 'column',
          gap: 12,
        }
      ];
    } else if (isTablet(width)) {
      return [
        styles.actionButtons,
        {
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }
      ];
    } else {
      return styles.actionButtons;
    }
  };

  const handleOfferAction = (offerId: string, action: string) => {
    const offer = creatorOffers.find(o => o.id === offerId);
    if (!offer) return;

    switch (action) {
      case 'view':
        router.push({
          pathname: '/offers/review',
          params: { offerId }
        });
        break;
      case 'accept':
        Alert.alert(
          'Accept Offer',
          `Accept ${offer.offerType} offer from ${offer.marketer.company} for $${offer.amount}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Accept', 
              onPress: () => {
                Alert.alert('Offer Accepted!', 'The deal is now active. You can start working on the requirements.');
              }
            }
          ]
        );
        break;
      case 'reject':
        Alert.alert(
          'Decline Offer',
          `Are you sure you want to decline this offer from ${offer.marketer.company}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Decline', 
              style: 'destructive',
              onPress: () => {
                Alert.alert('Offer Declined', 'The marketer has been notified of your decision.');
              }
            }
          ]
        );
        break;
      case 'counter':
        router.push({
          pathname: '/offers/counter',
          params: { offerId }
        });
        break;
      case 'view_deal':
        if (offer.dealId) {
          router.push({
            pathname: '/deals/[id]',
            params: { id: offer.dealId }
          });
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const renderOfferCard = (offer: Offer) => (
    <TouchableOpacity 
      key={offer.id} 
      style={getOfferCardStyles()}
      onPress={() => handleOfferAction(offer.id, 'view')}
    >
      <View style={styles.offerHeader}>
        <View style={styles.offerMainInfo}>
          <Text style={styles.offerTitle}>{offer.offerType}</Text>
          <Text style={styles.offerMarketer}>from {offer.marketer.company}</Text>
          <Text style={styles.offerPlatform}>{offer.platform} • {offer.deliveryDays} days</Text>
        </View>
        <View style={styles.offerActions}>
          <Text style={styles.offerAmount}>${offer.amount.toLocaleString()}</Text>
          <View style={[styles.offerStatus, { backgroundColor: getStatusColor(offer.status) + '20' }]}>
            <Text style={[styles.offerStatusText, { color: getStatusColor(offer.status) }]}>
              {getStatusLabel(offer.status)}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.offerDescription} numberOfLines={2}>
        {offer.description}
      </Text>
      
      <View style={styles.offerRequirements}>
        <Text style={styles.requirementsTitle}>Key Requirements:</Text>
        {offer.requirements.slice(0, 2).map((req, index) => (
          <Text key={index} style={styles.requirementItem}>• {req}</Text>
        ))}
        {offer.requirements.length > 2 && (
          <Text style={styles.moreRequirements}>+{offer.requirements.length - 2} more</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={getActionButtonsStyles()}>
        {offer.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleOfferAction(offer.id, 'reject')}
            >
              <Text style={styles.rejectButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.counterButton]}
              onPress={() => handleOfferAction(offer.id, 'counter')}
            >
              <Text style={styles.counterButtonText}>Counter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleOfferAction(offer.id, 'accept')}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
        
        {offer.status === 'accepted' && offer.dealId && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewDealButton]}
            onPress={() => handleOfferAction(offer.id, 'view_deal')}
          >
            <Text style={styles.viewDealButtonText}>View Deal</Text>
          </TouchableOpacity>
        )}
        
        {offer.status === 'negotiating' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.negotiatingButton]}
            onPress={() => handleOfferAction(offer.id, 'view')}
          >
            <Text style={styles.negotiatingButtonText}>Continue Negotiation</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.offerFooter}>
        <Text style={styles.offerDate}>
          Received: {new Date(offer.submittedDate).toLocaleDateString()}
        </Text>
        <Text style={styles.offerNumber}>#{offer.id}</Text>
      </View>
    </TouchableOpacity>
  );

  const pendingOffers = creatorOffers.filter(o => o.status === 'pending');
  const activeOffers = creatorOffers.filter(o => o.status === 'accepted');
  const otherOffers = creatorOffers.filter(o => !['pending', 'accepted'].includes(o.status));

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Summary skeleton */}
        <DealMetricsSkeleton count={3} />
        
        {/* Main content skeleton */}
        <View style={styles.section}>
          <View style={styles.skeletonSectionHeader}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
          <DealSkeleton variant="card" count={2} />
        </View>
        
        <View style={styles.section}>
          <View style={styles.skeletonSectionHeader}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
          <DealSkeleton variant="card" count={1} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={getSummaryRowStyles()}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{pendingOffers.length}</Text>
          <Text style={styles.summaryLabel}>Pending Review</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{activeOffers.length}</Text>
          <Text style={styles.summaryLabel}>Active Deals</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${creatorOffers.reduce((sum, o) => o.status === 'accepted' ? sum + o.amount : sum, 0).toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Value</Text>
        </View>
      </View>

      {/* Pending Offers */}
      {pendingOffers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Pending Offers ({pendingOffers.length})</Text>
          <Text style={styles.sectionSubtitle}>Review and respond to new offers</Text>
          <View style={styles.offersContainer}>
            {pendingOffers.map(renderOfferCard)}
          </View>
        </View>
      )}

      {/* Active Deals */}
      {activeOffers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Active Deals ({activeOffers.length})</Text>
          <Text style={styles.sectionSubtitle}>Manage your ongoing projects</Text>
          <View style={styles.offersContainer}>
            {activeOffers.map(renderOfferCard)}
          </View>
        </View>
      )}

      {/* Other Offers */}
      {otherOffers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
          <View style={styles.offersContainer}>
            {otherOffers.map(renderOfferCard)}
          </View>
        </View>
      )}

      {creatorOffers.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Offers Yet</Text>
          <Text style={styles.emptyStateText}>
            Complete your profile to start receiving offers from brands and marketers.
          </Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2D0FB',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  offersContainer: {
    gap: 16,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D0FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerMainInfo: {
    flex: 1,
    marginRight: 16,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  offerMarketer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  offerPlatform: {
    fontSize: 12,
    color: '#999',
  },
  offerActions: {
    alignItems: 'flex-end',
  },
  offerAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 6,
  },
  offerStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  offerDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  offerRequirements: {
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  requirementItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  moreRequirements: {
    fontSize: 12,
    color: Color.cSK430B92500,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  counterButton: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  counterButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: Color.cSK430B92500,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewDealButton: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewDealButtonText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
  negotiatingButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  negotiatingButtonText: {
    color: '#EA580C',
    fontSize: 14,
    fontWeight: '600',
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  offerDate: {
    fontSize: 12,
    color: '#666',
  },
  offerNumber: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  profileButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Skeleton styles
  skeletonSectionHeader: {
    marginBottom: 16,
  },
  skeletonTitle: {
    height: 20,
    width: '40%',
    backgroundColor: '#E2D0FB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 14,
    width: '60%',
    backgroundColor: '#E2D0FB',
    borderRadius: 4,
  },
});

export default CreatorDealsView;