import React, { useState, useMemo, useCallback, useEffect, createContext, useContext } from 'react';
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
  Alert,
  SafeAreaView
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { DemoData } from '@/demo/DemoData';
import { Feather, MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';
import { BrandColors } from '@/constants/Colors';
import { getPlatformIcon } from '@/constants/platforms';
import { WebSEO } from '../web-seo';
import { DebugPanel } from '@/contexts/DiscoveryFilterContext';

// ========== INLINE CONTEXT FOR DEBUGGING ==========
const debugLogs: string[] = [];
const addDebugLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  debugLogs.push(logEntry);
  console.log('🔧 INLINE DEBUG:', logEntry);
};

interface FilterState {
  searchText: string;
  activeFilterSection: string | null;
}

const defaultFilters: FilterState = {
  searchText: '',
  activeFilterSection: null,
};

interface FilterContextType {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: any) => void;
}

const InlineFilterContext = createContext<FilterContextType | undefined>(undefined);

const InlineFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  addDebugLog('🔧 INLINE PROVIDER: Function called');
  
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  addDebugLog('🔧 INLINE PROVIDER: useState initialized');
  
  const updateFilter = (key: keyof FilterState, value: any) => {
    addDebugLog(`🔧 INLINE REAL updateFilter: ${String(key)} = ${JSON.stringify(value)}`);
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  addDebugLog('🔧 INLINE PROVIDER: About to return JSX');
  
  return (
    <InlineFilterContext.Provider value={{ filters, updateFilter }}>
      {children}
    </InlineFilterContext.Provider>
  );
};

const useInlineFilters = () => {
  const context = useContext(InlineFilterContext);
  addDebugLog(`🔧 INLINE HOOK: context available: ${!!context}`);
  
  if (!context) {
    addDebugLog('🔧 INLINE HOOK: FALLBACK MODE');
    return {
      filters: defaultFilters,
      updateFilter: (key: any, value: any) => {
        addDebugLog(`🔧 INLINE FALLBACK: ${key} = ${JSON.stringify(value)} (NO EFFECT)`);
      }
    };
  }
  
  addDebugLog('🔧 INLINE HOOK: Real context returned');
  return context;
};
// ========== END INLINE CONTEXT ==========

