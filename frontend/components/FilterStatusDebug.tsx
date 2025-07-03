import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDiscoveryFilters } from '@/contexts/DiscoveryFilterContext';
import { BrandColors } from '@/constants/Colors';

// Debug component to verify filter persistence
export const FilterStatusDebug = () => {
  const { filters, getActiveFilterCount } = useDiscoveryFilters();
  
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }
  
  const activeCount = getActiveFilterCount();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Status (Debug)</Text>
      <Text style={styles.stat}>Active Filters: {activeCount}</Text>
      <Text style={styles.stat}>Search: "{filters.searchText}"</Text>
      <Text style={styles.stat}>Price: ${filters.priceRange.min}-${filters.priceRange.max}</Text>
      <Text style={styles.stat}>Platforms: {filters.selectedPlatforms.join(', ') || 'None'}</Text>
      <Text style={styles.stat}>Categories: {filters.selectedCategories.join(', ') || 'None'}</Text>
      <Text style={styles.stat}>Countries: {filters.selectedCountries.join(', ') || 'None'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    maxWidth: 200,
    zIndex: 9999,
  },
  title: {
    color: BrandColors.primary[400],
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stat: {
    color: 'white',
    fontSize: 12,
    marginVertical: 2,
  },
});