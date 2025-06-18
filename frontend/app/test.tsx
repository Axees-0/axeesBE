import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native App is Working!</Text>
      <Text style={styles.subtitle}>The marketplace component you were looking for is at:</Text>
      <Text style={styles.path}>app/UFM01ResultsScreen.tsx</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  path: {
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
  },
});