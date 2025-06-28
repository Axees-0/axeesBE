import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { useAlertModal, useConfirmModal } from '@/components/ConfirmModal';
import { UniversalBackButton } from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface PaymentMethod {
  id: string;
  type: 'bank' | 'paypal' | 'stripe';
  name: string;
  details: string;
  isDefault: boolean;
  processingTime: string;
  fee: number;
}

interface WithdrawalData {
  amount: string;
  selectedMethod: string;
  note: string;
}

const WithdrawPage: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const { showAlert, AlertModalComponent } = useAlertModal();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  
  const availableBalance = 3280; // Demo balance
  
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({
    amount: '',
    selectedMethod: '',
    note: ''
  });

  // Demo payment methods
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'bank-001',
      type: 'bank',
      name: 'Chase Bank',
      details: '****1234',
      isDefault: true,
      processingTime: '1-3 business days',
      fee: 0
    },
    {
      id: 'paypal-001',
      type: 'paypal',
      name: 'PayPal',
      details: 'creator@email.com',
      isDefault: false,
      processingTime: 'Instant',
      fee: 2.5
    },
    {
      id: 'stripe-001',
      type: 'stripe',
      name: 'Debit Card',
      details: 'Visa ****5678',
      isDefault: false,
      processingTime: 'Instant',
      fee: 1.5
    }
  ]);

  const selectedMethod = paymentMethods.find(m => m.id === withdrawalData.selectedMethod);
  const withdrawalAmount = parseFloat(withdrawalData.amount || '0');
  const feeAmount = selectedMethod ? (withdrawalAmount * selectedMethod.fee / 100) : 0;
  const netAmount = withdrawalAmount - feeAmount;

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank': return '🏦';
      case 'paypal': return '💳';
      case 'stripe': return '💰';
      default: return '💳';
    }
  };

  const validateWithdrawal = () => {
    if (!withdrawalData.amount || withdrawalAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return false;
    }
    
    if (withdrawalAmount < 50) {
      showAlert('Minimum Amount', 'Minimum withdrawal amount is $50.');
      return false;
    }
    
    if (withdrawalAmount > availableBalance) {
      showAlert('Insufficient Balance', 'Withdrawal amount cannot exceed your available balance.');
      return false;
    }
    
    if (!withdrawalData.selectedMethod) {
      showAlert('Select Payment Method', 'Please select a payment method for withdrawal.');
      return false;
    }
    
    return true;
  };

  const handleSubmitWithdrawal = () => {
    if (!validateWithdrawal()) return;
    
    const method = paymentMethods.find(m => m.id === withdrawalData.selectedMethod);
    if (!method) return;
    
    showConfirm(
      'Confirm Withdrawal',
      `Withdraw $${withdrawalAmount.toLocaleString()} to ${method.name} (${method.details})?\n\nProcessing time: ${method.processingTime}\nFee: $${feeAmount.toFixed(2)}\nYou'll receive: $${netAmount.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Withdrawal', 
          onPress: () => {
            showAlert(
              'Withdrawal Initiated!',
              `Your withdrawal of $${withdrawalAmount.toLocaleString()} has been initiated. You'll receive a confirmation email shortly and the funds will be processed according to the selected method's timeline.`,
              'View Earnings',
              () => router.replace('/earnings')
            );
          }
        }
      ]
    );
  };

  const handleQuickAmount = (percentage: number) => {
    const amount = Math.floor(availableBalance * percentage);
    setWithdrawalData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleAddPaymentMethod = () => {
    router.push('/payments/creator');
  };

  return (
    <>
      <WebSEO 
        title="Withdraw Funds | Axees"
        description="Withdraw your earnings to your preferred payment method"
        keywords="withdraw earnings, payment methods, creator payments"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/earnings" />
          
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Available Balance */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>${availableBalance.toLocaleString()}</Text>
              <Text style={styles.balanceSubtext}>Ready to withdraw</Text>
            </View>
          </View>

          {/* Withdrawal Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={withdrawalData.amount}
                onChangeText={(text) => setWithdrawalData(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountContainer}>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(0.25)}
              >
                <Text style={styles.quickAmountText}>25%</Text>
                <Text style={styles.quickAmountValue}>${Math.floor(availableBalance * 0.25)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(0.5)}
              >
                <Text style={styles.quickAmountText}>50%</Text>
                <Text style={styles.quickAmountValue}>${Math.floor(availableBalance * 0.5)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(0.75)}
              >
                <Text style={styles.quickAmountText}>75%</Text>
                <Text style={styles.quickAmountValue}>${Math.floor(availableBalance * 0.75)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(1)}
              >
                <Text style={styles.quickAmountText}>Max</Text>
                <Text style={styles.quickAmountValue}>${availableBalance}</Text>
              </TouchableOpacity>
            </View>

            {withdrawalAmount > 0 && withdrawalAmount < 50 && (
              <Text style={styles.warningText}>Minimum withdrawal amount is $50</Text>
            )}
            
            {withdrawalAmount > availableBalance && (
              <Text style={styles.errorText}>Amount exceeds available balance</Text>
            )}
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentMethodsSection}>
            <View style={styles.paymentMethodsHeader}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <TouchableOpacity 
                style={styles.addMethodButton}
                onPress={handleAddPaymentMethod}
              >
                <Text style={styles.addMethodText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.methodsList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    withdrawalData.selectedMethod === method.id && styles.selectedMethodCard
                  ]}
                  onPress={() => setWithdrawalData(prev => ({ ...prev, selectedMethod: method.id }))}
                >
                  <View style={styles.methodInfo}>
                    <View style={styles.methodIcon}>
                      <Text style={styles.methodIconText}>{getMethodIcon(method.type)}</Text>
                    </View>
                    
                    <View style={styles.methodDetails}>
                      <View style={styles.methodNameRow}>
                        <Text style={styles.methodName}>{method.name}</Text>
                        {method.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.methodDetailsText}>{method.details}</Text>
                      <Text style={styles.methodProcessingTime}>{method.processingTime}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.methodFee}>
                    <Text style={styles.feeText}>
                      {method.fee === 0 ? 'Free' : `${method.fee}% fee`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Withdrawal Summary */}
          {withdrawalAmount > 0 && selectedMethod && (
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Withdrawal Summary</Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Withdrawal Amount</Text>
                  <Text style={styles.summaryValue}>${withdrawalAmount.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Processing Fee</Text>
                  <Text style={styles.summaryValue}>
                    {selectedMethod.fee === 0 ? 'Free' : `-$${feeAmount.toFixed(2)}`}
                  </Text>
                </View>
                
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>You'll Receive</Text>
                  <Text style={styles.summaryTotalValue}>${netAmount.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryInfoText}>
                    Funds will be processed to {selectedMethod.name} ({selectedMethod.details}) 
                    within {selectedMethod.processingTime.toLowerCase()}.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Note */}
          <View style={styles.noteSection}>
            <Text style={styles.sectionTitle}>Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={withdrawalData.note}
              onChangeText={(text) => setWithdrawalData(prev => ({ ...prev, note: text }))}
              placeholder="Add a note for this withdrawal..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Important Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Important Information</Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoItem}>⏰ Processing times vary by payment method</Text>
              <Text style={styles.infoItem}>💰 Minimum withdrawal amount is $50</Text>
              <Text style={styles.infoItem}>🔒 All transactions are secured and encrypted</Text>
              <Text style={styles.infoItem}>📧 You'll receive email confirmation for all withdrawals</Text>
              <Text style={styles.infoItem}>❓ Contact support if you have any questions</Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!validateWithdrawal() || !withdrawalData.amount || !withdrawalData.selectedMethod) && styles.disabledSubmitButton
            ]}
            onPress={handleSubmitWithdrawal}
            disabled={!validateWithdrawal() || !withdrawalData.amount || !withdrawalData.selectedMethod}
          >
            <Text style={[
              styles.submitButtonText,
              (!validateWithdrawal() || !withdrawalData.amount || !withdrawalData.selectedMethod) && styles.disabledSubmitButtonText
            ]}>
              {withdrawalAmount > 0 ? `Withdraw $${withdrawalAmount.toLocaleString()}` : 'Enter Amount'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={4} />}
      </SafeAreaView>
      
      <AlertModalComponent />
      <ConfirmModalComponent />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContainer: {
    flex: 1,
  },
  balanceSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  balanceCard: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#FFFFFF80',
  },
  amountSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 16,
    color: '#333',
  },
  quickAmountContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickAmountText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  quickAmountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92500,
  },
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  paymentMethodsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMethodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
  },
  addMethodText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontWeight: '600',
  },
  methodsList: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMethodCard: {
    borderColor: Color.cSK430B92500,
    backgroundColor: Color.cSK430B92500 + '10',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconText: {
    fontSize: 24,
  },
  methodDetails: {
    flex: 1,
  },
  methodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  methodDetailsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  methodProcessingTime: {
    fontSize: 12,
    color: '#999',
  },
  methodFee: {
    alignItems: 'flex-end',
  },
  feeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  summarySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  summaryInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  summaryInfoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  noteSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  submitSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledSubmitButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledSubmitButtonText: {
    color: '#999',
  },
});

export default WithdrawPage;