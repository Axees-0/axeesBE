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
import { DemoData } from '@/demo/DemoData';

const NetworkPage = () => {
  const [activeTab, setActiveTab] = useState<'saved' | 'contacts' | 'collaborations'>('saved');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock saved creators data
  const savedCreators = DemoData.creators.slice(0, 5).map(creator => ({
    ...creator,
    savedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Great engagement rates, perfect for fashion campaigns',
  }));

  // Mock contacts data
  const contacts = [
    {
      id: '1',
      name: 'Emily Johnson',
      role: 'Talent Manager',
      agency: 'Creative Minds Agency',
      email: 'emily@creativeminds.com',
      phone: '+1 (555) 123-4567',
      avatar: require('@/assets/empty-image.png'),
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Brand Manager',
      agency: 'TechStyle Brands',
      email: 'michael@techstyle.com',
      phone: '+1 (555) 987-6543',
      avatar: require('@/assets/empty-image.png'),
    },
  ];

  // Mock collaborations data
  const collaborations = [
    {
      id: '1',
      creatorName: 'Alex Chen',
      campaignName: 'Summer Tech Review',
      status: 'completed',
      date: '2024-05-15',
      performance: 'excellent',
    },
    {
      id: '2',
      creatorName: 'Sophia Style',
      campaignName: 'Fashion Week Coverage',
      status: 'ongoing',
      date: '2024-06-01',
      performance: 'good',
    },
  ];

  const renderSavedCreators = () => (
    <View style={styles.tabContent}>
      {savedCreators
        .filter(creator => 
          creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          creator.userName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((creator) => (
          <TouchableOpacity
            key={creator._id}
            style={styles.creatorCard}
            onPress={() => router.push(`/profile/${creator._id}`)}
          >
            <Image
              source={creator.avatarUrl || require('@/assets/empty-image.png')}
              style={styles.creatorAvatar}
              contentFit="cover"
            />
            <View style={styles.creatorInfo}>
              <View style={styles.creatorHeader}>
                <Text style={styles.creatorName}>{creator.name}</Text>
                <TouchableOpacity style={styles.removeButton}>
                  <Ionicons name="bookmark" size={20} color="#430B92" />
                </TouchableOpacity>
              </View>
              <Text style={styles.creatorHandle}>@{creator.userName}</Text>
              <Text style={styles.creatorNotes}>{creator.notes}</Text>
              <View style={styles.creatorStats}>
                <View style={styles.stat}>
                  <FontAwesome5 name="users" size={12} color="#6B7280" />
                  <Text style={styles.statText}>
                    {(creator.creatorData?.totalFollowers || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text style={styles.statText}>{creator.location}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
    </View>
  );

  const renderContacts = () => (
    <View style={styles.tabContent}>
      {contacts
        .filter(contact => 
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.agency.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <Image
              source={contact.avatar}
              style={styles.contactAvatar}
              contentFit="cover"
            />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactRole}>{contact.role} at {contact.agency}</Text>
              <View style={styles.contactDetails}>
                <TouchableOpacity style={styles.contactAction}>
                  <Ionicons name="mail-outline" size={16} color="#430B92" />
                  <Text style={styles.contactActionText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactAction}>
                  <Ionicons name="call-outline" size={16} color="#430B92" />
                  <Text style={styles.contactActionText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
    </View>
  );

  const renderCollaborations = () => (
    <View style={styles.tabContent}>
      {collaborations
        .filter(collab => 
          collab.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          collab.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((collab) => (
          <View key={collab.id} style={styles.collaborationCard}>
            <View style={styles.collaborationHeader}>
              <Text style={styles.collaborationCreator}>{collab.creatorName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(collab.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(collab.status) }]}>
                  {collab.status}
                </Text>
              </View>
            </View>
            <Text style={styles.collaborationCampaign}>{collab.campaignName}</Text>
            <View style={styles.collaborationFooter}>
              <Text style={styles.collaborationDate}>
                <Ionicons name="calendar-outline" size={12} color="#6B7280" /> {collab.date}
              </Text>
              <View style={styles.performanceBadge}>
                <Text style={styles.performanceText}>
                  Performance: {collab.performance}
                </Text>
              </View>
            </View>
          </View>
        ))}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'ongoing': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <UniversalBackButton />
        <Text style={styles.headerTitle}>My Network</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color="#430B92" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search network..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['saved', 'contacts', 'collaborations'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            <View style={styles.tabCount}>
              <Text style={[styles.tabCountText, activeTab === tab && styles.tabCountTextActive]}>
                {tab === 'saved' ? savedCreators.length : 
                 tab === 'contacts' ? contacts.length : 
                 collaborations.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'saved' && renderSavedCreators()}
        {activeTab === 'contacts' && renderContacts()}
        {activeTab === 'collaborations' && renderCollaborations()}
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
  addButton: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#430B92',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  tabTextActive: {
    color: '#430B92',
    fontWeight: '600',
  },
  tabCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tabCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabCountTextActive: {
    backgroundColor: '#430B92',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  creatorCard: {
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
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  removeButton: {
    padding: 4,
  },
  creatorHandle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  creatorNotes: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  creatorStats: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  contactRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  contactDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactActionText: {
    fontSize: 14,
    color: '#430B92',
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  collaborationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  collaborationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  collaborationCreator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
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
  collaborationCampaign: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  collaborationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collaborationDate: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  performanceBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  performanceText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
});

export default NetworkPage;