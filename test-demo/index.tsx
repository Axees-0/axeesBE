import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';

export default function TestDemoIndex() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🚀 Investor Demo Test Environment</Text>
        <Text style={styles.subtitle}>
          Test the AxeesMockup3-based profile layout with demo content
        </Text>
        
        <View style={styles.demoOptions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/test-demo/investor-profile')}
          >
            <Text style={styles.primaryButtonText}>View Demo Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Demo Features:</Text>
          <Text style={styles.infoItem}>• AxeesMockup3 UI layout preserved exactly</Text>
          <Text style={styles.infoItem}>• MrBeast profile data (1.1B+ followers)</Text>
          <Text style={styles.infoItem}>• Responsive design (desktop + mobile)</Text>
          <Text style={styles.infoItem}>• Full modal integration</Text>
          <Text style={styles.infoItem}>• Production-ready for investor demos</Text>
        </View>
        
        <View style={styles.platformInfo}>
          <Text style={styles.platformText}>
            Platform: {Platform.OS === 'web' ? '🌐 Web' : '📱 Mobile'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#430B92',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C6C6C',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  demoOptions: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#430B92',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#430B92',
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#430B92',
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#430B92',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#6C6C6C',
    marginBottom: 6,
    lineHeight: 20,
  },
  platformInfo: {
    alignItems: 'center',
  },
  platformText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
});