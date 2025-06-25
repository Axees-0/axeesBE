import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Pressable, 
  Platform, 
  useWindowDimensions,
  Alert 
} from 'react-native';
import { Image } from 'expo-image';
import { Color, Focus } from '@/GlobalStyles';
import { router } from 'expo-router';
import { DemoData } from '@/demo/DemoData';
import { AdvancedFilters } from './AdvancedFilters';
import { SmartBlast } from './SmartBlast';
import { CreativeServices } from './CreativeServices';
import { PerformanceServices } from './PerformanceServices';
import { MyNetwork } from './MyNetwork';
import { useAuth } from '@/contexts/AuthContext';
import { Feather, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

type TabType = 'search' | 'smart-blast' | 'creative-services' | 'performance-services' | 'my-network';

const Dashboard = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  
  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>('search');
  
  // Filter management
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  
  // Batch selection
  const [batchSize, setBatchSize] = useState<number>(10);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  
  // Creator data with enhanced structure
  const creators = DemoData.creators.map(creator => {
    const totalFollowers = creator.creatorData?.totalFollowers || 0;
    const platforms = creator.creatorData?.platforms || [];
    const avgEngagement = platforms.reduce((acc, p) => acc + (p.engagement || 0), 0) / Math.max(platforms.length, 1);
    
    return {
      id: creator._id,
      name: creator.name,
      handle: creator.userName,
      bio: creator.bio,
      location: creator.location,
      avatarUrl: creator.avatarUrl,
      
      // Enhanced metrics
      totalFollowers,
      avgEngagement: avgEngagement.toFixed(1),
      platforms: platforms.map(p => p.platform).join(', '),
      categories: creator.creatorData?.categories || ['Creator'],
      
      // Dashboard-specific data
      tier: getTierFromFollowers(totalFollowers),
      estimatedCost: getEstimatedCost(totalFollowers, avgEngagement),
      postFrequency: getRandomPostFrequency(),
      demographics: getRandomDemographics(),
      languages: ['English'],
      gender: getRandomGender(),
      ageRange: getRandomAgeRange(),
      
      // Smart Blast compatibility
      isSelected: false,
      lastContactDate: null,
      responseRate: Math.random() * 0.8 + 0.2,
    };
  });

  const [filteredCreators, setFilteredCreators] = useState(creators);
  const [searchText, setSearchText] = useState('');

  // Helper functions
  function getTierFromFollowers(followers: number): string {
    if (followers >= 1000000) return 'Mega';
    if (followers >= 100000) return 'Macro';
    if (followers >= 10000) return 'Micro';
    return 'Nano';
  }

  function getEstimatedCost(followers: number, engagement: number): number {
    const baseCost = followers * 0.01;
    const engagementMultiplier = Math.max(engagement / 100, 0.5);
    return Math.round(baseCost * engagementMultiplier);
  }

  function getRandomPostFrequency(): string {
    const frequencies = ['Daily', 'Weekly', 'Monthly'];
    return frequencies[Math.floor(Math.random() * frequencies.length)];
  }

  function getRandomDemographics(): { age: string; location: string; interests: string[] } {
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
    const interests = ['Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Gaming'];
    
    return {
      age: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      location: 'US',
      interests: interests.slice(0, Math.floor(Math.random() * 3) + 1)
    };
  }

  function getRandomGender(): string {
    const genders = ['Male', 'Female', 'Non-binary'];
    return genders[Math.floor(Math.random() * genders.length)];
  }

  function getRandomAgeRange(): string {
    const ranges = ['18-24', '25-34', '35-44', '45-54', '55+'];
    return ranges[Math.floor(Math.random() * ranges.length)];
  }

  // Filter application
  const applyFilters = (filters: any) => {
    setAppliedFilters(filters);
    let filtered = creators;

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.name.toLowerCase().includes(searchLower) ||
        creator.location.toLowerCase().includes(searchLower) ||
        creator.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        creator.handle.toLowerCase().includes(searchLower)
      );
    }

    if (filters.priceRange) {
      filtered = filtered.filter(creator => 
        creator.estimatedCost >= filters.priceRange.min && 
        creator.estimatedCost <= filters.priceRange.max
      );
    }

    if (filters.tiers && filters.tiers.length > 0) {
      filtered = filtered.filter(creator => filters.tiers.includes(creator.tier));
    }

    if (filters.platforms && filters.platforms.length > 0) {
      filtered = filtered.filter(creator => 
        filters.platforms.some((platform: string) => creator.platforms.includes(platform))
      );
    }

    setFilteredCreators(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(appliedFilters);
  };

  // Batch selection handlers
  const handleBatchSelect = () => {
    const newSelection = new Set(selectedCreators);
    const availableCreators = filteredCreators.slice(0, batchSize);
    
    availableCreators.forEach(creator => {
      newSelection.add(creator.id);
    });
    
    setSelectedCreators(newSelection);
    Alert.alert('Batch Selection', `Selected ${availableCreators.length} creators`);
  };

  const toggleCreatorSelection = (creatorId: string) => {
    const newSelection = new Set(selectedCreators);
    if (newSelection.has(creatorId)) {
      newSelection.delete(creatorId);
    } else {
      newSelection.add(creatorId);
    }
    setSelectedCreators(newSelection);
  };

  // Search content (main dashboard)
  const renderSearchContent = () => (
    <View style={styles.searchContent}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search creators by name, location, or category..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => handleSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Batch Selection Bar */}
      <View style={styles.batchSelectionBar}>
        <Text style={styles.batchLabel}>Select batch size:</Text>
        <View style={styles.batchOptions}>
          {[10, 20, 50, 100].map(size => (
            <TouchableOpacity
              key={size}
              style={[styles.batchButton, batchSize === size && styles.batchButtonActive]}
              onPress={() => setBatchSize(size)}
            >
              <Text style={[styles.batchButtonText, batchSize === size && styles.batchButtonTextActive]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.selectBatchButton} onPress={handleBatchSelect}>
          <Text style={styles.selectBatchButtonText}>Select Top {batchSize}</Text>
        </TouchableOpacity>
      </View>

      {/* Results Summary */}
      <View style={styles.resultsSummary}>
        <Text style={styles.resultsText}>
          Found {filteredCreators.length.toLocaleString()} creators
        </Text>
        <Text style={styles.resultsSubtext}>
          {selectedCreators.size} selected • Total reach: {filteredCreators.reduce((acc, creator) => acc + creator.totalFollowers, 0).toLocaleString()} followers
        </Text>
      </View>

      {/* Creator Grid */}
      <ScrollView style={styles.creatorGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.creatorsContainer}>
          {filteredCreators.map((creator) => {
            const isSelected = selectedCreators.has(creator.id);
            return (
              <Pressable 
                key={creator.id}
                style={[styles.creatorCard, isSelected && styles.creatorCardSelected]}
                onPress={() => router.push(`/profile/${creator.id}`)}
                onLongPress={() => toggleCreatorSelection(creator.id)}
              >
                <TouchableOpacity 
                  style={styles.selectionCheckbox}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleCreatorSelection(creator.id);
                  }}
                >
                  {isSelected ? (
                    <Ionicons name="checkbox" size={24} color="#430B92" />
                  ) : (
                    <Ionicons name="square-outline" size={24} color="#ccc" />
                  )}
                </TouchableOpacity>

                <Image
                  style={styles.creatorAvatar}
                  source={creator.avatarUrl || require("@/assets/empty-image.png")}
                  placeholder={require("@/assets/empty-image.png")}
                  contentFit="cover"
                />
                
                <View style={styles.creatorInfo}>
                  <Text style={styles.creatorName}>{creator.name}</Text>
                  <Text style={styles.creatorHandle}>@{creator.handle}</Text>
                  <Text style={styles.creatorStats}>
                    <FontAwesome5 name="users" size={12} color="#666" /> {creator.totalFollowers.toLocaleString()} • 
                    <FontAwesome5 name="chart-line" size={12} color="#666" /> {creator.avgEngagement}%
                  </Text>
                  <Text style={styles.creatorTier}>
                    <MaterialIcons name="stars" size={14} color="#430B92" /> {creator.tier} • ${creator.estimatedCost}/post
                  </Text>
                  
                  <View style={styles.creatorTags}>
                    {creator.categories.slice(0, 2).map((tag, index) => (
                      <Text key={index} style={styles.tag}>{tag}</Text>
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return renderSearchContent();
      case 'smart-blast':
        return <SmartBlast creators={filteredCreators} filters={appliedFilters} />;
      case 'creative-services':
        return <CreativeServices />;
      case 'performance-services':
        return <PerformanceServices />;
      case 'my-network':
        return <MyNetwork />;
      default:
        return renderSearchContent();
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderTabContent()}
      </View>
      
      {/* Expandable Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.filtersToggle}
          onPress={() => setIsFiltersExpanded(!isFiltersExpanded)}
        >
          <View style={styles.filtersToggleContent}>
            <Feather name="filter" size={20} color="#430B92" />
            <Text style={styles.filtersToggleText}>
              Advanced Filters {isFiltersExpanded ? '▼' : '▲'}
            </Text>
            {Object.keys(appliedFilters).length > 0 && (
              <View style={styles.filtersBadge}>
                <Text style={styles.filtersBadgeText}>{Object.keys(appliedFilters).length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {isFiltersExpanded && (
          <AdvancedFilters 
            onFiltersChange={applyFilters}
            initialFilters={appliedFilters}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'search' && styles.navItemActive]}
          onPress={() => setActiveTab('search')}
        >
          <Feather name="search" size={24} color={activeTab === 'search' ? '#430B92' : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'search' && styles.navLabelActive]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'smart-blast' && styles.navItemActive]}
          onPress={() => setActiveTab('smart-blast')}
        >
          <Ionicons name="rocket" size={24} color={activeTab === 'smart-blast' ? '#430B92' : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'smart-blast' && styles.navLabelActive]}>Smart Blast</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'creative-services' && styles.navItemActive]}
          onPress={() => setActiveTab('creative-services')}
        >
          <Ionicons name="color-palette" size={24} color={activeTab === 'creative-services' ? '#430B92' : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'creative-services' && styles.navLabelActive]}>Creative</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'performance-services' && styles.navItemActive]}
          onPress={() => setActiveTab('performance-services')}
        >
          <Ionicons name="trending-up" size={24} color={activeTab === 'performance-services' ? '#430B92' : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'performance-services' && styles.navLabelActive]}>Services</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'my-network' && styles.navItemActive]}
          onPress={() => setActiveTab('my-network')}
        >
          <FontAwesome5 name="network-wired" size={20} color={activeTab === 'my-network' ? '#430B92' : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'my-network' && styles.navLabelActive]}>Network</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContent: {
    flex: 1,
  },
  searchContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  batchSelectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  batchLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  batchOptions: {
    flexDirection: 'row',
    flex: 1,
  },
  batchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  batchButtonActive: {
    backgroundColor: '#430B92',
    borderColor: '#430B92',
  },
  batchButtonText: {
    fontSize: 14,
    color: '#666',
  },
  batchButtonTextActive: {
    color: '#ffffff',
  },
  selectBatchButton: {
    backgroundColor: '#430B92',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectBatchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsSummary: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultsSubtext: {
    fontSize: 14,
    color: '#666',
  },
  creatorGrid: {
    flex: 1,
  },
  creatorsContainer: {
    padding: 16,
  },
  creatorCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  creatorCardSelected: {
    borderColor: '#430B92',
    borderWidth: 2,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
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
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  creatorHandle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  creatorStats: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  creatorTier: {
    fontSize: 13,
    color: '#430B92',
    fontWeight: '500',
    marginBottom: 8,
  },
  creatorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
    marginRight: 6,
    marginBottom: 4,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  filtersToggle: {
    padding: 16,
  },
  filtersToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtersToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#430B92',
    marginLeft: 8,
    flex: 1,
  },
  filtersBadge: {
    backgroundColor: '#430B92',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  filtersBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  navItemActive: {
    backgroundColor: '#f8f9fa',
  },
  navLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#430B92',
    fontWeight: '600',
  },
});

export default Dashboard;