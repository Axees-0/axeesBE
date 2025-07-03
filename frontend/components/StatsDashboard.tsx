import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Color } from '@/GlobalStyles';

interface StatItem {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  growth?: string;
}

interface StatsDashboardProps {
  stats?: StatItem[];
  style?: any;
}

// Animated number component for smooth transitions
const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}> = ({ value, prefix = '', suffix = '', duration = 1500 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: true,
    }).start();

    return () => {
      animatedValue.removeAllListeners();
    };
  }, [value, duration]);

  return (
    <Text style={styles.statValue}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </Text>
  );
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  style,
}) => {
  // Default impressive stats for investor demo
  const defaultStats: StatItem[] = [
    {
      label: 'Total Creators',
      value: '12847',
      suffix: '+',
      growth: '+156% YoY',
    },
    {
      label: 'Active Brands',
      value: '3420',
      suffix: '+',
      growth: '+89% YoY',
    },
    {
      label: 'GMV Processed',
      value: '24.8',
      prefix: '$',
      suffix: 'M',
      growth: '+234% YoY',
    },
    {
      label: 'Avg Deal Value',
      value: '3850',
      prefix: '$',
      growth: '+45% YoY',
    },
  ];

  const displayStats = stats || defaultStats;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Platform Metrics</Text>
        <Text style={styles.subtitle}>Real-time performance dashboard</Text>
      </View>
      
      <View style={styles.statsGrid}>
        {displayStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            
            {/* For web, show animated numbers; for native, show static */}
            {Platform.OS === 'web' ? (
              <AnimatedNumber
                value={parseFloat(stat.value.replace(/,/g, ''))}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            ) : (
              <Text style={styles.statValue}>
                {stat.prefix}{stat.value}{stat.suffix}
              </Text>
            )}
            
            {stat.growth && (
              <View style={styles.growthContainer}>
                <Text style={styles.growthIcon}>📈</Text>
                <Text style={styles.growthText}>{stat.growth}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Live activity ticker */}
      <View style={styles.activitySection}>
        <Text style={styles.activityTitle}>Live Activity</Text>
        <View style={styles.activityList}>
          <ActivityItem
            text="Emma Thompson just closed a $5,200 deal"
            time="2 min ago"
          />
          <ActivityItem
            text="Nike started a new campaign with 8 creators"
            time="5 min ago"
          />
          <ActivityItem
            text="Marcus Johnson completed product review"
            time="12 min ago"
          />
        </View>
      </View>
    </View>
  );
};

// Activity ticker item
const ActivityItem: React.FC<{ text: string; time: string }> = ({ text, time }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.activityItem, { opacity: fadeAnim }]}>
      <View style={styles.activityDot} />
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{text}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </Animated.View>
  );
};

// Mini stats bar for compact displays
export const StatsBar: React.FC<{ style?: any }> = ({ style }) => {
  return (
    <View style={[styles.statsBar, style]}>
      <View style={styles.statsBarItem}>
        <Text style={styles.statsBarValue}>12.8K+</Text>
        <Text style={styles.statsBarLabel}>Creators</Text>
      </View>
      <View style={styles.statsBarDivider} />
      <View style={styles.statsBarItem}>
        <Text style={styles.statsBarValue}>$24.8M</Text>
        <Text style={styles.statsBarLabel}>GMV</Text>
      </View>
      <View style={styles.statsBarDivider} />
      <View style={styles.statsBarItem}>
        <Text style={styles.statsBarValue}>98%</Text>
        <Text style={styles.statsBarLabel}>Success Rate</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'interBold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'interRegular',
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'interMedium',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'interBold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  growthIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  growthText: {
    fontSize: 12,
    fontFamily: 'interMedium',
    color: '#10B981',
  },
  activitySection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'interSemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'interRegular',
    color: '#374151',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'interRegular',
    color: '#9CA3AF',
  },
  // Stats bar styles
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.cSK430B92500,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statsBarItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsBarDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  statsBarValue: {
    fontSize: 20,
    fontFamily: 'interBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsBarLabel: {
    fontSize: 12,
    fontFamily: 'interRegular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default StatsDashboard;