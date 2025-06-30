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
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { useAuth } from '@/contexts/AuthContext';

interface Deal {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'dispute';
  platform: string;
  deliveryDays: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
    followers?: number;
  };
  marketer: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
  payments?: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
  milestones?: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string;
  }>;
}

interface DealsResponse {
  deals: Deal[];
  totalDeals: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const AdminDealsPage: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  const [dealsData, setDealsData] = useState<DealsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'dispute'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }
    
    fetchDeals();
  }, [user, currentPage, filterStatus, searchQuery]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/deals?${params}`, {
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });

      const result = await response.json();

      if (result.success) {
        setDealsData(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load deals');
      }

    } catch (error) {
      console.error('Error fetching deals:', error);
      Alert.alert('Error', 'Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeals();
  };

  const handleDealStatusUpdate = async (dealId: string, newStatus: string) => {
    Alert.alert(
      'Update Deal Status',
      `Are you sure you want to change the deal status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            setLoadingAction(dealId);
            
            try {
              const response = await fetch(`/api/admin/deals/${dealId}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user?.token || ''}`,
                },
                body: JSON.stringify({
                  status: newStatus,
                  adminNote: `Status updated by admin to ${newStatus}`
                }),
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert('Success', 'Deal status updated successfully');
                fetchDeals(); // Refresh the list
              } else {
                Alert.alert('Error', result.message || 'Failed to update deal status');
              }
            } catch (error) {
              console.error('Error updating deal status:', error);
              Alert.alert('Error', 'Failed to update deal status. Please try again.');
            } finally {
              setLoadingAction(null);
            }
          }
        }
      ]
    );
  };

  const handleViewDealDetails = (dealId: string) => {
    router.push({
      pathname: '/admin/deal-details',
      params: { dealId }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#6B7280';
      case 'dispute': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusActions = (currentStatus: string) => {
    const actions = [];
    
    switch (currentStatus) {
      case 'pending':
        actions.push('accepted', 'cancelled');
        break;
      case 'accepted':
        actions.push('in_progress', 'cancelled');
        break;
      case 'in_progress':
        actions.push('completed', 'dispute');
        break;
      case 'dispute':
        actions.push('in_progress', 'cancelled', 'completed');
        break;
      default:
        break;
    }
    
    return actions;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (status: any) => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Loading state
  if (loading && !dealsData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/admin" />
          <Text style={styles.headerTitle}>Manage Deals</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.cSK430B92500} />
          <Text style={styles.loadingText}>Loading deals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <WebSEO 
        title="Deal Management | Admin | Axees"
        description="Manage platform deals, view details, and update deal status"
        keywords="admin, deal management, creator collaborations, campaigns"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/admin" />
          <Text style={styles.headerTitle}>Manage Deals</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search deals by title, creator, or company..."
            clearButtonMode="while-editing"
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>All Deals</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'pending' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('pending')}
            >
              <Text style={[styles.filterText, filterStatus === 'pending' && styles.activeFilterText]}>Pending</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'in_progress' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('in_progress')}
            >
              <Text style={[styles.filterText, filterStatus === 'in_progress' && styles.activeFilterText]}>In Progress</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'completed' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('completed')}
            >
              <Text style={[styles.filterText, filterStatus === 'completed' && styles.activeFilterText]}>Completed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'dispute' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('dispute')}
            >
              <Text style={[styles.filterText, filterStatus === 'dispute' && styles.activeFilterText]}>Disputes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={styles.statsText}>
            Showing {dealsData?.deals.length || 0} of {dealsData?.totalDeals || 0} deals
          </Text>
          <Text style={styles.statsText}>
            Page {dealsData?.currentPage || 1} of {dealsData?.totalPages || 1}
          </Text>
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
          {/* Deals List */}
          <View style={styles.dealsList}>
            {dealsData?.deals.map((deal) => (
              <View key={deal.id} style={styles.dealCard}>
                <TouchableOpacity
                  style={styles.dealInfo}
                  onPress={() => handleViewDealDetails(deal.id)}
                >
                  <View style={styles.dealHeader}>
                    <View style={styles.dealBasicInfo}>
                      <Text style={styles.dealTitle}>{deal.title}</Text>
                      <Text style={styles.dealAmount}>{formatCurrency(deal.amount)}</Text>
                    </View>
                    
                    <View style={styles.dealBadges}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deal.status) + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(deal.status) }]}>
                          {deal.status.replace('_', ' ')}
                        </Text>
                      </View>
                      
                      <View style={styles.platformBadge}>
                        <Text style={styles.platformBadgeText}>{deal.platform}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.dealDescription} numberOfLines={2}>
                    {deal.description}
                  </Text>
                  
                  <View style={styles.dealParticipants}>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantLabel}>Creator:</Text>
                      <Text style={styles.participantName}>{deal.creator.name}</Text>
                      {deal.creator.followers && (
                        <Text style={styles.participantDetail}>
                          {(deal.creator.followers / 1000).toFixed(1)}K followers
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantLabel}>Marketer:</Text>
                      <Text style={styles.participantName}>{deal.marketer.name}</Text>
                      <Text style={styles.participantDetail}>{deal.marketer.company}</Text>
                    </View>
                  </View>
                  
                  {deal.payments && (
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentText}>
                        Paid: {formatCurrency(deal.payments.paidAmount)} / {formatCurrency(deal.payments.totalAmount)}
                      </Text>
                      {deal.payments.pendingAmount > 0 && (
                        <Text style={styles.pendingPaymentText}>
                          Pending: {formatCurrency(deal.payments.pendingAmount)}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  <View style={styles.dealDates}>
                    <Text style={styles.dateText}>
                      Created: {new Date(deal.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.dateText}>
                      Delivery: {deal.deliveryDays} days
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.dealActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewDealDetails(deal.id)}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  {getStatusActions(deal.status).length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {getStatusActions(deal.status).map((action) => (
                        <TouchableOpacity
                          key={action}
                          style={[
                            styles.statusActionButton,
                            { backgroundColor: getStatusColor(action) }
                          ]}
                          onPress={() => handleDealStatusUpdate(deal.id, action)}
                          disabled={loadingAction === deal.id}
                        >
                          {loadingAction === deal.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.statusActionText}>
                              {action.replace('_', ' ')}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            ))}
            
            {(!dealsData?.deals || dealsData.deals.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No deals found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
              </View>
            )}
          </View>

          {/* Pagination */}
          {dealsData && dealsData.totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, !dealsData.hasPrevPage && styles.disabledPageButton]}
                onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!dealsData.hasPrevPage}
              >
                <Text style={[styles.pageButtonText, !dealsData.hasPrevPage && styles.disabledPageButtonText]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.pageInfo}>
                Page {dealsData.currentPage} of {dealsData.totalPages}
              </Text>
              
              <TouchableOpacity
                style={[styles.pageButton, !dealsData.hasNextPage && styles.disabledPageButton]}
                onPress={() => setCurrentPage(prev => prev + 1)}
                disabled={!dealsData.hasNextPage}
              >
                <Text style={[styles.pageButtonText, !dealsData.hasNextPage && styles.disabledPageButtonText]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={4} />}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  filtersSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: Color.cSK430B92500,
    borderColor: Color.cSK430B92500,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  dealsList: {
    padding: 16,
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dealInfo: {
    marginBottom: 12,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealBasicInfo: {
    flex: 1,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 2,
  },
  dealAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  dealBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730a3',
  },
  dealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  dealParticipants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  participantDetail: {
    fontSize: 12,
    color: '#666',
  },
  paymentInfo: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  pendingPaymentText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  dealDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  dealActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
  },
  viewButtonText: {
    color: Color.cSK430B92500,
    fontSize: 12,
    fontWeight: '500',
  },
  statusActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 6,
  },
  statusActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Color.cSK430B92500,
  },
  disabledPageButton: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledPageButtonText: {
    color: '#999',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdminDealsPage;