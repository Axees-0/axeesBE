import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';

const CampaignsPage = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock campaign data
  const campaigns = [
    {
      id: '1',
      name: 'Summer Fashion Collection',
      status: 'active',
      budget: '$15,000',
      creators: 12,
      progress: 65,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      image: require('@/assets/empty-image.png'),
    },
    {
      id: '2',
      name: 'Tech Product Launch',
      status: 'active',
      budget: '$25,000',
      creators: 8,
      progress: 40,
      startDate: '2024-06-15',
      endDate: '2024-07-30',
      image: require('@/assets/empty-image.png'),
    },
    {
      id: '3',
      name: 'Wellness Brand Partnership',
      status: 'draft',
      budget: '$10,000',
      creators: 0,
      progress: 0,
      startDate: 'TBD',
      endDate: 'TBD',
      image: require('@/assets/empty-image.png'),
    },
    {
      id: '4',
      name: 'Holiday Campaign 2023',
      status: 'completed',
      budget: '$30,000',
      creators: 20,
      progress: 100,
      startDate: '2023-11-01',
      endDate: '2023-12-31',
      image: require('@/assets/empty-image.png'),
    },
  ];

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesTab = campaign.status === activeTab;
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <UniversalBackButton />
        <Text style={styles.headerTitle}>My Campaigns</Text>
        <TouchableOpacity 
          style={styles.newCampaignButton}
          onPress={() => router.push('/campaigns/create')}
        >
          <Ionicons name="add-circle" size={24} color="#430B92" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campaigns..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['active', 'draft', 'completed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campaign List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredCampaigns.map((campaign) => (
          <TouchableOpacity
            key={campaign.id}
            style={styles.campaignCard}
            onPress={() => router.push(`/campaigns/${campaign.id}`)}
          >
            <Image
              source={campaign.image}
              style={styles.campaignImage}
              contentFit="cover"
            />
            <View style={styles.campaignInfo}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>
                    {campaign.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.campaignStats}>
                <View style={styles.stat}>
                  <MaterialCommunityIcons name="currency-usd" size={16} color="#6B7280" />
                  <Text style={styles.statText}>{campaign.budget}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="people" size={16} color="#6B7280" />
                  <Text style={styles.statText}>{campaign.creators} creators</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="calendar" size={14} color="#6B7280" />
                  <Text style={styles.statText}>{campaign.startDate}</Text>
                </View>
              </View>

              {campaign.status === 'active' && (
                <View style={styles.progressSection}>
                  <Text style={styles.progressText}>Progress: {campaign.progress}%</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${campaign.progress}%` }]} 
                    />
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 16,
    fontFamily: DesignSystem.Typography.h2.fontFamily,
  },
  newCampaignButton: {
    padding: 8,
  },
  searchSection: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#430B92',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  tabTextActive: {
    color: '#430B92',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  campaignCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  campaignImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  campaignStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  progressSection: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
});

export default CampaignsPage;