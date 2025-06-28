import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DesignSystem from '@/styles/DesignSystem';
import { WebSEO } from '../web-seo';
import { Color } from '@/GlobalStyles';
import { Image } from 'expo-image';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { BrandColors } from '@/constants/Colors';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple' | 'google' | 'crypto';
  name: string;
  last4?: string;
  icon: string;
  isDefault?: boolean;
}

const GHOST_PROFILE_KEY = '@axees_ghost_profile';

const InstantPaymentPage: React.FC = () => {
  const params = useLocalSearchParams();
  const { paymentId, amount: amountStr, creatorId, offerType } = params;
  const amount = parseFloat(amountStr as string || '0');

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'success'>('select');
  const [hasGhostProfile, setHasGhostProfile] = useState(false);
  
  // Payment form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // Available payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'new-card',
      type: 'card',
      name: 'Credit or Debit Card',
      icon: '💳',
    },
    {
      id: 'paypal',
      type: 'paypal',
      name: 'PayPal',
      icon: '🅿️',
    },
    {
      id: 'apple-pay',
      type: 'apple',
      name: 'Apple Pay',
      icon: '🍎',
    },
    {
      id: 'google-pay',
      type: 'google',
      name: 'Google Pay',
      icon: '🌐',
    },
    {
      id: 'crypto',
      type: 'crypto',
      name: 'Cryptocurrency',
      icon: '₿',
    },
  ];

  useEffect(() => {
    checkGhostProfile();
  }, []);

  const checkGhostProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(GHOST_PROFILE_KEY);
      setHasGhostProfile(!!stored);
    } catch (error) {
      // Handle error silently
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const validatePaymentDetails = () => {
    if (selectedMethod === 'new-card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid card number');
        return false;
      }
      if (expiryDate.length < 5) {
        Alert.alert('Invalid Expiry', 'Please enter a valid expiry date (MM/YY)');
        return false;
      }
      if (cvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid CVV');
        return false;
      }
      if (billingZip.length < 5) {
        Alert.alert('Invalid ZIP', 'Please enter a valid billing ZIP code');
        return false;
      }
    }
    return true;
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    if (methodId === 'new-card') {
      setStep('details');
    } else {
      setStep('confirm');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!validatePaymentDetails()) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // In a real app, would process payment through payment gateway
        
        // Show success
        setStep('success');
        
        // Clear sensitive data
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
        
        // Navigate after delay
        setTimeout(() => {
          if (creatorId) {
            router.replace(`/profile/${creatorId}`);
          } else {
            router.replace('/explore');
          }
        }, 3000);
      } catch (error) {
        Alert.alert('Payment Failed', 'Please try again');
        setIsProcessing(false);
      }
    }, 2000);
  };

  const renderPaymentMethodSelection = () => (
    <View style={styles.methodContainer}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodCard,
            selectedMethod === method.id && styles.methodCardSelected
          ]}
          onPress={() => handlePaymentMethodSelect(method.id)}
        >
          <Text style={styles.methodIcon}>{method.icon}</Text>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>{method.name}</Text>
            {method.last4 && (
              <Text style={styles.methodDetails}>•••• {method.last4}</Text>
            )}
          </View>
          <MaterialIcons 
            name="chevron-right" 
            size={24} 
            color={selectedMethod === method.id ? BrandColors.primary[500] : BrandColors.neutral[400]} 
          />
        </TouchableOpacity>
      ))}

      {!hasGhostProfile && (
        <View style={styles.securityNote}>
          <MaterialIcons name="lock" size={16} color={BrandColors.semantic.success} />
          <Text style={styles.securityText}>
            Your payment info is encrypted and never stored
          </Text>
        </View>
      )}
    </View>
  );

  const renderCardDetails = () => (
    <View style={styles.detailsContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('select')}
      >
        <MaterialIcons name="arrow-back" size={24} color={BrandColors.neutral[700]} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Card Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Card Number"
        value={cardNumber}
        onChangeText={(text) => setCardNumber(formatCardNumber(text))}
        keyboardType="numeric"
        maxLength={19}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="MM/YY"
          value={expiryDate}
          onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
          keyboardType="numeric"
          maxLength={5}
        />
        
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="CVV"
          value={cvv}
          onChangeText={setCvv}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Billing ZIP Code"
        value={billingZip}
        onChangeText={setBillingZip}
        keyboardType="numeric"
        maxLength={10}
      />

      {hasGhostProfile && (
        <TouchableOpacity
          style={styles.saveCardOption}
          onPress={() => setSaveCard(!saveCard)}
        >
          <MaterialIcons 
            name={saveCard ? "check-box" : "check-box-outline-blank"} 
            size={24} 
            color={BrandColors.primary[500]} 
          />
          <Text style={styles.saveCardText}>
            Save card for future purchases
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setStep('confirm')}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.confirmContainer}>
      <Text style={styles.sectionTitle}>Confirm Payment</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryValue}>${amount.toFixed(2)}</Text>
        </View>
        
        {offerType && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type</Text>
            <Text style={styles.summaryValue}>{offerType}</Text>
          </View>
        )}
        
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${amount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.paymentMethodSummary}>
        <MaterialIcons name="credit-card" size={24} color={BrandColors.neutral[600]} />
        <View style={styles.methodSummaryInfo}>
          <Text style={styles.methodSummaryText}>
            {selectedMethod === 'new-card' ? 'Card' : paymentMethods.find(m => m.id === selectedMethod)?.name}
          </Text>
          {selectedMethod === 'new-card' && cardNumber && (
            <Text style={styles.methodSummaryDetails}>
              •••• {cardNumber.slice(-4)}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setStep('select')}>
          <Text style={styles.changeLink}>Change</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isProcessing && styles.disabledButton]}
        onPress={handlePaymentSubmit}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Text style={styles.primaryButtonText}>Processing...</Text>
        ) : (
          <>
            <MaterialIcons name="lock" size={20} color={BrandColors.neutral[0]} />
            <Text style={styles.primaryButtonText}>Pay ${amount.toFixed(2)}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityBadges}>
        <View style={styles.badge}>
          <MaterialIcons name="https" size={14} color={BrandColors.semantic.success} />
          <Text style={styles.badgeText}>Secure</Text>
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="verified-user" size={14} color={BrandColors.semantic.success} />
          <Text style={styles.badgeText}>PCI Compliant</Text>
        </View>
        <View style={styles.badge}>
          <FontAwesome5 name="shield-alt" size={14} color={BrandColors.semantic.success} />
          <Text style={styles.badgeText}>Encrypted</Text>
        </View>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <LinearGradient
        colors={[BrandColors.semantic.success, BrandColors.semantic.successDark]}
        style={styles.successIcon}
      >
        <MaterialIcons name="check" size={48} color={BrandColors.neutral[0]} />
      </LinearGradient>

      <Text style={styles.successTitle}>Payment Successful!</Text>
      <Text style={styles.successAmount}>${amount.toFixed(2)}</Text>
      
      <View style={styles.successDetails}>
        <Text style={styles.successText}>Transaction ID: {paymentId}</Text>
        <Text style={styles.successText}>
          {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Text>
      </View>

      <Text style={styles.redirectText}>Redirecting to profile...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <WebSEO 
        title="Instant Payment - Axees"
        description="Complete your payment securely"
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('@/assets/icon.png')} 
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Instant Checkout</Text>
        </View>
        
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Cancel Payment',
              'Are you sure you want to cancel this payment?',
              [
                { text: 'Continue', style: 'cancel' },
                { 
                  text: 'Cancel Payment', 
                  style: 'destructive',
                  onPress: () => router.push('/')
                },
              ]
            );
          }}
        >
          <MaterialIcons name="close" size={24} color={BrandColors.neutral[600]} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 'select' && renderPaymentMethodSelection()}
          {step === 'details' && renderCardDetails()}
          {step === 'confirm' && renderConfirmation()}
          {step === 'success' && renderSuccess()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.AccessibleColors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  headerTitle: {
    ...DesignSystem.Typography.h3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  methodContainer: {
    paddingVertical: 20,
  },
  sectionTitle: {
    ...DesignSystem.Typography.h2,
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.AccessibleColors.borderLight,
    marginBottom: 12,
  },
  methodCardSelected: {
    borderColor: BrandColors.primary[500],
    backgroundColor: BrandColors.primary[50],
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    ...DesignSystem.Typography.bodyMedium,
    fontWeight: '600',
  },
  methodDetails: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  securityText: {
    ...DesignSystem.Typography.caption,
    color: BrandColors.semantic.success,
  },
  detailsContainer: {
    paddingVertical: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  input: {
    ...DesignSystem.InputStyles.default,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  saveCardText: {
    ...DesignSystem.Typography.body,
  },
  primaryButton: {
    ...DesignSystem.ButtonStyles.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...DesignSystem.ButtonTextStyles.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmContainer: {
    paddingVertical: 20,
  },
  summaryCard: {
    backgroundColor: DesignSystem.AccessibleColors.backgroundSubtle,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.AccessibleColors.textSecondary,
  },
  summaryValue: {
    ...DesignSystem.Typography.bodyMedium,
  },
  divider: {
    height: 1,
    backgroundColor: DesignSystem.AccessibleColors.borderLight,
    marginVertical: 12,
  },
  totalLabel: {
    ...DesignSystem.Typography.h3,
  },
  totalValue: {
    ...DesignSystem.Typography.h2,
    color: BrandColors.primary[500],
  },
  paymentMethodSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.AccessibleColors.borderLight,
    marginBottom: 24,
  },
  methodSummaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodSummaryText: {
    ...DesignSystem.Typography.bodyMedium,
  },
  methodSummaryDetails: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
  changeLink: {
    ...DesignSystem.Typography.caption,
    color: BrandColors.primary[500],
    fontWeight: '600',
  },
  securityBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    ...DesignSystem.Typography.small,
    color: BrandColors.semantic.success,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    ...DesignSystem.Typography.h1,
    color: BrandColors.semantic.success,
    marginBottom: 8,
  },
  successAmount: {
    ...DesignSystem.Typography.h2,
    color: BrandColors.primary[500],
    marginBottom: 24,
  },
  successDetails: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successText: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    marginBottom: 4,
  },
  redirectText: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
});

export default InstantPaymentPage;