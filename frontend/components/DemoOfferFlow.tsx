import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Color } from '@/GlobalStyles';
import { LoadingOverlay } from './LoadingIndicator';
import { useDemoLoading } from '@/hooks/useLoadingState';

interface DemoOfferFlowProps {
  creatorName: string;
  creatorHandle: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const DemoOfferFlow: React.FC<DemoOfferFlowProps> = ({
  creatorName,
  creatorHandle,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { isLoading, simulateLoading } = useDemoLoading();
  
  // Form state with pre-filled demo data
  const [formData, setFormData] = useState({
    campaignName: 'Summer Collection 2024',
    budget: '5000',
    deliverables: '3 Instagram posts, 2 Stories',
    timeline: '2 weeks',
    message: `Hi ${creatorName}! We love your authentic style and engaged audience. We'd like to partner with you for our Summer Collection launch...`,
  });

  const handleNext = async () => {
    await simulateLoading('Processing...', 600);
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - show success
      await simulateLoading('Creating offer...', 1200);
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel?.();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Campaign Details</Text>
            <Text style={styles.stepSubtitle}>
              Tell {creatorName} about your campaign
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Campaign Name</Text>
              <TextInput
                style={styles.input}
                value={formData.campaignName}
                onChangeText={(text) => setFormData({ ...formData, campaignName: text })}
                placeholder="Enter campaign name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget (USD)</Text>
              <TextInput
                style={styles.input}
                value={formData.budget}
                onChangeText={(text) => setFormData({ ...formData, budget: text })}
                placeholder="5000"
                keyboardType="numeric"
              />
              <Text style={styles.helper}>Industry average for {creatorHandle}: $3,000 - $7,000</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deliverables</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.deliverables}
                onChangeText={(text) => setFormData({ ...formData, deliverables: text })}
                placeholder="What content do you need?"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Timeline & Message</Text>
            <Text style={styles.stepSubtitle}>
              Set expectations and introduce yourself
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Timeline</Text>
              <TextInput
                style={styles.input}
                value={formData.timeline}
                onChangeText={(text) => setFormData({ ...formData, timeline: text })}
                placeholder="e.g., 2 weeks"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Personal Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                placeholder="Introduce yourself and your brand..."
                multiline
                numberOfLines={5}
              />
              <Text style={styles.helper}>
                Tip: Personalized messages have 3x higher acceptance rate
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Your Offer</Text>
            <Text style={styles.stepSubtitle}>
              Make sure everything looks good
            </Text>

            <View style={styles.reviewSection}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>To:</Text>
                <Text style={styles.reviewValue}>{creatorName} ({creatorHandle})</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Campaign:</Text>
                <Text style={styles.reviewValue}>{formData.campaignName}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Budget:</Text>
                <Text style={styles.reviewValue}>${formData.budget}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Deliverables:</Text>
                <Text style={styles.reviewValue}>{formData.deliverables}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Timeline:</Text>
                <Text style={styles.reviewValue}>{formData.timeline}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Message:</Text>
                <Text style={[styles.reviewValue, styles.reviewMessage]}>
                  {formData.message}
                </Text>
              </View>
            </View>

            <View style={styles.terms}>
              <Text style={styles.termsText}>
                By sending this offer, you agree to Axees platform terms and payment processing fees (10%)
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} />
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              currentStep >= step && styles.progressStepActive,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleBack}
        >
          <Text style={styles.buttonSecondaryText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNext}
        >
          <Text style={styles.buttonPrimaryText}>
            {currentStep === 3 ? 'Send Offer' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Color.cSK430B92500,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'interSemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'interRegular',
    color: '#6B7280',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'interMedium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'interRegular',
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helper: {
    fontSize: 14,
    fontFamily: 'interRegular',
    color: '#6B7280',
    marginTop: 8,
  },
  reviewSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: 'interMedium',
    color: '#6B7280',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: 'interRegular',
    color: '#111827',
  },
  reviewMessage: {
    lineHeight: 22,
  },
  terms: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
  },
  termsText: {
    fontSize: 14,
    fontFamily: 'interRegular',
    color: '#92400E',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: Color.cSK430B92500,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'interSemiBold',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontFamily: 'interMedium',
  },
});

export default DemoOfferFlow;