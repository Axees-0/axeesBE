import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Platform
} from 'react-native';
import { Color } from '@/GlobalStyles';
import Slider from '@react-native-community/slider';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  initialFilters: any;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ 
  onFiltersChange, 
  initialFilters 
}) => {
  const [filters, setFilters] = useState({
    campaignTypes: [],
    priceRange: { min: 0, max: 10000 },
    locations: [],
    languages: [],
    tiers: [],
    gender: [],
    ageRange: [],
    platforms: [],
    postFrequency: [],
    demographics: {
      interests: [],
      audienceAge: [],
      audienceGender: []
    },
    engagement: { min: 0, max: 100 },
    followers: { min: 0, max: 10000000 },
    verifiedOnly: false,
    activeOnly: true,
    ...initialFilters
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleMultiSelect = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter((item: string) => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      campaignTypes: [],
      priceRange: { min: 0, max: 10000 },
      locations: [],
      languages: [],
      tiers: [],
      gender: [],
      ageRange: [],
      platforms: [],
      postFrequency: [],
      demographics: {
        interests: [],
        audienceAge: [],
        audienceGender: []
      },
      engagement: { min: 0, max: 100 },
      followers: { min: 0, max: 10000000 },
      verifiedOnly: false,
      activeOnly: true,
    });
  };

  const renderMultiSelectGroup = (
    title: string, 
    options: string[], 
    selectedValues: string[], 
    filterKey: string
  ) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionChip,
              selectedValues.includes(option) && styles.selectedOptionChip
            ]}
            onPress={() => toggleMultiSelect(filterKey, option)}
          >
            <Text style={[
              styles.optionText,
              selectedValues.includes(option) && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRangeSlider = (
    title: string,
    min: number,
    max: number,
    value: { min: number; max: number },
    filterKey: string,
    suffix: string = ''
  ) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>
        {title}: {value.min.toLocaleString()}{suffix} - {value.max.toLocaleString()}{suffix}
      </Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Min</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={value.min}
          onValueChange={(val) => updateFilter(filterKey, { ...value, min: Math.round(val) })}
          minimumTrackTintColor={Color.cSK430B92500}
          maximumTrackTintColor="#ddd"
          thumbStyle={{ backgroundColor: Color.cSK430B92500 }}
        />
        <Text style={styles.sliderLabel}>Max</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={value.max}
          onValueChange={(val) => updateFilter(filterKey, { ...value, max: Math.round(val) })}
          minimumTrackTintColor={Color.cSK430B92500}
          maximumTrackTintColor="#ddd"
          thumbStyle={{ backgroundColor: Color.cSK430B92500 }}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Campaign Types */}
      {renderMultiSelectGroup(
        'Campaign Types',
        ['Brand Partnership', 'Product Review', 'Sponsored Post', 'Giveaway', 'Event Promotion', 'Content Creation'],
        filters.campaignTypes,
        'campaignTypes'
      )}

      {/* Price Range */}
      {renderRangeSlider(
        'Price Range (per post)',
        0,
        10000,
        filters.priceRange,
        'priceRange',
        '$'
      )}

      {/* Influencer Tiers */}
      {renderMultiSelectGroup(
        'Influencer Tiers',
        ['Nano', 'Micro', 'Macro', 'Mega'],
        filters.tiers,
        'tiers'
      )}

      {/* Platforms */}
      {renderMultiSelectGroup(
        'Platforms',
        ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Twitch', 'Snapchat'],
        filters.platforms,
        'platforms'
      )}

      {/* Follower Range */}
      {renderRangeSlider(
        'Follower Count',
        0,
        10000000,
        filters.followers,
        'followers',
        ''
      )}

      {/* Engagement Range */}
      {renderRangeSlider(
        'Engagement Rate',
        0,
        100,
        filters.engagement,
        'engagement',
        '%'
      )}

      {/* Location */}
      {renderMultiSelectGroup(
        'Location',
        ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Brazil', 'India', 'Japan', 'South Korea'],
        filters.locations,
        'locations'
      )}

      {/* Languages */}
      {renderMultiSelectGroup(
        'Languages',
        ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Mandarin', 'Hindi'],
        filters.languages,
        'languages'
      )}

      {/* Gender */}
      {renderMultiSelectGroup(
        'Gender',
        ['Male', 'Female', 'Non-binary'],
        filters.gender,
        'gender'
      )}

      {/* Age Range */}
      {renderMultiSelectGroup(
        'Age Range',
        ['18-24', '25-34', '35-44', '45-54', '55+'],
        filters.ageRange,
        'ageRange'
      )}

      {/* Post Frequency */}
      {renderMultiSelectGroup(
        'Posting Frequency',
        ['Daily', 'Weekly', 'Monthly'],
        filters.postFrequency,
        'postFrequency'
      )}

      {/* Audience Demographics */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Audience Demographics</Text>
        
        {renderMultiSelectGroup(
          'Audience Interests',
          ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Food', 'Travel', 'Fitness', 'Lifestyle', 'Education', 'Entertainment'],
          filters.demographics.interests,
          'demographics.interests'
        )}
        
        {renderMultiSelectGroup(
          'Audience Age',
          ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'],
          filters.demographics.audienceAge,
          'demographics.audienceAge'
        )}
        
        {renderMultiSelectGroup(
          'Audience Gender',
          ['Mostly Male', 'Mostly Female', 'Balanced'],
          filters.demographics.audienceGender,
          'demographics.audienceGender'
        )}
      </View>

      {/* Toggle Options */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Additional Options</Text>
        
        <View style={styles.toggleOption}>
          <Text style={styles.toggleLabel}>Verified Accounts Only</Text>
          <Switch
            value={filters.verifiedOnly}
            onValueChange={(value) => updateFilter('verifiedOnly', value)}
            trackColor={{ false: '#767577', true: Color.cSK430B92500 }}
            thumbColor={Platform.OS === 'ios' ? undefined : (filters.verifiedOnly ? Color.cSK430B92500 : '#f4f3f4')}
          />
        </View>
        
        <View style={styles.toggleOption}>
          <Text style={styles.toggleLabel}>Active in Last 30 Days</Text>
          <Switch
            value={filters.activeOnly}
            onValueChange={(value) => updateFilter('activeOnly', value)}
            trackColor={{ false: '#767577', true: Color.cSK430B92500 }}
            thumbColor={Platform.OS === 'ios' ? undefined : (filters.activeOnly ? Color.cSK430B92500 : '#f4f3f4')}
          />
        </View>
      </View>

      {/* Clear All Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
        <Text style={styles.clearButtonText}>Clear All Filters</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOptionChip: {
    backgroundColor: Color.cSK430B92500,
    borderColor: Color.cSK430B92500,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: 'white',
  },
  sliderContainer: {
    paddingHorizontal: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 50,
  },
});

export default AdvancedFilters;