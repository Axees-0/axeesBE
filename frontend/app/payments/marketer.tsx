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
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

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
  
  // Demo payment data
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'pm-1',
      type: 'credit_card',
      name: 'Visa ending in 4242',
      last4: '4242',
      isDefault: true,
      icon: '💳',
    },
    {
      id: 'pm-2',
      type: 'paypal',
      name: 'PayPal',
      email: 'sarah@techstyle.com',
      isDefault: false,
      icon: '🅿️',
    },
  ]);

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

  const activeDeals = 3;
  const pendingPayments = transactions.filter(t => t.status === 'pending').length;

  const handleAddPaymentMethod = (type: string) => {
    Alert.alert(
      'Add Payment Method',
      `Add new ${type} payment method?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: () => {
            Alert.alert('Success', 'Payment method added successfully');
            setShowAddMethod(false);
          }
        }
      ]
    );
  };

  const handleRemoveMethod = (method: PaymentMethod) => {
    if (method.isDefault) {
      Alert.alert('Cannot Remove', 'You cannot remove your default payment method. Please set another method as default first.');
      return;
    }
    
    Alert.alert(
      'Remove Payment Method',
      `Remove ${method.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive' }
      ]
    );
  };

  const handleSetDefault = (method: PaymentMethod) => {
    Alert.alert(
      'Set Default',
      `Set ${method.name} as your default payment method?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set Default' }
      ]
    );
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft width={24} height={24} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Payments</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'methods' && styles.activeTab]}
            onPress={() => setActiveTab('methods')}
          >
            <Text style={[styles.tabText, activeTab === 'methods' && styles.activeTabText]}>
              Payment Methods
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
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
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
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
                <TouchableOpacity style={styles.actionCard}>
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
            <View style={styles.tabContent}>
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
                      >
                        <Text style={styles.methodActionText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.methodAction}
                      onPress={() => handleRemoveMethod(method)}
                    >
                      <Text style={[styles.methodActionText, styles.removeText]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity 
                style={styles.addMethodButton}
                onPress={() => setShowAddMethod(true)}
              >
                <Text style={styles.addMethodIcon}>+</Text>
                <Text style={styles.addMethodText}>Add Payment Method</Text>
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
            <View style={styles.tabContent}>
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
      </SafeAreaView>
    </>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#10B981';
    case 'pending': return '#F59E0B';
    case 'failed': return '#EF4444';
    default: return '#6B7280';
  }
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Color.cSK430B92500,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: Color.cSK430B92500,
    fontWeight: '600',
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
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    fontSize: 18,
    color: '#999',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  positiveAmount: {
    color: '#10B981',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodEmoji: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDetail: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  methodActions: {
    gap: 8,
  },
  methodAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  methodActionText: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '500',
  },
  removeText: {
    color: '#EF4444',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Color.cSK430B92500,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  addMethodIcon: {
    fontSize: 20,
    color: Color.cSK430B92500,
    marginRight: 8,
  },
  addMethodText: {
    fontSize: 16,
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
  addMethodOptions: {
    marginTop: 16,
    gap: 8,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodOptionText: {
    fontSize: 16,
    color: '#333',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDate: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  historyMonth: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  historyDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    color: '#333',
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
    color: '#666',
    textTransform: 'capitalize',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default MarketerPaymentsPage;