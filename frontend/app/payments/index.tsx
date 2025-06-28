import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import {
  Ionicons,
  MaterialIcons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';
import { BrandColors } from '@/constants/Colors';

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for payments
  const stats = {
    totalPaid: '$45,320',
    pending: '$12,450',
    thisMonth: '$8,900',
    activeCreators: 24
  };

  const transactions = [
    {
      id: '1',
      creator: '@fashionista',
      avatar: require('@/assets/empty-image.png'),
      amount: '$2,500',
      status: 'completed',
      date: '2024-01-15',
      campaign: 'Spring Collection'
    },
    {
      id: '2',
      creator: '@techguru',
      avatar: require('@/assets/empty-image.png'),
      amount: '$1,800',
      status: 'pending',
      date: '2024-01-14',
      campaign: 'Product Launch'
    },
    {
      id: '3',
      creator: '@lifestyle',
      avatar: require('@/assets/empty-image.png'),
      amount: '$3,200',
      status: 'processing',
      date: '2024-01-13',
      campaign: 'Brand Awareness'
    },
    {
      id: '4',
      creator: '@beautyqueen',
      avatar: require('@/assets/empty-image.png'),
      amount: '$1,500',
      status: 'completed',
      date: '2024-01-12',
      campaign: 'Makeup Tutorial'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return BrandColors.semantic.success;
      case 'pending': return BrandColors.semantic.warning;
      case 'processing': return BrandColors.semantic.info;
      default: return BrandColors.neutral[500];
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    return transaction.status === activeTab;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <UniversalBackButton fallbackRoute="/" />
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Feather name="download" size={20} color={BrandColors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={[styles.statCard, { backgroundColor: BrandColors.semantic.infoLight }]}>
            <MaterialIcons name="paid" size={24} color={BrandColors.semantic.info} />
            <Text style={styles.statAmount}>{stats.totalPaid}</Text>
            <Text style={styles.statLabel}>Total Paid</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: BrandColors.semantic.warningLight }]}>
            <MaterialIcons name="pending" size={24} color={BrandColors.semantic.warning} />
            <Text style={styles.statAmount}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: BrandColors.semantic.successLight }]}>
            <MaterialIcons name="calendar-today" size={24} color={BrandColors.semantic.success} />
            <Text style={styles.statAmount}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: BrandColors.primary[100] }]}>
            <MaterialCommunityIcons name="account-group" size={24} color={BrandColors.primary[400]} />
            <Text style={styles.statAmount}>{stats.activeCreators}</Text>
            <Text style={styles.statLabel}>Active Creators</Text>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={BrandColors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BrandColors.neutral[400]}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'processing' && styles.activeTab]}
            onPress={() => setActiveTab('processing')}
          >
            <Text style={[styles.tabText, activeTab === 'processing' && styles.activeTabText]}>
              Processing
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {filteredTransactions.map((transaction) => (
            <TouchableOpacity key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.creatorInfo}>
                  <Image
                    source={transaction.avatar}
                    style={styles.creatorAvatar}
                    contentFit="cover"
                  />
                  <View>
                    <Text style={styles.creatorName}>{transaction.creator}</Text>
                    <Text style={styles.campaignName}>{transaction.campaign}</Text>
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.transactionFooter}>
                <Text style={styles.transactionDate}>
                  <Ionicons name="calendar-outline" size={14} color={BrandColors.neutral[500]} /> {transaction.date}
                </Text>
                <TouchableOpacity>
                  <MaterialIcons name="more-horiz" size={20} color={BrandColors.neutral[500]} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <LinearGradient
              colors={[BrandColors.primary[500], BrandColors.primary[400]]}
              style={styles.gradientButton}
            >
              <FontAwesome5 name="file-invoice" size={18} color={BrandColors.neutral[0]} />
              <Text style={styles.buttonText}>Generate Invoice</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <MaterialIcons name="payment" size={20} color={BrandColors.primary[500]} />
            <Text style={styles.secondaryButtonText}>Payment Methods</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.neutral[900],
  },
  exportButton: {
    padding: 8,
    backgroundColor: BrandColors.neutral[100],
    borderRadius: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  statAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.neutral[900],
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.neutral[50],
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: BrandColors.neutral[900],
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: BrandColors.neutral[100],
  },
  activeTab: {
    backgroundColor: BrandColors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.neutral[500],
  },
  activeTabText: {
    color: BrandColors.neutral[0],
  },
  transactionsList: {
    paddingHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[900],
  },
  campaignName: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    marginTop: 2,
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.neutral[900],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 14,
    color: BrandColors.neutral[500],
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[0],
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.primary[500],
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.primary[500],
  },
});

export default PaymentsPage;