import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import SallyMcNultyProfile from '../components/desktop/SallyMcNultyProfile';
import SallyMcNultyDesktop from '../components/desktop/SallyMcNultyDesktop';
import { WebSEO } from './web-seo';

const SallyDemo = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  return (
    <>
      <WebSEO 
        title="Sally McNulty Profile Demo - Axees"
        description="Desktop profile demo showcasing Sally McNulty's racing-themed creator profile"
        keywords="sally mcnulty, profile demo, creator profile, racing theme"
      />
      <View style={styles.container}>
        {isDesktop ? <SallyMcNultyDesktop /> : <SallyMcNultyProfile />}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default SallyDemo;