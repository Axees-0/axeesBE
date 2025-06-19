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
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingPayments: number;
  thisMonth: number;
  lastMonth: number;
  completedDeals: number;
  averageDealValue: number;
}

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'pending';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'processing';
  dealId?: string;
}

const EarningsPage: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  
  // Demo earnings data
  const [earningsData] = useState<EarningsData>({
    totalEarnings: 12450,
    availableBalance: 3280,
    pendingPayments: 1850,
    thisMonth: 2650,
    lastMonth: 1890,
    completedDeals: 23,
    averageDealValue: 541,
  });

  // Demo transaction history
  const [transactions] = useState<Transaction[]>([
    {
      id: 'TXN-001',
      type: 'earning',
      amount: 1500,
      description: 'Instagram Post Campaign - TechStyle Brand',
      date: '2024-06-20',
      status: 'completed',
      dealId: 'DEAL-001',
    },
    {
      id: 'TXN-002',
      type: 'withdrawal',
      amount: -800,
      description: 'Withdrawal to Bank Account ****1234',
      date: '2024-06-18',
      status: 'completed',
    },
    {
      id: 'TXN-003',
      type: 'pending',
      amount: 1200,
      description: 'Product Review Video - FitTech Solutions',
      date: '2024-06-15',
      status: 'pending',
      dealId: 'DEAL-002',
    },
    {
      id: 'TXN-004',
      type: 'earning',
      amount: 750,
      description: 'TikTok Series - Beauty Collective',
      date: '2024-06-12',
      status: 'completed',
      dealId: 'DEAL-003',
    },
    {
      id: 'TXN-005',
      type: 'pending',
      amount: 650,
      description: 'Gaming Stream - GamerHub',
      date: '2024-06-10',
      status: 'pending',
      dealId: 'DEAL-004',
    },
  ]);

  const handleWithdraw = () => {
    if (earningsData.availableBalance < 50) {
      Alert.alert('Minimum Withdrawal', 'Minimum withdrawal amount is $50.');
      return;
    }
    
    router.push('/earnings/withdraw');
  };

  const handleViewTransaction = (transaction: Transaction) => {
    if (transaction.dealId) {
      router.push({
        pathname: '/deals/[id]',
        params: { id: transaction.dealId }
      });
    } else {
      Alert.alert('Transaction Details', `Transaction ${transaction.id}\nAmount: $${Math.abs(transaction.amount)}\nDate: ${new Date(transaction.date).toLocaleDateString()}`);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning': return '💰';
      case 'withdrawal': return '🏦';
      case 'pending': return '⏳';
      default: return '💳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      default: return status;
    }
  };

  return (
    <>
      <WebSEO 
        title="Earnings & Payments | Axees"
        description="Track your earnings and manage withdrawals"
        keywords="creator earnings, payments, withdrawals, income tracking"
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
          
          <Text style={styles.headerTitle}>Earnings & Payments</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Balance Overview */}
          <View style={styles.balanceSection}>
            <View style={styles.mainBalanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>${earningsData.availableBalance.toLocaleString()}</Text>
              <Text style={styles.balanceSubtext}>Ready to withdraw</Text>
              
              <TouchableOpacity 
                style={[
                  styles.withdrawButton,
                  earningsData.availableBalance < 50 && styles.disabledWithdrawButton
                ]}
                onPress={handleWithdraw}
                disabled={earningsData.availableBalance < 50}
              >
                <Text style={[
                  styles.withdrawButtonText,
                  earningsData.availableBalance < 50 && styles.disabledWithdrawButtonText
                ]}>
                  Withdraw Funds
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${earningsData.pendingPayments.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${earningsData.totalEarnings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
            </View>
          </View>

          {/* Monthly Performance */}
          <View style={styles.performanceSection}>
            <Text style={styles.sectionTitle}>Monthly Performance</Text>
            
            <View style={styles.monthlyStats}>
              <View style={styles.monthCard}>
                <Text style={styles.monthLabel}>This Month</Text>
                <Text style={styles.monthValue}>${earningsData.thisMonth.toLocaleString()}</Text>
                <View style={styles.monthChange}>
                  <Text style={styles.monthChangeText}>
                    +{Math.round(((earningsData.thisMonth - earningsData.lastMonth) / earningsData.lastMonth) * 100)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.monthCard}>
                <Text style={styles.monthLabel}>Last Month</Text>
                <Text style={styles.monthValue}>${earningsData.lastMonth.toLocaleString()}</Text>
                <Text style={styles.monthSubtext}>June 2024</Text>
              </View>
            </View>

            <View style={styles.additionalStats}>
              <View style={styles.additionalStatCard}>
                <Text style={styles.additionalStatValue}>{earningsData.completedDeals}</Text>
                <Text style={styles.additionalStatLabel}>Completed Deals</Text>
              </View>
              <View style={styles.additionalStatCard}>
                <Text style={styles.additionalStatValue}>${earningsData.averageDealValue}</Text>
                <Text style={styles.additionalStatLabel}>Avg Deal Value</Text>
              </View>
            </View>
          </View>

          {/* Transaction History */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionCard}
                  onPress={() => handleViewTransaction(transaction)}
                >
                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionIconContainer}>
                      <Text style={styles.transactionIcon}>
                        {getTransactionIcon(transaction.type)}
                      </Text>
                    </View>
                    
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
                    ]}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                    </Text>
                    
                    <View style={[
                      styles.transactionStatus,
                      { backgroundColor: getStatusColor(transaction.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.transactionStatusText,
                        { color: getStatusColor(transaction.status) }
                      ]}>
                        {getStatusLabel(transaction.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentInfoSection}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoItem}>💳 Payments are processed within 1-3 business days</Text>
              <Text style={styles.infoItem}>💰 Minimum withdrawal amount is $50</Text>
              <Text style={styles.infoItem}>🏦 Connect your bank account for faster transfers</Text>
              <Text style={styles.infoItem}>📊 Tax documents are available in your account settings</Text>
            </View>
          </View>
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
    width: 32,
  },
  scrollContainer: {
    flex: 1,
  },
  balanceSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  mainBalanceCard: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginBottom: 20,
  },
  withdrawButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  disabledWithdrawButton: {
    backgroundColor: '#FFFFFF40',
  },
  withdrawButtonText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledWithdrawButtonText: {
    color: '#FFFFFF60',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  performanceSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  monthlyStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  monthCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  monthLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  monthValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  monthChange: {
    alignSelf: 'flex-start',
  },
  monthChangeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  monthSubtext: {
    fontSize: 12,
    color: '#999',
  },
  additionalStats: {
    flexDirection: 'row',
    gap: 12,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  additionalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  transactionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentInfoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
});

export default EarningsPage;