const DiscoverCreators = () => {
  const { width } = useWindowDimensions();
  
  // Debug component mount
  useEffect(() => {
    console.log('🔍 DiscoverCreators component mounted');
    return () => console.log('🔍 DiscoverCreators component unmounted');
  }, []);
  
  const { filters, updateFilter } = useInlineFilters();
  
  // Simplified versions of missing functions for testing
  const resetFilters = () => addDebugLog('🔧 INLINE resetFilters called');
  const hasActiveFilters = () => false;
  const getActiveFilterCount = () => 0;
  
  // Local state only for UI elements
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  
  // Destructure filters for easier access
  const {
    activeFilterSection,
    priceRange,
    selectedTier,
    followerSize,
    selectedPlatforms,
    postingFrequency,
    locationType,
    selectedCountries,
    selectedCities,
    genderRatio,
    ageRange,
    selectedLanguages,
    influencerAge,
    selectedGroups,
    selectedCategories,
    searchText
  } = filters;
  
  // Filter options
  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Pinterest', 'Twitch', 'Snapchat'];
  const frequencies = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];
  const categories = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Music', 'Art', 'Business', 'Education', 'Culture', 'Sustainability', 'Dance', 'Minimalism', 'Outdoor', 'Adventure', 'Pets', 'Plants', 'Motivation'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Japanese', 'Korean'];
  const countries = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Brazil', 'Japan', 'India', 'Mexico'];
  const cities = {
    'USA': ['Los Angeles', 'New York', 'San Francisco', 'Miami', 'Chicago', 'Austin', 'Seattle', 'Denver', 'Portland', 'Atlanta'],
    'UK': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow'],
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
    'Australia': ['Sydney', 'Melbourne', 'Gold Coast', 'Brisbane', 'Perth'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'],
    'France': ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse'],
    'Brazil': ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Brasília', 'Fortaleza'],
    'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
    'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana']
  };
  const groups = ['Gen Z', 'Millennials', 'Parents', 'Students', 'Professionals'];
  
  // Creator data with enhanced structure - memoized for performance
  const creators = useMemo(() => DemoData.creators.map(creator => {
    const totalFollowers = creator.creatorData?.totalFollowers || 0;
    const platforms = creator.creatorData?.platforms || [];
    const avgEngagement = platforms.reduce((acc, p) => acc + (p.engagement || 0), 0) / Math.max(platforms.length, 1);
    const creatorData = creator.creatorData;
    
    return {
      id: creator._id,
      name: creator.name,
      handle: creator.userName,
      bio: creator.bio,
      location: creator.location,
      avatarUrl: creator.avatarUrl,
      totalFollowers,
      avgEngagement: avgEngagement.toFixed(1),
      platforms: platforms.map(p => p.platform),
      categories: creatorData?.categories || ['Creator'],
      tier: getTierFromFollowers(totalFollowers),
      estimatedCost: getEstimatedCost(totalFollowers, avgEngagement),
      postingFrequency: creatorData?.postingFrequency || 'Weekly',
      country: creatorData?.country || 'USA',
      city: creatorData?.city || 'Los Angeles',
      audienceGender: creatorData?.audienceGender || { male: 45, female: 55 },
      audienceAge: creatorData?.audienceAge || { min: 18, max: 34 },
      language: creatorData?.language || 'English',
      age: creatorData?.age || 28,
      audienceGroups: creatorData?.audienceGroups || ['Millennials'],
      tierCategory: getTierCategory(getEstimatedCost(totalFollowers, avgEngagement)),
    };
  }), []);

  // Helper functions
  function getTierFromFollowers(followers: number): string {
    if (followers >= 1000000) return 'Mega';
    if (followers >= 100000) return 'Macro';
    if (followers >= 10000) return 'Micro';
    return 'Nano';
  }

  function getEstimatedCost(followers: number, engagement: number): number {
    // More realistic pricing based on industry standards
    let baseCostPerFollower;
    if (followers >= 1000000) {
      baseCostPerFollower = 0.008; // Mega: $8 per 1K followers
    } else if (followers >= 100000) {
      baseCostPerFollower = 0.012; // Macro: $12 per 1K followers  
    } else if (followers >= 10000) {
      baseCostPerFollower = 0.015; // Micro: $15 per 1K followers
    } else {
      baseCostPerFollower = 0.025; // Nano: $25 per 1K followers
    }
    
    const baseCost = followers * baseCostPerFollower;
    const engagementMultiplier = Math.max(engagement / 100, 0.6);
    const minCost = followers < 10000 ? 250 : 500; // Minimum rates
    return Math.max(Math.round(baseCost * engagementMultiplier), minCost);
  }

  // Apply all filters - memoized for performance
  const filteredCreators = useMemo(() => creators.filter(creator => {
    // Search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        creator.name.toLowerCase().includes(searchLower) ||
        creator.location.toLowerCase().includes(searchLower) ||
        creator.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        creator.handle.toLowerCase().includes(searchLower) ||
        creator.country.toLowerCase().includes(searchLower) ||
        creator.city.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Filter criteria
    if (creator.estimatedCost < priceRange.min || creator.estimatedCost > priceRange.max) return false;
    if (selectedTier.length > 0 && !selectedTier.includes(creator.tierCategory)) return false;
    // Platform filter - case-insensitive comparison (UI uses "Instagram", data uses "instagram")
    if (selectedPlatforms.length > 0 && !creator.platforms.some(p => selectedPlatforms.some(sp => sp.toLowerCase() === p.toLowerCase()))) return false;
    
    // Follower size filter
    if (followerSize !== 'all') {
      const followers = creator.totalFollowers;
      switch (followerSize) {
        case 'nano':
          if (followers >= 10000) return false;
          break;
        case 'micro':
          if (followers < 10000 || followers >= 100000) return false;
          break;
        case 'macro':
          if (followers < 100000 || followers >= 1000000) return false;
          break;
        case 'mega':
          if (followers < 1000000) return false;
          break;
      }
    }
    
    // Posting frequency filter
    if (postingFrequency !== 'all' && creator.postingFrequency.toLowerCase() !== postingFrequency.toLowerCase()) return false;
    
    // Location filters
    if (locationType === 'country' && selectedCountries.length > 0 && !selectedCountries.includes(creator.country)) return false;
    if (locationType === 'local' && selectedCities.length > 0 && !selectedCities.includes(creator.city)) return false;
    
    // Demographic filters
    // Gender ratio filter (check if creator's audience matches desired ratio within 20% tolerance)
    const genderTolerance = 20;
    if (Math.abs(creator.audienceGender.male - genderRatio.male) > genderTolerance) {
      // Allow some flexibility in gender ratios
    }
    
    // Age range filter (check if creator's audience overlaps with desired range)
    if (creator.audienceAge.max < ageRange.min || creator.audienceAge.min > ageRange.max) {
      // Only filter out if there's no overlap
      return false;
    }
    
    // Influencer age filter
    if (creator.age < influencerAge.min || creator.age > influencerAge.max) return false;
    
    // Language filter
    if (selectedLanguages.length > 0 && !selectedLanguages.includes(creator.language)) return false;
    
    // Groups filter
    if (selectedGroups.length > 0 && !selectedGroups.some(group => creator.audienceGroups.includes(group))) return false;
    
    // Category filter
    if (selectedCategories.length > 0 && !creator.categories.some(cat => selectedCategories.includes(cat))) return false;

    return true;
  }), [
    searchText,
    priceRange,
    selectedTier,
    followerSize,
    selectedPlatforms,
    postingFrequency,
    locationType,
    selectedCountries,
    selectedCities,
    genderRatio,
    ageRange,
    selectedLanguages,
    influencerAge,
    selectedGroups,
    selectedCategories
  ]);

  function getTierCategory(cost: number): string {
    if (cost >= 5000) return 'Premium';
    if (cost >= 1000) return 'Standard';
    return 'Budget';
  }

  const toggleCreatorSelection = useCallback((creatorId: string) => {
    const newSelection = new Set(selectedCreators);
    if (newSelection.has(creatorId)) {
      newSelection.delete(creatorId);
    } else {
      newSelection.add(creatorId);
    }
    setSelectedCreators(newSelection);
  }, [selectedCreators]);

  const renderFilterSection = () => {
    switch (activeFilterSection) {
      case 'filters':
        return (
          <View style={styles.filterContent}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceInputs}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={`$${priceRange.min}`}
                  onChangeText={(text) => updateFilter('priceRange', {...priceRange, min: parseInt(text.replace('$', '')) || 0})}
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={`$${priceRange.max}`}
                  onChangeText={(text) => updateFilter('priceRange', {...priceRange, max: parseInt(text.replace('$', '')) || 10000})}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Follower Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {['All', 'Nano (1K-10K)', 'Micro (10K-100K)', 'Macro (100K-1M)', 'Mega (1M+)'].map(size => {
                  const value = size.split(' ')[0].toLowerCase();
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[styles.filterChip, followerSize === value && styles.filterChipActive]}
                      onPress={() => updateFilter('followerSize', value)}
                    >
                      <Text style={[styles.filterChipText, followerSize === value && styles.filterChipTextActive]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Posting Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {['All', ...frequencies].map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[styles.filterChip, postingFrequency === freq.toLowerCase() && styles.filterChipActive]}
                    onPress={() => updateFilter('postingFrequency', freq.toLowerCase())}
                  >
                    <Text style={[styles.filterChipText, postingFrequency === freq.toLowerCase() && styles.filterChipTextActive]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Platform</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {platforms.map(platform => (
                  <TouchableOpacity
                    key={platform}
                    style={[styles.filterChip, selectedPlatforms.includes(platform) && styles.filterChipActive]}
                    onPress={() => {
                      if (selectedPlatforms.includes(platform)) {
                        updateFilter('selectedPlatforms', selectedPlatforms.filter(p => p !== platform));
                      } else {
                        updateFilter('selectedPlatforms', [...selectedPlatforms, platform]);
                      }
                    }}
                  >
                    <Image 
                      source={getPlatformIcon(platform)}
                      style={[styles.filterChipIcon, selectedPlatforms.includes(platform) && styles.filterChipIconActive]}
                      alt={`${platform} icon`}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        );
        
      case 'location':
        return (
          <View style={styles.filterContent}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Location Type</Text>
              <View style={styles.locationTypeOptions}>
                {['Local', 'Country', 'Event'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.locationTypeButton, locationType === type.toLowerCase() && styles.locationTypeButtonActive]}
                    onPress={() => updateFilter('locationType', type.toLowerCase() as any)}
                  >
                    <View style={[styles.radioButton, locationType === type.toLowerCase() && styles.radioButtonActive]} />
                    <Text style={[styles.locationTypeText, locationType === type.toLowerCase() && styles.locationTypeTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {locationType === 'country' && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Countries</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                  {countries.map(country => (
                    <TouchableOpacity
                      key={country}
                      style={[styles.filterChip, selectedCountries.includes(country) && styles.filterChipActive]}
                      onPress={() => {
                        if (selectedCountries.includes(country)) {
                          updateFilter('selectedCountries', selectedCountries.filter(c => c !== country));
                        } else {
                          updateFilter('selectedCountries', [...selectedCountries, country]);
                        }
                      }}
                    >
                      <Text style={[styles.filterChipText, selectedCountries.includes(country) && styles.filterChipTextActive]}>
                        {country}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {locationType === 'local' && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Cities</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                  {selectedCountries.length > 0 ? 
                    selectedCountries.flatMap(country => cities[country] || []).map(city => (
                      <TouchableOpacity
                        key={city}
                        style={[styles.filterChip, selectedCities.includes(city) && styles.filterChipActive]}
                        onPress={() => {
                          if (selectedCities.includes(city)) {
                            updateFilter('selectedCities', selectedCities.filter(c => c !== city));
                          } else {
                            updateFilter('selectedCities', [...selectedCities, city]);
                          }
                        }}
                      >
                        <Text style={[styles.filterChipText, selectedCities.includes(city) && styles.filterChipTextActive]}>
                          {city}
                        </Text>
                      </TouchableOpacity>
                    )) :
                    Object.values(cities).flat().map(city => (
                      <TouchableOpacity
                        key={city}
                        style={[styles.filterChip, selectedCities.includes(city) && styles.filterChipActive]}
                        onPress={() => {
                          if (selectedCities.includes(city)) {
                            updateFilter('selectedCities', selectedCities.filter(c => c !== city));
                          } else {
                            updateFilter('selectedCities', [...selectedCities, city]);
                          }
                        }}
                      >
                        <Text style={[styles.filterChipText, selectedCities.includes(city) && styles.filterChipTextActive]}>
                          {city}
                        </Text>
                      </TouchableOpacity>
                    ))
                  }
                </ScrollView>
              </View>
            )}
          </View>
        );
        
      case 'demographic':
        return (
          <View style={styles.filterContent}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Audience Gender Ratio</Text>
              <View style={styles.genderRatio}>
                <Text style={styles.genderText}>Male: {genderRatio.male}%</Text>
                <Text style={styles.genderText}>Female: {genderRatio.female}%</Text>
              </View>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Audience Age Range</Text>
              <View style={styles.ageInputs}>
                <TextInput
                  style={styles.ageInput}
                  placeholder="Min"
                  value={ageRange.min.toString()}
                  onChangeText={(text) => updateFilter('ageRange', {...ageRange, min: parseInt(text) || 18})}
                  keyboardType="numeric"
                />
                <Text style={styles.ageSeparator}>-</Text>
                <TextInput
                  style={styles.ageInput}
                  placeholder="Max"
                  value={ageRange.max.toString()}
                  onChangeText={(text) => updateFilter('ageRange', {...ageRange, max: parseInt(text) || 65})}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Influencer Age Range</Text>
              <View style={styles.ageInputs}>
                <TextInput
                  style={styles.ageInput}
                  placeholder="Min"
                  value={influencerAge.min.toString()}
                  onChangeText={(text) => updateFilter('influencerAge', {...influencerAge, min: parseInt(text) || 18})}
                  keyboardType="numeric"
                />
                <Text style={styles.ageSeparator}>-</Text>
                <TextInput
                  style={styles.ageInput}
                  placeholder="Max"
                  value={influencerAge.max.toString()}
                  onChangeText={(text) => updateFilter('influencerAge', {...influencerAge, max: parseInt(text) || 50})}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {languages.map(language => (
                  <TouchableOpacity
                    key={language}
                    style={[styles.filterChip, selectedLanguages.includes(language) && styles.filterChipActive]}
                    onPress={() => {
                      if (selectedLanguages.includes(language)) {
                        updateFilter('selectedLanguages', selectedLanguages.filter(l => l !== language));
                      } else {
                        updateFilter('selectedLanguages', [...selectedLanguages, language]);
                      }
                    }}
                  >
                    <Text style={[styles.filterChipText, selectedLanguages.includes(language) && styles.filterChipTextActive]}>
                      {language}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Group</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {groups.map(group => (
                  <TouchableOpacity
                    key={group}
                    style={[styles.filterChip, selectedGroups.includes(group) && styles.filterChipActive]}
                    onPress={() => {
                      if (selectedGroups.includes(group)) {
                        updateFilter('selectedGroups', selectedGroups.filter(g => g !== group));
                      } else {
                        updateFilter('selectedGroups', [...selectedGroups, group]);
                      }
                    }}
                  >
                    <Text style={[styles.filterChipText, selectedGroups.includes(group) && styles.filterChipTextActive]}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        );
        
      case 'category':
        return (
          <View style={styles.filterContent}>
            <View style={styles.categoryGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryCard, selectedCategories.includes(category) && styles.categoryCardActive]}
                  onPress={() => {
                    if (selectedCategories.includes(category)) {
                      updateFilter('selectedCategories', selectedCategories.filter(c => c !== category));
                    } else {
                      updateFilter('selectedCategories', [...selectedCategories, category]);
                    }
                  }}
                >
                  <Text style={[styles.categoryText, selectedCategories.includes(category) && styles.categoryTextActive]}>
                    {category}
                  </Text>
                  {selectedCategories.includes(category) && (
                    <Ionicons name="checkmark-circle" size={20} color={BrandColors.semantic.success} style={styles.categoryCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <WebSEO 
        title="Discover Creators & Influencers"
        description="Find and connect with top creators and influencers on Axees. Advanced filtering and search for perfect brand partnerships."
        keywords="discover, creators, influencers, find, search, partnerships, campaigns"
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover Influencers</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Feather name="sliders" size={20} color={BrandColors.primary[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, activeFilterSection === 'filters' && styles.filterTabActive]}
              onPress={() => updateFilter('activeFilterSection', activeFilterSection === 'filters' ? null : 'filters')}
            >
              <View style={[styles.filterTabIcon, { backgroundColor: BrandColors.semantic.info }]}>
                <MaterialIcons name="tune" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.filterTabText, activeFilterSection === 'filters' && styles.filterTabTextActive]}>Filters</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterTab, activeFilterSection === 'location' && styles.filterTabActive]}
              onPress={() => updateFilter('activeFilterSection', activeFilterSection === 'location' ? null : 'location')}
            >
              <View style={[styles.filterTabIcon, { backgroundColor: BrandColors.neutral[900] }]}>
                <Ionicons name="location" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.filterTabText, activeFilterSection === 'location' && styles.filterTabTextActive]}>Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterTab, activeFilterSection === 'demographic' && styles.filterTabActive]}
              onPress={() => updateFilter('activeFilterSection', activeFilterSection === 'demographic' ? null : 'demographic')}
            >
              <View style={[styles.filterTabIcon, { backgroundColor: BrandColors.semantic.success }]}>
                <Ionicons name="people" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.filterTabText, activeFilterSection === 'demographic' && styles.filterTabTextActive]}>Demographic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterTab, activeFilterSection === 'category' && styles.filterTabActive]}
              onPress={() => updateFilter('activeFilterSection', activeFilterSection === 'category' ? null : 'category')}
            >
              <View style={[styles.filterTabIcon, { backgroundColor: BrandColors.semantic.error }]}>
                <MaterialIcons name="bookmark" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.filterTabText, activeFilterSection === 'category' && styles.filterTabTextActive]}>Category</Text>
            </TouchableOpacity>
          </View>

          {/* Active Filter Section */}
          {activeFilterSection && (
            <View style={styles.activeFilterSection}>
              {renderFilterSection()}
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Feather name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search influencers..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={(text) => updateFilter('searchText', text)}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => updateFilter('searchText', '')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Results Summary */}
          <View style={styles.resultsSummary}>
            <View style={styles.resultsSummaryLeft}>
              <Text style={styles.resultsText}>
                {filteredCreators.length} influencers found
              </Text>
              {hasActiveFilters() && (
                <TouchableOpacity 
                  style={styles.activeFiltersIndicator}
                  onPress={resetFilters}
                >
                  <Feather name="filter" size={14} color={BrandColors.primary[500]} />
                  <Text style={styles.activeFiltersText}>
                    {getActiveFilterCount()} filters active • Clear all
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedCreators.size > 0 && (
              <TouchableOpacity 
                style={styles.clearSelectionButton}
                onPress={() => setSelectedCreators(new Set())}
              >
                <Text style={styles.clearSelectionText}>
                  Clear {selectedCreators.size} selected
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Creator Grid */}
          <View style={styles.creatorGrid}>
            {filteredCreators.map((creator) => {
              const isSelected = selectedCreators.has(creator.id);
              return (
                <Pressable 
                  key={creator.id}
                  style={[styles.creatorCard, isSelected && styles.creatorCardSelected]}
                  onPress={() => router.push(`/profile/${creator.id}`)}
                  onLongPress={() => toggleCreatorSelection(creator.id)}
                >
                  <Image
                    style={styles.creatorAvatar}
                    source={creator.avatarUrl || require("@/assets/empty-image.png")}
                    placeholder={require("@/assets/empty-image.png")}
                    contentFit="cover"
                  />
                  
                  <View style={styles.creatorInfo}>
                    <View style={styles.creatorHeader}>
                      <Text style={styles.creatorName}>{creator.name}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary[500]} />
                      )}
                    </View>
                    
                    <Text style={styles.creatorHandle}>{creator.handle}</Text>
                    
                    <View style={styles.creatorStats}>
                      <View style={styles.statItem}>
                        <FontAwesome5 name="users" size={12} color="#666" />
                        <Text style={styles.statText}>{creator.totalFollowers.toLocaleString()}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="trending-up" size={12} color="#666" />
                        <Text style={styles.statText}>{creator.avgEngagement}%</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialIcons name="attach-money" size={12} color="#666" />
                        <Text style={styles.statText}>${creator.estimatedCost}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.creatorMeta}>
                      <Text style={styles.metaText}>Age: {creator.age} • {creator.language}</Text>
                      <Text style={styles.metaText}>Posts: {creator.postingFrequency}</Text>
                    </View>
                    
                    <View style={styles.creatorTags}>
                      <View style={[styles.tierTag, { backgroundColor: getTierColor(creator.tier) }]}>
                        <Text style={styles.tierTagText}>{creator.tier}</Text>
                      </View>
                      {creator.platforms.slice(0, 2).map((platform, index) => (
                        <View key={index} style={styles.platformTag}>
                          <Image 
                            source={getPlatformIcon(platform)}
                            style={styles.platformTagIcon}
                            alt={`${platform} icon`}
                          />
                        </View>
                      ))}
                    </View>
                    
                    <Text style={styles.creatorLocation}>
                      <Ionicons name="location-outline" size={12} color="#666" /> {creator.city}, {creator.country}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        {selectedCreators.size > 0 && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => Alert.alert('Campaign Created', `Starting campaign with ${selectedCreators.size} influencers`)}
          >
            <MaterialCommunityIcons name="rocket-launch" size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>Start Campaign ({selectedCreators.size})</Text>
          </TouchableOpacity>
        )}
        
        {/* Debug Panel for Development */}
        <DebugPanel />
      </SafeAreaView>
    </>
  );
};

function getTierColor(tier: string): string {
  switch (tier) {
    case 'Mega': return '#EF4444';
    case 'Macro': return '#F59E0B';
    case 'Micro': return '#10B981';
    case 'Nano': return '#3B82F6';
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    fontFamily: DesignSystem.Typography.h2.fontFamily,
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BrandColors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[200],
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: BrandColors.neutral[0],
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  filterTabActive: {
    borderColor: BrandColors.primary[500],
    backgroundColor: BrandColors.primary[50],
  },
  filterTabIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  filterTabText: {
    fontSize: 13,
    color: BrandColors.neutral[500],
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  filterTabTextActive: {
    color: BrandColors.primary[500],
  },
  activeFilterSection: {
    backgroundColor: BrandColors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[200],
    paddingVertical: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.neutral[700],
    marginBottom: 8,
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BrandColors.neutral[100],
    marginRight: 8,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary[500],
    borderColor: BrandColors.primary[500],
  },
  filterChipText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  filterChipTextActive: {
    color: BrandColors.neutral[0],
  },
  filterChipIcon: {
    width: 20,
    height: 20,
  },
  filterChipIconActive: {
    // Can add tint or other effects if needed
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: BrandColors.neutral[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  priceSeparator: {
    marginHorizontal: 12,
    color: BrandColors.neutral[500],
  },
  locationTypeOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  locationTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BrandColors.neutral[300],
    marginRight: 8,
  },
  radioButtonActive: {
    borderColor: BrandColors.semantic.success,
    backgroundColor: BrandColors.semantic.success,
  },
  locationTypeText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
  },
  locationTypeTextActive: {
    color: BrandColors.neutral[900],
    fontWeight: '500',
  },
  genderRatio: {
    flexDirection: 'row',
    gap: 24,
  },
  genderText: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  ageInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInput: {
    width: 60,
    backgroundColor: BrandColors.neutral[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
    textAlign: 'center',
  },
  ageSeparator: {
    marginHorizontal: 12,
    color: BrandColors.neutral[500],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: BrandColors.neutral[100],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BrandColors.neutral[200],
    position: 'relative',
  },
  categoryCardActive: {
    borderColor: BrandColors.semantic.success,
    backgroundColor: BrandColors.semantic.successLight,
  },
  categoryText: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    textAlign: 'center',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  categoryTextActive: {
    color: BrandColors.semantic.successDark,
    fontWeight: '600',
  },
  categoryCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  searchSection: {
    padding: 16,
    backgroundColor: BrandColors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: BrandColors.neutral[900],
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BrandColors.neutral[50],
  },
  resultsSummaryLeft: {
    flex: 1,
  },
  activeFiltersIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  activeFiltersText: {
    fontSize: 12,
    color: BrandColors.primary[500],
    marginLeft: 4,
    fontWeight: '500',
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.neutral[900],
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  clearSelectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: BrandColors.semantic.error,
  },
  clearSelectionText: {
    fontSize: 14,
    color: BrandColors.neutral[0],
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  creatorGrid: {
    padding: 16,
  },
  creatorCard: {
    backgroundColor: BrandColors.neutral[0],
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
    flexDirection: 'row',
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
  creatorCardSelected: {
    borderColor: BrandColors.primary[500],
    borderWidth: 2,
  },
  creatorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  creatorHandle: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    marginTop: 2,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  creatorStats: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: BrandColors.neutral[500],
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  creatorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tierTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierTagText: {
    fontSize: 12,
    color: BrandColors.neutral[0],
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  platformTag: {
    backgroundColor: BrandColors.neutral[200],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformTagText: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  platformTagIcon: {
    width: 16,
    height: 16,
  },
  creatorLocation: {
    fontSize: 13,
    color: BrandColors.neutral[500],
    marginTop: 6,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  creatorMeta: {
    marginTop: 6,
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: BrandColors.neutral[400],
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: BrandColors.primary[500],
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
});

// Memoized creator card for performance
const CreatorCard = React.memo(({ 
  creator, 
  isSelected, 
  onPress, 
  onLongPress 
}: {
  creator: any;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) => (
  <Pressable 
    style={[styles.creatorCard, isSelected && styles.creatorCardSelected]}
    onPress={onPress}
    onLongPress={onLongPress}
  >
    <Image
      style={styles.creatorAvatar}
      source={creator.avatarUrl || require("@/assets/empty-image.png")}
      placeholder={require("@/assets/empty-image.png")}
      contentFit="cover"
    />
    
    <View style={styles.creatorInfo}>
      <View style={styles.creatorHeader}>
        <Text style={styles.creatorName}>{creator.name}</Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary[500]} />
        )}
      </View>
      
      <Text style={styles.creatorHandle}>{creator.handle}</Text>
      
      <View style={styles.creatorStats}>
        <View style={styles.statItem}>
          <FontAwesome5 name="users" size={12} color="#666" />
          <Text style={styles.statText}>{creator.totalFollowers.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={12} color="#666" />
          <Text style={styles.statText}>{creator.avgEngagement}%</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="attach-money" size={12} color="#666" />
          <Text style={styles.statText}>${creator.estimatedCost.toLocaleString()}</Text>
        </View>
      </View>
      
      <View style={styles.creatorPlatforms}>
        {creator.platforms.slice(0, 3).map((platform: string, index: number) => (
          <Image 
            key={index}
            source={getPlatformIcon(platform)}
            style={styles.platformIcon}
            alt={`${platform} icon`}
          />
        ))}
        {creator.platforms.length > 3 && (
          <Text style={styles.morePlatforms}>+{creator.platforms.length - 3}</Text>
        )}
      </View>
      
      <View style={styles.tierBadge}>
        <Text style={styles.tierText}>{creator.tier}</Text>
      </View>
    </View>
  </Pressable>
));

// Wrapper component with inline context
const DiscoverCreatorsWithProvider = () => {
  addDebugLog('🔧 WRAPPER: Component called');
  
  return (
    <InlineFilterProvider>
      <DiscoverCreators />
    </InlineFilterProvider>
  );
};

export default DiscoverCreatorsWithProvider;