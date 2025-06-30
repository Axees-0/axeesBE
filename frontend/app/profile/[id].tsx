import React, { useState, useMemo, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Assets and Components
import { Color, FontFamily, FontSize, Gap, Padding, Focus } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { useAuth } from '@/contexts/AuthContext';
import { DemoData } from '@/demo/DemoData';
import { DEMO_MODE } from '@/demo/DemoMode';
import { DemoOfferFlow } from '@/components/DemoOfferFlow';
import { AvatarWithFallback } from '@/components/AvatarWithFallback';
import QRGenerator from '@/components/QR/QRGenerator';
import DesignSystem from '@/styles/DesignSystem';
import { getPlatformIcon } from '@/constants/platforms';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';
import Share from '@/assets/share-08.png';
import Heart from '@/assets/icons.png';
import HeartFilled from '@/assets/heart-red.png';
import Message from '@/assets/message01.svg';
import CheckBadge from '@/assets/checkmarkbadge01.svg';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { MaterialIcons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/Colors';

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
  const [contactSubject, setContactSubject] = useState('Collaboration Opportunity');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

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

  // Add Esc key support for contact modal (web only)
  useEffect(() => {
    if (!isContactModalVisible || Platform.OS !== 'web') return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsContactModalVisible(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isContactModalVisible]);

  // Calculate total followers and engagement
  const totalFollowers = creator.creatorData?.totalFollowers || 0;
  
  // Safe calculation of average engagement
  const platforms = creator.creatorData?.platforms || [];
  const totalEngagement = platforms.reduce((acc, p) => {
    const engagement = typeof p.engagement === 'number' && !isNaN(p.engagement) ? p.engagement : 0;
    return acc + engagement;
  }, 0);
  const avgEngagement = platforms.length > 0 ? totalEngagement / platforms.length : 0;

  // Format numbers with safety checks
  const formatNumber = (num: number) => {
    // Ensure num is a valid number
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      return '0';
    }
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Handle share profile
  const handleShareProfile = async () => {
    const profileUrl = `${Platform.OS === 'web' ? window.location.origin : 'https://axees.com'}/profile/${creator._id}`;
    const shareText = `Check out ${creator.name}'s creator profile on Axees!`;
    
    if (Platform.OS === 'web' && navigator.share) {
      try {
        await navigator.share({
          title: `${creator.name} - Axees Creator`,
          text: shareText,
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled share or share API not supported
        // Fallback to copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(profileUrl);
          Alert.alert('Success', 'Profile link copied to clipboard!');
        }
      }
    } else if (Platform.OS === 'web') {
      // Fallback for browsers without share API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
        Alert.alert('Success', 'Profile link copied to clipboard!');
      }
    } else {
      // Mobile share
      const { Share: RNShare } = require('react-native');
      try {
        await RNShare.share({
          message: `${shareText} ${profileUrl}`,
          url: profileUrl,
          title: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  // Simple working contact form with Subject validation
  const handleSendMessage = () => {
    const subject = (document.getElementById('contact-subject') as HTMLInputElement)?.value || '';
    const message = (document.getElementById('contact-message') as HTMLTextAreaElement)?.value || '';
    
    // Validate Subject field
    if (!subject.trim()) {
      window.alert('Please enter a subject before sending.');
      // Focus the subject field for better UX
      const subjectField = document.getElementById('contact-subject') as HTMLInputElement;
      if (subjectField) {
        subjectField.focus();
        subjectField.style.borderColor = '#ed0006'; // Red border for error state
      }
      return;
    }
    
    // Validate Message field
    if (!message.trim()) {
      window.alert('Please enter a message before sending.');
      // Focus the message field for better UX
      const messageField = document.getElementById('contact-message') as HTMLTextAreaElement;
      if (messageField) {
        messageField.focus();
        messageField.style.borderColor = '#ed0006'; // Red border for error state
      }
      return;
    }
    
    // Reset border colors to normal if validation passes
    const subjectField = document.getElementById('contact-subject') as HTMLInputElement;
    const messageField = document.getElementById('contact-message') as HTMLTextAreaElement;
    if (subjectField) subjectField.style.borderColor = '#ddd';
    if (messageField) messageField.style.borderColor = '#ddd';
    
    // Create chat ID for this conversation
    const chatId = `chat-${id}-${Date.now()}`;
    
    // Close modal
    setIsContactModalVisible(false);
    
    // Show success and navigate to chat
    const openChat = window.confirm(
      `Your message has been sent to ${creator.name}. You can continue the conversation in chat.\n\nOpen chat now?`
    );
    if (openChat) {
      router.push({
        pathname: '/chat/[id]',
        params: { 
          id: chatId,
          otherUserId: creator._id,
          otherUserName: creator.name
        }
      });
    }
  };

  // Offer Modal Component with DemoOfferFlow
  const OfferModal = () => (
    <Modal
      visible={isOfferModalVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setIsOfferModalVisible(false)}
    >
      <DemoOfferFlow
        creatorName={creator.name}
        creatorHandle={creator.userName}
        onComplete={() => {
          setIsOfferModalVisible(false);
          // Show success message
          if (Platform.OS === 'web') {
            window.alert(`Offer sent successfully to ${creator.name}! They will receive a notification.`);
          } else {
            Alert.alert(
              'Offer Sent!',
              `Your offer has been sent to ${creator.name}. They will receive a notification.`,
              [{ text: 'OK' }]
            );
          }
        }}
        onCancel={() => setIsOfferModalVisible(false)}
      />
    </Modal>
  );

  // Using centralized platform icon function from @/constants/platforms

  // Render different tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Social Media Platforms</Text>
              <View style={styles.socialPlatformsGrid}>
                {creator.creatorData?.platforms?.map((platform, index) => (
                  <TouchableOpacity key={index} style={styles.socialPlatformCard}>
                    <View style={styles.socialPlatformIcon}>
                      <Image 
                        source={getPlatformIcon(platform.platform)} 
                        style={styles.largePlatformIcon}
                        accessibilityLabel={`${platform.platform} platform icon`}
                      />
                    </View>
                    <View style={styles.socialPlatformInfo}>
                      <Text style={styles.socialPlatformHandle}>{platform.handle}</Text>
                      <Text style={styles.socialPlatformFollowers}>
                        {formatNumber(platform.followersCount || 0)} followers
                      </Text>
                    </View>
                    <View style={styles.socialPlatformEngagement}>
                      <Text style={styles.engagementRate}>
                        {typeof platform.engagement === 'number' && !isNaN(platform.engagement) 
                          ? `${platform.engagement.toFixed(1)}%`
                          : 'N/A'
                        }
                      </Text>
                      <Text style={styles.engagementLabel}>engagement</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Response Time</Text>
              <Text style={styles.infoValue}>{creator.responseTime}</Text>
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
              <Text style={styles.sectionTitle}>Languages</Text>
              <Text style={styles.infoValue}>English, Spanish</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Working Hours</Text>
              <Text style={styles.infoValue}>Mon-Fri 9AM-6PM EST</Text>
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
                        accessibilityLabel={`${platform.platform} platform icon`}
                      />
                      <View>
                        <Text style={styles.ratePlatform}>
                          {platform.platform} Post Rate
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
          <UniversalBackButton 
            fallbackRoute="/explore"
          />
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={({ focused }) => [
                styles.actionButton,
                focused && styles.actionButtonFocused,
              ]}
              onPress={() => setIsFavorited(!isFavorited)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isFavorited ? "Remove from favorites" : "Add to favorites"}
              accessibilityHint={isFavorited ? "Remove this creator from your favorites list" : "Add this creator to your favorites list"}
              accessibilityState={{ selected: isFavorited }}
            >
              <Image 
                source={isFavorited ? HeartFilled : Heart} 
                style={styles.actionIcon}
                accessibilityLabel={isFavorited ? "Remove from favorites" : "Add to favorites"}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={({ focused }) => [
                styles.actionButton,
                focused && styles.actionButtonFocused,
              ]}
              onPress={() => handleShareProfile()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Share creator profile"
              accessibilityHint="Share this creator's profile with others via link or social media"
            >
              <Image 
                source={Share} 
                style={styles.actionIcon}
                accessibilityLabel="Share profile"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Container for absolute positioning */}
          <View style={styles.contentContainer}>
            {/* Modern Cover + Profile Section */}
            <View style={styles.coverSection}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop' }}
                style={styles.coverImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
                style={styles.coverGradient}
              />
            </View>

            {/* Profile Avatar - Now inside content so it scrolls properly */}
            <View style={styles.avatarContainer}>
              <AvatarWithFallback 
                source={creator.avatarUrl}
                name={creator.name}
                size={120}
              />
              {creator.verified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={24} color={BrandColors.primary[500]} />
                </View>
              )}
            </View>

          {/* Profile Info */}
          <View style={styles.profileInfoSection}>
            <View style={styles.nameSection}>
              <Text style={styles.fullName}>{creator.name}</Text>
              <Text style={styles.username}>{creator.userName}</Text>
            </View>
            
            {creator.bio && (
              <Text style={styles.bio}>{creator.bio}</Text>
            )}
            
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={16} color={BrandColors.neutral[500]} />
                <Text style={styles.metaText}>{creator.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="calendar-today" size={16} color={BrandColors.neutral[500]} />
                <Text style={styles.metaText}>Joined {creator.joinedDate?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>

            {/* Social Stats */}
            <View style={styles.socialStats}>
              <View style={styles.socialStatItem}>
                <Text style={styles.socialStatValue}>{formatNumber(totalFollowers)}</Text>
                <Text style={styles.socialStatLabel}>Followers</Text>
              </View>
              <View style={styles.socialStatDivider} />
              <View style={styles.socialStatItem}>
                <Text style={styles.socialStatValue}>
                  {!isNaN(avgEngagement) && isFinite(avgEngagement) ? `${avgEngagement.toFixed(1)}%` : '0.0%'}
                </Text>
                <Text style={styles.socialStatLabel}>Engagement</Text>
              </View>
              <View style={styles.socialStatDivider} />
              <View style={styles.socialStatItem}>
                <Text style={styles.socialStatValue}>
                  {typeof creator.rating === 'number' && !isNaN(creator.rating) && isFinite(creator.rating)
                    ? `${creator.rating.toFixed(1)}/5`
                    : '0.0/5'
                  }
                </Text>
                <Text style={styles.socialStatLabel}>Rating</Text>
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


            {/* Action Buttons - Connect, Contact, Create Offer */}
            <View style={styles.actionButtonsContainer}>
                <View style={styles.primaryActionButtons}>
                  <TouchableOpacity 
                    style={[styles.primaryActionButton, styles.connectButton]}
                    onPress={() => setShowQRCode(!showQRCode)}
                  >
                    <MaterialIcons name="qr-code" size={20} color="#fff" />
                    <Text style={styles.primaryActionText}>Connect</Text>
                  </TouchableOpacity>
                </View>

                {/* QR Code Generator */}
                {showQRCode && (
                  <View style={styles.qrContainer}>
                    <QRGenerator
                      value={`axees://profile/${creator._id}?instant=true`}
                      creatorName={creator.name}
                      profileUrl={`${Platform.OS === 'web' ? window.location.origin : 'https://axees.com'}/profile/${creator._id}`}
                      onScan={() => router.push('/qr/scan')}
                      customMessage="Scan to instantly send offers - no login required!"
                    />
                  </View>
                )}

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={({ focused }) => [
                    styles.contactButton,
                    focused && styles.contactButtonFocused,
                  ]}
                  onPress={() => {
                    console.log('📞 Contact button pressed, opening modal');
                    setIsContactModalVisible(true);
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Contact creator"
                  accessibilityHint="Open contact form to send a message"
                >
                  <Message 
                    width={20} 
                    height={20} 
                    accessibilityLabel="Send message icon"
                    accessibilityRole="image"
                  />
                  <Text style={styles.contactText}>Contact</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={({ focused }) => [
                    styles.collaborateButton,
                    focused && styles.collaborateButtonFocused,
                  ]}
                  onPress={() => setIsOfferModalVisible(true)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Create offer for creator"
                  accessibilityHint="Open form to create a collaboration offer"
                >
                  <Text 
                    style={styles.collaborateText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Create Offer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View 
            style={styles.tabContainer}
            accessible={true}
            accessibilityRole="tablist"
            accessibilityLabel="Profile navigation tabs"
          >
            {['about', 'portfolio', 'rates'].map((tab, index) => (
              <Pressable
                key={tab}
                style={({ pressed, hovered }) => [
                  styles.tabButton, 
                  activeTab === tab && styles.activeTabButton,
                  pressed && styles.tabButtonPressed,
                  hovered && Platform.OS === 'web' && styles.tabButtonHovered,
                  hovered && activeTab !== tab && Platform.OS === 'web' && styles.tabButtonHoveredInactive
                ]}
                onPress={() => setActiveTab(tab as any)}
                accessible={true}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
                accessibilityLabel={`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`}
                accessibilityHint={`Shows ${tab} information for ${creator.name}`}
                tabIndex={activeTab === tab ? 0 : -1}
              >
                <View style={styles.tabContentInner}>
                  <MaterialIcons 
                    name={tab === 'about' ? 'info-outline' : tab === 'portfolio' ? 'work-outline' : 'attach-money'} 
                    size={18} 
                    color={activeTab === tab ? BrandColors.primary[600] : BrandColors.neutral[600]}
                    style={styles.tabIcon}
                  />
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

            {/* Tab Content */}
            {renderTabContent()}
          </View>
        </ScrollView>

        {/* Contact Modal - Simple HTML for web */}
        {isContactModalVisible && isWeb && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px'
            }}>
              <h2 style={{ marginBottom: '8px' }}>Contact {creator.name}</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Send a message to discuss collaboration opportunities
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  defaultValue="Collaboration Opportunity"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                
                <label style={{ display: 'block', marginTop: '16px', marginBottom: '6px', fontWeight: 500 }}>Message</label>
                <textarea
                  id="contact-message"
                  rows={4}
                  placeholder={`Hi ${creator.name}, I'm interested in working with you...`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsContactModalVisible(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: BrandColors.primary[500],
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Offer Modal */}
        <OfferModal />
        
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
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  actionButtonFocused: {
    ...Focus.primary,
    borderRadius: 8,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    position: 'relative',
  },
  coverSection: {
    position: 'relative',
    height: 200,
    backgroundColor: BrandColors.neutral[200],
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  avatarContainer: {
    marginTop: -60,  // Overlap with the cover image
    marginLeft: 24,
    marginBottom: 16,
    zIndex: 10,
    elevation: 10,  // For Android
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BrandColors.neutral[0],
    borderRadius: 12,
    padding: 2,
  },
  profileInfoSection: {
    position: 'relative',
    padding: 24,
    paddingTop: 70,
    backgroundColor: BrandColors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutral[100],
  },
  nameSection: {
    marginBottom: 12,
  },
  fullName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandColors.neutral[900],
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: BrandColors.neutral[600],
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: BrandColors.neutral[700],
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  socialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: BrandColors.neutral[50],
    borderRadius: 12,
  },
  socialStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  socialStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.neutral[900],
    marginBottom: 4,
  },
  socialStatLabel: {
    fontSize: 12,
    color: BrandColors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialStatDivider: {
    width: 1,
    backgroundColor: BrandColors.neutral[200],
    marginVertical: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    backgroundColor: BrandColors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: BrandColors.primary[700],
    fontWeight: '500',
  },
  socialPlatformsSection: {
    marginTop: 24,
  },
  socialPlatformsGrid: {
    gap: 12,
  },
  socialPlatformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.neutral[0],
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialPlatformIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  largePlatformIcon: {
    width: 40,
    height: 40,
  },
  socialPlatformInfo: {
    flex: 1,
    gap: 2,
  },
  socialPlatformName: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.neutral[900],
  },
  socialPlatformHandle: {
    fontSize: 14,
    color: BrandColors.primary[600],
    fontWeight: '500',
  },
  socialPlatformFollowers: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  socialPlatformEngagement: {
    alignItems: 'flex-end',
  },
  engagementRate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.semantic.success,
  },
  engagementLabel: {
    fontSize: 12,
    color: BrandColors.neutral[500],
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
  contactButtonFocused: {
    ...Focus.primary,
    borderRadius: 8,
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
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Color.cSK430B92500,
    minHeight: 44,
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  collaborateButtonFocused: {
    ...Focus.secondary,
    borderRadius: 8,
  },
  collaborateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: BrandColors.neutral[50],
    marginTop: 24,
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
    minWidth: 90,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
    }),
  },
  activeTabButton: {
    backgroundColor: BrandColors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonFocused: {
    ...Focus.primary,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 15,
    color: BrandColors.neutral[600],
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    fontFamily: DesignSystem.Typography.bodyMedium.fontFamily,
    ...(Platform.OS === 'web' && {
      transition: 'color 0.2s ease-in-out',
    }),
  },
  activeTabText: {
    color: BrandColors.primary[600],
    fontWeight: '600',
  },
  tabButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tabButtonHovered: {
    backgroundColor: BrandColors.neutral[100],
  },
  tabButtonHoveredInactive: {
    backgroundColor: BrandColors.neutral[100],
  },
  tabContentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 6,
    ...(Platform.OS === 'web' && {
      transition: 'color 0.2s ease-in-out',
    }),
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
    backgroundColor: '#d1ecf1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 12,
    color: '#0c5460',
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
  
  // New Galaxies Features Styles
  actionButtonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  primaryActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButton: {
    backgroundColor: BrandColors.primary[400],
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrContainer: {
    marginVertical: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#fff',
    color: '#333',
    outlineStyle: 'none', // Remove web focus outline
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
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