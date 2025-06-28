import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Color, FontFamily } from '@/GlobalStyles';

interface EmptyStateProps {
  searchText?: string;
  selectedFilters?: string[];
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onClearAll?: () => void;
  totalCreators?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchText = '',
  selectedFilters = [],
  onClearSearch,
  onClearFilters,
  onClearAll,
  totalCreators = 0,
}) => {
  const hasSearch = searchText.trim().length > 0;
  const hasFilters = selectedFilters.length > 0;
  const hasAnyFiltering = hasSearch || hasFilters;

  // Generate helpful suggestions based on the context
  const getSuggestions = () => {
    const suggestions = [];
    
    if (hasSearch) {
      suggestions.push('Check your spelling');
      suggestions.push('Try different keywords');
      suggestions.push('Use broader search terms');
    }
    
    if (hasFilters) {
      suggestions.push('Remove some filters');
      suggestions.push('Try different categories');
    }
    
    if (!hasAnyFiltering) {
      suggestions.push('Try searching for "Fashion", "Tech", or "Lifestyle"');
      suggestions.push('Browse by category using filters');
    }
    
    return suggestions;
  };

  // Generate action buttons based on context
  const getActions = () => {
    const actions = [];
    
    if (hasSearch && onClearSearch) {
      actions.push({
        label: 'Clear search',
        onPress: onClearSearch,
        style: 'secondary',
      });
    }
    
    if (hasFilters && onClearFilters) {
      actions.push({
        label: `Clear ${selectedFilters.length} filter${selectedFilters.length > 1 ? 's' : ''}`,
        onPress: onClearFilters,
        style: 'secondary',
      });
    }
    
    if (hasAnyFiltering && onClearAll) {
      actions.push({
        label: 'Clear all',
        onPress: onClearAll,
        style: 'primary',
      });
    }
    
    return actions;
  };

  return (
    <View 
      style={styles.container}
      accessibilityRole="region"
      accessibilityLabel="No results found"
      accessibilityLiveRegion="polite"
    >
      {/* Icon */}
      <Text style={styles.icon} aria-hidden="true">🔍</Text>
      
      {/* Title */}
      <Text style={styles.title}>
        {hasAnyFiltering ? 'No creators found' : 'No creators available'}
      </Text>
      
      {/* Description */}
      <Text style={styles.description}>
        {hasSearch && hasFilters && (
          <>We couldn't find any creators matching "{searchText}" with the selected filters.</>
        )}
        {hasSearch && !hasFilters && (
          <>We couldn't find any creators matching "{searchText}".</>
        )}
        {!hasSearch && hasFilters && (
          <>We couldn't find any creators in the selected categories: {selectedFilters.join(', ')}.</>
        )}
        {!hasAnyFiltering && (
          <>Start exploring our {totalCreators > 0 ? `${totalCreators}+` : ''} talented creators!</>
        )}
      </Text>
      
      {/* Suggestions */}
      {hasAnyFiltering && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Try these suggestions:</Text>
          {getSuggestions().map((suggestion, index) => (
            <Text key={index} style={styles.suggestionItem}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}
      
      {/* Action buttons */}
      {getActions().length > 0 && (
        <View style={styles.actions}>
          {getActions().map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.style === 'primary' && styles.primaryButton,
                action.style === 'secondary' && styles.secondaryButton,
              ]}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text style={[
                styles.actionButtonText,
                action.style === 'primary' && styles.primaryButtonText,
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Popular categories hint */}
      {!hasFilters && totalCreators > 0 && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Popular categories: Fashion, Technology, Lifestyle, Food, Beauty
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 400,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
    opacity: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: FontFamily.inter,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 500,
    marginBottom: 24,
    fontFamily: FontFamily.inter,
  },
  suggestions: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: FontFamily.inter,
  },
  suggestionItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: FontFamily.inter,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Color.cSK430B92500,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: FontFamily.inter,
  },
  primaryButtonText: {
    color: '#fff',
  },
  hint: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: FontFamily.inter,
  },
});