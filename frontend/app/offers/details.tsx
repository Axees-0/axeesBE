import React, { useState, useMemo } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color, Focus } from '@/GlobalStyles';
import { BrandColors } from '@/constants/Colors';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { DemoData } from '@/demo/DemoData';
import UniversalBackButton from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface OfferConfiguration {
  campaignGoal: string;
  targetAudience: string;
  brandMessage: string;
  timeline: string;
  additionalRequests: string;
  totalPrice: number;
}

const OfferDetailsPage: React.FC = () => {
  const { creatorId, offerId, offerType } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';

  // Find creator from demo data
  const creator = useMemo(() => {
    return DemoData.creators.find(c => c._id === creatorId);
  }, [creatorId]);

  // Demo offer data (would normally come from API)
  const offerTemplate = useMemo(() => {
    const offers: Record<string, any> = {
      'social-media-post': {
        id: 'social-media-post',
        title: 'Social Media Post',
        description: 'Single Instagram post with your product/service featuring professional photography',
        basePrice: 500,
        deliveryDays: 3,
        includes: ['1 Instagram post', 'Professional photos', 'Caption writing', 'Hashtag research'],
        category: 'Social Media',
      },
      'video-review': {
        id: 'video-review',
        title: 'Product Review Video',
        description: 'Detailed video review of your product with honest feedback and demonstration',
        basePrice: 1200,
        deliveryDays: 7,
        includes: ['60-second video', 'Product demonstration', 'Honest review', 'Multiple takes'],
        category: 'Video Content',
      },
      // Add other templates as needed
    };
    return offers[offerId as string] || offers['social-media-post'];
  }, [offerId]);

  const [config, setConfig] = useState<OfferConfiguration>({
    campaignGoal: '',
    targetAudience: '',
    brandMessage: '',
    timeline: 'standard',
    additionalRequests: '',
    totalPrice: offerTemplate.basePrice,
  });

  // State for keyboard navigation of radio buttons
  const [focusedTimelineIndex, setFocusedTimelineIndex] = useState(1); // Default to 'standard' (index 1)

  const timelineOptions = [
    { id: 'rush', label: 'Rush (1-2 days)', multiplier: 1.5 },
    { id: 'standard', label: `Standard (${offerTemplate.deliveryDays} days)`, multiplier: 1.0 },
    { id: 'extended', label: 'Extended (14+ days)', multiplier: 0.9 },
  ];

  const handleTimelineChange = (timeline: string) => {
    const option = timelineOptions.find(opt => opt.id === timeline);
    if (option) {
      setConfig(prev => ({
        ...prev,
        timeline,
        totalPrice: Math.round(offerTemplate.basePrice * option.multiplier)
      }));
      // Update focused index to match selected timeline
      const newIndex = timelineOptions.findIndex(opt => opt.id === timeline);
      if (newIndex !== -1) {
        setFocusedTimelineIndex(newIndex);
      }
    }
  };

  // Keyboard navigation for radio buttons
  const handleTimelineKeyPress = (event: any, index: number) => {
    switch (event.nativeEvent.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = index > 0 ? index - 1 : timelineOptions.length - 1;
        setFocusedTimelineIndex(prevIndex);
        handleTimelineChange(timelineOptions[prevIndex].id);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = index < timelineOptions.length - 1 ? index + 1 : 0;
        setFocusedTimelineIndex(nextIndex);
        handleTimelineChange(timelineOptions[nextIndex].id);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTimelineChange(timelineOptions[index].id);
        break;
    }
  };

  const handleContinueToPayment = () => {
    // Navigate to payment preview
    router.push({
      pathname: '/offers/preview',
      params: {
        creatorId,
        offerId,
        offerType,
        config: JSON.stringify(config)
      }
    });
  };

  const isFormValid = () => {
    return config.campaignGoal.trim() !== '' && 
           config.targetAudience.trim() !== '' && 
           config.brandMessage.trim() !== '';
  };

  return (
    <>
      <WebSEO 
        title={`Configure ${offerTemplate.title} | Axees`}
        description="Configure your offer details and requirements"
        keywords="offer configuration, campaign details, creator collaboration"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/offers" />
          
          <Text style={styles.headerTitle}>Configure Offer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Offer Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>{offerTemplate.title}</Text>
            <Text style={styles.summarySubtitle}>for {creator?.name}</Text>
            <Text style={styles.summaryDescription}>{offerTemplate.description}</Text>
            
            <View style={styles.includesContainer}>
              <Text style={styles.includesTitle}>Includes:</Text>
              {offerTemplate.includes.map((item: string, index: number) => (
                <Text key={index} style={styles.includeItem}>• {item}</Text>
              ))}
            </View>
          </View>

          {/* Configuration Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Campaign Details</Text>
            
            {/* Campaign Goal */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Goal *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What do you want to achieve with this campaign?"
                value={config.campaignGoal}
                onChangeText={(text) => setConfig(prev => ({ ...prev, campaignGoal: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Target Audience */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Audience *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe your target audience demographics"
                value={config.targetAudience}
                onChangeText={(text) => setConfig(prev => ({ ...prev, targetAudience: text }))}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Brand Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Key Brand Message *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What key message should be communicated?"
                value={config.brandMessage}
                onChangeText={(text) => setConfig(prev => ({ ...prev, brandMessage: text }))}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Timeline Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Timeline & Pricing</Text>
              <Text style={styles.radioGroupInstructions}>
                Use arrow keys to navigate between options
              </Text>
              {timelineOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={({ focused }) => [
                    styles.timelineOption,
                    config.timeline === option.id && styles.selectedTimelineOption,
                    focused && styles.focusedTimelineOption,
                    focusedTimelineIndex === index && styles.keyboardFocusedOption,
                  ]}
                  onPress={() => handleTimelineChange(option.id)}
                  onKeyPress={(event) => handleTimelineKeyPress(event, index)}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ 
                    selected: config.timeline === option.id,
                    checked: config.timeline === option.id 
                  }}
                  accessibilityLabel={`${option.label} - $${Math.round(offerTemplate.basePrice * option.multiplier).toLocaleString()}`}
                  accessibilityHint="Use arrow keys to navigate between timeline options"
                >
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      config.timeline === option.id && styles.selectedTimelineLabel
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.timelinePrice,
                      config.timeline === option.id && styles.selectedTimelinePrice
                    ]}>
                      ${Math.round(offerTemplate.basePrice * option.multiplier).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    config.timeline === option.id && styles.selectedRadioButton
                  ]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Requests */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Requests (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Any special requirements or requests?"
                value={config.additionalRequests}
                onChangeText={(text) => setConfig(prev => ({ ...prev, additionalRequests: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Price Summary */}
          <View style={styles.priceSummarySection}>
            <Text style={styles.priceSummaryTitle}>Price Summary</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base Price</Text>
              <Text style={styles.priceValue}>${offerTemplate.basePrice.toLocaleString()}</Text>
            </View>
            
            {config.timeline === 'rush' && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Rush Delivery (+50%)</Text>
                <Text style={styles.priceValue}>+${(offerTemplate.basePrice * 0.5).toLocaleString()}</Text>
              </View>
            )}
            
            {config.timeline === 'extended' && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Extended Timeline (-10%)</Text>
                <Text style={styles.priceValue}>-${(offerTemplate.basePrice * 0.1).toLocaleString()}</Text>
              </View>
            )}
            
            <View style={styles.totalPriceRow}>
              <Text style={styles.totalPriceLabel}>Total Price</Text>
              <Text style={styles.totalPriceValue}>${config.totalPrice.toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={[styles.continueButton, !isFormValid() && styles.disabledButton]}
            onPress={handleContinueToPayment}
            disabled={!isFormValid()}
          >
            <Text style={[styles.continueButtonText, !isFormValid() && styles.disabledButtonText]}>
              Continue to Preview
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={0} />}
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
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  summarySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 16,
    color: BrandColors.neutral[500],
    marginBottom: 12,
  },
  summaryDescription: {
    fontSize: 16,
    color: BrandColors.neutral[800],
    lineHeight: 24,
    marginBottom: 16,
  },
  includesContainer: {
    marginTop: 12,
  },
  includesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  includeItem: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    marginBottom: 4,
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  radioGroupInstructions: {
    fontSize: 14,
    color: BrandColors.neutral[500],
    fontStyle: 'italic',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 44,
  },
  timelineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.neutral[300],
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedTimelineOption: {
    borderColor: Color.cSK430B92500,
    backgroundColor: BrandColors.primary[50],
  },
  focusedTimelineOption: {
    ...Focus.primary,
    borderRadius: 8,
  },
  keyboardFocusedOption: {
    ...Focus.primary,
    borderRadius: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.neutral[800],
    marginBottom: 4,
  },
  selectedTimelineLabel: {
    color: Color.cSK430B92500,
  },
  timelinePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandColors.neutral[500],
  },
  selectedTimelinePrice: {
    color: Color.cSK430B92500,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BrandColors.neutral[300],
    marginLeft: 16,
  },
  selectedRadioButton: {
    borderColor: Color.cSK430B92500,
    backgroundColor: Color.cSK430B92500,
  },
  priceSummarySection: {
    margin: 20,
    padding: 20,
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
  },
  priceSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: BrandColors.neutral[500],
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.neutral[800],
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BrandColors.neutral[300],
    marginTop: 8,
  },
  totalPriceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  totalPriceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BrandColors.neutral[100],
  },
  continueButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: BrandColors.neutral[400],
  },
  continueButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: BrandColors.neutral[400],
  },
});

export default OfferDetailsPage;