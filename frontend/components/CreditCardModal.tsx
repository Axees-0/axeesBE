import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Color, Focus } from '@/GlobalStyles';

interface CreditCardModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (cardData: any) => void;
}

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = () => {
    // Basic validation
    if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Format and validate card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      Alert.alert('Error', 'Invalid card number');
      return;
    }

    // Validate expiry
    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    if (month < 1 || month > 12) {
      Alert.alert('Error', 'Invalid expiry month');
      return;
    }

    // In a real app, this would be sent to a payment processor
    const cardData = {
      number: cleanCardNumber,
      name: cardholderName,
      expiryMonth: month,
      expiryYear: year,
      cvv,
      billingZip,
      last4: cleanCardNumber.slice(-4),
    };

    onAdd(cardData);
    resetForm();
  };

  const resetForm = () => {
    setCardNumber('');
    setCardholderName('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setBillingZip('');
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    
    setCardNumber(formatted);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Credit/Debit Card</Text>
            <Pressable 
              onPress={onClose} 
              style={({ focused }) => [
                styles.closeButton,
                focused && styles.closeButtonFocused
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'cardNumber' && styles.inputFocused
                ]}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={formatCardNumber}
                onFocus={() => setFocusedInput('cardNumber')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="numeric"
                maxLength={19} // 16 digits + 3 spaces
                accessibilityLabel="Card number input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'cardholderName' && styles.inputFocused
                ]}
                placeholder="John Doe"
                value={cardholderName}
                onChangeText={setCardholderName}
                onFocus={() => setFocusedInput('cardholderName')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="words"
                accessibilityLabel="Cardholder name input"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Expiry Date *</Text>
                <View style={styles.expiryContainer}>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.expiryInput,
                      focusedInput === 'expiryMonth' && styles.inputFocused
                    ]}
                    placeholder="MM"
                    value={expiryMonth}
                    onChangeText={setExpiryMonth}
                    onFocus={() => setFocusedInput('expiryMonth')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="numeric"
                    maxLength={2}
                    accessibilityLabel="Expiry month input"
                  />
                  <Text style={styles.expirySeparator}>/</Text>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.expiryInput,
                      focusedInput === 'expiryYear' && styles.inputFocused
                    ]}
                    placeholder="YY"
                    value={expiryYear}
                    onChangeText={setExpiryYear}
                    onFocus={() => setFocusedInput('expiryYear')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="numeric"
                    maxLength={2}
                    accessibilityLabel="Expiry year input"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>CVV *</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'cvv' && styles.inputFocused
                  ]}
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  onFocus={() => setFocusedInput('cvv')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  accessibilityLabel="CVV input"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Billing ZIP Code</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'billingZip' && styles.inputFocused
                ]}
                placeholder="12345"
                value={billingZip}
                onChangeText={setBillingZip}
                onFocus={() => setFocusedInput('billingZip')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="numeric"
                maxLength={10}
                accessibilityLabel="Billing ZIP code input"
              />
            </View>

            <View style={styles.securityNote}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>
                Your payment information is encrypted and secure
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ focused }) => [
                  styles.button, 
                  styles.cancelButton,
                  focused && styles.cancelButtonFocused
                ]}
                onPress={onClose}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel adding card"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ focused }) => [
                  styles.button, 
                  styles.submitButton,
                  focused && styles.submitButtonFocused
                ]}
                onPress={handleSubmit}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add credit card"
              >
                <Text style={styles.submitButtonText}>Add Card</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.select({ ios: 20, default: 0 }),
    width: '100%',
    maxWidth: Platform.select({ web: 600, default: '100%' }),
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  closeButton: {
    padding: 8,
    borderRadius: 4,
  },
  closeButtonFocused: {
    ...Focus.primary,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    padding: Platform.select({ default: 16, web: 20 }),
  },
  inputGroup: {
    marginBottom: Platform.select({ default: 16, web: 20 }),
  },
  label: {
    fontSize: Platform.select({ default: 13, web: 14 }),
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: Platform.select({ default: 10, web: 12 }),
    fontSize: Platform.select({ default: 14, web: 16 }),
    color: '#333',
    minHeight: Platform.select({ default: 40, web: 48 }),
  },
  inputFocused: {
    ...Focus.primary,
  },
  row: {
    flexDirection: Platform.select({ default: 'column', web: 'row' }),
    gap: Platform.select({ default: 0, web: 16 }),
  },
  halfWidth: {
    flex: Platform.select({ default: 0, web: 1 }),
    marginBottom: Platform.select({ default: 16, web: 0 }),
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryInput: {
    flex: 1,
  },
  expirySeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#666',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  actions: {
    flexDirection: Platform.select({ default: 'column', web: 'row' }),
    gap: Platform.select({ default: 8, web: 12 }),
  },
  button: {
    flex: Platform.select({ default: 0, web: 1 }),
    padding: Platform.select({ default: 12, web: 16 }),
    borderRadius: 8,
    alignItems: 'center',
    minHeight: Platform.select({ default: 44, web: 48 }),
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonFocused: {
    ...Focus.secondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  submitButton: {
    backgroundColor: Color.cSK430B92500,
  },
  submitButtonFocused: {
    ...Focus.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});