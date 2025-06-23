import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { isMobile, isTablet } from '@/constants/breakpoints';

interface DealSkeletonProps {
  variant?: 'card' | 'summary' | 'list';
  count?: number;
}

export const DealSkeleton: React.FC<DealSkeletonProps> = ({ 
  variant = 'card', 
  count = 3 
}) => {
  const { width } = useWindowDimensions();
  const isMobileDevice = isMobile(width);
  const isTabletDevice = isTablet(width);

  const getCardStyles = () => {
    if (Platform.OS !== 'web') {
      return styles.skeletonCard;
    }

    if (isMobileDevice) {
      return [
        styles.skeletonCard,
        {
          marginHorizontal: 0,
          width: '100%',
        }
      ];
    } else if (isTabletDevice) {
      return [
        styles.skeletonCard,
        {
          marginHorizontal: 0,
          width: '100%',
          maxWidth: '100%',
          padding: 20,
        }
      ];
    } else {
      return [
        styles.skeletonCard,
        {
          marginHorizontal: 0,
          width: '100%',
          maxWidth: 800,
        }
      ];
    }
  };

  const getSummaryStyles = () => {
    if (isMobileDevice) {
      return styles.summaryColumnLayout;
    }
    return styles.summaryRowLayout;
  };

  if (variant === 'summary') {
    return (
      <View style={getSummaryStyles()}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.summarySkeleton}>
            <SkeletonLoader width="60%" height={24} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="40%" height={16} />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'list') {
    return (
      <View style={styles.listContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listIcon}>
              <SkeletonLoader width={40} height={40} borderRadius={20} />
            </View>
            <View style={styles.listContent}>
              <SkeletonLoader width="70%" height={16} style={{ marginBottom: 6 }} />
              <SkeletonLoader width="50%" height={14} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="30%" height={12} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Default: card variant
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={getCardStyles()}>
          {/* Header section */}
          <View style={styles.cardHeader}>
            <View style={styles.cardMainInfo}>
              <SkeletonLoader width="70%" height={18} style={{ marginBottom: 6 }} />
              <SkeletonLoader width="50%" height={14} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="40%" height={12} />
            </View>
            <View style={styles.cardActions}>
              <SkeletonLoader width={80} height={20} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={60} height={24} borderRadius={12} />
            </View>
          </View>

          {/* Description section */}
          <View style={styles.cardDescription}>
            <SkeletonLoader width="100%" height={14} style={{ marginBottom: 4 }} />
            <SkeletonLoader width="80%" height={14} />
          </View>

          {/* Requirements/Details section */}
          <View style={styles.cardRequirements}>
            <SkeletonLoader width="40%" height={12} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="90%" height={12} style={{ marginBottom: 4 }} />
            <SkeletonLoader width="75%" height={12} />
          </View>

          {/* Action buttons */}
          <View style={styles.cardButtons}>
            <SkeletonLoader width={80} height={32} borderRadius={8} />
            <SkeletonLoader width={80} height={32} borderRadius={8} />
            <SkeletonLoader width={80} height={32} borderRadius={8} />
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <SkeletonLoader width="35%" height={12} />
            <SkeletonLoader width="25%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const DealMetricsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const { width } = useWindowDimensions();
  const isMobileDevice = isMobile(width);

  const getMetricsStyles = () => {
    if (isMobileDevice) {
      return styles.metricsColumn;
    }
    return styles.metricsRow;
  };

  return (
    <View style={getMetricsStyles()}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.metricSkeleton}>
          <SkeletonLoader width="60%" height={14} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="80%" height={24} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="40%" height={12} />
        </View>
      ))}
    </View>
  );
};

export const DealActivitySkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.activityContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.activityItem}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={styles.activityContent}>
            <SkeletonLoader width="60%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="90%" height={14} style={{ marginBottom: 4 }} />
            <SkeletonLoader width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const DealListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.dealListContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.dealListCard}>
          {/* Deal content section */}
          <View style={styles.dealListContent}>
            <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
            <View style={styles.dealListDetails}>
              <SkeletonLoader width="30%" height={16} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="60%" height={14} style={{ marginBottom: 8 }} />
            </View>
            <SkeletonLoader width="40%" height={12} style={{ marginBottom: 8 }} />
            
            {/* Platform icons */}
            <View style={styles.dealListPlatforms}>
              <SkeletonLoader width={35} height={35} borderRadius={8} />
              <SkeletonLoader width={35} height={35} borderRadius={8} />
              <SkeletonLoader width={35} height={35} borderRadius={8} />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dealListDivider} />

          {/* Creator info section */}
          <View style={styles.dealListCreatorInfo}>
            <SkeletonLoader width="40%" height={14} />
            <SkeletonLoader width={60} height={28} borderRadius={14} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D0FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardMainInfo: {
    flex: 1,
    marginRight: 16,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  cardDescription: {
    marginBottom: 16,
  },
  cardRequirements: {
    marginBottom: 16,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  // Summary skeletons
  summaryRowLayout: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryColumnLayout: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  summarySkeleton: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D0FB',
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
  },
  // Metrics skeletons
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metricsColumn: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  metricSkeleton: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D0FB',
    height: 120,
    justifyContent: 'space-between',
  },
  // List skeletons
  listContainer: {
    gap: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listIcon: {
    width: 40,
    height: 40,
  },
  listContent: {
    flex: 1,
  },
  // Activity skeletons
  activityContainer: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityContent: {
    flex: 1,
  },
  // Deal list skeleton styles
  dealListContainer: {
    gap: 12,
  },
  dealListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D0FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dealListContent: {
    marginBottom: 12,
  },
  dealListDetails: {
    marginBottom: 8,
  },
  dealListPlatforms: {
    flexDirection: 'row',
    gap: 8,
  },
  dealListDivider: {
    height: 1,
    backgroundColor: '#E2D0FB',
    marginVertical: 12,
  },
  dealListCreatorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});