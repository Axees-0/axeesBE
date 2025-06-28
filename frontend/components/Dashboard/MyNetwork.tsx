import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  FlatList,
  Alert,
  Platform,
  Modal,
  TextInput
} from 'react-native';
import { Image } from 'expo-image';
import { Color } from '@/GlobalStyles';
import { DemoData } from '@/demo/DemoData';

interface NetworkCreator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  totalFollowers: number;
  avgEngagement: number;
  categories: string[];
  estimatedCost: number;
  
  // Network-specific data
  addedDate: Date;
  lastContactDate: Date | null;
  status: 'active' | 'contacted' | 'negotiating' | 'contracted' | 'completed' | 'declined';
  notes: string;
  tags: string[];
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    date: Date;
    payment: number;
  }>;
  communicationHistory: Array<{
    id: string;
    type: 'email' | 'message' | 'call' | 'meeting';
    date: Date;
    subject: string;
    notes: string;
  }>;
  responseRate: number;
  averageResponseTime: number; // in hours
}

type FilterType = 'all' | 'active' | 'contacted' | 'negotiating' | 'contracted' | 'completed';

export const MyNetwork: React.FC = () => {
  const [networkCreators, setNetworkCreators] = useState<NetworkCreator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<NetworkCreator[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<NetworkCreator | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    // Initialize with some demo saved creators
    const savedCreators: NetworkCreator[] = DemoData.creators.slice(0, 8).map((creator, index) => ({
      id: creator._id,
      name: creator.name,
      handle: creator.userName,
      avatarUrl: creator.avatarUrl,
      totalFollowers: creator.creatorData?.totalFollowers || 10000,
      avgEngagement: 3.5,
      categories: creator.creatorData?.categories || ['Creator'],
      estimatedCost: Math.floor(Math.random() * 2000) + 500,
      
      addedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
      lastContactDate: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      status: getRandomStatus(),
      notes: getRandomNotes(),
      tags: getRandomTags(),
      campaigns: generateRandomCampaigns(),
      communicationHistory: generateCommunicationHistory(),
      responseRate: Math.random() * 0.8 + 0.2,
      averageResponseTime: Math.random() * 48 + 2,
    }));

    setNetworkCreators(savedCreators);
    setFilteredCreators(savedCreators);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeFilter, searchText, networkCreators]);

  const getRandomStatus = (): NetworkCreator['status'] => {
    const statuses: NetworkCreator['status'][] = ['active', 'contacted', 'negotiating', 'contracted', 'completed', 'declined'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getRandomNotes = (): string => {
    const notes = [
      'Great engagement rates, responsive to messages',
      'Interested in long-term partnership',
      'Prefers video content over static posts',
      'Available for exclusive deals',
      'Strong audience in 18-34 demographic',
      'Premium pricing but worth it for quality',
      'Quick turnaround times',
      'Excellent collaboration on previous campaign'
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  };

  const getRandomTags = (): string[] => {
    const allTags = ['High ROI', 'Quick Response', 'Premium', 'Exclusive', 'Repeat Customer', 'Video Specialist', 'Story Expert'];
    const count = Math.floor(Math.random() * 3) + 1;
    return allTags.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const generateRandomCampaigns = () => {
    const campaignCount = Math.floor(Math.random() * 4);
    return Array.from({ length: campaignCount }, (_, i) => ({
      id: `campaign-${i}`,
      name: `Campaign ${i + 1}`,
      status: ['completed', 'active', 'planned'][Math.floor(Math.random() * 3)],
      date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      payment: Math.floor(Math.random() * 2000) + 500,
    }));
  };

  const generateCommunicationHistory = () => {
    const historyCount = Math.floor(Math.random() * 6) + 1;
    const types: Array<'email' | 'message' | 'call' | 'meeting'> = ['email', 'message', 'call', 'meeting'];
    
    return Array.from({ length: historyCount }, (_, i) => ({
      id: `comm-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      subject: `Discussion about collaboration ${i + 1}`,
      notes: 'Initial outreach and interest discussion',
    }));
  };

  const applyFilters = () => {
    let filtered = networkCreators;

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(creator => creator.status === activeFilter);
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.name.toLowerCase().includes(searchLower) ||
        creator.handle.toLowerCase().includes(searchLower) ||
        creator.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        creator.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCreators(filtered);
  };

  const getStatusColor = (status: NetworkCreator['status']) => {
    const colors = {
      active: '#4CAF50',
      contacted: '#2196F3',
      negotiating: '#FF9800',
      contracted: '#9C27B0',
      completed: '#607D8B',
      declined: '#F44336',
    };
    return colors[status];
  };

  const getStatusText = (status: NetworkCreator['status']) => {
    const texts = {
      active: 'Active',
      contacted: 'Contacted',
      negotiating: 'Negotiating',
      contracted: 'Under Contract',
      completed: 'Completed',
      declined: 'Declined',
    };
    return texts[status];
  };

  const handleCreatorPress = (creator: NetworkCreator) => {
    setSelectedCreator(creator);
    setIsModalVisible(true);
  };

  const addNote = () => {
    if (selectedCreator && newNote.trim()) {
      const updatedHistory = [...selectedCreator.communicationHistory, {
        id: `note-${Date.now()}`,
        type: 'message' as const,
        date: new Date(),
        subject: 'Note added',
        notes: newNote.trim(),
      }];

      const updatedCreator = {
        ...selectedCreator,
        communicationHistory: updatedHistory,
        lastContactDate: new Date(),
      };

      setNetworkCreators(prev => 
        prev.map(creator => 
          creator.id === selectedCreator.id ? updatedCreator : creator
        )
      );
      
      setSelectedCreator(updatedCreator);
      setNewNote('');
    }
  };

  const updateCreatorStatus = (status: NetworkCreator['status']) => {
    if (selectedCreator) {
      const updatedCreator = { ...selectedCreator, status };
      
      setNetworkCreators(prev => 
        prev.map(creator => 
          creator.id === selectedCreator.id ? updatedCreator : creator
        )
      );
      
      setSelectedCreator(updatedCreator);
    }
  };

  const removeFromNetwork = () => {
    if (selectedCreator) {
      Alert.alert(
        'Remove from Network',
        `Remove ${selectedCreator.name} from your network?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: () => {
              setNetworkCreators(prev => 
                prev.filter(creator => creator.id !== selectedCreator.id)
              );
              setIsModalVisible(false);
            }
          }
        ]
      );
    }
  };

  const renderCreatorCard = ({ item }: { item: NetworkCreator }) => (
    <TouchableOpacity 
      style={styles.creatorCard}
      onPress={() => handleCreatorPress(item)}
    >
      <Image
        style={styles.avatar}
        source={item.avatarUrl || require("@/assets/empty-image.png")}
        placeholder={require("@/assets/empty-image.png")}
        contentFit="cover"
      />
      
      <View style={styles.creatorInfo}>
        <View style={styles.creatorHeader}>
          <Text style={styles.creatorName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.creatorHandle}>@{item.handle}</Text>
        <Text style={styles.creatorStats}>
          {item.totalFollowers.toLocaleString()} followers • {item.avgEngagement.toFixed(1)}% engagement
        </Text>
        
        <View style={styles.networkStats}>
          <Text style={styles.networkStat}>
            📅 Added {item.addedDate.toLocaleDateString()}
          </Text>
          {item.lastContactDate && (
            <Text style={styles.networkStat}>
              💬 Last contact {item.lastContactDate.toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <View style={styles.tags}>
          {item.tags.slice(0, 2).map((tag, index) => (
            <Text key={index} style={styles.tag}>{tag}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const filters: { id: FilterType; name: string; count: number }[] = [
    { id: 'all', name: 'All', count: networkCreators.length },
    { id: 'active', name: 'Active', count: networkCreators.filter(c => c.status === 'active').length },
    { id: 'contacted', name: 'Contacted', count: networkCreators.filter(c => c.status === 'contacted').length },
    { id: 'negotiating', name: 'Negotiating', count: networkCreators.filter(c => c.status === 'negotiating').length },
    { id: 'contracted', name: 'Under Contract', count: networkCreators.filter(c => c.status === 'contracted').length },
    { id: 'completed', name: 'Completed', count: networkCreators.filter(c => c.status === 'completed').length },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧩 My Network</Text>
        <Text style={styles.headerSubtitle}>
          Manage your influencer relationships and communication history
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your network..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              activeFilter === filter.id && styles.activeFilterChip
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter.id && styles.activeFilterText
            ]}>
              {filter.name} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Network Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{networkCreators.length}</Text>
          <Text style={styles.statLabel}>Total Creators</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {networkCreators.reduce((acc, creator) => acc + creator.totalFollowers, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Reach</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {networkCreators.filter(c => c.status === 'contracted').length}
          </Text>
          <Text style={styles.statLabel}>Active Contracts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {(networkCreators.reduce((acc, creator) => acc + creator.responseRate, 0) / networkCreators.length * 100).toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Avg Response Rate</Text>
        </View>
      </View>

      {/* Creators List */}
      <FlatList
        data={filteredCreators}
        renderItem={renderCreatorCard}
        keyExtractor={(item) => item.id}
        style={styles.creatorsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No creators found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Try adjusting your search' : 'Start building your network by saving creators'}
            </Text>
          </View>
        }
      />

      {/* Creator Detail Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedCreator && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCreator.name}</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Creator Info */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Creator Information</Text>
                <Text style={styles.modalText}>Handle: @{selectedCreator.handle}</Text>
                <Text style={styles.modalText}>
                  Followers: {selectedCreator.totalFollowers.toLocaleString()}
                </Text>
                <Text style={styles.modalText}>
                  Engagement: {selectedCreator.avgEngagement.toFixed(1)}%
                </Text>
                <Text style={styles.modalText}>
                  Estimated Cost: ${selectedCreator.estimatedCost}/post
                </Text>
              </View>

              {/* Status Update */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(['active', 'contacted', 'negotiating', 'contracted', 'completed', 'declined'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        selectedCreator.status === status && styles.selectedStatusOption,
                        { borderColor: getStatusColor(status) }
                      ]}
                      onPress={() => updateCreatorStatus(status)}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        selectedCreator.status === status && { color: getStatusColor(status) }
                      ]}>
                        {getStatusText(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.modalText}>{selectedCreator.notes}</Text>
              </View>

              {/* Add Note */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Add Communication Note</Text>
                <TextInput
                  style={styles.noteInput}
                  multiline
                  numberOfLines={3}
                  placeholder="Add a note about your communication..."
                  value={newNote}
                  onChangeText={setNewNote}
                />
                <TouchableOpacity 
                  style={styles.addNoteButton}
                  onPress={addNote}
                  disabled={!newNote.trim()}
                >
                  <Text style={styles.addNoteButtonText}>Add Note</Text>
                </TouchableOpacity>
              </View>

              {/* Communication History */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Communication History</Text>
                {selectedCreator.communicationHistory.map((comm) => (
                  <View key={comm.id} style={styles.commItem}>
                    <View style={styles.commHeader}>
                      <Text style={styles.commType}>{comm.type.toUpperCase()}</Text>
                      <Text style={styles.commDate}>{comm.date.toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.commSubject}>{comm.subject}</Text>
                    <Text style={styles.commNotes}>{comm.notes}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={removeFromNetwork}
                >
                  <Text style={styles.removeButtonText}>Remove from Network</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: Color.cSK430B92500,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  creatorsList: {
    flex: 1,
    padding: 16,
  },
  creatorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
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
    alignItems: 'center',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  creatorHandle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  creatorStats: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  networkStats: {
    marginBottom: 8,
  },
  networkStat: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: 'white',
  },
  selectedStatusOption: {
    backgroundColor: '#f0f0f0',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  addNoteButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addNoteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  commItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  commDate: {
    fontSize: 10,
    color: '#666',
  },
  commSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  commNotes: {
    fontSize: 11,
    color: '#666',
  },
  modalActions: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginTop: 16,
  },
  removeButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyNetwork;