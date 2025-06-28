import React, { useState, useEffect } from 'react';
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
import { useAccessibleFocusTrap } from '@/hooks/useFocusTrap';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Use focus trap hook
  const focusTrapRef = useAccessibleFocusTrap(
    visible,
    'Add Credit/Debit Card',
    'Enter your credit or debit card information'
  );

  // Add ESC key support for web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [visible, onClose]);

  const handleSubmit = () => {
    // Mark all fields as touched to show validation errors
    setTouched({
      cardNumber: true,
      cardholderName: true,
      expiryMonth: true,
      expiryYear: true,
      cvv: true,
    });
    
    // Validate all fields
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    const isCardValid = validateCardNumber(cleanCardNumber);
    const isNameValid = validateName(cardholderName);
    const isExpiryValid = validateExpiry(expiryMonth, expiryYear);
    const isCvvValid = validateCVV(cvv);
    
    if (!isCardValid || !isNameValid || !isExpiryValid || !isCvvValid) {
      // Show platform-specific error message
      if (Platform.OS === 'web') {
        // Errors are already shown inline, no need for alert
        return;
      } else {
        Alert.alert('Validation Error', 'Please fix the errors in the form');
        return;
      }
    }

    // In a real app, this would be sent to a payment processor
    const cardData = {
      number: cleanCardNumber,
      name: cardholderName,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
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
    setErrors({});
    setTouched({});
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    
    setCardNumber(formatted);
    
    // Validate card number in real-time
    if (touched.cardNumber) {
      validateCardNumber(cleaned);
    }
  };
  
  const validateCardNumber = (number: string) => {
    const newErrors = { ...errors };
    
    if (!number) {
      newErrors.cardNumber = 'Card number is required';
    } else if (number.length < 13 || number.length > 19) {
      newErrors.cardNumber = 'Card number must be between 13 and 19 digits';
    } else if (!isValidCardNumber(number)) {
      newErrors.cardNumber = 'Invalid card number';
    } else {
      delete newErrors.cardNumber;
    }
    
    setErrors(newErrors);
    return !newErrors.cardNumber;
  };
  
  const isValidCardNumber = (number: string) => {
    // Luhn algorithm for basic card validation
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };
  
  const validateName = (name: string) => {
    const newErrors = { ...errors };
    
    if (!name.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    } else if (name.trim().length < 3) {
      newErrors.cardholderName = 'Name must be at least 3 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      newErrors.cardholderName = 'Name should only contain letters and spaces';
    } else {
      delete newErrors.cardholderName;
    }
    
    setErrors(newErrors);
    return !newErrors.cardholderName;
  };
  
  const validateExpiry = (month: string, year: string) => {
    const newErrors = { ...errors };
    const currentYear = new Date().getFullYear() % 100; // Get last 2 digits
    const currentMonth = new Date().getMonth() + 1;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (!month) {
      newErrors.expiryMonth = 'Month is required';
    } else if (monthNum < 1 || monthNum > 12) {
      newErrors.expiryMonth = 'Invalid month (01-12)';
    } else {
      delete newErrors.expiryMonth;
    }
    
    if (!year) {
      newErrors.expiryYear = 'Year is required';
    } else if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      newErrors.expiryYear = 'Card is expired';
    } else {
      delete newErrors.expiryYear;
    }
    
    setErrors(newErrors);
    return !newErrors.expiryMonth && !newErrors.expiryYear;
  };
  
  const validateCVV = (cvv: string) => {
    const newErrors = { ...errors };
    
    if (!cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    } else if (!/^\d+$/.test(cvv)) {
      newErrors.cvv = 'CVV must contain only digits';
    } else {
      delete newErrors.cvv;
    }
    
    setErrors(newErrors);
    return !newErrors.cvv;
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
        
        <View ref={focusTrapRef} style={styles.modalContent}>
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
                  focusedInput === 'cardNumber' && styles.inputFocused,
                  errors.cardNumber && touched.cardNumber && styles.inputError
                ]}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={formatCardNumber}
                onFocus={() => setFocusedInput('cardNumber')}
                onBlur={() => {
                  setFocusedInput(null);
                  setTouched({ ...touched, cardNumber: true });
                  validateCardNumber(cardNumber.replace(/\s/g, ''));
                }}
                keyboardType="numeric"
                maxLength={19} // 16 digits + 3 spaces
                accessibilityLabel="Card number input"
                accessibilityInvalid={!!errors.cardNumber && touched.cardNumber}
                accessibilityErrorMessage={errors.cardNumber}
              />
              {errors.cardNumber && touched.cardNumber && (
                <Text style={styles.errorText}>{errors.cardNumber}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'cardholderName' && styles.inputFocused,
                  errors.cardholderName && touched.cardholderName && styles.inputError
                ]}
                placeholder="John Doe"
                value={cardholderName}
                onChangeText={(text) => {
                  setCardholderName(text);
                  if (touched.cardholderName) {
                    validateName(text);
                  }
                }}
                onFocus={() => setFocusedInput('cardholderName')}
                onBlur={() => {
                  setFocusedInput(null);
                  setTouched({ ...touched, cardholderName: true });
                  validateName(cardholderName);
                }}
                autoCapitalize="words"
                accessibilityLabel="Cardholder name input"
                accessibilityInvalid={!!errors.cardholderName && touched.cardholderName}
                accessibilityErrorMessage={errors.cardholderName}
              />
              {errors.cardholderName && touched.cardholderName && (
                <Text style={styles.errorText}>{errors.cardholderName}</Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Expiry Date *</Text>
                <View style={styles.expiryContainer}>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.expiryInput,
                      focusedInput === 'expiryMonth' && styles.inputFocused,
                      errors.expiryMonth && touched.expiryMonth && styles.inputError
                    ]}
                    placeholder="MM"
                    value={expiryMonth}
                    onChangeText={(text) => {
                      setExpiryMonth(text);
                      if (touched.expiryMonth) {
                        validateExpiry(text, expiryYear);
                      }
                    }}
                    onFocus={() => setFocusedInput('expiryMonth')}
                    onBlur={() => {
                      setFocusedInput(null);
                      setTouched({ ...touched, expiryMonth: true });
                      validateExpiry(expiryMonth, expiryYear);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    accessibilityLabel="Expiry month input"
                    accessibilityInvalid={!!errors.expiryMonth && touched.expiryMonth}
                    accessibilityErrorMessage={errors.expiryMonth}
                  />
                  <Text style={styles.expirySeparator}>/</Text>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.expiryInput,
                      focusedInput === 'expiryYear' && styles.inputFocused,
                      errors.expiryYear && touched.expiryYear && styles.inputError
                    ]}
                    placeholder="YY"
                    value={expiryYear}
                    onChangeText={(text) => {
                      setExpiryYear(text);
                      if (touched.expiryYear) {
                        validateExpiry(expiryMonth, text);
                      }
                    }}
                    onFocus={() => setFocusedInput('expiryYear')}
                    onBlur={() => {
                      setFocusedInput(null);
                      setTouched({ ...touched, expiryYear: true });
                      validateExpiry(expiryMonth, expiryYear);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    accessibilityInvalid={!!errors.expiryYear && touched.expiryYear}
                    accessibilityErrorMessage={errors.expiryYear}
                    accessibilityLabel="Expiry year input"
                  />
                </View>
                {(errors.expiryMonth || errors.expiryYear) && (touched.expiryMonth || touched.expiryYear) && (
                  <Text style={styles.errorText}>{errors.expiryMonth || errors.expiryYear}</Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>CVV *</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'cvv' && styles.inputFocused,
                    errors.cvv && touched.cvv && styles.inputError
                  ]}
                  placeholder="123"
                  value={cvv}
                  onChangeText={(text) => {
                    setCvv(text);
                    if (touched.cvv) {
                      validateCVV(text);
                    }
                  }}
                  onFocus={() => setFocusedInput('cvv')}
                  onBlur={() => {
                    setFocusedInput(null);
                    setTouched({ ...touched, cvv: true });
                    validateCVV(cvv);
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  accessibilityLabel="CVV input"
                  accessibilityInvalid={!!errors.cvv && touched.cvv}
                  accessibilityErrorMessage={errors.cvv}
                />
                {errors.cvv && touched.cvv && (
                  <Text style={styles.errorText}>{errors.cvv}</Text>
                )}
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
  inputError: {
    borderColor: Color.colorRed,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: Color.colorRed,
    marginTop: 4,
    marginLeft: 4,
  },
});