import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterState {
  // General filters
  priceRange: { min: number; max: number };
  selectedTier: string[];
  followerSize: string;
  selectedPlatforms: string[];
  postingFrequency: string;
  
  // Location filters
  locationType: 'local' | 'country' | 'event';
  selectedCountries: string[];
  selectedCities: string[];
  
  // Demographic filters
  genderRatio: { male: number; female: number };
  ageRange: { min: number; max: number };
  selectedLanguages: string[];
  influencerAge: { min: number; max: number };
  selectedGroups: string[];
  
  // Category filters
  selectedCategories: string[];
  
  // Search
  searchText: string;
  
  // UI state
  activeFilterSection: 'filters' | 'location' | 'demographic' | 'category' | null;
}

interface DiscoveryFilterContextType {
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

const defaultFilters: FilterState = {
  priceRange: { min: 0, max: 10000 },
  selectedTier: [],
  followerSize: 'all',
  selectedPlatforms: [],
  postingFrequency: 'all',
  locationType: 'country',
  selectedCountries: [],
  selectedCities: [],
  genderRatio: { male: 50, female: 50 },
  ageRange: { min: 18, max: 65 },
  selectedLanguages: ['English'],
  influencerAge: { min: 18, max: 50 },
  selectedGroups: [],
  selectedCategories: [],
  searchText: '',
  activeFilterSection: null,
};

const DiscoveryFilterContext = createContext<DiscoveryFilterContextType | undefined>(undefined);

export const DiscoveryFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.priceRange.min !== defaultFilters.priceRange.min ||
      filters.priceRange.max !== defaultFilters.priceRange.max ||
      filters.selectedTier.length > 0 ||
      filters.followerSize !== 'all' ||
      filters.selectedPlatforms.length > 0 ||
      filters.postingFrequency !== 'all' ||
      filters.selectedCountries.length > 0 ||
      filters.selectedCities.length > 0 ||
      filters.selectedLanguages.length !== 1 || 
      filters.selectedLanguages[0] !== 'English' ||
      filters.selectedGroups.length > 0 ||
      filters.selectedCategories.length > 0 ||
      filters.searchText.trim() !== ''
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    
    if (filters.priceRange.min !== defaultFilters.priceRange.min || 
        filters.priceRange.max !== defaultFilters.priceRange.max) count++;
    if (filters.selectedTier.length > 0) count++;
    if (filters.followerSize !== 'all') count++;
    if (filters.selectedPlatforms.length > 0) count++;
    if (filters.postingFrequency !== 'all') count++;
    if (filters.selectedCountries.length > 0) count++;
    if (filters.selectedCities.length > 0) count++;
    if (filters.selectedLanguages.length !== 1 || filters.selectedLanguages[0] !== 'English') count++;
    if (filters.selectedGroups.length > 0) count++;
    if (filters.selectedCategories.length > 0) count++;
    if (filters.searchText.trim() !== '') count++;
    
    return count;
  };

  return (
    <DiscoveryFilterContext.Provider 
      value={{ 
        filters, 
        updateFilter, 
        resetFilters, 
        hasActiveFilters,
        getActiveFilterCount 
      }}
    >
      {children}
    </DiscoveryFilterContext.Provider>
  );
};

export const useDiscoveryFilters = () => {
  const context = useContext(DiscoveryFilterContext);
  if (!context) {
    console.error('DiscoveryFilterContext not found. Make sure DiscoveryFilterProvider wraps the component tree.');
    // Return default values to prevent crash during development
    return {
      filters: defaultFilters,
      updateFilter: () => {},
      resetFilters: () => {},
      hasActiveFilters: () => false,
      getActiveFilterCount: () => 0,
    };
  }
  return context;
};