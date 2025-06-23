import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Color, FontFamily, Focus } from '@/GlobalStyles';

interface AccessibleFiltersProps {
  availableFilters: string[];
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
  onClearAll: () => void;
}

export const AccessibleFilters: React.FC<AccessibleFiltersProps> = ({
  availableFilters,
  selectedFilters,
  onFilterChange,
  onClearAll,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const filterRefs = useRef<(View | null)[]>([]);
  const clearButtonRef = useRef<View>(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const totalItems = availableFilters.length + (selectedFilters.length > 0 ? 1 : 0);
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = (prev + 1) % totalItems;
            return next;
          });
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = prev <= 0 ? totalItems - 1 : prev - 1;
            return next;
          });
          break;
          
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
          
        case 'End':
          event.preventDefault();
          setFocusedIndex(totalItems - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [availableFilters.length, selectedFilters.length]);

  // Focus management
  useEffect(() => {
    if (Platform.OS !== 'web' || focusedIndex === -1) return;

    const isClearButton = focusedIndex === availableFilters.length;
    
    if (isClearButton && clearButtonRef.current) {
      (clearButtonRef.current as any)?.focus?.();
      // Scroll into view
      (clearButtonRef.current as any)?.scrollIntoView?.({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    } else if (filterRefs.current[focusedIndex]) {
      (filterRefs.current[focusedIndex] as any)?.focus?.();
      // Scroll into view
      (filterRefs.current[focusedIndex] as any)?.scrollIntoView?.({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [focusedIndex, availableFilters.length]);

  const toggleFilter = (filter: string) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    onFilterChange(newFilters);
  };

  const handleFilterKeyPress = (event: any, filter: string, index: number) => {
    if (event.nativeEvent.key === 'Enter' || event.nativeEvent.key === ' ') {
      event.preventDefault();
      toggleFilter(filter);
      setFocusedIndex(index);
    }
  };

  const handleClearKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter' || event.nativeEvent.key === ' ') {
      event.preventDefault();
      onClearAll();
      setFocusedIndex(0);
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="group"
      accessibilityLabel="Filter options"
    >
      <Text style={styles.title}>Filters</Text>
      
      <ScrollView
        style={styles.filterList}
        keyboardShouldPersistTaps="handled"
      >
        <View
          role="listbox"
          aria-label="Category filters"
          aria-multiselectable="true"
        >
          {availableFilters.map((filter, index) => {
            const isSelected = selectedFilters.includes(filter);
            const isFocused = focusedIndex === index;

            return (
              <Pressable
                key={filter}
                ref={ref => filterRefs.current[index] = ref}
                style={({ pressed, focused }) => [
                  styles.filterItem,
                  isSelected && styles.filterItemActive,
                  (pressed || focused || isFocused) && styles.filterItemFocused,
                ]}
                onPress={() => toggleFilter(filter)}
                onKeyPress={(e) => handleFilterKeyPress(e, filter, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                accessible={true}
                accessibilityRole="checkbox"
                accessibilityState={{ 
                  checked: isSelected,
                  selected: isSelected 
                }}
                accessibilityLabel={`${filter} filter`}
                accessibilityHint={`${isSelected ? 'Remove' : 'Add'} ${filter} filter`}
                {...(Platform.OS === 'web' && {
                  tabIndex: 0,
                  role: 'option',
                  'aria-selected': isSelected,
                })}
              >
                <View style={styles.filterContent}>
                  <Text 
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxActive
                    ]}
                    aria-hidden="true"
                  >
                    {isSelected ? '✓' : '○'}
                  </Text>
                  <Text style={[
                    styles.filterText,
                    isSelected && styles.filterTextActive
                  ]}>
                    {filter}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedFilters.length > 0 && (
          <Pressable
            ref={clearButtonRef}
            style={({ pressed, focused }) => [
              styles.clearButton,
              (pressed || focused || focusedIndex === availableFilters.length) && styles.clearButtonFocused,
            ]}
            onPress={onClearAll}
            onKeyPress={handleClearKeyPress}
            onFocus={() => setFocusedIndex(availableFilters.length)}
            onBlur={() => setFocusedIndex(-1)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            accessibilityHint={`Remove ${selectedFilters.length} selected filters`}
            {...(Platform.OS === 'web' && { tabIndex: 0 })}
          >
            <Text style={styles.clearButtonText}>
              Clear All ({selectedFilters.length})
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {Platform.OS === 'web' && (
        <Text style={styles.keyboardHint} aria-live="polite">
          Use arrow keys to navigate, Space or Enter to select
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 16,
    fontFamily: FontFamily.inter,
  },
  filterList: {
    maxHeight: 400,
    marginBottom: 8, // Add margin to prevent scrollbar overlap with helper text
    paddingRight: Platform.OS === 'web' ? 8 : 0, // Add padding for web scrollbar spacing
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterItemActive: {
    backgroundColor: Color.cSK430B92500, // Use darker purple background for better contrast
    borderColor: Color.cSK430B92500,
  },
  filterItemFocused: {
    ...Focus.primary,
    borderRadius: 8,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    fontSize: 16,
    marginRight: 12,
    color: '#999',
    width: 20,
  },
  checkboxActive: {
    color: '#fff', // White checkbox on dark purple background for WCAG AA compliance
  },
  filterText: {
    fontSize: 16,
    color: '#333',
    fontFamily: FontFamily.inter,
  },
  filterTextActive: {
    color: '#fff', // White text on dark purple background for WCAG AA compliance
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonFocused: {
    ...Focus.primary,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: FontFamily.inter,
  },
  keyboardHint: {
    marginTop: 16, // Increased margin to ensure proper separation from scrollbar
    paddingTop: 8, // Add padding for extra spacing
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0', // Add subtle border to separate from filter area
  },
});