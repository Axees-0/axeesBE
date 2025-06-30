import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Color } from '@/GlobalStyles';
import { BrandColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

interface CompletionSection {
  completed: boolean;
  required: boolean;
  weight: number;
  items: Array<{
    field: string;
    completed: boolean;
    label: string;
  }>;
}

interface CompletionData {
  completionPercentage: number;
  completionChecks: {
    basicInfo: CompletionSection;
    profileDetails: CompletionSection;
    socialLinks: CompletionSection;
    accountSetup: CompletionSection;
    paymentSetup: CompletionSection;
  };
  missingRequired: number;
  nextAction?: {
    type: string;
    message: string;
    field: string;
    section: string;
  };
  isProfileComplete: boolean;
}

interface ProfileCompletionProps {
  onFieldUpdate?: (field: string, value: any, section?: string) => void;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ onFieldUpdate }) => {
  const { user } = useAuth();
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletionStatus();
  }, []);

  const fetchCompletionStatus = async () => {
    try {
      const response = await fetch('/api/profile-completion/status', {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setCompletionData(result.data);
      } else {
        console.error('Failed to fetch completion status:', result.message);
      }
    } catch (error) {
      console.error('Error fetching completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileField = async (field: string, value: any, section?: string) => {
    if (!field || value === undefined) return;

    setUpdating(field);
    
    try {
      const response = await fetch('/api/profile-completion/update-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: JSON.stringify({
          field,
          value,
          section,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local completion data
        setCompletionData(result.data.completion);
        
        // Call parent callback if provided
        if (onFieldUpdate) {
          onFieldUpdate(field, value, section);
        }

        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile field:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const handleQuickUpdate = (item: any, section: string) => {
    let value: any = '';
    
    switch (item.field) {
      case 'bio':
        Alert.prompt(
          'Update Bio',
          'Enter your bio/description:',
          (text) => {
            if (text && text.trim()) {
              updateProfileField(item.field, text.trim());
            }
          },
          'plain-text',
          ''
        );
        break;
        
      case 'location':
        Alert.prompt(
          'Update Location',
          'Enter your location:',
          (text) => {
            if (text && text.trim()) {
              updateProfileField(item.field, text.trim());
            }
          },
          'plain-text',
          ''
        );
        break;
        
      case 'instagram':
      case 'tiktok':
      case 'youtube':
      case 'twitter':
        Alert.prompt(
          `Update ${item.label}`,
          `Enter your ${item.label} profile URL or username:`,
          (text) => {
            if (text && text.trim()) {
              updateProfileField(item.field, text.trim(), 'socialLinks');
            }
          },
          'plain-text',
          ''
        );
        break;
        
      default:
        Alert.alert('Update Required', `Please update your ${item.label} in account settings.`);
    }
  };

  const markSetupComplete = async () => {
    if (!completionData?.isProfileComplete) {
      Alert.alert('Profile Incomplete', 'Please complete all required fields before marking setup as complete.');
      return;
    }

    try {
      const response = await fetch('/api/profile-completion/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Setup Complete!', 'Your profile setup is now complete. Welcome to Axees!');
        fetchCompletionStatus(); // Refresh data
      } else {
        Alert.alert('Error', result.message || 'Failed to mark setup as complete');
      }
    } catch (error) {
      console.error('Error marking setup complete:', error);
      Alert.alert('Error', 'Failed to mark setup as complete. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.cSK430B92500} />
        <Text style={styles.loadingText}>Loading profile completion...</Text>
      </View>
    );
  }

  if (!completionData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile completion data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCompletionStatus}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return BrandColors.semantic.error;
    if (percentage < 80) return BrandColors.semantic.warning;
    return BrandColors.semantic.success;
  };

  return (
    <View style={styles.container}>
      {/* Progress Overview */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Profile Completion</Text>
          <Text style={[styles.progressPercentage, { color: getProgressColor(completionData.completionPercentage) }]}>
            {completionData.completionPercentage}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${completionData.completionPercentage}%`,
                  backgroundColor: getProgressColor(completionData.completionPercentage)
                }
              ]} 
            />
          </View>
        </View>

        {completionData.nextAction && (
          <View style={styles.nextActionContainer}>
            <Text style={styles.nextActionLabel}>Next: </Text>
            <Text style={styles.nextActionText}>{completionData.nextAction.message}</Text>
          </View>
        )}
      </View>

      {/* Required Items */}
      {completionData.missingRequired > 0 && (
        <View style={styles.requiredSection}>
          <Text style={styles.sectionTitle}>Required Items ({completionData.missingRequired})</Text>
          
          {Object.entries(completionData.completionChecks).map(([sectionKey, section]) => {
            if (!section.required || section.completed) return null;
            
            return (
              <View key={sectionKey} style={styles.sectionCard}>
                <Text style={styles.sectionName}>{getSectionDisplayName(sectionKey)}</Text>
                
                {section.items.map((item, index) => {
                  if (item.completed) return null;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.itemRow}
                      onPress={() => handleQuickUpdate(item, sectionKey)}
                      disabled={updating === item.field}
                    >
                      <View style={styles.itemInfo}>
                        <View style={[styles.itemStatus, { backgroundColor: BrandColors.semantic.error }]} />
                        <Text style={styles.itemLabel}>{item.label}</Text>
                      </View>
                      
                      {updating === item.field ? (
                        <ActivityIndicator size="small" color={Color.cSK430B92500} />
                      ) : (
                        <Text style={styles.updateButton}>Update</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      {/* Optional Items */}
      <View style={styles.optionalSection}>
        <Text style={styles.sectionTitle}>Optional Items</Text>
        
        {Object.entries(completionData.completionChecks).map(([sectionKey, section]) => {
          if (section.required) return null;
          
          const incompleteItems = section.items.filter(item => !item.completed);
          if (incompleteItems.length === 0) return null;
          
          return (
            <View key={sectionKey} style={styles.sectionCard}>
              <Text style={styles.sectionName}>{getSectionDisplayName(sectionKey)}</Text>
              
              {incompleteItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.itemRow}
                  onPress={() => handleQuickUpdate(item, sectionKey)}
                  disabled={updating === item.field}
                >
                  <View style={styles.itemInfo}>
                    <View style={[styles.itemStatus, { backgroundColor: BrandColors.semantic.warning }]} />
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  
                  {updating === item.field ? (
                    <ActivityIndicator size="small" color={Color.cSK430B92500} />
                  ) : (
                    <Text style={styles.updateButton}>Add</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </View>

      {/* Complete Setup Button */}
      {completionData.isProfileComplete && (
        <TouchableOpacity style={styles.completeButton} onPress={markSetupComplete}>
          <Text style={styles.completeButtonText}>Mark Setup as Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const getSectionDisplayName = (sectionKey: string): string => {
  switch (sectionKey) {
    case 'basicInfo': return 'Basic Information';
    case 'profileDetails': return 'Profile Details';
    case 'socialLinks': return 'Social Media Links';
    case 'accountSetup': return 'Account Setup';
    case 'paymentSetup': return 'Payment Setup';
    default: return sectionKey;
  }
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: BrandColors.neutral[500],
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 14,
    color: BrandColors.semantic.error,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Color.cSK430B92500,
    borderRadius: 6,
  },
  retryButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 14,
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: BrandColors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextActionLabel: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    fontWeight: '500',
  },
  nextActionText: {
    fontSize: 12,
    color: Color.cSK430B92500,
    fontWeight: '500',
  },
  requiredSection: {
    marginBottom: 16,
  },
  optionalSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.neutral[700],
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  itemLabel: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  updateButton: {
    fontSize: 12,
    color: Color.cSK430B92500,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completeButton: {
    backgroundColor: Color.cSK430B92500,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    color: BrandColors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileCompletion;