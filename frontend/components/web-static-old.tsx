import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Color, Focus } from '@/GlobalStyles';
import { router } from 'expo-router';
import { DemoData } from '@/demo/DemoData';
import { AccessibleFilters } from './AccessibleFilters';
import { EmptyState } from './EmptyState';

const Web = () => {
  const { width: screenWidth } = useWindowDimensions();
  
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
  
  // Store filter state in ref to preserve it across errors
  const filterStateRef = React.useRef({
    searchText: '',
    selectedFilters: [] as string[]
  });
  
  // Update ref whenever state changes
  React.useEffect(() => {
    filterStateRef.current = {
      searchText,
      selectedFilters
    };
  }, [searchText, selectedFilters]);
  
  // Restore filter state on mount (e.g., after error recovery)
  React.useEffect(() => {
    const savedState = filterStateRef.current;
    if (savedState.searchText || savedState.selectedFilters.length > 0) {
      setSearchText(savedState.searchText);
      setSelectedFilters(savedState.selectedFilters);
      applyFilters(savedState.searchText, savedState.selectedFilters);
    }
  }, []); // Only run on mount

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

  // Calculate dynamic styles based on screen width
  const dynamicStyles = React.useMemo(() => {
    const isMobile = screenWidth < 768;
    const isSmallMobile = screenWidth <= 320;
    
    return StyleSheet.create({
      creatorCard: {
        backgroundColor: 'white',
        padding: isSmallMobile ? 16 : isMobile ? 20 : 24,
        borderRadius: 16,
        width: isSmallMobile ? '100%' : isMobile ? (screenWidth - 52) / 2 : 350, // 52 = padding (32) + gap (20)
        minWidth: isSmallMobile ? 'auto' : 280,
        maxWidth: isSmallMobile ? '100%' : 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden', // Prevent content overflow
      },
      mainContent: {
        padding: isSmallMobile ? 12 : isMobile ? 16 : 24,
      },
      creatorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: isSmallMobile ? 12 : isMobile ? 16 : 20,
        justifyContent: isSmallMobile ? 'center' : 'flex-start',
      },
      creatorName: {
        fontSize: isSmallMobile ? 18 : 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
      },
      creatorBio: {
        fontSize: isSmallMobile ? 13 : 14,
        color: '#555',
        lineHeight: isSmallMobile ? 18 : 20,
        marginBottom: isSmallMobile ? 12 : 16,
      },
      creatorTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: isSmallMobile ? 6 : 8,
      },
      title: {
        fontSize: isSmallMobile ? 24 : isMobile ? 28 : 32,
        fontWeight: 'bold',
        color: Color.cSK430B92500,
        marginBottom: 8,
      },
      subtitle: {
        fontSize: isSmallMobile ? 16 : 18,
        color: '#666',
      },
      searchBar: {
        backgroundColor: 'white',
        padding: isSmallMobile ? 12 : 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
      },
    });
  }, [screenWidth]);

  return (
    <ScrollView style={styles.container} showsHorizontalScrollIndicator={false}>
      <View style={[styles.mainContent, dynamicStyles.mainContent]}>
        <View style={styles.header}>
          <Text style={[styles.title, dynamicStyles.title]}>Explore Creators & Influencers</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Connect with top creators for your brand campaigns</Text>
        </View>
        
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, dynamicStyles.searchBar]} role="search">
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
              {...(Platform.OS === 'web' && { tabIndex: 0 })}
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
        
        {/* Filters Section - Now displayed horizontally */}
        <View style={styles.filtersSection}>
          <View style={styles.filtersContainer}>
            {availableFilters.map((filter) => {
              const isSelected = selectedFilters.includes(filter);
              return (
                <Pressable
                  key={filter}
                  style={({ pressed, focused }) => [
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                    focused && styles.filterChipFocused,
                    pressed && styles.filterChipPressed
                  ]}
                  onPress={() => toggleFilter(filter)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${filter} filter`}
                  {...(Platform.OS === 'web' && { tabIndex: 0 })}
                >
                  <Text style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive
                  ]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
            {selectedFilters.length > 0 && (
              <Pressable
                style={({ pressed, focused }) => [
                  styles.clearFiltersChip,
                  focused && styles.clearFiltersFocused,
                  pressed && styles.clearFiltersPressed
                ]}
                onPress={() => {
                  setSelectedFilters([]);
                  applyFilters(searchText, []);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
                {...(Platform.OS === 'web' && { tabIndex: 0 })}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
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
        
        <View style={[styles.creatorsGrid, dynamicStyles.creatorsGrid]}>
          {filteredCreators.map((creator) => (
            <Pressable 
              key={creator.id}
              style={({ pressed, focused }) => [
                styles.creatorCard,
                dynamicStyles.creatorCard,
                focused && styles.creatorCardFocused,
                pressed && styles.creatorCardPressed
              ]}
              onPress={() => router.push(`/profile/${creator.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`View ${creator.name}'s profile`}
              {...(Platform.OS === 'web' && { tabIndex: 0 })}
            >
              <Image
                style={styles.creatorAvatar}
                source={creator.avatarUrl || require("@/assets/empty-image.png")}
                placeholder={require("@/assets/empty-image.png")}
                contentFit="cover"
              />
              <Text style={[styles.creatorName, dynamicStyles.creatorName]}>{creator.name}</Text>
              <Text style={styles.creatorHandle} numberOfLines={1} ellipsizeMode="tail">{creator.handle}</Text>
              <Text style={styles.creatorStats} numberOfLines={2}>{creator.stats}</Text>
              <Text style={[styles.creatorBio, dynamicStyles.creatorBio]} numberOfLines={3}>{creator.bio}</Text>
              <View style={[styles.creatorTags, dynamicStyles.creatorTags]}>
                {creator.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>{tag}</Text>
                ))}
              </View>
            </Pressable>
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    padding: 24,
  },
  filtersSection: {
    marginBottom: 24,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    flexShrink: 1,
  },
  filterChipActive: {
    backgroundColor: Color.cSK430B92500,
    borderColor: Color.cSK430B92500,
  },
  filterChipText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  clearFiltersChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterChipFocused: {
    ...Focus.primary,
    borderRadius: 20,
  },
  filterChipPressed: {
    opacity: 0.8,
  },
  creatorCardFocused: {
    ...Focus.primary,
    borderRadius: 12,
  },
  creatorCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  clearFiltersFocused: {
    ...Focus.secondary,
    borderRadius: 20,
  },
  clearFiltersPressed: {
    opacity: 0.8,
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
    flexShrink: 1,
  },
});

export default Web;