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
import { CreativeTab } from './CreativeTab';
import { MyNetwork } from './MyNetwork';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'dashboard' | 'smart-blast' | 'creative' | 'my-network';

const Dashboard = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  
  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Filter management
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  
  // Creator data with enhanced structure for dashboard
  const creators = DemoData.creators.map(creator => {
    const totalFollowers = creator.creatorData?.totalFollowers || 0;
    const platforms = creator.creatorData?.platforms || [];
    const avgEngagement = platforms.reduce((acc, p) => acc + (p.engagement || 0), 0) / Math.max(platforms.length, 1);
    
    // Enhanced creator data for dashboard features
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
      languages: ['English'], // Default, can be enhanced
      gender: getRandomGender(),
      ageRange: getRandomAgeRange(),
      
      // Smart Blast compatibility
      isSelected: false,
      lastContactDate: null,
      responseRate: Math.random() * 0.8 + 0.2, // 20-100%
    };
  });

  const [filteredCreators, setFilteredCreators] = useState(creators);
  const [searchText, setSearchText] = useState('');

  // Helper functions for enhanced data
  function getTierFromFollowers(followers: number): string {
    if (followers >= 1000000) return 'Mega';
    if (followers >= 100000) return 'Macro';
    if (followers >= 10000) return 'Micro';
    return 'Nano';
  }

  function getEstimatedCost(followers: number, engagement: number): number {
    const baseCost = followers * 0.01; // $0.01 per follower
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
      location: 'US', // Simplified
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

    // Apply search
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.name.toLowerCase().includes(searchLower) ||
        creator.location.toLowerCase().includes(searchLower) ||
        creator.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        creator.handle.toLowerCase().includes(searchLower)
      );
    }

    // Apply advanced filters
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

    if (filters.postFrequency && filters.postFrequency.length > 0) {
      filtered = filtered.filter(creator => filters.postFrequency.includes(creator.postFrequency));
    }

    if (filters.gender && filters.gender.length > 0) {
      filtered = filtered.filter(creator => filters.gender.includes(creator.gender));
    }

    if (filters.ageRange && filters.ageRange.length > 0) {
      filtered = filtered.filter(creator => filters.ageRange.includes(creator.ageRange));
    }

    setFilteredCreators(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(appliedFilters);
  };

  // Tab navigation
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
        onPress={() => setActiveTab('dashboard')}
      >
        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
          📊 Dashboard
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'smart-blast' && styles.activeTab]}
        onPress={() => setActiveTab('smart-blast')}
      >
        <Text style={[styles.tabText, activeTab === 'smart-blast' && styles.activeTabText]}>
          🎯 Smart Blast
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'creative' && styles.activeTab]}
        onPress={() => setActiveTab('creative')}
      >
        <Text style={[styles.tabText, activeTab === 'creative' && styles.activeTabText]}>
          🧠 Creative
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'my-network' && styles.activeTab]}
        onPress={() => setActiveTab('my-network')}
      >
        <Text style={[styles.tabText, activeTab === 'my-network' && styles.activeTabText]}>
          🧩 My Network
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Main dashboard content
  const renderDashboardContent = () => (
    <View style={styles.dashboardContent}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
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
              <Text style={styles.clearButtonText}>×</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Results Summary */}
      <View style={styles.resultsSummary}>
        <Text style={styles.resultsText}>
          Found {filteredCreators.length.toLocaleString()} creators
        </Text>
        <Text style={styles.resultsSubtext}>
          Estimated total reach: {filteredCreators.reduce((acc, creator) => acc + creator.totalFollowers, 0).toLocaleString()} followers
        </Text>
      </View>

      {/* Creator Grid */}
      <ScrollView style={styles.creatorGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.creatorsContainer}>
          {filteredCreators.map((creator) => (
            <Pressable 
              key={creator.id}
              style={styles.creatorCard}
              onPress={() => router.push(`/profile/${creator.id}`)}
            >
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
                  {creator.totalFollowers.toLocaleString()} followers • {creator.avgEngagement}% engagement
                </Text>
                <Text style={styles.creatorTier}>{creator.tier} Influencer • ${creator.estimatedCost}/post</Text>
                
                <View style={styles.creatorTags}>
                  {creator.categories.slice(0, 2).map((tag, index) => (
                    <Text key={index} style={styles.tag}>{tag}</Text>
                  ))}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'smart-blast':
        return <SmartBlast creators={filteredCreators} filters={appliedFilters} />;
      case 'creative':
        return <CreativeTab />;
      case 'my-network':
        return <MyNetwork />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      {renderTabBar()}
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderTabContent()}
      </View>
      
      {/* Expandable Filters at Bottom */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.filtersToggle}
          onPress={() => setIsFiltersExpanded(!isFiltersExpanded)}
        >
          <Text style={styles.filtersToggleText}>
            🔧 Advanced Filters {isFiltersExpanded ? '▼' : '▲'}
          </Text>
          <Text style={styles.filtersCount}>
            {Object.keys(appliedFilters).length} active
          </Text>
        </TouchableOpacity>
        
        {isFiltersExpanded && (
          <AdvancedFilters 
            onFiltersChange={applyFilters}
            initialFilters={appliedFilters}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
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
  mainContent: {
    flex: 1,
  },
  dashboardContent: {
    flex: 1,
    padding: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    outlineStyle: 'none',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  resultsSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  resultsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  creatorGrid: {
    flex: 1,
  },
  creatorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 100, // Space for filters
  },
  creatorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    width: '48%',
    minWidth: 280,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  creatorHandle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  creatorStats: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  creatorTier: {
    fontSize: 12,
    color: Color.cSK430B92500,
    fontWeight: '600',
    marginBottom: 8,
  },
  creatorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: '500',
  },
  filtersContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  filtersToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  filtersToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
  },
  filtersCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default Dashboard;