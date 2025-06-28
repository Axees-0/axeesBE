import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateCampaignPage = () => {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    budget: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    objectives: [] as string[],
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      gender: 'all',
      interests: [] as string[],
      locations: [] as string[],
    },
    contentRequirements: {
      posts: 0,
      stories: 0,
      reels: 0,
      videos: 0,
    },
    selectedPlatforms: [] as string[],
  });

  const objectives = ['Brand Awareness', 'Sales', 'Engagement', 'App Downloads', 'Website Traffic', 'Lead Generation'];
  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook'];
  const interests = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle'];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Create campaign
      Alert.alert(
        'Campaign Created!',
        'Your campaign has been created successfully. You can now start inviting creators.',
        [
          {
            text: 'View Campaign',
            onPress: () => router.replace('/campaigns'),
          },
        ]
      );
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleObjective = (objective: string) => {
    const newObjectives = campaignData.objectives.includes(objective)
      ? campaignData.objectives.filter(o => o !== objective)
      : [...campaignData.objectives, objective];
    setCampaignData({ ...campaignData, objectives: newObjectives });
  };

  const togglePlatform = (platform: string) => {
    const newPlatforms = campaignData.selectedPlatforms.includes(platform)
      ? campaignData.selectedPlatforms.filter(p => p !== platform)
      : [...campaignData.selectedPlatforms, platform];
    setCampaignData({ ...campaignData, selectedPlatforms: newPlatforms });
  };

  const toggleInterest = (interest: string) => {
    const newInterests = campaignData.targetAudience.interests.includes(interest)
      ? campaignData.targetAudience.interests.filter(i => i !== interest)
      : [...campaignData.targetAudience.interests, interest];
    setCampaignData({
      ...campaignData,
      targetAudience: { ...campaignData.targetAudience, interests: newInterests },
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Campaign Details</Text>
            <Text style={styles.stepDescription}>Let's start with the basics of your campaign</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Summer Fashion Collection 2024"
                value={campaignData.name}
                onChangeText={(text) => setCampaignData({ ...campaignData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your campaign goals and requirements..."
                value={campaignData.description}
                onChangeText={(text) => setCampaignData({ ...campaignData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Budget</Text>
              <View style={styles.budgetInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="10,000"
                  value={campaignData.budget}
                  onChangeText={(text) => setCampaignData({ ...campaignData, budget: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Objectives</Text>
              <View style={styles.chipContainer}>
                {objectives.map((objective) => (
                  <TouchableOpacity
                    key={objective}
                    style={[
                      styles.chip,
                      campaignData.objectives.includes(objective) && styles.chipActive,
                    ]}
                    onPress={() => toggleObjective(objective)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        campaignData.objectives.includes(objective) && styles.chipTextActive,
                      ]}
                    >
                      {objective}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Platform & Content</Text>
            <Text style={styles.stepDescription}>Choose platforms and content requirements</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Platforms</Text>
              <View style={styles.platformGrid}>
                {platforms.map((platform) => (
                  <TouchableOpacity
                    key={platform}
                    style={[
                      styles.platformCard,
                      campaignData.selectedPlatforms.includes(platform) && styles.platformCardActive,
                    ]}
                    onPress={() => togglePlatform(platform)}
                  >
                    <View style={styles.platformIcon}>
                      {platform === 'Instagram' && <MaterialCommunityIcons name="instagram" size={24} color={campaignData.selectedPlatforms.includes(platform) ? '#FFFFFF' : '#6B7280'} />}
                      {platform === 'TikTok' && <MaterialCommunityIcons name="music-note" size={24} color={campaignData.selectedPlatforms.includes(platform) ? '#FFFFFF' : '#6B7280'} />}
                      {platform === 'YouTube' && <MaterialCommunityIcons name="youtube" size={24} color={campaignData.selectedPlatforms.includes(platform) ? '#FFFFFF' : '#6B7280'} />}
                      {platform === 'Twitter' && <MaterialCommunityIcons name="twitter" size={24} color={campaignData.selectedPlatforms.includes(platform) ? '#FFFFFF' : '#6B7280'} />}
                      {platform === 'Facebook' && <MaterialCommunityIcons name="facebook" size={24} color={campaignData.selectedPlatforms.includes(platform) ? '#FFFFFF' : '#6B7280'} />}
                    </View>
                    <Text style={[styles.platformText, campaignData.selectedPlatforms.includes(platform) && styles.platformTextActive]}>
                      {platform}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Content Requirements</Text>
              <View style={styles.contentRequirements}>
                <View style={styles.requirementRow}>
                  <Text style={styles.requirementLabel}>Feed Posts</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => setCampaignData({
                        ...campaignData,
                        contentRequirements: {
                          ...campaignData.contentRequirements,
                          posts: Math.max(0, campaignData.contentRequirements.posts - 1),
                        },
                      })}
                    >
                      <Ionicons name="remove" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{campaignData.contentRequirements.posts}</Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => setCampaignData({
                        ...campaignData,
                        contentRequirements: {
                          ...campaignData.contentRequirements,
                          posts: campaignData.contentRequirements.posts + 1,
                        },
                      })}
                    >
                      <Ionicons name="add" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.requirementRow}>
                  <Text style={styles.requirementLabel}>Stories</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => setCampaignData({
                        ...campaignData,
                        contentRequirements: {
                          ...campaignData.contentRequirements,
                          stories: Math.max(0, campaignData.contentRequirements.stories - 1),
                        },
                      })}
                    >
                      <Ionicons name="remove" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{campaignData.contentRequirements.stories}</Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => setCampaignData({
                        ...campaignData,
                        contentRequirements: {
                          ...campaignData.contentRequirements,
                          stories: campaignData.contentRequirements.stories + 1,
                        },
                      })}
                    >
                      <Ionicons name="add" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Target Audience</Text>
            <Text style={styles.stepDescription}>Define your ideal audience</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age Range</Text>
              <View style={styles.ageRangeContainer}>
                <TextInput
                  style={styles.ageInput}
                  placeholder="18"
                  value={campaignData.targetAudience.ageRange.min.toString()}
                  onChangeText={(text) => setCampaignData({
                    ...campaignData,
                    targetAudience: {
                      ...campaignData.targetAudience,
                      ageRange: { ...campaignData.targetAudience.ageRange, min: parseInt(text) || 18 },
                    },
                  })}
                  keyboardType="numeric"
                />
                <Text style={styles.ageSeparator}>to</Text>
                <TextInput
                  style={styles.ageInput}
                  placeholder="65"
                  value={campaignData.targetAudience.ageRange.max.toString()}
                  onChangeText={(text) => setCampaignData({
                    ...campaignData,
                    targetAudience: {
                      ...campaignData.targetAudience,
                      ageRange: { ...campaignData.targetAudience.ageRange, max: parseInt(text) || 65 },
                    },
                  })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {['all', 'male', 'female'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      campaignData.targetAudience.gender === gender && styles.genderButtonActive,
                    ]}
                    onPress={() => setCampaignData({
                      ...campaignData,
                      targetAudience: { ...campaignData.targetAudience, gender },
                    })}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        campaignData.targetAudience.gender === gender && styles.genderTextActive,
                      ]}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Interests</Text>
              <View style={styles.chipContainer}>
                {interests.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.chip,
                      campaignData.targetAudience.interests.includes(interest) && styles.chipActive,
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        campaignData.targetAudience.interests.includes(interest) && styles.chipTextActive,
                      ]}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Launch</Text>
            <Text style={styles.stepDescription}>Review your campaign details</Text>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Campaign Summary</Text>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{campaignData.name || 'Not set'}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Budget:</Text>
                <Text style={styles.reviewValue}>${campaignData.budget || '0'}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Platforms:</Text>
                <Text style={styles.reviewValue}>
                  {campaignData.selectedPlatforms.join(', ') || 'None selected'}
                </Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Content:</Text>
                <Text style={styles.reviewValue}>
                  {campaignData.contentRequirements.posts} posts, {campaignData.contentRequirements.stories} stories
                </Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Target Age:</Text>
                <Text style={styles.reviewValue}>
                  {campaignData.targetAudience.ageRange.min}-{campaignData.targetAudience.ageRange.max} years
                </Text>
              </View>
            </View>

            <View style={styles.launchNote}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.launchNoteText}>
                Once launched, you can start inviting creators to participate in your campaign.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <UniversalBackButton />
        <Text style={styles.headerTitle}>Create Campaign</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.progressStep,
              i <= step && styles.progressStepActive,
              i < step && styles.progressStepCompleted,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, !campaignData.name && step === 1 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!campaignData.name && step === 1}
        >
          <Text style={styles.nextButtonText}>
            {step === 4 ? 'Launch Campaign' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 16,
    fontFamily: DesignSystem.Typography.h2.fontFamily,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#430B92',
  },
  progressStepCompleted: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: DesignSystem.Typography.h1.fontFamily,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  budgetInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    color: '#6B7280',
    marginRight: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#430B92',
    borderColor: '#430B92',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  platformCardActive: {
    backgroundColor: '#430B92',
    borderColor: '#430B92',
  },
  platformIcon: {
    marginBottom: 8,
  },
  platformText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  platformTextActive: {
    color: '#FFFFFF',
  },
  contentRequirements: {
    gap: 16,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requirementLabel: {
    fontSize: 16,
    color: '#374151',
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  ageRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
  },
  ageSeparator: {
    fontSize: 16,
    color: '#6B7280',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderButtonActive: {
    backgroundColor: '#430B92',
    borderColor: '#430B92',
  },
  genderText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    fontFamily: DesignSystem.Typography.h3.fontFamily,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: DesignSystem.Typography.caption.fontFamily,
  },
  reviewValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    fontFamily: DesignSystem.Typography.captionMedium.fontFamily,
  },
  launchNote: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  launchNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontFamily: DesignSystem.Typography.body.fontFamily,
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#430B92',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
  },
});

export default CreateCampaignPage;