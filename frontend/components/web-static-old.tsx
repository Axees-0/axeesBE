import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Color } from '@/GlobalStyles';
import { router } from 'expo-router';
import { DemoData } from '@/demo/DemoData';
import { AccessibleFilters } from './AccessibleFilters';
import { EmptyState } from './EmptyState';

const Web = () => {
  // Creator data - Using DemoData.creators with mapped structure for explore page
  const creators = DemoData.creators.map(creator => {
    // Calculate total followers and average engagement for stats display
    const totalFollowers = creator.creatorData?.totalFollowers || 0;
    const avgEngagement = creator.creatorData?.platforms?.reduce((acc, p) => acc + (p.engagement || 0), 0) / (creator.creatorData?.platforms?.length || 1);
    
    // Format follower count
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };
    
    // Extract avatar initials from name
    const getInitials = (name: string) => {
      const parts = name.split(' ');
      return parts.map(part => part[0]).join('').substring(0, 2).toUpperCase();
    };
    
    return {
      id: creator._id,
      name: creator.name,
      handle: creator.userName,
      stats: `${formatNumber(totalFollowers)} followers • ${avgEngagement.toFixed(1)}% engagement`,
      bio: creator.bio,
      tags: creator.creatorData?.categories || ['Creator'],
      avatar: getInitials(creator.name),
      avatarUrl: creator.avatarUrl,
      location: creator.location
    };
  });

  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filteredCreators, setFilteredCreators] = useState(creators);

  // Extract unique categories from DemoData.creators for filters
  const availableFilters = Array.from(new Set(
    DemoData.creators.flatMap(creator => creator.creatorData?.categories || [])
  )).sort();

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
        <AccessibleFilters
          availableFilters={availableFilters}
          selectedFilters={selectedFilters}
          onFilterChange={(newFilters) => {
            setSelectedFilters(newFilters);
            applyFilters(searchText, newFilters);
          }}
          onClearAll={() => {
            setSelectedFilters([]);
            applyFilters(searchText, []);
          }}
        />
      </View>
      
      <ScrollView style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore Creators & Influencers</Text>
          <Text style={styles.subtitle}>Connect with top creators for your brand campaigns</Text>
        </View>
        
        <View style={styles.searchSection}>
          <View style={styles.searchBar} role="search">
            <Text style={styles.searchIcon} aria-hidden="true">🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search creators by name, location, or category"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearch}
              returnKeyType="search"
              accessibilityLabel="Search creators"
              accessibilityHint="Enter name, location, or category to filter results"
              accessibilityRole="searchbox"
            />
            {searchText.length > 0 && (
              <Pressable 
                onPress={() => handleSearch('')} 
                style={({ pressed, focused }) => [
                  styles.clearButton,
                  (pressed || focused) && styles.clearButtonFocused
                ]}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
              >
                <Text style={styles.clearButtonText} aria-hidden="true">×</Text>
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
              <Image
                style={styles.creatorAvatar}
                source={creator.avatarUrl || require("@/assets/empty-image.png")}
                placeholder={require("@/assets/empty-image.png")}
                contentFit="cover"
              />
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
            <EmptyState
              searchText={searchText}
              selectedFilters={selectedFilters}
              onClearSearch={() => handleSearch('')}
              onClearFilters={() => {
                setSelectedFilters([]);
                applyFilters(searchText, []);
              }}
              onClearAll={() => {
                handleSearch('');
                setSelectedFilters([]);
                applyFilters('', []);
              }}
              totalCreators={creators.length}
            />
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
  clearButtonFocused: {
    outlineWidth: 2,
    outlineColor: Color.cSK430B92500,
    outlineStyle: 'solid',
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
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
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