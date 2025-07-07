import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import MarcusJohnsonDesktop from '../components/desktop/MarcusJohnsonDesktop';
import SallyMcNultyProfile from '../components/desktop/SallyMcNultyProfile';

export default function MarcusDemo() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 1250;

  return (
    <View style={styles.container}>
      {isDesktop ? (
        <MarcusJohnsonDesktop />
      ) : (
        <SallyMcNultyProfile />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});