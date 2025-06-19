import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  useWindowDimensions,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Assets and Components
import { Color, FontFamily, FontSize, Gap, Padding } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { useAuth } from '@/contexts/AuthContext';
import { DemoData } from '@/demo/DemoData';
import { DEMO_MODE } from '@/demo/DemoMode';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';
import Share from '@/assets/share-08.png';
import Heart from '@/assets/icons.png';
import HeartFilled from '@/assets/heart-red.png';
import Message from '@/assets/message01.svg';
import CheckBadge from '@/assets/checkmarkbadge01.svg';

interface CreatorProfileProps {}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
};

const CreatorProfile: React.FC<CreatorProfileProps> = () => {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isMobileScreen = width <= BREAKPOINTS.mobile;
  const isWeb = Platform.OS === 'web';

  // State
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'rates'>('about');
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);

  // Find creator from demo data
  const creator = useMemo(() => {
    if (!DEMO_MODE) return null;
    return DemoData.creators.find(c => c._id === id);
  }, [id]);

  if (!creator) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Creator not found</Text>
      </View>
    );
  }

  // Calculate total followers and engagement
  const totalFollowers = creator.creatorData?.totalFollowers || 0;
  const avgEngagement = creator.creatorData?.platforms?.reduce((acc, p) => acc + (p.engagement || 0), 0) / (creator.creatorData?.platforms?.length || 1);

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Contact Modal Component
  const ContactModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Contact {creator.name}</Text>
        <Text style={styles.modalDescription}>
          Send a message to discuss collaboration opportunities
        </Text>
        
        <View style={styles.modalForm}>
          <Text style={styles.inputLabel}>Subject</Text>
          <View style={styles.input}>
            <Text style={styles.inputPlaceholder}>Collaboration Opportunity</Text>
          </View>
          
          <Text style={styles.inputLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={`Hi ${creator.name}, I'm interested in working with you...`}
            placeholderTextColor="#999"
            value={contactMessage}
            onChangeText={setContactMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={styles.modalCancelBtn}
            onPress={() => setIsContactModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalSendBtn}
            onPress={() => {
              if (!contactMessage.trim()) {
                Alert.alert('Message Required', 'Please enter a message before sending.');
                return;
              }
              
              // Create chat ID for this conversation
              const chatId = `chat-${id}-${Date.now()}`;
              
              // Close modal first
              setIsContactModalVisible(false);
              setContactMessage('');
              
              // Show success and navigate to chat
              Alert.alert(
                'Message Sent!',
                `Your message has been sent to ${creator.name}. You can continue the conversation in chat.`,
                [
                  {
                    text: 'Open Chat',
                    onPress: () => {
                      router.push({
                        pathname: '/chat/[id]',
                        params: { 
                          id: chatId,
                          otherUserId: creator.id,
                          otherUserName: creator.name
                        }
                      });
                    }
                  },
                  { text: 'OK' }
                ]
              );
            }}
          >
            <Text style={styles.modalSendText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Offer Modal Component
  const OfferModal = () => (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, styles.offerModalContainer]}>
        <Text style={styles.modalTitle}>Create Offer for {creator.name}</Text>
        <Text style={styles.modalDescription}>
          Choose how you'd like to create your offer
        </Text>
        
        <View style={styles.offerOptions}>
          <TouchableOpacity 
            style={styles.offerOptionButton}
            onPress={() => {
              setIsOfferModalVisible(false);
              router.push({
                pathname: '/offers/premade',
                params: { creatorId: creator._id }
              });
            }}
          >
            <Text style={styles.offerOptionTitle}>Pre-Made Offers</Text>
            <Text style={styles.offerOptionDescription}>
              Choose from our curated offer templates
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.offerOptionButton}
            onPress={() => {
              setIsOfferModalVisible(false);
              router.push({
                pathname: '/offers/custom',
                params: { creatorId: creator._id }
              });
            }}
          >
            <Text style={styles.offerOptionTitle}>Custom Offer</Text>
            <Text style={styles.offerOptionDescription}>
              Create a personalized offer from scratch
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.modalCancelBtn}
          onPress={() => setIsOfferModalVisible(false)}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Platform Icons
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return require('@/assets/instagram.png');
      case 'tiktok':
        return require('@/assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-1.png');
      case 'youtube':
        return require('@/assets/youtube-icon.png');
      case 'twitter':
      case 'x':
        return require('@/assets/1707226109newtwitterlogopng-1.png');
      case 'facebook':
        return require('@/assets/facebook-icon.png');
      case 'linkedin':
        return require('@/assets/facebook-icon.png'); // Using facebook as placeholder
      case 'twitch':
        return require('@/assets/youtube-icon.png'); // Using youtube as placeholder
      case 'pinterest':
        return require('@/assets/instagram.png'); // Using instagram as placeholder
      default:
        return require('@/assets/icons.png');
    }
  };

  // Render different tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{creator.bio}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{creator.location}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Response Time</Text>
                <Text style={styles.infoValue}>{creator.responseTime}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{creator.joinedDate?.toLocaleDateString()}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <View style={styles.specialtiesContainer}>
                {creator.creatorData?.specialties?.map((specialty, index) => (
                  <View key={index} style={styles.specialtyChip}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platform Stats</Text>
              {creator.creatorData?.platforms?.map((platform, index) => (
                <View key={index} style={styles.platformRow}>
                  <View style={styles.platformInfo}>
                    <Image 
                      source={getPlatformIcon(platform.platform)} 
                      style={styles.platformIcon}
                    />
                    <View>
                      <Text style={styles.platformName}>
                        {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                      </Text>
                      <Text style={styles.platformHandle}>{platform.handle}</Text>
                    </View>
                  </View>
                  <View style={styles.platformStats}>
                    <Text style={styles.followersText}>
                      {formatNumber(platform.followersCount || 0)}
                    </Text>
                    <Text style={styles.engagementText}>
                      {platform.engagement?.toFixed(1)}% engagement
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      
      case 'portfolio':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio Highlights</Text>
              {creator.creatorData?.portfolioHighlights?.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <View style={styles.highlightBullet} />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Work</Text>
              <Text style={styles.comingSoonText}>
                Portfolio samples will be displayed here in the full version
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client Reviews</Text>
              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>Sarah M.</Text>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text key={star} style={styles.star}>★</Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>
                  "Excellent work and very professional. Delivered exactly what we needed for our campaign."
                </Text>
              </View>
            </View>
          </View>
        );
      
      case 'rates':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing Guide</Text>
              <Text style={styles.rateDescription}>
                Estimated rates based on platform and content type
              </Text>
              
              {creator.creatorData?.platforms?.map((platform, index) => {
                const cpmRates: Record<string, number> = {
                  instagram: 10,
                  tiktok: 25,
                  youtube: 20,
                  twitter: 2,
                  x: 2,
                  facebook: 25,
                  linkedin: 15,
                  twitch: 30,
                  pinterest: 8,
                };
                
                const cpm = cpmRates[platform.platform.toLowerCase()] || 10;
                const estimatedRate = ((platform.followersCount || 0) / 1000) * cpm;
                
                return (
                  <View key={index} style={styles.rateRow}>
                    <View style={styles.rateInfo}>
                      <Image 
                        source={getPlatformIcon(platform.platform)} 
                        style={styles.rateIcon}
                      />
                      <View>
                        <Text style={styles.ratePlatform}>
                          {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)} Post
                        </Text>
                        <Text style={styles.rateFollowers}>
                          {formatNumber(platform.followersCount || 0)} followers
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.ratePrice}>
                      ${Math.round(estimatedRate).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
              
              <View style={styles.rateNote}>
                <Text style={styles.rateNoteText}>
                  * Rates may vary based on content complexity, timeline, and campaign requirements
                </Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <WebSEO 
        title={`${creator.name} - Creator Profile | Axees`}
        description={creator.bio}
        keywords={`${creator.name}, ${creator.creatorData?.categories?.join(', ')}, influencer, creator`}
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
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setIsFavorited(!isFavorited)}
            >
              <Image 
                source={isFavorited ? HeartFilled : Heart} 
                style={styles.actionIcon} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Image source={Share} style={styles.actionIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Profile Hero */}
          <View style={styles.heroSection}>
            <Image 
              source={{ uri: creator.avatarUrl }} 
              style={styles.profileImage}
              placeholder={require('@/assets/empty-image.png')}
            />
            
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.creatorName}>{creator.name}</Text>
                {creator.verified && (
                  <CheckBadge width={20} height={20} />
                )}
              </View>
              
              <Text style={styles.username}>{creator.userName}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatNumber(totalFollowers)}</Text>
                  <Text style={styles.statLabel}>Total Followers</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{avgEngagement.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Avg Engagement</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{creator.rating?.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>

              {/* Categories */}
              <View style={styles.categoriesContainer}>
                {creator.creatorData?.categories?.map((category, index) => (
                  <View key={index} style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => setIsContactModalVisible(true)}
                >
                  <Message width={20} height={20} />
                  <Text style={styles.contactText}>Contact</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.collaborateButton}
                  onPress={() => setIsOfferModalVisible(true)}
                >
                  <Text style={styles.collaborateText}>Create Offer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {['about', 'portfolio', 'rates'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </ScrollView>

        {/* Contact Modal */}
        {isContactModalVisible && <ContactModal />}
        
        {/* Offer Modal */}
        {isOfferModalVisible && <OfferModal />}
        
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  categoryChip: {
    backgroundColor: '#f0e7fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: Color.cSK430B92500,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
  },
  contactText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
  },
  collaborateButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Color.cSK430B92500,
  },
  collaborateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Color.cSK430B92500,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformIcon: {
    width: 32,
    height: 32,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  platformHandle: {
    fontSize: 14,
    color: '#666',
  },
  platformStats: {
    alignItems: 'flex-end',
  },
  followersText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  engagementText: {
    fontSize: 12,
    color: '#666',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  highlightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Color.cSK430B92500,
  },
  highlightText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  reviewItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    color: '#FFD700',
    fontSize: 14,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  rateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateIcon: {
    width: 32,
    height: 32,
  },
  ratePlatform: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  rateFollowers: {
    fontSize: 12,
    color: '#666',
  },
  ratePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  rateNote: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  rateNoteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalForm: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputPlaceholder: {
    color: '#999',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Color.cSK430B92500,
    alignItems: 'center',
  },
  modalSendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Offer Modal styles
  offerModalContainer: {
    maxWidth: 500,
  },
  offerOptions: {
    marginBottom: 24,
    gap: 16,
  },
  offerOptionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  offerOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 4,
  },
  offerOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default CreatorProfile;