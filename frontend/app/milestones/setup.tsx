import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import UniversalBackButton from '@/components/UniversalBackButton';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  deliverables: string[];
}

const MilestoneSetupWizard: React.FC = () => {
  const { dealId, totalAmount, offerTitle } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: 'milestone-1',
      title: 'Content Creation',
      description: 'Create and prepare content according to requirements',
      amount: Number(totalAmount) * 0.5,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliverables: ['Content draft', 'Visual assets']
    },
    {
      id: 'milestone-2', 
      title: 'Publication & Proof',
      description: 'Publish content and provide proof of completion',
      amount: Number(totalAmount) * 0.5,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliverables: ['Published content', 'Performance metrics', 'Proof of posting']
    }
  ]);

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `milestone-${milestones.length + 1}`,
      title: 'New Milestone',
      description: 'Description of milestone requirements',
      amount: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliverables: ['Deliverable item']
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateDeliverable = (milestoneIndex: number, deliverableIndex: number, value: string) => {
    const updated = [...milestones];
    updated[milestoneIndex].deliverables[deliverableIndex] = value;
    setMilestones(updated);
  };

  const addDeliverable = (milestoneIndex: number) => {
    const updated = [...milestones];
    updated[milestoneIndex].deliverables.push('New deliverable');
    setMilestones(updated);
  };

  const validateMilestones = () => {
    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const dealAmount = Number(totalAmount);
    
    if (Math.abs(totalMilestoneAmount - dealAmount) > 0.01) {
      if (isWeb) {
        window.alert(`Milestone amounts ($${totalMilestoneAmount}) must equal deal total ($${dealAmount})`);
      } else {
        Alert.alert('Amount Mismatch', `Milestone amounts ($${totalMilestoneAmount}) must equal deal total ($${dealAmount})`);
      }
      return false;
    }

    for (const milestone of milestones) {
      if (!milestone.title.trim() || !milestone.description.trim()) {
        if (isWeb) {
          window.alert('All milestones must have a title and description');
        } else {
          Alert.alert('Missing Information', 'All milestones must have a title and description');
        }
        return false;
      }
      if (milestone.amount <= 0) {
        if (isWeb) {
          window.alert('All milestones must have a positive amount');
        } else {
          Alert.alert('Invalid Amount', 'All milestones must have a positive amount');
        }
        return false;
      }
      if (milestone.deliverables.length === 0 || milestone.deliverables.some(d => !d.trim())) {
        if (isWeb) {
          window.alert('All milestones must have at least one deliverable');
        } else {
          Alert.alert('Missing Deliverables', 'All milestones must have at least one deliverable');
        }
        return false;
      }
    }
    
    return true;
  };

  const handleCreateMilestones = async () => {
    if (!validateMilestones()) return;

    if (isWeb) {
      const confirmed = window.confirm(
        `Create ${milestones.length} milestones for this deal?`
      );
      if (!confirmed) return;
    } else {
      // Show confirmation dialog for mobile
      const confirmResult = await new Promise((resolve) => {
        Alert.alert(
          'Create Milestones',
          `Create ${milestones.length} milestones for this deal?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Create Deal', onPress: () => resolve(true) }
          ]
        );
      });
      
      if (!confirmResult) return;
    }

    try {
      // Create milestone payment structure via API
      const response = await fetch('/api/milestone-payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: JSON.stringify({
          dealId: dealId,
          milestones: milestones.map(milestone => ({
            title: milestone.title,
            description: milestone.description,
            percentage: (milestone.amount / Number(totalAmount)) * 100,
            dueDate: milestone.dueDate,
            requirements: milestone.deliverables
          }))
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Milestones Created!',
          'Your milestone payment structure has been created successfully.',
          [
            { 
              text: 'View Deal', 
              onPress: () => router.replace({
                pathname: '/deals/[id]',
                params: { 
                  id: dealId,
                  milestonesSetup: 'true'
                }
              })
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create milestones. Please try again.');
      }
    } catch (error) {
      console.error('Error creating milestones:', error);
      Alert.alert('Error', 'Failed to create milestones. Please check your connection and try again.');
    }
  };

  return (
    <>
      <WebSEO 
        title={`Setup Milestones - ${offerTitle} | Axees`}
        description="Configure deal milestones and deliverables"
        keywords="milestones, deal management, deliverables"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/deals" />
          <Text style={styles.headerTitle}>Setup Milestones</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Deal Info */}
            <View style={styles.dealInfo}>
              <Text style={styles.dealTitle}>{offerTitle}</Text>
              <Text style={styles.dealAmount}>Total Amount: ${totalAmount}</Text>
              <Text style={styles.infoText}>
                Break down your deal into milestones to ensure smooth delivery and payment.
              </Text>
            </View>

            {/* Milestones */}
            {milestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneNumber}>Milestone {index + 1}</Text>
                  {milestones.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeMilestone(index)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.textInput}
                    value={milestone.title}
                    onChangeText={(value) => updateMilestone(index, 'title', value)}
                    placeholder="Milestone title"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={milestone.description}
                    onChangeText={(value) => updateMilestone(index, 'description', value)}
                    placeholder="Describe what needs to be completed"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Amount ($)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={milestone.amount.toString()}
                      onChangeText={(value) => updateMilestone(index, 'amount', parseFloat(value) || 0)}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Due Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={milestone.dueDate}
                      onChangeText={(value) => updateMilestone(index, 'dueDate', value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Deliverables</Text>
                  {milestone.deliverables.map((deliverable, dIndex) => (
                    <View key={dIndex} style={styles.deliverableRow}>
                      <TextInput
                        style={[styles.textInput, styles.deliverableInput]}
                        value={deliverable}
                        onChangeText={(value) => updateDeliverable(index, dIndex, value)}
                        placeholder="Deliverable item"
                      />
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addDeliverableButton}
                    onPress={() => addDeliverable(index)}
                  >
                    <Text style={styles.addDeliverableText}>+ Add Deliverable</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Add Milestone Button */}
            <TouchableOpacity style={styles.addMilestoneButton} onPress={addMilestone}>
              <Text style={styles.addMilestoneText}>+ Add Another Milestone</Text>
            </TouchableOpacity>

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>
                Total Milestones: {milestones.length}
              </Text>
              <Text style={styles.summaryText}>
                Total Amount: ${milestones.reduce((sum, m) => sum + m.amount, 0).toFixed(2)}
              </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity style={styles.createButton} onPress={handleCreateMilestones}>
              <Text style={styles.createButtonText}>Create Deal with Milestones</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
    justifyContent: 'space-between',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  dealInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  dealAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  milestoneCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee',
  },
  removeText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  deliverableRow: {
    marginBottom: 8,
  },
  deliverableInput: {
    marginBottom: 0,
  },
  addDeliverableButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  addDeliverableText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontWeight: '500',
  },
  addMilestoneButton: {
    borderWidth: 2,
    borderColor: Color.cSK430B92500,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  addMilestoneText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  createButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MilestoneSetupWizard;