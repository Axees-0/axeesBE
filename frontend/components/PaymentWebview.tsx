import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PaymentWebviewProps {
  [key: string]: any;
}

// Stub component for demo mode - payments are bypassed
const PaymentWebview: React.FC<PaymentWebviewProps> = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Payment Bypassed (Demo Mode)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    margin: 16,
  },
  text: {
    textAlign: 'center',
    color: '#007bff',
    fontWeight: '600',
  },
});

export default PaymentWebview;