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
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface ProofData {
  description: string;
  socialPostUrl: string;
  screenshots: string[];
  notes: string;
}

const ProofUploadPage: React.FC = () => {
  const { dealId, milestoneId } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  
  const [proofData, setProofData] = useState<ProofData>({
    description: '',
    socialPostUrl: '',
    screenshots: [],
    notes: ''
  });

  const [uploadedScreenshots, setUploadedScreenshots] = useState<string[]>([]);

  // Demo milestone data
  const milestone = {
    title: 'Content Publishing',
    description: 'Publish approved content and provide posting proof',
    deliverables: ['Published Instagram post', 'Screenshots of post', 'Performance metrics after 24h'],
    dueDate: '2024-06-28',
    amount: 750,
    approvedContent: {
      caption: 'Summer vibes are here! ☀️ Check out our latest collection that perfectly captures the essence of sunny days...',
      hashtags: '#SummerCollection #TechStyle #SunnyDays #Fashion #OOTD',
      postTime: '2024-06-26 2:00 PM'
    }
  };

  const handleAddScreenshot = () => {
    // In a real app, this would open image picker
    const demoScreenshots = [
      'instagram_post_live_screenshot.jpg',
      'post_engagement_screenshot.jpg', 
      'story_screenshot.jpg',
      'analytics_screenshot.jpg',
      'comments_screenshot.jpg'
    ];
    
    const newScreenshot = demoScreenshots[Math.floor(Math.random() * demoScreenshots.length)];
    if (!uploadedScreenshots.includes(newScreenshot)) {
      setUploadedScreenshots([...uploadedScreenshots, newScreenshot]);
    }
  };

  const handleRemoveScreenshot = (fileName: string) => {
    setUploadedScreenshots(uploadedScreenshots.filter(f => f !== fileName));
  };

  const handleSubmitProof = () => {
    if (!proofData.description.trim()) {
      Alert.alert('Missing Description', 'Please provide a description of your published content.');
      return;
    }

    if (!proofData.socialPostUrl.trim()) {
      Alert.alert('Missing Post URL', 'Please provide the URL of your published social media post.');
      return;
    }

    if (uploadedScreenshots.length === 0) {
      Alert.alert('Missing Screenshots', 'Please upload at least one screenshot of your published content.');
      return;
    }

    Alert.alert(
      'Submit Proof',
      'Are you ready to submit proof of your published content? This will complete the milestone and release payment.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit Proof', 
          onPress: () => {
            // In a real app, this would call the API
            Alert.alert(
              'Proof Submitted!',
              'Your proof has been submitted successfully. The marketer will review it and payment will be released once approved.',
              [
                { 
                  text: 'View Deal', 
                  onPress: () => router.replace({
                    pathname: '/deals/[id]',
                    params: { id: dealId }
                  })
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your proof has been saved as a draft. You can continue working on it later.');
  };

  return (
    <>
      <WebSEO 
        title="Upload Proof | Axees"
        description="Upload proof of published content"
        keywords="proof upload, content publishing, milestone completion"
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
          
          <Text style={styles.headerTitle}>Upload Proof</Text>
          
          <TouchableOpacity 
            style={styles.draftButton}
            onPress={handleSaveDraft}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Milestone Overview */}
          <View style={styles.milestoneSection}>
            <Text style={styles.sectionTitle}>Milestone Details</Text>
            
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              
              <View style={styles.milestoneInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Due Date</Text>
                  <Text style={styles.infoValue}>{new Date(milestone.dueDate).toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>${milestone.amount}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Approved Content Reference */}
          <View style={styles.approvedContentSection}>
            <Text style={styles.sectionTitle}>Approved Content</Text>
            
            <View style={styles.approvedContentCard}>
              <Text style={styles.approvedContentLabel}>Caption:</Text>
              <Text style={styles.approvedContentText}>{milestone.approvedContent.caption}</Text>
              
              <Text style={styles.approvedContentLabel}>Hashtags:</Text>
              <Text style={styles.approvedContentText}>{milestone.approvedContent.hashtags}</Text>
              
              <Text style={styles.approvedContentLabel}>Scheduled Post Time:</Text>
              <Text style={styles.approvedContentText}>{milestone.approvedContent.postTime}</Text>
            </View>
          </View>

          {/* Proof Upload Form */}
          <View style={styles.proofSection}>
            <Text style={styles.sectionTitle}>Proof of Publication</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Post URL *</Text>
              <Text style={styles.inputHint}>
                Provide the direct link to your published social media post
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://instagram.com/p/..."
                value={proofData.socialPostUrl}
                onChangeText={(text) => setProofData(prev => ({ ...prev, socialPostUrl: text }))}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <Text style={styles.inputHint}>
                Describe how you published the content and any relevant details
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Example: I published the post at exactly 2:00 PM as scheduled. The content includes all approved elements - the summer collection photos, approved caption, and hashtags. The post is now live and receiving engagement..."
                value={proofData.description}
                onChangeText={(text) => setProofData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Screenshot Upload */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Screenshots *</Text>
              <Text style={styles.inputHint}>
                Upload screenshots showing your published content (post, stories, analytics)
              </Text>
              
              <TouchableOpacity style={styles.uploadButton} onPress={handleAddScreenshot}>
                <Text style={styles.uploadButtonText}>+ Add Screenshots</Text>
              </TouchableOpacity>

              {uploadedScreenshots.length > 0 && (
                <View style={styles.screenshotsContainer}>
                  {uploadedScreenshots.map((fileName, index) => (
                    <View key={index} style={styles.screenshotItem}>
                      <View style={styles.screenshotPreview}>
                        <Text style={styles.screenshotIcon}>📱</Text>
                        <Text style={styles.screenshotName}>{fileName}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleRemoveScreenshot(fileName)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <Text style={styles.inputHint}>
                Any additional context about the publication or performance
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Example: The post is performing well with 500+ likes in the first hour. I also shared it to my story with additional behind-the-scenes content..."
                value={proofData.notes}
                onChangeText={(text) => setProofData(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Proof Guidelines */}
          <View style={styles.guidelinesSection}>
            <Text style={styles.sectionTitle}>Proof Guidelines</Text>
            
            <View style={styles.guidelinesCard}>
              <Text style={styles.guidelineItem}>
                🔗 Provide the direct URL to your published post
              </Text>
              <Text style={styles.guidelineItem}>
                📱 Include clear screenshots of the published content
              </Text>
              <Text style={styles.guidelineItem}>
                📊 Show engagement metrics if available (likes, comments, views)
              </Text>
              <Text style={styles.guidelineItem}>
                📝 Describe how the content matches the approved version
              </Text>
              <Text style={styles.guidelineItem}>
                ⏰ Submit proof within 24 hours of publishing
              </Text>
              <Text style={styles.guidelineItem}>
                ✅ Ensure all deliverables are clearly visible in screenshots
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
              (!proofData.description.trim() || !proofData.socialPostUrl.trim() || uploadedScreenshots.length === 0) && styles.disabledButton
            ]}
            onPress={handleSubmitProof}
            disabled={!proofData.description.trim() || !proofData.socialPostUrl.trim() || uploadedScreenshots.length === 0}
          >
            <Text style={[
              styles.submitButtonText, 
              (!proofData.description.trim() || !proofData.socialPostUrl.trim() || uploadedScreenshots.length === 0) && styles.disabledButtonText
            ]}>
              Submit Proof
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
  milestoneSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 12,
  },
  milestoneCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  milestoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {},
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  approvedContentSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  approvedContentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  approvedContentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
    marginTop: 8,
  },
  approvedContentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  proofSection: {
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
    minHeight: 100,
  },
  uploadButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '500',
  },
  screenshotsContainer: {
    gap: 8,
  },
  screenshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  screenshotPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  screenshotIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  screenshotName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guidelinesSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  guidelinesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  guidelineItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
    flex: 2,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default ProofUploadPage;