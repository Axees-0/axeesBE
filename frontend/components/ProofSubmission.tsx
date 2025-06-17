import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  Video,
  Image as ImageIcon,
  FileText,
  Calendar,
  MapPin,
  Hash,
  AtSign,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Clock,
  Send
} from 'lucide-react-native';
import DatePicker from 'react-datepicker';
import DocumentUpload from './DocumentUpload';
import {
  useProofSubmission,
  ProofMetadata,
  ProofTemplate,
  ProofSubmission as ProofSubmissionType
} from '@/utils/proofSubmissionService';
import { DocumentFile } from '@/utils/documentSubmissionService';
import { useAuth } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';

interface ProofSubmissionProps {
  dealId: string;
  milestoneId?: string;
  templateId?: string;
  onSubmissionComplete?: (proofId: string) => void;
  onCancel?: () => void;
  editingProofId?: string; // For editing existing proofs
  compact?: boolean;
}

export default function ProofSubmission({
  dealId,
  milestoneId,
  templateId,
  onSubmissionComplete,
  onCancel,
  editingProofId,
  compact = false
}: ProofSubmissionProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ProofTemplate | null>(null);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    proofs,
    templates,
    analytics,
    isLoading,
    error,
    createProof,
    submitProof,
    updateProof,
    service
  } = useProofSubmission(dealId);

  const [metadata, setMetadata] = useState<ProofMetadata>({
    contentType: 'post_content',
    tags: [],
    mentions: [],
    hashtags: [],
    campaignGoals: [],
    socialMediaLinks: []
  });

  // Load existing proof for editing
  useEffect(() => {
    if (editingProofId) {
      const loadExistingProof = async () => {
        const existingProof = await service.getProofSubmission(editingProofId);
        if (existingProof) {
          setMetadata(existingProof.metadata);
          setFiles(existingProof.files);
          setSelectedTemplate(existingProof.template || null);
          setCurrentStep(2); // Skip template selection
        }
      };
      loadExistingProof();
    }
  }, [editingProofId]);

  // Set template based on templateId prop
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setMetadata(prev => ({ ...prev, contentType: template.contentType as any }));
        setCurrentStep(2); // Skip template selection
      }
    }
  }, [templateId, templates]);

  const handleTemplateSelect = (template: ProofTemplate) => {
    setSelectedTemplate(template);
    setMetadata(prev => ({ ...prev, contentType: template.contentType as any }));
    setCurrentStep(2);
  };

  const handleMetadataChange = (field: keyof ProofMetadata, value: any) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field: 'tags' | 'mentions' | 'hashtags' | 'campaignGoals', value: string) => {
    if (value.trim()) {
      const newArray = value.split(',').map(item => item.trim()).filter(item => item);
      setMetadata(prev => ({ ...prev, [field]: newArray }));
    } else {
      setMetadata(prev => ({ ...prev, [field]: [] }));
    }
  };

  const handleSocialMediaLinkAdd = () => {
    setMetadata(prev => ({
      ...prev,
      socialMediaLinks: [
        ...prev.socialMediaLinks || [],
        { platform: '', url: '', status: 'draft' }
      ]
    }));
  };

  const handleSocialMediaLinkUpdate = (index: number, field: 'platform' | 'url' | 'status', value: string) => {
    setMetadata(prev => ({
      ...prev,
      socialMediaLinks: prev.socialMediaLinks?.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      ) || []
    }));
  };

  const handleSocialMediaLinkRemove = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      socialMediaLinks: prev.socialMediaLinks?.filter((_, i) => i !== index) || []
    }));
  };

  const validateSubmission = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push('At least one file is required');
    }

    if (selectedTemplate) {
      selectedTemplate.requiredFields.forEach(field => {
        const value = metadata[field as keyof ProofMetadata];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors.push(`${field} is required for ${selectedTemplate.name}`);
        }
      });
    }

    // Validate social media links
    metadata.socialMediaLinks?.forEach((link, index) => {
      if (link.platform && !link.url) {
        errors.push(`URL is required for social media link ${index + 1}`);
      }
      if (link.url && !link.platform) {
        errors.push(`Platform is required for social media link ${index + 1}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async () => {
    const validation = validateSubmission();
    
    if (!validation.isValid) {
      Alert.alert(
        'Validation Error',
        validation.errors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      let proofId: string;
      
      if (editingProofId) {
        // Update existing proof
        await updateProof(editingProofId, { files, metadata });
        proofId = editingProofId;
      } else {
        // Create new proof
        const result = await createProof(
          user?._id || '',
          files,
          metadata,
          milestoneId,
          selectedTemplate?.id
        );
        proofId = result.proofId!;
      }

      // Submit for review
      await submitProof(proofId, metadata);
      
      Toast.show({
        type: 'success',
        text1: 'Proof Submitted',
        text2: 'Your proof has been submitted for review',
        visibilityTime: 3000
      });

      onSubmissionComplete?.(proofId);
    } catch (err: any) {
      Alert.alert(
        'Submission Failed',
        err.message || 'Failed to submit proof. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTemplateIcon = (template: ProofTemplate) => {
    const iconProps = { width: 24, height: 24, color: '#430B92' };
    
    switch (template.contentType) {
      case 'post_content':
        return <ImageIcon {...iconProps} />;
      case 'story_content':
        return <Camera {...iconProps} />;
      case 'reel_content':
      case 'video_content':
        return <Video {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  const renderTemplateSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Content Type</Text>
      <Text style={styles.stepSubtitle}>
        Choose the type of content you're submitting for review
      </Text>
      
      <ScrollView style={styles.templatesContainer} showsVerticalScrollIndicator={false}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              selectedTemplate?.id === template.id && styles.templateCardSelected
            ]}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={styles.templateHeader}>
              {renderTemplateIcon(template)}
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
              </View>
            </View>
            
            {template.recommendedSpecs.dimensions && (
              <View style={styles.templateSpecs}>
                <Text style={styles.specsTitle}>Recommended Dimensions:</Text>
                {template.recommendedSpecs.dimensions.slice(0, 2).map((dim, index) => (
                  <Text key={index} style={styles.specsText}>
                    {dim.width}x{dim.height} ({dim.label})
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={styles.skipButton} onPress={() => setCurrentStep(2)}>
        <Text style={styles.skipButtonText}>Skip Template Selection</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMetadataForm = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Content Details</Text>
      <Text style={styles.stepSubtitle}>
        Provide details about your content submission
      </Text>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Title {selectedTemplate?.requiredFields.includes('title') && <Text style={styles.required}>*</Text>}
          </Text>
          <TextInput
            style={styles.input}
            value={metadata.title || ''}
            onChangeText={(text) => handleMetadataChange('title', text)}
            placeholder="Enter content title"
            placeholderTextColor="#6C6C6C"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Description {selectedTemplate?.requiredFields.includes('description') && <Text style={styles.required}>*</Text>}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={metadata.description || ''}
            onChangeText={(text) => handleMetadataChange('description', text)}
            placeholder="Describe your content"
            placeholderTextColor="#6C6C6C"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Platform */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Platform</Text>
          <TextInput
            style={styles.input}
            value={metadata.platform || ''}
            onChangeText={(text) => handleMetadataChange('platform', text)}
            placeholder="e.g., Instagram, YouTube, TikTok"
            placeholderTextColor="#6C6C6C"
          />
        </View>

        {/* Scheduled Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Scheduled Date</Text>
          <TouchableOpacity style={styles.dateInput}>
            <Calendar width={20} height={20} color="#430B92" />
            <Text style={styles.dateText}>
              {metadata.scheduledDate 
                ? metadata.scheduledDate.toLocaleDateString()
                : 'Select date'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location</Text>
          <View style={styles.inputWithIcon}>
            <MapPin width={20} height={20} color="#6C6C6C" />
            <TextInput
              style={styles.inputWithIconText}
              value={metadata.location || ''}
              onChangeText={(text) => handleMetadataChange('location', text)}
              placeholder="Enter location"
              placeholderTextColor="#6C6C6C"
            />
          </View>
        </View>

        {/* Hashtags */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Hashtags {selectedTemplate?.requiredFields.includes('hashtags') && <Text style={styles.required}>*</Text>}
          </Text>
          <View style={styles.inputWithIcon}>
            <Hash width={20} height={20} color="#6C6C6C" />
            <TextInput
              style={styles.inputWithIconText}
              value={metadata.hashtags?.join(', ') || ''}
              onChangeText={(text) => handleArrayFieldChange('hashtags', text)}
              placeholder="Enter hashtags separated by commas"
              placeholderTextColor="#6C6C6C"
            />
          </View>
        </View>

        {/* Mentions */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mentions</Text>
          <View style={styles.inputWithIcon}>
            <AtSign width={20} height={20} color="#6C6C6C" />
            <TextInput
              style={styles.inputWithIconText}
              value={metadata.mentions?.join(', ') || ''}
              onChangeText={(text) => handleArrayFieldChange('mentions', text)}
              placeholder="Enter mentions separated by commas"
              placeholderTextColor="#6C6C6C"
            />
          </View>
        </View>

        {/* Target Audience */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Target Audience</Text>
          <View style={styles.inputWithIcon}>
            <Target width={20} height={20} color="#6C6C6C" />
            <TextInput
              style={styles.inputWithIconText}
              value={metadata.targetAudience || ''}
              onChangeText={(text) => handleMetadataChange('targetAudience', text)}
              placeholder="Describe target audience"
              placeholderTextColor="#6C6C6C"
            />
          </View>
        </View>

        {/* Campaign Goals */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Campaign Goals</Text>
          <TextInput
            style={styles.input}
            value={metadata.campaignGoals?.join(', ') || ''}
            onChangeText={(text) => handleArrayFieldChange('campaignGoals', text)}
            placeholder="Enter goals separated by commas"
            placeholderTextColor="#6C6C6C"
          />
        </View>

        {/* Social Media Links */}
        <View style={styles.inputGroup}>
          <View style={styles.labelWithAction}>
            <Text style={styles.inputLabel}>Social Media Links</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleSocialMediaLinkAdd}>
              <Text style={styles.addButtonText}>+ Add Link</Text>
            </TouchableOpacity>
          </View>
          
          {metadata.socialMediaLinks?.map((link, index) => (
            <View key={index} style={styles.socialLinkItem}>
              <View style={styles.socialLinkInputs}>
                <TextInput
                  style={[styles.input, styles.socialLinkInput]}
                  value={link.platform}
                  onChangeText={(text) => handleSocialMediaLinkUpdate(index, 'platform', text)}
                  placeholder="Platform"
                  placeholderTextColor="#6C6C6C"
                />
                <TextInput
                  style={[styles.input, styles.socialLinkInput]}
                  value={link.url}
                  onChangeText={(text) => handleSocialMediaLinkUpdate(index, 'url', text)}
                  placeholder="URL"
                  placeholderTextColor="#6C6C6C"
                />
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleSocialMediaLinkRemove(index)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderFileUpload = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload Files</Text>
      <Text style={styles.stepSubtitle}>
        Upload your content files for review
      </Text>
      
      {selectedTemplate && (
        <View style={styles.templateInfo}>
          <Info width={16} height={16} color="#430B92" />
          <Text style={styles.templateInfoText}>
            Template: {selectedTemplate.name}
          </Text>
        </View>
      )}

      <DocumentUpload
        onFilesChange={setFiles}
        options={{
          maxFiles: 20,
          maxFileSize: selectedTemplate?.recommendedSpecs.maxFileSize || 100 * 1024 * 1024,
          allowedTypes: [
            ...(selectedTemplate?.recommendedSpecs.imageFormats || []),
            ...(selectedTemplate?.recommendedSpecs.videoFormats || []),
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/quicktime',
            'application/pdf'
          ],
          enableCompression: true,
          enableBatchUpload: true
        }}
        title="Upload Content Files"
        subtitle="Drag and drop your content files here or click to browse"
        compact={compact}
      />
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepIndicatorItem}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive,
            currentStep > step && styles.stepCircleComplete
          ]}>
            {currentStep > step ? (
              <CheckCircle width={16} height={16} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive
              ]}>
                {step}
              </Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= step && styles.stepLabelActive
          ]}>
            {step === 1 ? 'Template' : step === 2 ? 'Details' : 'Files'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderNavigation = () => (
    <View style={styles.navigation}>
      {currentStep > 1 && (
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonSecondary]}
          onPress={() => setCurrentStep(prev => prev - 1)}
        >
          <Text style={styles.navButtonTextSecondary}>Back</Text>
        </TouchableOpacity>
      )}
      
      {onCancel && (
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonSecondary]}
          onPress={onCancel}
        >
          <Text style={styles.navButtonTextSecondary}>Cancel</Text>
        </TouchableOpacity>
      )}

      {currentStep < 3 ? (
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={() => setCurrentStep(prev => prev + 1)}
        >
          <Text style={styles.navButtonTextPrimary}>Next</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[
            styles.navButton, 
            styles.navButtonPrimary,
            isSubmitting && styles.navButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Send width={16} height={16} color="#FFFFFF" />
              <Text style={styles.navButtonTextPrimary}>
                {editingProofId ? 'Update Proof' : 'Submit Proof'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle width={16} height={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!compact && !templateId && renderStepIndicator()}
      
      {currentStep === 1 && !templateId ? renderTemplateSelection() :
       currentStep === 2 ? renderMetadataForm() :
       renderFileUpload()}
      
      {renderNavigation()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerCompact: {
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C6C6C',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 40,
  },
  stepIndicatorItem: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#430B92',
  },
  stepCircleComplete: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  stepLabelActive: {
    color: '#430B92',
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  templatesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  templateCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  templateCardSelected: {
    borderColor: '#430B92',
    backgroundColor: '#F0E7FD',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  templateSpecs: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  specsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  specsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#430B92',
    textDecorationLine: 'underline',
  },
  formContainer: {
    flex: 1,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputWithIconText: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#000000',
  },
  labelWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#430B92',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  socialLinkItem: {
    marginBottom: 12,
  },
  socialLinkInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  socialLinkInput: {
    flex: 1,
  },
  removeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#EF4444',
  },
  templateInfoText: {
    fontSize: 14,
    color: '#430B92',
    marginLeft: 8,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  navButtonSecondary: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  navButtonPrimary: {
    backgroundColor: '#430B92',
  },
  navButtonDisabled: {
    opacity: 0.6,
  },
  navButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});