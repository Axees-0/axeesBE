import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { DemoData } from '@/demo/DemoData';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'funded' | 'in_progress' | 'submitted' | 'approved' | 'completed' | 'cancelled';
  dueDate: string;
  deliverables: string[];
  workSubmitted?: {
    content: string;
    submittedAt: string;
    files?: string[];
  };
  approvalNotes?: string;
}

interface Deal {
  id: string;
  offerTitle: string;
  creator: {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
  };
  marketer: {
    id: string;
    name: string;
    company: string;
  };
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  milestones: Milestone[];
  createdAt: string;
  platform: string;
}

const DealDetailPage: React.FC = () => {
  const { id } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [milestoneStatuses, setMilestoneStatuses] = useState<{[key: string]: string}>({});
  const { user } = useAuth();

  // Demo deal data mapping
  const getDealData = (dealId: string) => {
    const dealMappings: { [key: string]: Partial<Deal> } = {
      'OFF-123456': {
        offerTitle: 'Social Media Post Campaign',
        creator: { id: 'creator-001', name: 'Emma Thompson', handle: '@emmastyle' },
        totalAmount: 500,
        platform: 'Instagram',
      },
      'OFF-789012': {
        offerTitle: 'YouTube Video Review',
        creator: { id: 'creator-002', name: 'Marcus Johnson', handle: '@techmarc' },
        totalAmount: 1200,
        platform: 'YouTube',
      },
      'OFF-345678': {
        offerTitle: 'Custom Fitness Campaign',
        creator: { id: 'creator-003', name: 'Sofia Rodriguez', handle: '@sofiafit' },
        totalAmount: 800,
        platform: 'Instagram',
      },
      'OFF-901234': {
        offerTitle: 'Instagram Story Series',
        creator: { id: 'creator-004', name: 'Jake Miller', handle: '@jakeeats' },
        totalAmount: 750,
        platform: 'Instagram',
      },
    };
    
    return dealMappings[dealId] || dealMappings['OFF-123456']; // fallback
  };

  const dealData = getDealData(id as string);

  // Helper function to get current milestone status
  const getMilestoneStatus = (milestone: Milestone) => {
    return milestoneStatuses[milestone.id] || milestone.status;
  };

  // Demo deal data
  const deal: Deal = useMemo(() => ({
    id: id as string,
    offerTitle: dealData.offerTitle || 'Instagram Post Campaign - Summer Collection',
    creator: dealData.creator || {
      id: 'creator-001',
      name: 'Emma Thompson',
      handle: '@emmastyle',
    },
    marketer: {
      id: 'marketer-001',
      name: 'Sarah Martinez',
      company: 'TechStyle Brand',
    },
    totalAmount: dealData.totalAmount || 1700,
    status: 'active',
    platform: dealData.platform || 'Instagram',
    createdAt: '2024-06-18',
    milestones: [
      {
        id: 'milestone-1',
        title: 'Content Creation Setup',
        description: 'Plan content strategy and create initial draft concepts',
        amount: 500,
        status: 'pending',
        dueDate: '2024-06-25',
        deliverables: ['Content strategy document', 'Initial photo concepts', 'Caption drafts'],
      },
      {
        id: 'milestone-2',
        title: 'Content Creation',
        description: 'Create Instagram post showcasing summer collection with professional photos',
        amount: 750,
        status: 'pending',
        dueDate: '2024-06-28',
        deliverables: ['Instagram post draft', 'High-quality photos', 'Caption with hashtags'],
      },
      {
        id: 'milestone-3',
        title: 'Content Publishing',
        description: 'Publish approved content and provide posting proof',
        amount: 450,
        status: 'pending',
        dueDate: '2024-07-02',
        deliverables: ['Published Instagram post', 'Screenshots of post', 'Performance metrics after 24h'],
      }
    ]
  }), [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#6B7280';
      case 'funded': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'submitted': return '#8B5CF6';
      case 'approved': return '#10B981';
      case 'completed': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Setup';
      case 'funded': return 'Funded';
      case 'in_progress': return 'Work In Progress';
      case 'submitted': return 'Submitted for Review';
      case 'approved': return 'Approved';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleMilestoneAction = (milestoneId: string, action: string) => {
    console.log('handleMilestoneAction called:', milestoneId, action);
    const milestone = deal.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      console.log('Milestone not found:', milestoneId);
      return;
    }

    switch (action) {
      case 'fund':
        // Use web-compatible confirmation
        const isWeb = Platform.OS === 'web';
        const confirmed = isWeb 
          ? window.confirm(`Fund ${milestone.title} for $${milestone.amount}?`)
          : true; // Will show Alert.alert for mobile
        
        if (!confirmed && isWeb) return;
        
        if (!isWeb) {
          Alert.alert(
            'Fund Milestone', 
            `Fund ${milestone.title} for $${milestone.amount}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Fund', 
                onPress: () => handleFunding(milestoneId, milestone)
              }
            ]
          );
        } else {
          handleFunding(milestoneId, milestone);
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleFunding = async (milestoneId: string, milestone: Milestone) => {
    try {
      // Update milestone status (FUND_MILESTONE -> MilestoneFunded)
      setMilestoneStatuses(prev => ({
        ...prev,
        [milestoneId]: 'funded'
      }));
      
      // Send notification to creator (NOTIFY_C) - with error handling
      try {
        await notificationService.notifyCreator(deal.creator.id, {
          type: 'deal',
          title: 'Milestone Funded!',
          message: `${deal.marketer.name} funded the milestone "${milestone.title}" ($${milestone.amount})`,
          actionType: 'view_deal',
          actionParams: { dealId: deal.id }
        });
      } catch (notifError) {
        console.log('Notification error (non-critical):', notifError);
      }
      
      // Use web-compatible success message
      const isWeb = Platform.OS === 'web';
      if (isWeb) {
        const openChat = window.confirm('Milestone funded successfully! The creator has been notified and can start working.\n\nOpen chat?');
        if (openChat) {
          const otherParty = user?.userType === 'creator' ? deal.marketer : deal.creator;
          const chatId = `chat-${deal.id}`;
          
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: chatId,
              dealId: deal.id,
              otherUserId: otherParty.id,
              otherUserName: otherParty.name,
            }
          });
        }
      } else {
        Alert.alert(
          'Success', 
          'Milestone funded successfully! The creator has been notified and can start working.',
          [
            {
              text: 'Open Chat',
              onPress: () => {
                const otherParty = user?.userType === 'creator' ? deal.marketer : deal.creator;
                const chatId = `chat-${deal.id}`;
                
                router.push({
                  pathname: '/chat/[id]',
                  params: {
                    id: chatId,
                    dealId: deal.id,
                    otherUserId: otherParty.id,
                    otherUserName: otherParty.name,
                  }
                });
              }
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error funding milestone:', error);
      const isWeb = Platform.OS === 'web';
      if (isWeb) {
        window.alert('Failed to fund milestone. Please try again.');
      } else {
        Alert.alert(
          'Error',
          'Failed to fund milestone. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const renderMilestone = (milestone: Milestone, index: number) => (
    <View key={milestone.id} style={styles.milestoneCard}>
      <View style={styles.milestoneHeader}>
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneTitle}>{milestone.title}</Text>
          <Text style={styles.milestoneDescription}>{milestone.description}</Text>
          <Text style={styles.milestoneDue}>Due: {new Date(milestone.dueDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.milestoneStatus}>
          <Text style={styles.milestoneAmount}>${milestone.amount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(getMilestoneStatus(milestone)) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(getMilestoneStatus(milestone)) }]}>
              {getStatusLabel(getMilestoneStatus(milestone))}
            </Text>
          </View>
        </View>
      </View>

      {/* Deliverables */}
      <View style={styles.deliverablesSection}>
        <Text style={styles.sectionTitle}>Deliverables:</Text>
        {milestone.deliverables.map((deliverable, idx) => (
          <Text key={idx} style={styles.deliverableItem}>• {deliverable}</Text>
        ))}
      </View>

      {/* Work Submission */}
      {milestone.workSubmitted && (
        <View style={styles.workSubmissionSection}>
          <Text style={styles.sectionTitle}>Submitted Work:</Text>
          <Text style={styles.submissionContent}>{milestone.workSubmitted.content}</Text>
          <Text style={styles.submissionDate}>
            Submitted: {new Date(milestone.workSubmitted.submittedAt).toLocaleDateString()}
          </Text>
          {milestone.workSubmitted.files && (
            <View style={styles.filesSection}>
              <Text style={styles.filesTitle}>Attached Files:</Text>
              {milestone.workSubmitted.files.map((file, idx) => (
                <Text key={idx} style={styles.fileName}>📎 {file}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.milestoneActions}>
        {getMilestoneStatus(milestone) === 'pending' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              console.log('🚀 Fund button pressed for milestone:', milestone.id);
              console.log('🔍 Milestone status:', getMilestoneStatus(milestone));
              console.log('🎯 About to call handleMilestoneAction');
              handleMilestoneAction(milestone.id, 'fund');
            }}
          >
            <Text style={styles.actionButtonText}>Fund Milestone</Text>
          </TouchableOpacity>
        )}

        {getMilestoneStatus(milestone) === 'funded' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleMilestoneAction(milestone.id, 'submit_work')}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Submit Work</Text>
          </TouchableOpacity>
        )}

        {getMilestoneStatus(milestone) === 'submitted' && (
          <View style={styles.reviewActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleMilestoneAction(milestone.id, 'approve')}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleMilestoneAction(milestone.id, 'request_revision')}
            >
              <Text style={styles.actionButtonText}>Request Revision</Text>
            </TouchableOpacity>
          </View>
        )}

        {getMilestoneStatus(milestone) === 'approved' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.proofButton]}
            onPress={() => handleMilestoneAction(milestone.id, 'upload_proof')}
          >
            <Text style={styles.actionButtonText}>Upload Proof</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <WebSEO 
        title={`Deal: ${deal.offerTitle} | Axees`}
        description="Manage deal milestones and track progress"
        keywords="deal management, milestones, creator collaboration"
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
          
          <Text style={styles.headerTitle}>Deal Details</Text>
          
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => {
              // Navigate to chat with the other party
              const otherParty = user?.userType === 'creator' ? deal.marketer : deal.creator;
              const chatId = `chat-${deal.id}`;
              
              router.push({
                pathname: '/chat/[id]',
                params: {
                  id: chatId,
                  dealId: deal.id,
                  otherUserId: otherParty.id,
                  otherUserName: otherParty.name,
                }
              });
            }}
          >
            <Text style={styles.messageButtonText}>💬</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Deal Overview */}
          <View style={styles.dealOverview}>
            <Text style={styles.dealTitle}>{deal.offerTitle}</Text>
            
            <View style={styles.dealParties}>
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Creator</Text>
                <Text style={styles.partyName}>{deal.creator.name}</Text>
                <Text style={styles.partyHandle}>{deal.creator.handle}</Text>
              </View>
              
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Marketer</Text>
                <Text style={styles.partyName}>{deal.marketer.name}</Text>
                <Text style={styles.partyCompany}>{deal.marketer.company}</Text>
              </View>
            </View>

            <View style={styles.dealMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Total Value</Text>
                <Text style={styles.metaValue}>${deal.totalAmount.toLocaleString()}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Platform</Text>
                <Text style={styles.metaValue}>{deal.platform}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deal.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(deal.status) }]}>
                    {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Milestones */}
          <View style={styles.milestonesSection}>
            <Text style={styles.sectionHeader}>Project Milestones</Text>
            {deal.milestones.map((milestone, index) => renderMilestone(milestone, index))}
          </View>

          {/* Progress Summary */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionHeader}>Progress Summary</Text>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressValue}>
                  {deal.milestones.filter(m => m.status === 'completed').length}/{deal.milestones.length}
                </Text>
                <Text style={styles.progressLabel}>Milestones Completed</Text>
              </View>
              
              <View style={styles.progressStat}>
                <Text style={styles.progressValue}>
                  ${deal.milestones.filter(m => ['completed', 'approved'].includes(m.status))
                    .reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                </Text>
                <Text style={styles.progressLabel}>Amount Earned</Text>
              </View>
            </View>
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
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  messageButton: {
    padding: 8,
  },
  messageButtonText: {
    fontSize: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  dealOverview: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dealTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  dealParties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  partyInfo: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 2,
  },
  partyHandle: {
    fontSize: 14,
    color: '#666',
  },
  partyCompany: {
    fontSize: 14,
    color: '#666',
  },
  dealMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
  },
  milestonesSection: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 16,
  },
  milestoneCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
    marginRight: 16,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  milestoneDue: {
    fontSize: 12,
    color: '#999',
  },
  milestoneStatus: {
    alignItems: 'flex-end',
  },
  milestoneAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deliverablesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 6,
  },
  deliverableItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  workSubmissionSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submissionContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  submissionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  filesSection: {
    marginTop: 8,
  },
  filesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  milestoneActions: {
    marginTop: 8,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#6B7280',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  proofButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  progressSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default DealDetailPage;