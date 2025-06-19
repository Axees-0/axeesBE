import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const TestBasicPage: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>React Native Web is working</Text>
      <Text style={styles.subtitle}>Axees Frontend - Basic Validation Page</Text>
      <Text style={styles.info}>✅ React Native rendering</Text>
      <Text style={styles.info}>✅ Expo Router working</Text>
      <Text style={styles.info}>✅ TypeScript compilation</Text>
      <Text style={styles.info}>✅ CSS styling active</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#430B92',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default TestBasicPage;