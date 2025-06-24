import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { Color, Focus } from '@/GlobalStyles';
import { useAuth } from '@/contexts/AuthContext';

interface SmartBlastProps {
  creators: any[];
  filters: any;
}

interface BlastTab {
  id: number;
  name: string;
  creators: any[];
  status: 'ready' | 'sending' | 'completed' | 'failed';
  sentCount: number;
  responseCount: number;
}

export const SmartBlast: React.FC<SmartBlastProps> = ({ creators, filters }) => {
  const { user } = useAuth();
  const [selectedCreators, setSelectedCreators] = useState<any[]>([]);
  const [blastTabs, setBlastTabs] = useState<BlastTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [offerTemplate, setOfferTemplate] = useState('');
  
  // Mock wallet balance - in real app this would come from user context
  const walletBalance = 45600; // $45,600 for demo
  const minimumBalance = 10000; // $10,000 minimum for Smart Blast

  useEffect(() => {
    if (creators.length > 0) {
      generateBlastTabs();
    }
  }, [creators]);

  const generateBlastTabs = () => {
    setIsGenerating(true);
    
    // Simulate processing time
    setTimeout(() => {
      const tabs: BlastTab[] = [];
      const totalCreators = Math.min(creators.length, 100000); // Max 100k
      const creatorsPerTab = 1000;
      const numberOfTabs = Math.ceil(totalCreators / creatorsPerTab);
      
      for (let i = 0; i < numberOfTabs; i++) {
        const startIndex = i * creatorsPerTab;
        const endIndex = Math.min(startIndex + creatorsPerTab, totalCreators);
        const tabCreators = creators.slice(startIndex, endIndex);
        
        tabs.push({
          id: i + 1,
          name: `Batch ${i + 1}`,
          creators: tabCreators,
          status: 'ready',
          sentCount: 0,
          responseCount: 0
        });
      }
      
      setBlastTabs(tabs);
      setIsGenerating(false);
    }, 2000);
  };

  const canSendBlast = () => {
    return walletBalance >= minimumBalance && blastTabs.length > 0 && offerTemplate.trim().length > 0;
  };

  const handleSendBlast = (tabIndex?: number) => {
    if (!canSendBlast()) {
      if (walletBalance < minimumBalance) {
        Alert.alert(
          'Insufficient Funds',
          `Smart Blast requires a minimum wallet balance of $${minimumBalance.toLocaleString()}. Current balance: $${walletBalance.toLocaleString()}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Missing Information', 'Please create an offer template before sending.', [{ text: 'OK' }]);
      }
      return;
    }

    const tabsToSend = tabIndex !== undefined ? [tabIndex] : blastTabs.map((_, index) => index);
    
    Alert.alert(
      'Confirm Smart Blast',
      `Send offers to ${tabsToSend.reduce((acc, idx) => acc + blastTabs[idx].creators.length, 0)} creators across ${tabsToSend.length} batch(es)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          style: 'destructive',
          onPress: () => executeBlast(tabsToSend)
        }
      ]
    );
  };

  const executeBlast = (tabIndices: number[]) => {
    setIsModalVisible(false);
    
    tabIndices.forEach((tabIndex, i) => {
      setTimeout(() => {
        setBlastTabs(prev => prev.map((tab, index) => 
          index === tabIndex 
            ? { ...tab, status: 'sending' }
            : tab
        ));
        
        // Simulate sending process
        setTimeout(() => {
          setBlastTabs(prev => prev.map((tab, index) => 
            index === tabIndex 
              ? { 
                  ...tab, 
                  status: 'completed',
                  sentCount: tab.creators.length,
                  responseCount: Math.floor(tab.creators.length * 0.15) // 15% response rate
                }
              : tab
          ));
        }, 3000 + (i * 1000)); // Stagger completion
        
      }, i * 500); // Stagger start
    });
  };

  const getTotalStats = () => {
    const totalCreators = blastTabs.reduce((acc, tab) => acc + tab.creators.length, 0);
    const totalSent = blastTabs.reduce((acc, tab) => acc + tab.sentCount, 0);
    const totalResponses = blastTabs.reduce((acc, tab) => acc + tab.responseCount, 0);
    const totalReach = blastTabs.reduce((acc, tab) => 
      acc + tab.creators.reduce((tabAcc, creator) => tabAcc + creator.totalFollowers, 0), 0
    );
    
    return { totalCreators, totalSent, totalResponses, totalReach };
  };

  const renderTabItem = ({ item, index }: { item: BlastTab; index: number }) => (
    <TouchableOpacity
      style={[
        styles.tabItem,
        activeTabIndex === index && styles.activeTabItem,
        item.status === 'completed' && styles.completedTabItem,
        item.status === 'sending' && styles.sendingTabItem,
        item.status === 'failed' && styles.failedTabItem
      ]}
      onPress={() => setActiveTabIndex(index)}
    >
      <Text style={[
        styles.tabItemText,
        activeTabIndex === index && styles.activeTabItemText
      ]}>
        {item.name}
      </Text>
      <Text style={styles.tabItemCount}>
        {item.creators.length.toLocaleString()}
      </Text>
      {item.status === 'sending' && (
        <Text style={styles.tabItemStatus}>Sending...</Text>
      )}
      {item.status === 'completed' && (
        <Text style={styles.tabItemStatus}>
          {item.responseCount}/{item.sentCount} responses
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderCreatorItem = ({ item }: { item: any }) => (
    <View style={styles.creatorItem}>
      <View style={styles.creatorInfo}>
        <Text style={styles.creatorName}>{item.name}</Text>
        <Text style={styles.creatorStats}>
          {item.totalFollowers.toLocaleString()} followers • {item.avgEngagement}% engagement
        </Text>
        <Text style={styles.creatorCost}>${item.estimatedCost}/post</Text>
      </View>
      <View style={styles.creatorActions}>
        <Text style={[
          styles.responseRate,
          item.responseRate > 0.6 ? styles.highResponse : 
          item.responseRate > 0.3 ? styles.mediumResponse : styles.lowResponse
        ]}>
          {(item.responseRate * 100).toFixed(0)}% response rate
        </Text>
      </View>
    </View>
  );

  const stats = getTotalStats();

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🎯 Generating Smart Blast...</Text>
        <Text style={styles.loadingSubtext}>
          Processing {creators.length.toLocaleString()} creators...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalCreators.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Creators</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalReach.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Reach</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{blastTabs.length}</Text>
          <Text style={styles.statLabel}>Blast Batches</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${walletBalance.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Wallet Balance</Text>
        </View>
      </View>

      {/* Phase Information */}
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>Smart Blast System</Text>
        <Text style={styles.phaseDescription}>
          Phase 1: Auto-generated list of up to 100,000 influencers based on your filters
        </Text>
        <Text style={styles.phaseDescription}>
          Phase 2: Bulk-send offers (requires wallet balance ≥ $10,000)
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.templateButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.templateButtonText}>
            📝 {offerTemplate ? 'Edit' : 'Create'} Offer Template
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.blastButton,
            !canSendBlast() && styles.disabledButton
          ]}
          onPress={() => handleSendBlast()}
          disabled={!canSendBlast()}
        >
          <Text style={[
            styles.blastButtonText,
            !canSendBlast() && styles.disabledButtonText
          ]}>
            🚀 Send All Batches
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs List */}
      {blastTabs.length > 0 && (
        <View style={styles.tabsSection}>
          <Text style={styles.sectionTitle}>Blast Batches (1,000 creators each)</Text>
          <FlatList
            data={blastTabs}
            renderItem={renderTabItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsList}
          />
        </View>
      )}

      {/* Current Tab Content */}
      {blastTabs.length > 0 && blastTabs[activeTabIndex] && (
        <View style={styles.tabContent}>
          <View style={styles.tabHeader}>
            <Text style={styles.tabTitle}>
              {blastTabs[activeTabIndex].name} - {blastTabs[activeTabIndex].creators.length} creators
            </Text>
            <TouchableOpacity 
              style={[
                styles.sendTabButton,
                !canSendBlast() && styles.disabledButton
              ]}
              onPress={() => handleSendBlast(activeTabIndex)}
              disabled={!canSendBlast()}
            >
              <Text style={[
                styles.sendTabButtonText,
                !canSendBlast() && styles.disabledButtonText
              ]}>
                Send This Batch
              </Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={blastTabs[activeTabIndex].creators}
            renderItem={renderCreatorItem}
            keyExtractor={(item) => item.id}
            style={styles.creatorsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Offer Template Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Offer Template</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            Create a template that will be sent to all selected creators. Personalization variables will be automatically replaced.
          </Text>
          
          <TextInput
            style={styles.templateInput}
            multiline
            numberOfLines={10}
            placeholder="Hi [NAME],

I love your content about [CATEGORY]! I'd like to collaborate with you on a campaign for [BRAND].

We're offering $[RATE] for a sponsored post featuring our product.

Are you interested? Let me know!

Best regards,
[YOUR_NAME]"
            value={offerTemplate}
            onChangeText={setOfferTemplate}
            textAlignVertical="top"
          />
          
          <View style={styles.templateVariables}>
            <Text style={styles.variablesTitle}>Available Variables:</Text>
            <Text style={styles.variablesText}>
              [NAME], [CATEGORY], [FOLLOWERS], [ENGAGEMENT], [RATE], [BRAND], [YOUR_NAME]
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.saveTemplateButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.saveTemplateButtonText}>Save Template</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  phaseContainer: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  templateButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  templateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  blastButton: {
    flex: 1,
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  blastButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#888',
  },
  tabsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tabsList: {
    flexGrow: 0,
  },
  tabItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTabItem: {
    borderColor: Color.cSK430B92500,
    backgroundColor: '#e7f3ff',
  },
  completedTabItem: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  sendingTabItem: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  failedTabItem: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activeTabItemText: {
    color: Color.cSK430B92500,
  },
  tabItemCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabItemStatus: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  tabContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sendTabButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  sendTabButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  creatorsList: {
    flex: 1,
  },
  creatorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  creatorStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  creatorCost: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '600',
    marginTop: 2,
  },
  creatorActions: {
    alignItems: 'flex-end',
  },
  responseRate: {
    fontSize: 12,
    fontWeight: '600',
  },
  highResponse: {
    color: '#4CAF50',
  },
  mediumResponse: {
    color: '#FF9800',
  },
  lowResponse: {
    color: '#f44336',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  templateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  templateVariables: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  variablesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92500,
    marginBottom: 4,
  },
  variablesText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  saveTemplateButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTemplateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SmartBlast;