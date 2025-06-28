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
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { BrandColors } from '@/constants/Colors';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';
import { UniversalBackButton } from '@/components/UniversalBackButton';

interface CounterOfferData {
  amount: string;
  deliveryDays: string;
  additionalRequirements: string;
  counterMessage: string;
  adjustedDeliverables: string[];
}

const CounterOfferPage: React.FC = () => {
  const { offerId } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  const [counterData, setCounterData] = useState<CounterOfferData>({
    amount: '1800',
    deliveryDays: '7',
    additionalRequirements: '',
    counterMessage: '',
    adjustedDeliverables: [
      '1 Instagram feed post with 3-5 images',
      '2-3 Instagram stories',
      'Story highlight saved for 7 days',
      'Caption with brand messaging and hashtags',
      'Performance metrics after 48 hours'
    ]
  });

  const [validationErrors, setValidationErrors] = useState({
    amount: false,
    deliveryDays: false,
    counterMessage: false
  });

  const [hasInteracted, setHasInteracted] = useState({
    amount: false,
    deliveryDays: false,
    counterMessage: false
  });

  // Original offer data for reference
  const originalOffer = {
    id: offerId as string,
    marketer: {
      name: 'Sarah Martinez',
      company: 'TechStyle Brand',
    },
    offerType: 'Instagram Post Campaign',
    platform: 'Instagram',
    amount: 1500,
    deliveryDays: 5,
    deliverables: [
      '1 Instagram feed post with 3-5 images',
      '2-3 Instagram stories',
      'Story highlight saved for 7 days',
      'Caption with brand messaging and hashtags',
      'Performance metrics after 48 hours'
    ]
  };

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    return value.trim() !== '' && !isNaN(numValue) && numValue > 0;
  };

  const validateDeliveryDays = (value: string) => {
    const numValue = parseInt(value);
    return value.trim() !== '' && !isNaN(numValue) && numValue > 0;
  };

  const validateCounterMessage = (value: string) => {
    return value.trim().length > 0;
  };

  const handleAmountChange = (text: string) => {
    if (!hasInteracted.amount) {
      setHasInteracted(prev => ({ ...prev, amount: true }));
    }
    
    setCounterData(prev => ({ ...prev, amount: text }));
    
    if (hasInteracted.amount) {
      setValidationErrors(prev => ({
        ...prev,
        amount: !validateAmount(text)
      }));
    }
  };

  const handleDeliveryDaysChange = (text: string) => {
    if (!hasInteracted.deliveryDays) {
      setHasInteracted(prev => ({ ...prev, deliveryDays: true }));
    }
    
    setCounterData(prev => ({ ...prev, deliveryDays: text }));
    
    if (hasInteracted.deliveryDays) {
      setValidationErrors(prev => ({
        ...prev,
        deliveryDays: !validateDeliveryDays(text)
      }));
    }
  };

  const handleCounterMessageChange = (text: string) => {
    if (!hasInteracted.counterMessage) {
      setHasInteracted(prev => ({ ...prev, counterMessage: true }));
    }
    
    setCounterData(prev => ({ ...prev, counterMessage: text }));
    
    if (hasInteracted.counterMessage) {
      setValidationErrors(prev => ({
        ...prev,
        counterMessage: !validateCounterMessage(text)
      }));
    }
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const updated = [...counterData.adjustedDeliverables];
    updated[index] = value;
    setCounterData(prev => ({ ...prev, adjustedDeliverables: updated }));
  };

  const addDeliverable = () => {
    setCounterData(prev => ({
      ...prev,
      adjustedDeliverables: [...prev.adjustedDeliverables, '']
    }));
  };

  const removeDeliverable = (index: number) => {
    const deliverableToRemove = counterData.adjustedDeliverables[index];
    
    Alert.alert(
      'Remove Deliverable',
      `Are you sure you want to remove "${deliverableToRemove}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = counterData.adjustedDeliverables.filter((_, i) => i !== index);
            setCounterData(prev => ({ ...prev, adjustedDeliverables: updated }));
          }
        }
      ]
    );
  };

  const validateCounterOffer = () => {
    // Trigger validation for all fields
    const amountValid = validateAmount(counterData.amount);
    const deliveryDaysValid = validateDeliveryDays(counterData.deliveryDays);
    const counterMessageValid = validateCounterMessage(counterData.counterMessage);
    
    setValidationErrors({
      amount: !amountValid,
      deliveryDays: !deliveryDaysValid,
      counterMessage: !counterMessageValid
    });
    
    setHasInteracted({
      amount: true,
      deliveryDays: true,
      counterMessage: true
    });
    
    if (!amountValid) {
      Alert.alert('Invalid Amount', 'Please enter a valid counter offer amount.');
      return false;
    }
    
    if (!deliveryDaysValid) {
      Alert.alert('Invalid Timeline', 'Please enter a valid delivery timeline.');
      return false;
    }
    
    if (!counterMessageValid) {
      Alert.alert('Missing Message', 'Please provide a message explaining your counter offer.');
      return false;
    }
    
    const validDeliverables = counterData.adjustedDeliverables.filter(d => d.trim());
    if (validDeliverables.length === 0) {
      Alert.alert('Missing Deliverables', 'Please specify at least one deliverable.');
      return false;
    }
    
    return true;
  };

  const handleSubmitCounterOffer = () => {
    if (!validateCounterOffer()) return;
    
    const amountDiff = parseFloat(counterData.amount) - originalOffer.amount;
    const daysDiff = parseInt(counterData.deliveryDays) - originalOffer.deliveryDays;
    
    let changes = [];
    if (amountDiff > 0) changes.push(`+$${amountDiff} increase`);
    if (amountDiff < 0) changes.push(`$${Math.abs(amountDiff)} decrease`);
    if (daysDiff > 0) changes.push(`+${daysDiff} days extension`);
    if (daysDiff < 0) changes.push(`${Math.abs(daysDiff)} days faster`);
    
    const changesText = changes.length > 0 ? `\n\nChanges: ${changes.join(', ')}` : '';
    
    Alert.alert(
      'Submit Counter Offer',
      `Send counter offer to ${originalOffer.marketer.company} for $${counterData.amount} with ${counterData.deliveryDays} days delivery?${changesText}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Counter Offer', 
          onPress: async () => {
            // Send notification to marketer (NOTIFY_M)
            await notificationService.notifyMarketer('sarah-001', {
              type: 'offer',
              title: 'New Counter Offer Received',
              message: `${user?.name || 'Creator'} sent a counter offer for ${originalOffer.offerType} - $${counterData.amount}`,
              actionType: 'view_counter',
              actionParams: { counterId: `counter-${Date.now()}`, offerId: originalOffer.id }
            });
            
            Alert.alert(
              'Counter Offer Sent!',
              'Your counter offer has been sent to the marketer. They will review and respond within 24-48 hours. You\'ll receive a notification when they respond.',
              [
                { 
                  text: 'Back to Deals', 
                  onPress: () => router.replace('/(tabs)/deals')
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleSaveDraft = () => {
    // In a real app, this would save to backend
    const draftId = `draft-${Date.now()}`;
    
    Alert.alert(
      'Draft Saved',
      'Your counter offer has been saved as a draft. You can continue editing it later from your deals page.',
      [
        {
          text: 'Continue Editing',
          style: 'cancel'
        },
        {
          text: 'Go to Deals',
          onPress: () => router.replace('/(tabs)/deals')
        }
      ]
    );
  };

  return (
    <>
      <WebSEO 
        title="Counter Offer | Axees"
        description="Create a counter offer for brand collaboration"
        keywords="counter offer, negotiation, creator collaboration"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/offers/review" />
          
          <Text style={styles.headerTitle}>Counter Offer</Text>
          
          <TouchableOpacity 
            style={styles.draftButton}
            onPress={handleSaveDraft}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Original Offer Summary */}
          <View style={styles.originalOfferSection}>
            <Text style={styles.sectionTitle}>Original Offer</Text>
            <View style={styles.originalOfferCard}>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Campaign:</Text>
                <Text style={styles.offerValue}>{originalOffer.offerType}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Amount:</Text>
                <Text style={styles.offerValue}>${originalOffer.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Timeline:</Text>
                <Text style={styles.offerValue}>{originalOffer.deliveryDays} days</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>From:</Text>
                <Text style={styles.offerValue}>{originalOffer.marketer.company}</Text>
              </View>
            </View>
          </View>

          {/* Counter Offer Form */}
          <View style={styles.counterOfferSection}>
            <Text style={styles.sectionTitle}>Your Counter Offer</Text>
            
            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Proposed Amount *</Text>
              <Text style={styles.inputHint}>
                Your counter offer amount (original: ${originalOffer.amount.toLocaleString()})
              </Text>
              <View style={[
                styles.amountInputContainer,
                validationErrors.amount && styles.inputError
              ]}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={counterData.amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="1800"
                />
              </View>
              {validationErrors.amount && (
                <Text style={styles.errorText}>
                  Please enter a valid amount greater than $0
                </Text>
              )}
              {!validationErrors.amount && parseFloat(counterData.amount || '0') !== originalOffer.amount && (
                <Text style={[
                  styles.changeIndicator,
                  parseFloat(counterData.amount || '0') > originalOffer.amount ? styles.increaseText : styles.decreaseText
                ]}>
                  {parseFloat(counterData.amount || '0') > originalOffer.amount ? '+' : ''}
                  ${(parseFloat(counterData.amount || '0') - originalOffer.amount).toLocaleString()} 
                  {parseFloat(counterData.amount || '0') > originalOffer.amount ? ' increase' : ' decrease'}
                </Text>
              )}
            </View>

            {/* Delivery Timeline */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Delivery Timeline *</Text>
              <Text style={styles.inputHint}>
                Days needed to complete (original: {originalOffer.deliveryDays} days)
              </Text>
              <View style={[
                styles.timelineInputContainer,
                validationErrors.deliveryDays && styles.inputError
              ]}>
                <TextInput
                  style={styles.timelineInput}
                  value={counterData.deliveryDays}
                  onChangeText={handleDeliveryDaysChange}
                  keyboardType="numeric"
                  placeholder="7"
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>
              {validationErrors.deliveryDays && (
                <Text style={styles.errorText}>
                  Please enter a valid number of days greater than 0
                </Text>
              )}
              {!validationErrors.deliveryDays && parseInt(counterData.deliveryDays || '0') !== originalOffer.deliveryDays && (
                <Text style={[
                  styles.changeIndicator,
                  parseInt(counterData.deliveryDays || '0') > originalOffer.deliveryDays ? styles.increaseText : styles.decreaseText
                ]}>
                  {parseInt(counterData.deliveryDays || '0') > originalOffer.deliveryDays ? '+' : ''}
                  {(parseInt(counterData.deliveryDays || '0') - originalOffer.deliveryDays)} days 
                  {parseInt(counterData.deliveryDays || '0') > originalOffer.deliveryDays ? ' extension' : ' faster'}
                </Text>
              )}
            </View>

            {/* Adjusted Deliverables */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Deliverables</Text>
              <Text style={styles.inputHint}>
                Modify the deliverables based on your counter offer
              </Text>
              {counterData.adjustedDeliverables.map((deliverable, index) => (
                <View key={index} style={styles.deliverableRow}>
                  <TextInput
                    style={styles.deliverableInput}
                    value={deliverable}
                    onChangeText={(text) => handleDeliverableChange(index, text)}
                    placeholder={`Deliverable ${index + 1}`}
                    multiline
                  />
                  {counterData.adjustedDeliverables.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeDeliverable(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addDeliverableButton} onPress={addDeliverable}>
                <Text style={styles.addDeliverableText}>+ Add Deliverable</Text>
              </TouchableOpacity>
            </View>

            {/* Additional Requirements */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Additional Requirements (Optional)</Text>
              <Text style={styles.inputHint}>
                Any additional requirements or modifications you'd like to propose
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={counterData.additionalRequirements}
                onChangeText={(text) => setCounterData(prev => ({ ...prev, additionalRequirements: text }))}
                placeholder="Example: I'd like to include additional story content, or I need more time for approval cycles..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Counter Message */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Message to Marketer *</Text>
              <Text style={styles.inputHint}>
                Explain your reasoning for the counter offer and highlight your value
              </Text>
              <TextInput
                style={[
                  styles.textInput, 
                  styles.textArea,
                  validationErrors.counterMessage && styles.inputError
                ]}
                value={counterData.counterMessage}
                onChangeText={handleCounterMessageChange}
                placeholder="Example: Thank you for considering me for this campaign! I'm excited about the opportunity to work with TechStyle Brand. Based on my experience and engagement rates, I believe this counter offer reflects the value I can provide..."
                multiline
                numberOfLines={5}
              />
              {validationErrors.counterMessage && (
                <Text style={styles.errorText}>
                  Please provide a message explaining your counter offer
                </Text>
              )}
            </View>
          </View>

          {/* Guidelines */}
          <View style={styles.guidelinesSection}>
            <Text style={styles.sectionTitle}>Counter Offer Tips</Text>
            <View style={styles.guidelinesCard}>
              <Text style={styles.guidelineItem}>
                💰 Be realistic with your pricing based on your engagement and experience
              </Text>
              <Text style={styles.guidelineItem}>
                ⏰ Consider the marketer's timeline needs when adjusting delivery dates
              </Text>
              <Text style={styles.guidelineItem}>
                📈 Highlight your unique value and why you're worth the investment
              </Text>
              <Text style={styles.guidelineItem}>
                🤝 Keep the tone professional and collaborative
              </Text>
              <Text style={styles.guidelineItem}>
                📊 Reference your past performance and engagement metrics if relevant
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.draftActionButton}
            onPress={handleSaveDraft}
          >
            <Text style={styles.draftActionText}>Save Draft</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!validateAmount(counterData.amount) || !validateDeliveryDays(counterData.deliveryDays) || !validateCounterMessage(counterData.counterMessage)) && styles.disabledButton
            ]}
            onPress={handleSubmitCounterOffer}
            disabled={!validateAmount(counterData.amount) || !validateDeliveryDays(counterData.deliveryDays) || !validateCounterMessage(counterData.counterMessage)}
          >
            <Text style={[
              styles.submitButtonText,
              (!validateAmount(counterData.amount) || !validateDeliveryDays(counterData.deliveryDays) || !validateCounterMessage(counterData.counterMessage)) && styles.disabledButtonText
            ]}>
              Send Counter Offer
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={1} />}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
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
  draftButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
  },
  draftButtonText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  originalOfferSection: {
    padding: 20,
    backgroundColor: BrandColors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 12,
  },
  originalOfferCard: {
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  offerLabel: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    fontWeight: '500',
  },
  offerValue: {
    fontSize: 14,
    color: BrandColors.neutral[800],
    fontWeight: '600',
  },
  counterOfferSection: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
    fontWeight: '600',
  },
  timelineInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  timelineInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
    fontWeight: '600',
    minWidth: 60,
  },
  daysLabel: {
    fontSize: 16,
    color: BrandColors.neutral[500],
  },
  changeIndicator: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  increaseText: {
    color: BrandColors.semantic.successDark,
  },
  decreaseText: {
    color: BrandColors.semantic.errorDark,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deliverableInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 6,
  },
  removeButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 18,
    fontWeight: 'bold',
  },
  addDeliverableButton: {
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addDeliverableText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 44,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  guidelinesSection: {
    padding: 20,
    backgroundColor: BrandColors.neutral[50],
  },
  guidelinesCard: {
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 12,
    padding: 16,
  },
  guidelineItem: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BrandColors.neutral[100],
    gap: 12,
  },
  draftActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  draftActionText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: BrandColors.neutral[400],
  },
  submitButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: BrandColors.neutral[400],
  },
  inputError: {
    borderColor: BrandColors.semantic.errorDark,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: BrandColors.semantic.errorDark,
    marginTop: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
});

export default CounterOfferPage;