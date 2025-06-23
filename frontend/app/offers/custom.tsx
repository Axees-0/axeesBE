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
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { DemoData } from '@/demo/DemoData';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface CustomOfferData {
  title: string;
  description: string;
  campaignGoal: string;
  targetAudience: string;
  deliverables: string[];
  timeline: number;
  price: number;
  additionalRequests: string;
  isDraft: boolean;
}

const CustomOfferPage: React.FC = () => {
  const { creatorId } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';

  // Find creator from demo data
  const creator = useMemo(() => {
    return DemoData.creators.find(c => c._id === creatorId);
  }, [creatorId]);

  const [offerData, setOfferData] = useState<CustomOfferData>({
    title: '',
    description: '',
    campaignGoal: '',
    targetAudience: '',
    deliverables: [''],
    timeline: 7,
    price: 500,
    additionalRequests: '',
    isDraft: false,
  });

  const [currentDeliverable, setCurrentDeliverable] = useState('');

  const platformSuggestions = [
    'Instagram Post',
    'Instagram Story',
    'Instagram Reel',
    'TikTok Video',
    'YouTube Video',
    'YouTube Short',
    'Twitter Thread',
    'LinkedIn Post',
    'Facebook Post',
    'Blog Post',
    'Product Review',
    'Unboxing Video',
    'Tutorial Content',
    'Live Stream',
    'Story Highlight',
    'IGTV Video',
  ];

  const addDeliverable = () => {
    if (currentDeliverable.trim()) {
      setOfferData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables.filter(d => d.trim()), currentDeliverable.trim()]
      }));
      setCurrentDeliverable('');
    }
  };

  const removeDeliverable = (index: number) => {
    const deliverableToRemove = offerData.deliverables[index];
    
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
            setOfferData(prev => ({
              ...prev,
              deliverables: prev.deliverables.filter((_, i) => i !== index)
            }));
          }
        }
      ]
    );
  };

  const addSuggestedDeliverable = (suggestion: string) => {
    if (!offerData.deliverables.includes(suggestion)) {
      setOfferData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables.filter(d => d.trim()), suggestion]
      }));
    }
  };

  const handleSaveAsDraft = () => {
    // In a real app, this would save to local storage or backend
    Alert.alert(
      'Draft Saved',
      'Your custom offer has been saved as a draft. You can continue editing it later.',
      [{ text: 'OK' }]
    );
  };

  const handleContinueToPreview = () => {
    // Navigate to preview with custom offer data
    router.push({
      pathname: '/offers/preview',
      params: {
        creatorId,
        offerId: 'custom-offer',
        offerType: 'custom',
        config: JSON.stringify({
          ...offerData,
          totalPrice: offerData.price
        })
      }
    });
  };

  const isFormValid = () => {
    return offerData.title.trim() !== '' &&
           offerData.description.trim() !== '' &&
           offerData.campaignGoal.trim() !== '' &&
           offerData.targetAudience.trim() !== '' &&
           offerData.deliverables.filter(d => d.trim()).length > 0 &&
           offerData.price > 0;
  };

  const estimatedPlatformFee = Math.round(offerData.price * 0.05);
  const totalWithFees = offerData.price + estimatedPlatformFee + 5;

  return (
    <>
      <WebSEO 
        title="Create Custom Offer | Axees"
        description="Create a personalized collaboration offer"
        keywords="custom offer, creator collaboration, influencer marketing"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft width={24} height={24} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Custom Offer</Text>
          
          <TouchableOpacity 
            style={styles.draftButton}
            onPress={handleSaveAsDraft}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Creator Info */}
          <View style={styles.creatorSection}>
            <Text style={styles.creatorLabel}>Creating offer for:</Text>
            <Text style={styles.creatorName}>{creator?.name}</Text>
            <Text style={styles.creatorHandle}>{creator?.userName}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Offer Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Offer Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Summer Campaign Instagram Posts"
                value={offerData.title}
                onChangeText={(text) => setOfferData(prev => ({ ...prev, title: text }))}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Offer Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe what you're looking for in detail..."
                value={offerData.description}
                onChangeText={(text) => setOfferData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Campaign Goal */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Goal *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="What do you want to achieve? (brand awareness, sales, engagement, etc.)"
                value={offerData.campaignGoal}
                onChangeText={(text) => setOfferData(prev => ({ ...prev, campaignGoal: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Target Audience */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Audience *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your target audience demographics and interests"
                value={offerData.targetAudience}
                onChangeText={(text) => setOfferData(prev => ({ ...prev, targetAudience: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Deliverables */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deliverables *</Text>
              <Text style={styles.inputHint}>What specific content do you want created?</Text>
              
              {/* Current Deliverables */}
              <View style={styles.deliverablesContainer}>
                {offerData.deliverables.filter(d => d.trim()).map((deliverable, index) => (
                  <View key={index} style={styles.deliverableChip}>
                    <Text style={styles.deliverableText}>{deliverable}</Text>
                    <TouchableOpacity 
                      onPress={() => removeDeliverable(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Add New Deliverable */}
              <View style={styles.addDeliverableContainer}>
                <TextInput
                  style={[styles.textInput, styles.deliverableInput]}
                  placeholder="Add a deliverable..."
                  value={currentDeliverable}
                  onChangeText={setCurrentDeliverable}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={addDeliverable}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Suggestions */}
              <Text style={styles.suggestionsLabel}>Quick suggestions:</Text>
              <View style={styles.suggestionsContainer}>
                {platformSuggestions.slice(0, 8).map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionChip,
                      offerData.deliverables.includes(suggestion) && styles.selectedSuggestion
                    ]}
                    onPress={() => addSuggestedDeliverable(suggestion)}
                  >
                    <Text style={[
                      styles.suggestionText,
                      offerData.deliverables.includes(suggestion) && styles.selectedSuggestionText
                    ]}>
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timeline & Price Row */}
            <View style={styles.rowContainer}>
              <View style={styles.halfInputGroup}>
                <Text style={styles.inputLabel}>Timeline (Days) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="7"
                  value={offerData.timeline.toString()}
                  onChangeText={(text) => setOfferData(prev => ({ 
                    ...prev, 
                    timeline: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfInputGroup}>
                <Text style={styles.inputLabel}>Your Budget ($) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="500"
                  value={offerData.price.toString()}
                  onChangeText={(text) => setOfferData(prev => ({ 
                    ...prev, 
                    price: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Additional Requests */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Requests (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Any special requirements, style preferences, or additional notes..."
                value={offerData.additionalRequests}
                onChangeText={(text) => setOfferData(prev => ({ ...prev, additionalRequests: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Price Summary */}
          <View style={styles.priceSummarySection}>
            <Text style={styles.priceSummaryTitle}>Price Estimate</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Your Budget</Text>
              <Text style={styles.priceValue}>${offerData.price.toLocaleString()}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee (5%)</Text>
              <Text style={styles.priceValue}>${estimatedPlatformFee.toLocaleString()}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Processing Fee</Text>
              <Text style={styles.priceValue}>$5</Text>
            </View>
            
            <View style={styles.totalPriceRow}>
              <Text style={styles.totalPriceLabel}>Total Cost</Text>
              <Text style={styles.totalPriceValue}>${totalWithFees.toLocaleString()}</Text>
            </View>
            
            <Text style={styles.priceNote}>
              Final price may be negotiated with the creator
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={[styles.continueButton, !isFormValid() && styles.disabledButton]}
            onPress={handleContinueToPreview}
            disabled={!isFormValid()}
          >
            <Text 
              style={[styles.continueButtonText, !isFormValid() && styles.disabledButtonText]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
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
  creatorSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  creatorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 2,
  },
  creatorHandle: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  halfInputGroup: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  deliverablesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  deliverableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deliverableText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addDeliverableContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  deliverableInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  selectedSuggestion: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  suggestionText: {
    fontSize: 12,
    color: '#666',
  },
  selectedSuggestionText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  priceSummarySection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
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
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 8,
    marginBottom: 8,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  priceNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default CustomOfferPage;