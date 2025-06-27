import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Feather, MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';
import { UniversalBackButton } from '@/components/UniversalBackButton';

const DiscoverCreators = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  
  // Filter states
  const [activeFilterSection, setActiveFilterSection] = useState<'type' | 'location' | 'demographic' | 'category' | null>(null);
  
  // Type filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedTier, setSelectedTier] = useState<string[]>([]);
  const [followerSize, setFollowerSize] = useState<string>('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postingFrequency, setPostingFrequency] = useState<string>('all');
  
  // Location filters
  const [locationType, setLocationType] = useState<'local' | 'country' | 'event'>('country');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  
  // Demographic filters
  const [genderRatio, setGenderRatio] = useState({ male: 50, female: 50 });
  const [ageRange, setAgeRange] = useState({ min: 18, max: 65 });
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [influencerAge, setInfluencerAge] = useState({ min: 18, max: 50 });
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  // Category filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Search
  const [searchText, setSearchText] = useState('');
  
  // Selection
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  
  // Filter options
  const influencerTypes = ['All', 'Mega', 'Macro', 'Micro', 'Nano'];
  const tiers = ['Premium', 'Standard', 'Budget'];
  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook'];
  const frequencies = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];
  const categories = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Music', 'Art'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Japanese', 'Korean'];
  const countries = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Brazil', 'Japan'];
  const groups = ['Gen Z', 'Millennials', 'Parents', 'Students', 'Professionals'];
  
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
      totalFollowers,
      avgEngagement: avgEngagement.toFixed(1),
      platforms: platforms.map(p => p.platform),
      categories: creator.creatorData?.categories || ['Creator'],
      tier: getTierFromFollowers(totalFollowers),
      estimatedCost: getEstimatedCost(totalFollowers, avgEngagement),
      postingFrequency: 'Weekly',
      country: 'USA',
      city: 'Los Angeles',
      audienceGender: { male: 45, female: 55 },
      audienceAge: { min: 18, max: 34 },
      language: 'English',
      age: 28,
    };
  });

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

  // Apply all filters
  const filteredCreators = creators.filter(creator => {
    // Search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        creator.name.toLowerCase().includes(searchLower) ||
        creator.location.toLowerCase().includes(searchLower) ||
        creator.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        creator.handle.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Type filters
    if (selectedType !== 'all' && creator.tier !== selectedType) return false;
    if (creator.estimatedCost < priceRange.min || creator.estimatedCost > priceRange.max) return false;
    if (selectedTier.length > 0 && !selectedTier.includes(getTierCategory(creator.estimatedCost))) return false;
    if (selectedPlatforms.length > 0 && !creator.platforms.some(p => selectedPlatforms.includes(p))) return false;
    
    // Location filters
    if (locationType === 'country' && selectedCountries.length > 0 && !selectedCountries.includes(creator.country)) return false;
    if (locationType === 'local' && selectedCities.length > 0 && !selectedCities.includes(creator.city)) return false;
    
    // Category filter
    if (selectedCategories.length > 0 && !creator.categories.some(cat => selectedCategories.includes(cat))) return false;

    return true;
  });

  function getTierCategory(cost: number): string {
    if (cost >= 5000) return 'Premium';
    if (cost >= 1000) return 'Standard';
    return 'Budget';
  }

  const toggleCreatorSelection = (creatorId: string) => {
    const newSelection = new Set(selectedCreators);
    if (newSelection.has(creatorId)) {
      newSelection.delete(creatorId);
    } else {
      newSelection.add(creatorId);
    }
    setSelectedCreators(newSelection);
  };

  const renderFilterSection = () => {
    switch (activeFilterSection) {
      case 'type':
        return (
          <View style={styles.filterContent}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {influencerTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterChip, selectedType === type.toLowerCase() && styles.filterChipActive]}
                    onPress={() => setSelectedType(type.toLowerCase())}
                  >
                    <Text style={[styles.filterChipText, selectedType === type.toLowerCase() && styles.filterChipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceInputs}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={`$${priceRange.min}`}
                  onChangeText={(text) => setPriceRange({...priceRange, min: parseInt(text.replace('$', '')) || 0})}
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={`$${priceRange.max}`}
                  onChangeText={(text) => setPriceRange({...priceRange, max: parseInt(text.replace('$', '')) || 10000})}
                  keyboardType="numeric"
                />
              </View>
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
                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                      } else {
                        setSelectedPlatforms([...selectedPlatforms, platform]);
                      }
                    }}
                  >
                    <Text style={[styles.filterChipText, selectedPlatforms.includes(platform) && styles.filterChipTextActive]}>
                      {platform}
                    </Text>
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
                    onPress={() => setLocationType(type.toLowerCase() as any)}
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
                          setSelectedCountries(selectedCountries.filter(c => c !== country));
                        } else {
                          setSelectedCountries([...selectedCountries, country]);
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
                  onChangeText={(text) => setAgeRange({...ageRange, min: parseInt(text) || 18})}
                  keyboardType="numeric"
                />
                <Text style={styles.ageSeparator}>-</Text>
                <TextInput
                  style={styles.ageInput}
                  placeholder="Max"
                  value={ageRange.max.toString()}
                  onChangeText={(text) => setAgeRange({...ageRange, max: parseInt(text) || 65})}
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
                        setSelectedLanguages(selectedLanguages.filter(l => l !== language));
                      } else {
                        setSelectedLanguages([...selectedLanguages, language]);
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
                        setSelectedGroups(selectedGroups.filter(g => g !== group));
                      } else {
                        setSelectedGroups([...selectedGroups, group]);
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
                      setSelectedCategories(selectedCategories.filter(c => c !== category));
                    } else {
                      setSelectedCategories([...selectedCategories, category]);
                    }
                  }}
                >
                  <Text style={[styles.categoryText, selectedCategories.includes(category) && styles.categoryTextActive]}>
                    {category}
                  </Text>
                  {selectedCategories.includes(category) && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.categoryCheck} />
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <UniversalBackButton />
        <Text style={styles.headerTitle}>Discover Influencers</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="sliders" size={20} color="#430B92" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilterSection === 'type' && styles.filterTabActive]}
            onPress={() => setActiveFilterSection(activeFilterSection === 'type' ? null : 'type')}
          >
            <View style={[styles.filterTabIcon, { backgroundColor: '#3B82F6' }]}>
              <MaterialIcons name="category" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.filterTabText, activeFilterSection === 'type' && styles.filterTabTextActive]}>Type</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, activeFilterSection === 'location' && styles.filterTabActive]}
            onPress={() => setActiveFilterSection(activeFilterSection === 'location' ? null : 'location')}
          >
            <View style={[styles.filterTabIcon, { backgroundColor: '#111827' }]}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.filterTabText, activeFilterSection === 'location' && styles.filterTabTextActive]}>Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, activeFilterSection === 'demographic' && styles.filterTabActive]}
            onPress={() => setActiveFilterSection(activeFilterSection === 'demographic' ? null : 'demographic')}
          >
            <View style={[styles.filterTabIcon, { backgroundColor: '#10B981' }]}>
              <Ionicons name="people" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.filterTabText, activeFilterSection === 'demographic' && styles.filterTabTextActive]}>Demographic</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, activeFilterSection === 'category' && styles.filterTabActive]}
            onPress={() => setActiveFilterSection(activeFilterSection === 'category' ? null : 'category')}
          >
            <View style={[styles.filterTabIcon, { backgroundColor: '#EF4444' }]}>
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
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results Summary */}
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsText}>
            {filteredCreators.length} influencers found
          </Text>
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
                      <Ionicons name="checkmark-circle" size={20} color="#430B92" />
                    )}
                  </View>
                  
                  <Text style={styles.creatorHandle}>@{creator.handle}</Text>
                  
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
                      <Text style={styles.statText}>{creator.estimatedCost}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.creatorTags}>
                    <View style={[styles.tierTag, { backgroundColor: getTierColor(creator.tier) }]}>
                      <Text style={styles.tierTagText}>{creator.tier}</Text>
                    </View>
                    {creator.platforms.slice(0, 2).map((platform, index) => (
                      <View key={index} style={styles.platformTag}>
                        <Text style={styles.platformTagText}>{platform}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={styles.creatorLocation}>
                    <Ionicons name="location-outline" size={12} color="#666" /> {creator.location}
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
    </SafeAreaView>
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
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    borderColor: '#430B92',
    backgroundColor: '#F3F0FF',
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
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  filterTabTextActive: {
    color: '#430B92',
  },
  activeFilterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#374151',
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
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#430B92',
    borderColor: '#430B92',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceSeparator: {
    marginHorizontal: 12,
    color: '#6B7280',
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
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  radioButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  locationTypeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationTypeTextActive: {
    color: '#111827',
    fontWeight: '500',
  },
  genderRatio: {
    flexDirection: 'row',
    gap: 24,
  },
  genderText: {
    fontSize: 14,
    color: '#4B5563',
  },
  ageInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInput: {
    width: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
  },
  ageSeparator: {
    marginHorizontal: 12,
    color: '#6B7280',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  categoryCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  categoryTextActive: {
    color: '#065F46',
    fontWeight: '600',
  },
  categoryCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  clearSelectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  clearSelectionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  creatorGrid: {
    padding: 16,
  },
  creatorCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderColor: '#430B92',
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
    color: '#111827',
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  creatorHandle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
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
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  platformTag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformTagText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  creatorLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#430B92',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
});

export default DiscoverCreators;