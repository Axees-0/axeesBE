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
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { useAlertModal, useConfirmModal } from '@/components/ConfirmModal';
import { UniversalBackButton } from '@/components/UniversalBackButton';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface SubmissionData {
  content: string;
  notes: string;
  files: string[];
}

const WorkSubmissionPage: React.FC = () => {
  const { dealId, milestoneId } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const { showAlert, AlertModalComponent } = useAlertModal();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    content: '',
    notes: '',
    files: []
  });

  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  // Demo milestone data
  const milestone = {
    title: 'Content Creation',
    description: 'Create Instagram post showcasing summer collection with professional photos',
    deliverables: ['Instagram post draft', 'High-quality photos', 'Caption with hashtags'],
    dueDate: '2024-06-25',
    amount: 750
  };

  const handleAddFile = () => {
    // In a real app, this would open file picker
    const demoFiles = [
      'summer_collection_post_v1.jpg',
      'summer_collection_post_v2.jpg', 
      'summer_collection_post_v3.jpg',
      'caption_options.txt',
      'hashtag_research.pdf'
    ];
    
    const newFile = demoFiles[Math.floor(Math.random() * demoFiles.length)];
    if (!attachedFiles.includes(newFile)) {
      setAttachedFiles([...attachedFiles, newFile]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setAttachedFiles(attachedFiles.filter(f => f !== fileName));
  };

  const handleSubmit = () => {
    if (!submissionData.content.trim()) {
      showAlert('Missing Content', 'Please provide details about your work submission.');
      return;
    }

    showConfirm(
      'Submit Work',
      'Are you ready to submit this work for review? You can still make changes if revisions are requested.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: () => {
            // In a real app, this would call the API
            showAlert(
              'Work Submitted!',
              'Your work has been submitted for review. The marketer will be notified and you\'ll receive an update within 24-48 hours. Payment will be released when approved.',
              'View Deal',
              () => router.replace({
                pathname: '/deals/[id]',
                params: { id: dealId }
              })
            );
          }
        }
      ]
    );
  };

  const handleSaveDraft = () => {
    showAlert('Draft Saved', 'Your work has been saved as a draft. You can continue working on it later.');
  };

  return (
    <>
      <WebSEO 
        title="Submit Work | Axees"
        description="Submit work for milestone review"
        keywords="work submission, milestone, creator content"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/deals" />
          
          <Text style={styles.headerTitle}>Submit Work</Text>
          
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

          {/* Required Deliverables */}
          <View style={styles.deliverablesSection}>
            <Text style={styles.sectionTitle}>Required Deliverables</Text>
            
            <View style={styles.deliverablesCard}>
              {milestone.deliverables.map((deliverable, index) => (
                <View key={index} style={styles.deliverableItem}>
                  <Text style={styles.deliverableText}>✓ {deliverable}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Work Submission Form */}
          <View style={styles.submissionSection}>
            <Text style={styles.sectionTitle}>Your Submission</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Work Description *</Text>
              <Text style={styles.inputHint}>
                Describe the work you've completed and how it meets the requirements
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Example: I've created three different post options showcasing the summer collection. Each post includes high-quality product photos with lifestyle shots. I've also prepared multiple caption variations with relevant hashtags for maximum engagement..."
                value={submissionData.content}
                onChangeText={(text) => setSubmissionData(prev => ({ ...prev, content: text }))}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <Text style={styles.inputHint}>
                Any additional context, creative decisions, or requests for feedback
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Any additional notes about your creative process, technical decisions, or requests for specific feedback..."
                value={submissionData.notes}
                onChangeText={(text) => setSubmissionData(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* File Attachments */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>File Attachments</Text>
              <Text style={styles.inputHint}>
                Upload your work files (images, videos, documents)
              </Text>
              
              <TouchableOpacity style={styles.uploadButton} onPress={handleAddFile}>
                <Text style={styles.uploadButtonText}>+ Add Files</Text>
              </TouchableOpacity>

              {attachedFiles.length > 0 && (
                <View style={styles.filesContainer}>
                  {attachedFiles.map((fileName, index) => (
                    <View key={index} style={styles.fileItem}>
                      <Text style={styles.fileName}>📎 {fileName}</Text>
                      <TouchableOpacity 
                        onPress={() => handleRemoveFile(fileName)}
                        style={styles.removeFileButton}
                      >
                        <Text style={styles.removeFileText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Submission Guidelines */}
          <View style={styles.guidelinesSection}>
            <Text style={styles.sectionTitle}>Submission Guidelines</Text>
            
            <View style={styles.guidelinesCard}>
              <Text style={styles.guidelineItem}>
                📋 Ensure all deliverables are included and meet the requirements
              </Text>
              <Text style={styles.guidelineItem}>
                🎨 Provide context about your creative decisions and approach
              </Text>
              <Text style={styles.guidelineItem}>
                📁 Include high-quality files in appropriate formats
              </Text>
              <Text style={styles.guidelineItem}>
                ⏰ Submit before the deadline to allow time for revisions if needed
              </Text>
              <Text style={styles.guidelineItem}>
                💬 Be responsive to feedback and revision requests
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
            style={[styles.submitButton, !submissionData.content.trim() && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!submissionData.content.trim()}
          >
            <Text style={[styles.submitButtonText, !submissionData.content.trim() && styles.disabledButtonText]}>
              Submit for Review
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={1} />}
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
  deliverablesSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deliverablesCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  deliverableItem: {
    marginBottom: 8,
  },
  deliverableText: {
    fontSize: 14,
    color: '#666',
  },
  submissionSection: {
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
    minHeight: 120,
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
  filesContainer: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  removeFileButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFileText: {
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

export default WorkSubmissionPage;