import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { getMetrics } from '@/utils/metrics';

export const MetricsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [timeRange, setTimeRange] = useState(5); // minutes
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setSummary(getMetrics().getSummary(timeRange));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [timeRange]);

  if (!__DEV__ || !summary) return null;

  const getHealthColor = () => {
    if (summary.errors.jsErrors > 5) return '#FF4444';
    if (summary.errors.apiErrors > 10) return '#FF8800';
    if (summary.pageLoads.avgTime > 3000) return '#FF8800';
    return '#44FF44';
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.header}>
        <View style={[styles.healthDot, { backgroundColor: getHealthColor() }]} />
        <Text style={styles.headerText}>
          📊 Metrics ({summary.timeRange})
        </Text>
      </Pressable>

      {isExpanded && (
        <ScrollView style={styles.content}>
          {/* Performance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Performance</Text>
            <Text style={styles.metric}>
              Page Loads: {summary.pageLoads.count}
            </Text>
            <Text style={styles.metric}>
              Avg Load Time: {summary.pageLoads.avgTime}ms
            </Text>
            <Text style={[styles.metric, summary.pageLoads.maxTime > 3000 && styles.warning]}>
              Max Load Time: {summary.pageLoads.maxTime}ms
            </Text>
          </View>

          {/* Errors Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Errors</Text>
            <Text style={[styles.metric, summary.errors.jsErrors > 0 && styles.error]}>
              JS Errors: {summary.errors.jsErrors}
            </Text>
            <Text style={[styles.metric, summary.errors.apiErrors > 0 && styles.warning]}>
              API Errors: {summary.errors.apiErrors}
            </Text>
            <Text style={[styles.metric, summary.errors.authFailures > 0 && styles.warning]}>
              Auth Failures: {summary.errors.authFailures}
            </Text>
          </View>

          {/* Navigation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧭 Navigation</Text>
            <Text style={styles.metric}>
              Route Changes: {summary.routes.changes}
            </Text>
            <Text style={styles.metric}>
              Unique Routes: {summary.routes.unique.length}
            </Text>
            {summary.routes.unique.slice(0, 5).map((route: string, index: number) => (
              <Text key={index} style={styles.route}>
                • {route}
              </Text>
            ))}
          </View>

          {/* Time Range Selector */}
          <View style={styles.timeRangeContainer}>
            <Text style={styles.sectionTitle}>⏱️ Time Range</Text>
            <View style={styles.timeRangeButtons}>
              {[1, 5, 15, 30].map((minutes) => (
                <Pressable
                  key={minutes}
                  onPress={() => setTimeRange(minutes)}
                  style={[
                    styles.timeRangeButton,
                    timeRange === minutes && styles.timeRangeButtonActive
                  ]}
                >
                  <Text style={[
                    styles.timeRangeText,
                    timeRange === minutes && styles.timeRangeTextActive
                  ]}>
                    {minutes}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                getMetrics().forceFlush();
              }}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Flush Metrics</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (__DEV__) {
                  const recent = getMetrics().getRecent(10);
                  console.log('Recent metrics:', recent);
                }
              }}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Log Recent</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 8,
    minWidth: 280,
    maxWidth: 350,
    zIndex: 9998,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    maxHeight: 400,
    padding: 12,
    paddingRight: 16, // Add extra padding to prevent scrollbar overlap
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metric: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
    paddingLeft: 12,
  },
  warning: {
    color: '#FF8800',
  },
  error: {
    color: '#FF4444',
  },
  route: {
    color: '#999',
    fontSize: 11,
    marginLeft: 24,
    marginBottom: 2,
  },
  timeRangeContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  timeRangeButtonActive: {
    backgroundColor: '#430B92',
  },
  timeRangeText: {
    color: '#999',
    fontSize: 12,
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default MetricsDashboard;