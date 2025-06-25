import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';

interface MetricData {
  networkValue: number;
  brandValue: number;
  appInfluence: number;
  reachScore: number;
  engagementTrend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface RealTimeMetricsProps {
  creatorId: string;
  initialData?: MetricData;
  onMetricClick?: (metric: string) => void;
  compact?: boolean;
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  creatorId,
  initialData,
  onMetricClick,
  compact = false,
}) => {
  const [metrics, setMetrics] = useState<MetricData>(initialData || {
    networkValue: 0,
    brandValue: 0,
    appInfluence: 0,
    reachScore: 0,
    engagementTrend: 'stable',
    lastUpdated: new Date(),
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const valueAnimations = useRef({
    network: new Animated.Value(0),
    brand: new Animated.Value(0),
    influence: new Animated.Value(0),
  }).current;

  // Simulate real-time updates
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        networkValue: prev.networkValue + Math.floor(Math.random() * 100 - 40),
        brandValue: prev.brandValue + Math.floor(Math.random() * 500 - 200),
        appInfluence: Math.max(0, Math.min(100, prev.appInfluence + (Math.random() * 4 - 2))),
        reachScore: Math.max(0, prev.reachScore + Math.floor(Math.random() * 1000 - 400)),
        engagementTrend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        lastUpdated: new Date(),
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(updateInterval);
  }, []);

  // Pulse animation for live indicator
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Animate value changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(valueAnimations.network, {
        toValue: metrics.networkValue,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(valueAnimations.brand, {
        toValue: metrics.brandValue,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(valueAnimations.influence, {
        toValue: metrics.appInfluence,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, [metrics]);

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value > 1000000 
          ? `${(value / 1000000).toFixed(1)}M`
          : value > 1000 
          ? `${(value / 1000).toFixed(1)}K`
          : value.toString();
      default:
        return value.toString();
    }
  };

  const getTrendIcon = () => {
    switch (metrics.engagementTrend) {
      case 'up':
        return <Ionicons name="trending-up" size={16} color="#10B981" />;
      case 'down':
        return <Ionicons name="trending-down" size={16} color="#EF4444" />;
      default:
        return <MaterialCommunityIcons name="minus" size={16} color="#6B7280" />;
    }
  };

  const MetricCard = ({ icon, label, value, type, color, onPress }: any) => (
    <TouchableOpacity
      style={[styles.metricCard, compact && styles.metricCardCompact]}
      onPress={() => onPress && onPress(label)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '30' }]}>
            {icon}
          </View>
          <View style={styles.liveIndicator}>
            <Animated.View
              style={[
                styles.liveDot,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        
        <Text style={styles.metricLabel}>{label}</Text>
        
        <Animated.Text style={[styles.metricValue, { color }]}>
          {formatValue(value, type)}
        </Animated.Text>
        
        {!compact && (
          <View style={styles.metricFooter}>
            {getTrendIcon()}
            <Text style={styles.updateText}>
              Updated {Math.floor((new Date().getTime() - metrics.lastUpdated.getTime()) / 1000)}s ago
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <View style={styles.compactMetric}>
            <MaterialCommunityIcons name="network" size={18} color="#8B5CF6" />
            <Text style={styles.compactValue}>
              {formatValue(metrics.networkValue, 'number')}
            </Text>
          </View>
          <View style={styles.compactMetric}>
            <FontAwesome5 name="dollar-sign" size={16} color="#10B981" />
            <Text style={styles.compactValue}>
              {formatValue(metrics.brandValue, 'currency')}
            </Text>
          </View>
          <View style={styles.compactMetric}>
            <MaterialCommunityIcons name="trending-up" size={18} color="#F59E0B" />
            <Text style={styles.compactValue}>
              {formatValue(metrics.appInfluence, 'percentage')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Real-Time Metrics</Text>
        <View style={styles.globalLiveIndicator}>
          <Animated.View
            style={[
              styles.liveDot,
              { transform: [{ scale: pulseAnim }] }
            ]}
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon={<MaterialCommunityIcons name="network" size={24} color="#8B5CF6" />}
          label="Network Value"
          value={valueAnimations.network}
          type="number"
          color="#8B5CF6"
          onPress={onMetricClick}
        />
        
        <MetricCard
          icon={<FontAwesome5 name="dollar-sign" size={20} color="#10B981" />}
          label="Brand Value"
          value={valueAnimations.brand}
          type="currency"
          color="#10B981"
          onPress={onMetricClick}
        />
        
        <MetricCard
          icon={<MaterialCommunityIcons name="trending-up" size={24} color="#F59E0B" />}
          label="App Influence"
          value={valueAnimations.influence}
          type="percentage"
          color="#F59E0B"
          onPress={onMetricClick}
        />
        
        <MetricCard
          icon={<Ionicons name="people" size={24} color="#3B82F6" />}
          label="Reach Score"
          value={metrics.reachScore}
          type="number"
          color="#3B82F6"
          onPress={onMetricClick}
        />
      </View>

      <View style={styles.insightBar}>
        <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#6B7280" />
        <Text style={styles.insightText}>
          Your influence is growing! Brand value increased 12% this week
        </Text>
      </View>
    </View>
  );
};

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...DesignSystem.Typography.h3,
    color: DesignSystem.AccessibleColors.textSecondary,
  },
  globalLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    flex: 1,
    minWidth: '48%',
    margin: 6,
  },
  metricCardCompact: {
    minWidth: 'auto',
  },
  metricGradient: {
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    ...DesignSystem.Typography.h2,
    fontSize: 24,
    marginBottom: 8,
  },
  metricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateText: {
    ...DesignSystem.Typography.small,
    color: DesignSystem.AccessibleColors.textMuted,
    marginLeft: 6,
  },
  insightBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.AccessibleColors.backgroundSubtle,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  insightText: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  compactContainer: {
    backgroundColor: DesignSystem.AccessibleColors.backgroundSubtle,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  compactMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactValue: {
    ...DesignSystem.Typography.bodyMedium,
    marginLeft: 6,
  },
});

export default RealTimeMetrics;