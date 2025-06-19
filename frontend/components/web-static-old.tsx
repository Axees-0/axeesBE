import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { Color } from '@/GlobalStyles';
import { router } from 'expo-router';

const Web = () => {
  // Creator data
  const creators = [
    {
      id: 'creator-001',
      name: 'Emma Thompson',
      handle: '@emmastyle',
      stats: '156K followers • 8.9% engagement',
      bio: 'Fashion & Lifestyle Creator | Sustainable Fashion Advocate',
      tags: ['Fashion', 'Lifestyle'],
      avatar: 'ET',
      location: 'Los Angeles'
    },
    {
      id: 'creator-002', 
      name: 'Marcus Johnson',
      handle: '@techmarc',
      stats: '234K followers • 7.2% engagement',
      bio: 'Tech Reviewer | Smart Home Enthusiast | Future Tech Explorer',
      tags: ['Technology', 'Reviews'],
      avatar: 'MJ',
      location: 'New York'
    },
    {
      id: 'creator-003',
      name: 'Sofia Rodriguez', 
      handle: '@sofiafit',
      stats: '189K followers • 9.8% engagement',
      bio: 'Certified Personal Trainer | Nutrition Coach | Wellness Advocate',
      tags: ['Fitness', 'Health'],
      avatar: 'SR',
      location: 'Miami'
    }
  ];

  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filteredCreators, setFilteredCreators] = useState(creators);

  const availableFilters = ['Fashion', 'Technology', 'Fitness', 'Lifestyle'];

  const toggleFilter = (filter: string) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    setSelectedFilters(newFilters);
    applyFilters(searchText, newFilters);
  };

  const applyFilters = (searchTerm: string, filters: string[]) => {
    let filtered = creators;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.name.toLowerCase().includes(searchLower) ||
        creator.location.toLowerCase().includes(searchLower) ||
        creator.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        creator.handle.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filters
    if (filters.length > 0) {
      filtered = filtered.filter(creator =>
        filters.some(filter =>
          creator.tags.some(tag => 
            tag.toLowerCase() === filter.toLowerCase()
          )
        )
      );
    }

    setFilteredCreators(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(text, selectedFilters);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Filters</Text>
        {availableFilters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterItem,
              selectedFilters.includes(filter) && styles.filterItemActive
            ]}
            onPress={() => toggleFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilters.includes(filter) && styles.filterTextActive
            ]}>
              {selectedFilters.includes(filter) ? '✓' : '○'} {filter}
            </Text>
          </TouchableOpacity>
        ))}
        {selectedFilters.length > 0 && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedFilters([]);
              applyFilters(searchText, []);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore Creators & Influencers</Text>
          <Text style={styles.subtitle}>Connect with top creators for your brand campaigns</Text>
        </View>
        
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, location, or category (e.g. Emma, Los Angeles, Fashion)"
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
        
        {(selectedFilters.length > 0 || searchText.length > 0) && (
          <View style={styles.filterStatus}>
            <Text style={styles.filterStatusText}>
              Showing {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
              {selectedFilters.length > 0 && (
                <Text> filtered by: {selectedFilters.join(', ')}</Text>
              )}
              {searchText.length > 0 && (
                <Text> • searching "{searchText}"</Text>
              )}
            </Text>
          </View>
        )}
        
        <View style={styles.creatorsGrid}>
          {filteredCreators.map((creator) => (
            <TouchableOpacity 
              key={creator.id}
              style={styles.creatorCard}
              onPress={() => router.push(`/profile/${creator.id}`)}
            >
              <View style={styles.creatorAvatar}>
                <Text style={styles.avatarText}>{creator.avatar}</Text>
              </View>
              <Text style={styles.creatorName}>{creator.name}</Text>
              <Text style={styles.creatorHandle}>{creator.handle}</Text>
              <Text style={styles.creatorStats}>{creator.stats}</Text>
              <Text style={styles.creatorBio}>{creator.bio}</Text>
              <View style={styles.creatorTags}>
                {creator.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>{tag}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
          {filteredCreators.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No creators found
                {searchText && ` matching "${searchText}"`}
                {selectedFilters.length > 0 && ` with filters: ${selectedFilters.join(', ')}`}
              </Text>
              <Text style={styles.noResultsSubtext}>
                Try {selectedFilters.length > 0 ? 'removing some filters or ' : ''}searching for different terms like "Fashion", "Tech", or creator names
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  sidebar: {
    width: 250,
    backgroundColor: 'white',
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 6,
  },
  filterItemActive: {
    backgroundColor: Color.cSK430B92500,
  },
  filterText: {
    fontSize: 14,
    color: '#555',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  filterStatus: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterStatusText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  searchSection: {
    marginBottom: 24,
  },
  searchBar: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
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
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  creatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  creatorCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  creatorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Color.cSK430B92500,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  creatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  creatorHandle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  creatorStats: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  creatorBio: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  creatorTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Web;