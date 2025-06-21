import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import {
  MessageSquare,
  DollarSign,
  Calendar,
  Clock,
  Target,
  FileText,
  Send,
  Edit3,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Star,
  ArrowRight,
  ArrowLeft,
  History,
  CheckCircle2
} from 'lucide-react-native';
import { useOfferNegotiation } from '@/utils/offerNegotiationService';
import Toast from 'react-native-toast-message';

export interface NegotiationOffer {
  id: string;
  offerId: string;
  fromUserId: string;
  toUserId: string;
  fromUserType: 'creator' | 'marketer';
  toUserType: 'creator' | 'marketer';
  terms: {
    amount: number;
    deliverables: string[];
    timeline: number; // days
    revisions: number;
    exclusivity: boolean;
    usageRights: string;
    deadlines: Array<{
      milestone: string;
      date: Date;
      amount: number;
    }>;
    additionalTerms: string;
  };
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NegotiationHistory {
  id: string;
  action: 'offer' | 'counter' | 'accept' | 'reject' | 'message' | 'terms_change';
  userId: string;
  userType: 'creator' | 'marketer';
  data: any;
  timestamp: Date;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

interface OfferNegotiationProps {
  offerId: string;
  currentUserId: string;
  currentUserType: 'creator' | 'marketer';
  onOfferAccepted?: (offer: NegotiationOffer) => void;
  onOfferRejected?: (offer: NegotiationOffer) => void;
  onNegotiationComplete?: (finalOffer: NegotiationOffer) => void;
  readonly?: boolean;
  compact?: boolean;
}

export default function OfferNegotiation({
  offerId,
  currentUserId,
  currentUserType,
  onOfferAccepted,
  onOfferRejected,
  onNegotiationComplete,
  readonly = false,
  compact = false
}: OfferNegotiationProps) {
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingTerms, setEditingTerms] = useState<Partial<NegotiationOffer['terms']>>({});
  const [counterMessage, setCounterMessage] = useState('');
  const [selectedDeadlines, setSelectedDeadlines] = useState<Array<{
    milestone: string;
    date: string;
    amount: string;
  }>>([]);

  const {
    currentOffer,
    history,
    isLoading,
    error,
    sendCounterOffer,
    acceptOffer,
    rejectOffer,
    addNegotiationMessage,
    service
  } = useOfferNegotiation({
    offerId,
    currentUserId,
    currentUserType
  });

  // Initialize editing terms when current offer changes
  useEffect(() => {
    if (currentOffer) {
      setEditingTerms(currentOffer.terms);
      setSelectedDeadlines(
        currentOffer.terms.deadlines.map(d => ({
          milestone: d.milestone,
          date: d.date.toISOString().split('T')[0],
          amount: d.amount.toString()
        }))
      );
    }
  }, [currentOffer]);

  const handleAcceptOffer = async () => {
    if (!currentOffer) return;

    Alert.alert(
      'Accept Offer',
      'Are you sure you want to accept this offer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              await acceptOffer(currentOffer.id);
              onOfferAccepted?.(currentOffer);
              onNegotiationComplete?.(currentOffer);
              Toast.show({
                type: 'success',
                text1: 'Offer Accepted',
                text2: 'The offer has been accepted successfully',
                visibilityTime: 3000
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Accept Failed',
                text2: error.message || 'Failed to accept offer',
                visibilityTime: 4000
              });
            }
          }
        }
      ]
    );
  };

  const handleRejectOffer = async () => {
    if (!currentOffer) return;

    Alert.alert(
      'Reject Offer',
      'Are you sure you want to reject this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectOffer(currentOffer.id);
              onOfferRejected?.(currentOffer);
              Toast.show({
                type: 'success',
                text1: 'Offer Rejected',
                text2: 'The offer has been rejected',
                visibilityTime: 3000
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Reject Failed',
                text2: error.message || 'Failed to reject offer',
                visibilityTime: 4000
              });
            }
          }
        }
      ]
    );
  };

  const handleSendCounterOffer = async () => {
    if (!editingTerms || !currentOffer) return;

    // Validate required fields
    if (!editingTerms.amount || editingTerms.amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid offer amount',
        visibilityTime: 3000
      });
      return;
    }

    if (!editingTerms.timeline || editingTerms.timeline <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Timeline',
        text2: 'Please enter a valid timeline in days',
        visibilityTime: 3000
      });
      return;
    }

    try {
      const deadlines = selectedDeadlines.map(d => ({
        milestone: d.milestone,
        date: new Date(d.date),
        amount: parseFloat(d.amount) || 0
      }));

      const counterOfferData: Partial<NegotiationOffer> = {
        terms: {
          ...editingTerms,
          deadlines,
          deliverables: editingTerms.deliverables || [],
          amount: editingTerms.amount || 0,
          timeline: editingTerms.timeline || 0,
          revisions: editingTerms.revisions || 2,
          exclusivity: editingTerms.exclusivity || false,
          usageRights: editingTerms.usageRights || '',
          additionalTerms: editingTerms.additionalTerms || ''
        },
        message: counterMessage.trim()
      };

      await sendCounterOffer(counterOfferData);
      setShowCounterOffer(false);
      setCounterMessage('');
      
      Toast.show({
        type: 'success',
        text1: 'Counter Offer Sent',
        text2: 'Your counter offer has been sent successfully',
        visibilityTime: 3000
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Counter Offer Failed',
        text2: error.message || 'Failed to send counter offer',
        visibilityTime: 4000
      });
    }
  };

  const addDeadline = () => {
    setSelectedDeadlines([
      ...selectedDeadlines,
      { milestone: '', date: '', amount: '' }
    ]);
  };

  const updateDeadline = (index: number, field: string, value: string) => {
    const updated = [...selectedDeadlines];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedDeadlines(updated);
  };

  const removeDeadline = (index: number) => {
    setSelectedDeadlines(selectedDeadlines.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'countered': return '#3B82F6';
      case 'expired': return '#6B7280';
      default: return '#430B92';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#430B92';
    }
  };

  const renderCurrentOffer = () => {
    if (!currentOffer) return null;

    return (
      <View style={[styles.offerCard, compact && styles.offerCardCompact]}>
        <View style={styles.offerHeader}>
          <View style={styles.offerStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(currentOffer.status) }
            ]}>
              <Text style={styles.statusText}>
                {currentOffer.status.charAt(0).toUpperCase() + currentOffer.status.slice(1)}
              </Text>
            </View>
            
            <View style={[
              styles.priorityBadge,
              { borderColor: getPriorityColor(currentOffer.priority) }
            ]}>
              <Text style={[
                styles.priorityText,
                { color: getPriorityColor(currentOffer.priority) }
              ]}>
                {currentOffer.priority.toUpperCase()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setShowHistory(true)}
          >
            <History width={16} height={16} color="#430B92" />
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.offerDetails}>
          <View style={styles.offerAmount}>
            <DollarSign width={20} height={20} color="#10B981" />
            <Text style={styles.amountText}>
              ${service.formatCurrency(currentOffer.terms.amount)}
            </Text>
          </View>

          <View style={styles.offerMeta}>
            <View style={styles.metaItem}>
              <Clock width={16} height={16} color="#6B7280" />
              <Text style={styles.metaText}>{currentOffer.terms.timeline} days</Text>
            </View>

            <View style={styles.metaItem}>
              <Target width={16} height={16} color="#6B7280" />
              <Text style={styles.metaText}>{currentOffer.terms.revisions} revisions</Text>
            </View>

            {currentOffer.terms.exclusivity && (
              <View style={styles.metaItem}>
                <Star width={16} height={16} color="#F59E0B" />
                <Text style={styles.metaText}>Exclusive</Text>
              </View>
            )}
          </View>
        </View>

        {currentOffer.message && (
          <View style={styles.offerMessage}>
            <MessageSquare width={16} height={16} color="#430B92" />
            <Text style={styles.messageText}>{currentOffer.message}</Text>
          </View>
        )}

        {!compact && currentOffer.terms.deliverables.length > 0 && (
          <View style={styles.deliverables}>
            <Text style={styles.deliverablesTitle}>Deliverables:</Text>
            {currentOffer.terms.deliverables.map((deliverable, index) => (
              <Text key={index} style={styles.deliverableItem}>
                • {deliverable}
              </Text>
            ))}
          </View>
        )}

        {!compact && currentOffer.terms.deadlines.length > 0 && (
          <View style={styles.deadlines}>
            <Text style={styles.deadlinesTitle}>Milestones:</Text>
            {currentOffer.terms.deadlines.map((deadline, index) => (
              <View key={index} style={styles.deadlineItem}>
                <Text style={styles.deadlineMilestone}>{deadline.milestone}</Text>
                <Text style={styles.deadlineDate}>
                  {deadline.date.toLocaleDateString()} - ${service.formatCurrency(deadline.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {currentOffer.expiresAt && (
          <View style={styles.expiration}>
            <AlertCircle width={14} height={14} color="#F59E0B" />
            <Text style={styles.expirationText}>
              Expires: {currentOffer.expiresAt.toLocaleDateString()} at {currentOffer.expiresAt.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderActionButtons = () => {
    if (readonly || !currentOffer || currentOffer.status !== 'pending') return null;

    const isMyOffer = currentOffer.fromUserId === currentUserId;
    
    if (isMyOffer) {
      return (
        <View style={styles.actionContainer}>
          <Text style={styles.waitingText}>Waiting for response...</Text>
        </View>
      );
    }

    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleRejectOffer}
        >
          <X width={16} height={16} color="#FFFFFF" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.counterButton]}
          onPress={() => setShowCounterOffer(true)}
        >
          <ArrowLeft width={16} height={16} color="#430B92" />
          <Text style={styles.counterButtonText}>Counter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAcceptOffer}
        >
          <Check width={16} height={16} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCounterOfferModal = () => (
    <Modal
      visible={showCounterOffer}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCounterOffer(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCounterOffer(false)}>
            <X width={24} height={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Send Counter Offer</Text>
          <TouchableOpacity
            onPress={handleSendCounterOffer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#430B92" />
            ) : (
              <Send width={24} height={24} color="#430B92" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Offer Amount</Text>
            <View style={styles.amountInput}>
              <DollarSign width={20} height={20} color="#6B7280" />
              <TextInput
                style={styles.amountInputText}
                value={editingTerms.amount?.toString() || ''}
                onChangeText={(text) => setEditingTerms(prev => ({
                  ...prev,
                  amount: parseFloat(text) || 0
                }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Timeline (Days)</Text>
            <View style={styles.inputWithIcon}>
              <Clock width={20} height={20} color="#6B7280" />
              <TextInput
                style={styles.inputText}
                value={editingTerms.timeline?.toString() || ''}
                onChangeText={(text) => setEditingTerms(prev => ({
                  ...prev,
                  timeline: parseInt(text) || 0
                }))}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Revisions */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Revisions</Text>
            <TextInput
              style={styles.input}
              value={editingTerms.revisions?.toString() || ''}
              onChangeText={(text) => setEditingTerms(prev => ({
                ...prev,
                revisions: parseInt(text) || 0
              }))}
              placeholder="2"
              keyboardType="numeric"
            />
          </View>

          {/* Exclusivity */}
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Exclusive Rights</Text>
              <Switch
                value={editingTerms.exclusivity || false}
                onValueChange={(value) => setEditingTerms(prev => ({
                  ...prev,
                  exclusivity: value
                }))}
                trackColor={{ false: '#E5E7EB', true: '#430B92' }}
                thumbColor={editingTerms.exclusivity ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* Usage Rights */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usage Rights</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editingTerms.usageRights || ''}
              onChangeText={(text) => setEditingTerms(prev => ({
                ...prev,
                usageRights: text
              }))}
              placeholder="Describe usage rights and restrictions..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Deadlines */}
          <View style={styles.inputGroup}>
            <View style={styles.labelWithAction}>
              <Text style={styles.inputLabel}>Project Milestones</Text>
              <TouchableOpacity style={styles.addButton} onPress={addDeadline}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            
            {selectedDeadlines.map((deadline, index) => (
              <View key={index} style={styles.deadlineInputContainer}>
                <TextInput
                  style={[styles.input, styles.deadlineInput]}
                  value={deadline.milestone}
                  onChangeText={(text) => updateDeadline(index, 'milestone', text)}
                  placeholder="Milestone name"
                />
                <TextInput
                  style={[styles.input, styles.deadlineInput]}
                  value={deadline.date}
                  onChangeText={(text) => updateDeadline(index, 'date', text)}
                  placeholder="YYYY-MM-DD"
                />
                <TextInput
                  style={[styles.input, styles.deadlineInput]}
                  value={deadline.amount}
                  onChangeText={(text) => updateDeadline(index, 'amount', text)}
                  placeholder="Amount"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.removeDeadlineButton}
                  onPress={() => removeDeadline(index)}
                >
                  <X width={16} height={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Additional Terms */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Terms</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editingTerms.additionalTerms || ''}
              onChangeText={(text) => setEditingTerms(prev => ({
                ...prev,
                additionalTerms: text
              }))}
              placeholder="Any additional terms or requirements..."
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Counter Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={counterMessage}
              onChangeText={setCounterMessage}
              placeholder="Explain your counter offer..."
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderHistoryModal = () => (
    <Modal
      visible={showHistory}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowHistory(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowHistory(false)}>
            <X width={24} height={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Negotiation History</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {history.map((item, index) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyAction}>
                  {item.action.charAt(0).toUpperCase() + item.action.slice(1).replace('_', ' ')}
                </Text>
                <Text style={styles.historyTimestamp}>
                  {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              
              <Text style={styles.historyUser}>
                {item.userType === currentUserType ? 'You' : `${item.userType.charAt(0).toUpperCase() + item.userType.slice(1)}`}
              </Text>

              {item.changes && item.changes.length > 0 && (
                <View style={styles.historyChanges}>
                  {item.changes.map((change, changeIndex) => (
                    <Text key={changeIndex} style={styles.historyChange}>
                      {change.field}: {change.oldValue} → {change.newValue}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  if (isLoading && !currentOffer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>Loading negotiation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle width={24} height={24} color="#EF4444" />
        <Text style={styles.errorTitle}>Negotiation Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {renderCurrentOffer()}
      {renderActionButtons()}
      {renderCounterOfferModal()}
      {renderHistoryModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  containerCompact: {
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
    minHeight: 200,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  offerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  offerCardCompact: {
    padding: 12,
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyButtonText: {
    fontSize: 12,
    color: '#430B92',
    fontWeight: '500',
  },
  offerDetails: {
    marginBottom: 12,
  },
  offerAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  offerMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  offerMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  deliverables: {
    marginBottom: 12,
  },
  deliverablesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  deliverableItem: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  deadlines: {
    marginBottom: 12,
  },
  deadlinesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  deadlineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  deadlineMilestone: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  deadlineDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  expiration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  expirationText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  waitingText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  counterButton: {
    borderWidth: 1,
    borderColor: '#430B92',
    backgroundColor: '#FFFFFF',
  },
  counterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#430B92',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  amountInputText: {
    flex: 1,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
  inputText: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '500',
    color: '#FFFFFF',
  },
  deadlineInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  deadlineInput: {
    flex: 1,
    padding: 8,
    fontSize: 14,
  },
  removeDeadlineButton: {
    padding: 8,
  },
  historyItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#430B92',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyUser: {
    fontSize: 12,
    color: '#430B92',
    fontWeight: '500',
    marginBottom: 8,
  },
  historyChanges: {
    gap: 4,
  },
  historyChange: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
});