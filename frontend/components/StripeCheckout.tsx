import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StripeCheckoutProps {
  amount?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  [key: string]: any;
}

// Stub component for demo mode - payments are bypassed
const StripeCheckout: React.FC<StripeCheckoutProps> = ({ 
  amount = 0, 
  onSuccess, 
  onCancel, 
  ...props 
}) => {
  const handlePayment = () => {
    // Simulate successful payment in demo mode
    setTimeout(() => {
      if (onSuccess) onSuccess();
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Demo Payment</Text>
      <Text style={styles.amount}>${amount.toLocaleString()}</Text>
      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
        <Text style={styles.payButtonText}>Process Payment (Demo)</Text>
      </TouchableOpacity>
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#430B92',
    textAlign: 'center',
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#430B92',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default StripeCheckout;