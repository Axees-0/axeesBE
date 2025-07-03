import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCardModal } from '@/components/CreditCardModal';
import { useConfirmModal } from '@/components/ConfirmModal';
import { BrandColors } from '@/constants/Colors';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';
import { UniversalBackButton } from '@/components/UniversalBackButton';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal';
  name: string;
  last4?: string;
  email?: string;
  isDefault: boolean;
  icon: string;
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'payment' | 'refund' | 'escrow';
  status: 'completed' | 'pending' | 'failed';
  dealId?: string;
}

const MarketerPaymentsPage: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'history'>('overview');
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Handle browser navigation on web platform
  React.useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      // Force router to recognize this page on mount
      const currentPath = window.location.pathname;
      if (currentPath === '/payments/marketer') {
        // Ensure content is properly loaded
        console.log('Payment page mounted:', currentPath);
      }
    }
  }, [isWeb]);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      
      const response = await fetch('/api/payment-persistence/methods', {
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });

      const result = await response.json();

      if (result.success) {
        const formattedMethods = result.data.methods.map((method: any) => ({
          id: method.id,
          type: method.type,
          name: method.displayName || `${method.type.replace('_', ' ')} ending in ${method.last4 || '****'}`,
          last4: method.last4,
          email: method.email,
          isDefault: method.isDefault,
          icon: getPaymentMethodIcon(method.type),
        }));
        setPaymentMethods(formattedMethods);
      } else {
        console.error('Failed to fetch payment methods:', result.message);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods. Please try again.');
    } finally {
      setLoadingMethods(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentMethods();
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return '💳';
      case 'bank_account': return '🏦';
      case 'paypal': return '🅿️';
      default: return '💳';
    }
  };

  const [transactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      date: new Date(Date.now() - 86400000),
      description: 'Milestone funding - Instagram Post Campaign',
      amount: -750,
      type: 'escrow',
      status: 'completed',
      dealId: 'DEAL-001',
    },
    {
      id: 'tx-2',
      date: new Date(Date.now() - 172800000),
      description: 'Milestone funding - Product Review Video',
      amount: -1200,
      type: 'escrow',
      status: 'completed',
      dealId: 'DEAL-002',
    },
    {
      id: 'tx-3',
      date: new Date(Date.now() - 259200000),
      description: 'Refund - Cancelled campaign',
      amount: 500,
      type: 'refund',
      status: 'completed',
    },
  ]);

  const totalSpent = transactions
    .filter(t => t.type === 'escrow' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Payment method handlers
  const handleSetDefault = (method: PaymentMethod) => {
    showConfirm(
      'Set Default Payment Method',
      `Set ${method.name} as your default payment method?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set Default',
          onPress: async () => {
            setActionLoading(method.id);
            
            try {
              const response = await fetch(`/api/payment-persistence/methods/${method.id}/default`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user?.token || ''}`,
                },
              });

              const result = await response.json();

              if (result.success) {
                // Update local state to reflect the change
                setPaymentMethods(prevMethods => 
                  prevMethods.map(m => ({
                    ...m,
                    isDefault: m.id === method.id
                  }))
                );
                
                Alert.alert('Success', `${method.name} has been set as your default payment method.`);
              } else {
                Alert.alert('Error', result.message || 'Failed to set default payment method.');
              }
            } catch (error) {
              console.error('Error setting default payment method:', error);
              Alert.alert('Error', 'Failed to set default payment method. Please try again.');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };
  
  const handleRemoveMethod = (method: PaymentMethod) => {
    if (method.isDefault) {
      Alert.alert(
        'Cannot Remove Default',
        'Please set another payment method as default before removing this one.'
      );
      return;
    }
    
    showConfirm(
      'Remove Payment Method',
      `Are you sure you want to remove ${method.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            setActionLoading(method.id);
            
            try {
              const response = await fetch(`/api/payment-persistence/methods/${method.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${user?.token || ''}`,
                },
              });

              const result = await response.json();

              if (result.success) {
                // Remove the payment method from state
                setPaymentMethods(prevMethods => 
                  prevMethods.filter(m => m.id !== method.id)
                );
                
                Alert.alert('Success', `${method.name} has been removed.`);
              } else {
                Alert.alert('Error', result.message || 'Failed to remove payment method.');
              }
            } catch (error) {
              console.error('Error removing payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method. Please try again.');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };
  
  const handleAddPaymentMethod = (type: string) => {
    setShowAddMethod(false);
    
    if (type === 'Credit Card') {
      // Show the credit card modal
      setShowCreditCardModal(true);
    } else if (type === 'Bank Account') {
      showConfirm(
        'Add Bank Account',
        'Bank account form would appear here with fields for:\n\n• Account Number\n• Routing Number\n• Account Type',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Account', 
            onPress: () => {
              setTimeout(() => {
                showConfirm('Success', 'Bank account added successfully!', [{ text: 'OK' }]);
              }, 100);
            }
          }
        ]
      );
    } else if (type === 'PayPal') {
      showConfirm(
        'Connect PayPal',
        'You would be redirected to PayPal to authorize the connection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Connect', 
            onPress: () => {
              setTimeout(() => {
                showConfirm('Success', 'PayPal account connected successfully!', [{ text: 'OK' }]);
              }, 100);
            }
          }
        ]
      );
    }
  };

  const activeDeals = 3;
  const pendingPayments = transactions.filter(t => t.status === 'pending').length;
  
  const handleAddCreditCard = async (cardData: any) => {
    setActionLoading('adding-card');
    
    try {
      const response = await fetch('/api/payment-persistence/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: JSON.stringify({
          type: 'credit_card',
          cardNumber: cardData.number,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          cvv: cardData.cvv,
          holderName: cardData.holderName,
          isDefault: paymentMethods.length === 0, // First method becomes default
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add new method to local state
        const newMethod: PaymentMethod = {
          id: result.data.paymentMethod.id,
          type: 'credit_card',
          name: `${cardData.number.startsWith('4') ? 'Visa' : 'Card'} ending in ${result.data.paymentMethod.last4}`,
          last4: result.data.paymentMethod.last4,
          isDefault: result.data.paymentMethod.isDefault,
          icon: '💳',
        };
        
        setPaymentMethods(prev => [...prev, newMethod]);
        
        // Close modal and show success
        setShowCreditCardModal(false);
        Alert.alert('Success', 'Credit card added successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to add credit card.');
      }
    } catch (error) {
      console.error('Error adding credit card:', error);
      Alert.alert('Error', 'Failed to add credit card. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <WebSEO 
        title="Payment Management | Axees"
        description="Manage your payment methods and transaction history"
        keywords="payments, billing, transactions, marketer"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton 
            fallbackRoute="/profile"
          />
          
          <Text style={styles.headerTitle}>Payments</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs} role="tablist" aria-label="Payment navigation tabs">
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'overview' }}
            accessibilityLabel="Overview tab"
            accessibilityHint="Shows payment overview and statistics"
            aria-selected={activeTab === 'overview'}
            aria-controls="overview-panel"
            {...(Platform.OS === 'web' && { tabIndex: 0 })}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'methods' && styles.activeTab]}
            onPress={() => setActiveTab('methods')}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'methods' }}
            accessibilityLabel="Payment Methods tab"
            accessibilityHint="Shows saved payment methods"
            aria-selected={activeTab === 'methods'}
            aria-controls="methods-panel"
            {...(Platform.OS === 'web' && { tabIndex: 0 })}
          >
            <Text style={[styles.tabText, activeTab === 'methods' && styles.activeTabText]}>
              Payment Methods
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'history' }}
            accessibilityLabel="History tab"
            accessibilityHint="Shows payment transaction history"
            aria-selected={activeTab === 'history'}
            aria-controls="history-panel"
            {...(Platform.OS === 'web' && { tabIndex: 0 })}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BrandColors.primary[500]]}
            />
          }
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent} role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
              {/* Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>${totalSpent.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{activeDeals}</Text>
                  <Text style={styles.statLabel}>Active Deals</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{pendingPayments}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => {
                    showConfirm(
                      'Fund Escrow',
                      'This would redirect you to select a deal and fund its escrow account.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Continue', onPress: () => router.push('/deals') }
                      ]
                    );
                  }}
                >
                  <Text style={styles.actionIcon}>💰</Text>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Fund Escrow</Text>
                    <Text style={styles.actionDescription}>Add funds to deal escrow accounts</Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => setActiveTab('methods')}
                >
                  <Text style={styles.actionIcon}>💳</Text>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Manage Payment Methods</Text>
                    <Text style={styles.actionDescription}>Add or update payment options</Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Transactions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {transactions.slice(0, 3).map(transaction => (
                  <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.amount > 0 && styles.positiveAmount
                    ]}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'methods' && (
            <View style={styles.tabContent} role="tabpanel" id="methods-panel" aria-labelledby="methods-tab">
              {loadingMethods ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={BrandColors.primary[500]} />
                  <Text style={styles.loadingText}>Loading payment methods...</Text>
                </View>
              ) : (
                <>
                  {paymentMethods.map(method => (
                    <View key={method.id} style={styles.methodCard}>
                      <View style={styles.methodIcon}>
                        <Text style={styles.methodEmoji}>{method.icon}</Text>
                      </View>
                      
                      <View style={styles.methodInfo}>
                        <Text style={styles.methodName}>{method.name}</Text>
                        {method.email && <Text style={styles.methodDetail}>{method.email}</Text>}
                        {method.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.methodActions}>
                        {!method.isDefault && (
                          <TouchableOpacity 
                            style={styles.methodAction}
                            onPress={() => handleSetDefault(method)}
                            disabled={actionLoading === method.id}
                          >
                            {actionLoading === method.id ? (
                              <ActivityIndicator size="small" color={BrandColors.primary[500]} />
                            ) : (
                              <Text style={styles.methodActionText}>Set Default</Text>
                            )}
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.methodAction}
                          onPress={() => handleRemoveMethod(method)}
                          disabled={actionLoading === method.id}
                        >
                          {actionLoading === method.id ? (
                            <ActivityIndicator size="small" color={BrandColors.semantic.error} />
                          ) : (
                            <Text style={[styles.methodActionText, styles.removeText]}>Remove</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {paymentMethods.length === 0 && !loadingMethods && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No payment methods added</Text>
                      <Text style={styles.emptyStateSubtext}>Add a payment method for transactions</Text>
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity 
                style={styles.addMethodButton}
                onPress={() => setShowAddMethod(true)}
                disabled={actionLoading === 'adding-card'}
              >
                {actionLoading === 'adding-card' ? (
                  <ActivityIndicator size="small" color={BrandColors.primary[500]} />
                ) : (
                  <>
                    <Text style={styles.addMethodIcon}>+</Text>
                    <Text style={styles.addMethodText}>Add Payment Method</Text>
                  </>
                )}
              </TouchableOpacity>

              {showAddMethod && (
                <View style={styles.addMethodOptions}>
                  <TouchableOpacity 
                    style={styles.methodOption}
                    onPress={() => handleAddPaymentMethod('Credit Card')}
                  >
                    <Text style={styles.methodOptionIcon}>💳</Text>
                    <Text style={styles.methodOptionText}>Credit/Debit Card</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.methodOption}
                    onPress={() => handleAddPaymentMethod('Bank Account')}
                  >
                    <Text style={styles.methodOptionIcon}>🏦</Text>
                    <Text style={styles.methodOptionText}>Bank Account</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.methodOption}
                    onPress={() => handleAddPaymentMethod('PayPal')}
                  >
                    <Text style={styles.methodOptionIcon}>🅿️</Text>
                    <Text style={styles.methodOptionText}>PayPal</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Transaction History Tab */}
          {activeTab === 'history' && (
            <View style={styles.tabContent} role="tabpanel" id="history-panel" aria-labelledby="history-tab">
              {transactions.map(transaction => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.historyItem}
                  onPress={() => {
                    if (transaction.dealId) {
                      router.push({
                        pathname: '/deals/[id]',
                        params: { id: transaction.dealId }
                      });
                    }
                  }}
                >
                  <View style={styles.historyDate}>
                    <Text style={styles.historyMonth}>
                      {transaction.date.toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                    <Text style={styles.historyDay}>
                      {transaction.date.getDate()}
                    </Text>
                  </View>
                  
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDescription}>{transaction.description}</Text>
                    <View style={styles.historyMeta}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(transaction.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(transaction.status) }
                        ]}>
                          {transaction.status}
                        </Text>
                      </View>
                      <Text style={styles.historyType}>{transaction.type}</Text>
                    </View>
                  </View>
                  
                  <Text style={[
                    styles.historyAmount,
                    transaction.amount > 0 && styles.positiveAmount
                  ]}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={4} />}
        
        {/* Credit Card Modal */}
        <CreditCardModal 
          visible={showCreditCardModal}
          onClose={() => setShowCreditCardModal(false)}
          onAdd={handleAddCreditCard}
        />
        
        {/* Confirm Modal */}
        <ConfirmModalComponent />
      </SafeAreaView>
    </>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return BrandColors.semantic.success;
    case 'pending': return BrandColors.semantic.warning;
    case 'failed': return BrandColors.semantic.error;
    default: return BrandColors.neutral[500];
  }
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
    color: BrandColors.neutral[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[600],
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: BrandColors.neutral[400],
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.primary[500],
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 4, // Increased thickness for better visibility
    borderBottomColor: BrandColors.primary[500],
    backgroundColor: BrandColors.primary[50], // Slightly more prominent background
    position: 'relative',
    transform: [{ scale: 1.02 }], // Subtle scale effect for active state
    // Add a subtle shadow for depth
    shadowColor: BrandColors.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // For Android shadow
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.neutral[600],
    textAlign: 'center',
  },
  activeTabText: {
    color: BrandColors.primary[500],
    fontWeight: '700', // Increased weight
    fontSize: 15, // Slightly larger font size for active tab
    textShadowColor: BrandColors.primary[300],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: BrandColors.neutral[50],
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.primary[500],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: BrandColors.neutral[600],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandColors.primary[500],
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.neutral[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[700],
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  actionArrow: {
    fontSize: 18,
    color: BrandColors.neutral[400],
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[200],
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: BrandColors.neutral[700],
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: BrandColors.neutral[400],
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.semantic.error,
  },
  positiveAmount: {
    color: BrandColors.semantic.success,
  },
  methodCard: {
    flexDirection: Platform.select({ default: 'column', web: 'row' }),
    alignItems: Platform.select({ default: 'stretch', web: 'center' }),
    backgroundColor: BrandColors.neutral[50],
    padding: Platform.select({ default: 12, web: 16 }),
    borderRadius: 12,
    marginBottom: 12,
    gap: Platform.select({ default: 8, web: 0 }),
  },
  methodIcon: {
    width: Platform.select({ default: 40, web: 48 }),
    height: Platform.select({ default: 40, web: 48 }),
    borderRadius: Platform.select({ default: 20, web: 24 }),
    backgroundColor: BrandColors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Platform.select({ default: 0, web: 16 }),
    alignSelf: Platform.select({ default: 'flex-start', web: 'auto' }),
  },
  methodEmoji: {
    fontSize: Platform.select({ default: 20, web: 24 }),
  },
  methodInfo: {
    flex: 1,
    flexDirection: Platform.select({ default: 'row', web: 'column' }),
    justifyContent: Platform.select({ default: 'space-between', web: 'flex-start' }),
    alignItems: Platform.select({ default: 'center', web: 'flex-start' }),
  },
  methodName: {
    fontSize: Platform.select({ default: 14, web: 16 }),
    fontWeight: '600',
    color: BrandColors.neutral[700],
    marginBottom: Platform.select({ default: 0, web: 4 }),
    flex: Platform.select({ default: 1, web: 0 }),
  },
  methodDetail: {
    fontSize: Platform.select({ default: 12, web: 14 }),
    color: BrandColors.neutral[600],
  },
  defaultBadge: {
    backgroundColor: BrandColors.primary[500],
    paddingHorizontal: Platform.select({ default: 6, web: 8 }),
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: Platform.select({ default: 0, web: 4 }),
    alignSelf: 'flex-start',
  },
  defaultText: {
    color: BrandColors.neutral[0],
    fontSize: Platform.select({ default: 9, web: 10 }),
    fontWeight: '600',
  },
  methodActions: {
    gap: Platform.select({ default: 4, web: 8 }),
    flexDirection: Platform.select({ default: 'row', web: 'column' }),
    alignItems: Platform.select({ default: 'center', web: 'flex-end' }),
  },
  methodAction: {
    paddingHorizontal: Platform.select({ default: 8, web: 12 }),
    paddingVertical: Platform.select({ default: 4, web: 6 }),
    backgroundColor: Platform.select({ default: BrandColors.neutral[0], web: 'transparent' }),
    borderRadius: Platform.select({ default: 4, web: 0 }),
    borderWidth: Platform.select({ default: 1, web: 0 }),
    borderColor: Platform.select({ default: BrandColors.neutral[200], web: 'transparent' }),
  },
  methodActionText: {
    fontSize: Platform.select({ default: 12, web: 14 }),
    color: BrandColors.primary[500],
    fontWeight: '500',
  },
  removeText: {
    color: BrandColors.semantic.error,
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandColors.primary[500],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: Platform.select({ default: 12, web: 16 }),
    marginTop: 12,
    minHeight: Platform.select({ default: 48, web: 56 }),
  },
  addMethodIcon: {
    fontSize: Platform.select({ default: 18, web: 20 }),
    color: BrandColors.primary[500],
    marginRight: 8,
  },
  addMethodText: {
    fontSize: Platform.select({ default: 14, web: 16 }),
    color: BrandColors.primary[500],
    fontWeight: '600',
    textAlign: 'center',
    flex: Platform.select({ default: 1, web: 0 }),
  },
  addMethodOptions: {
    marginTop: 16,
    gap: Platform.select({ default: 6, web: 8 }),
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.neutral[0],
    padding: Platform.select({ default: 12, web: 16 }),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
    minHeight: Platform.select({ default: 44, web: 52 }),
  },
  methodOptionIcon: {
    fontSize: Platform.select({ default: 20, web: 24 }),
    marginRight: Platform.select({ default: 8, web: 12 }),
  },
  methodOptionText: {
    fontSize: Platform.select({ default: 14, web: 16 }),
    color: BrandColors.neutral[700],
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[200],
  },
  historyDate: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  historyMonth: {
    fontSize: 12,
    color: BrandColors.neutral[400],
    textTransform: 'uppercase',
  },
  historyDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.primary[500],
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    color: BrandColors.neutral[700],
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  historyType: {
    fontSize: 12,
    color: BrandColors.neutral[600],
    textTransform: 'capitalize',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.semantic.error,
  },
});

export default MarketerPaymentsPage;