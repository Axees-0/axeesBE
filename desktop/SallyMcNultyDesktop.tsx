import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  Feather, 
  MaterialIcons, 
  Ionicons,
  FontAwesome5,
  AntDesign,
  Entypo
} from '@expo/vector-icons';

const SallyMcNultyDesktop = () => {
  const { width, height } = useWindowDimensions();
  
  const profileData = {
    name: "Sally McNulty",
    username: "@sallymcnulty",
    bio: "A video creator, a car lover and enthusiast in Reels, Memes, Merch, Fine Arts, and Prints. 208 FC RX7, BMW E46, LS WRX...",
    categories: ["Entertainment", "Car Enthusiast", "Molder", "Merch"],
    stats: {
      totalFollowers: "585K",
      listedEvents: "43",
      combinedViews: "4M+",
      offers: "123",
      deals: "87"
    },
    socialPlatforms: [
      { platform: "youtube", followers: "245K", verified: true },
      { platform: "instagram", followers: "132K", verified: true },
      { platform: "tiktok", followers: "198K", verified: false },
      { platform: "facebook", followers: "10K", verified: false }
    ]
  };

  return (
    <View style={styles.container}>
      {/* Header Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Profile</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="share-2" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="more-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Racing Theme */}
        <LinearGradient
          colors={['#e91e63', '#ad1457', '#8e24aa', '#673ab7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            {/* Left Side - Profile Info */}
            <View style={styles.heroLeft}>
              <View style={styles.profileImageContainer}>
                <View style={styles.profileAvatar}>
                  <View style={styles.avatarCap} />
                  <View style={styles.avatarCapBrim} />
                  <View style={styles.avatarFace} />
                  <View style={styles.avatarEyes} />
                  <View style={styles.avatarBody} />
                </View>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={32} color="#fff" />
                </View>
              </View>
              
              <View style={styles.profileMainInfo}>
                <Text style={styles.profileName}>{profileData.name}</Text>
                <Text style={styles.profileUsername}>{profileData.username}</Text>
                <View style={styles.macroContainer}>
                  <Text style={styles.macroText}>Macro Creator</Text>
                  <View style={styles.onlineIndicator} />
                </View>
              </View>

              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.primaryButton}>
                  <MaterialIcons name="local-offer" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Make Offer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton}>
                  <Feather name="message-circle" size={20} color="#673ab7" />
                  <Text style={styles.secondaryButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Feather name="bookmark" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Side - Racing Car Graphic */}
            <View style={styles.heroRight}>
              <View style={styles.racingCarContainer}>
                <View style={styles.carBody}>
                  <View style={styles.carStripe} />
                  <Text style={styles.carNumber}>7</Text>
                </View>
                <View style={styles.carWindshield} />
                <View style={[styles.carWheel, styles.frontWheel]} />
                <View style={[styles.carWheel, styles.rearWheel]} />
                <View style={styles.carSpoiler} />
                <View style={styles.carExhaust} />
              </View>
              
              <TouchableOpacity style={styles.buyThisButton}>
                <View style={styles.chainIcon} />
                <Text style={styles.buyThisText}>buythis NFT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <View style={styles.contentGrid}>
            {/* Left Column */}
            <View style={styles.leftColumn}>
              {/* Stats Overview */}
              <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>Performance Metrics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profileData.stats.totalFollowers}</Text>
                    <Text style={styles.statLabel}>Total Followers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profileData.stats.listedEvents}</Text>
                    <Text style={styles.statLabel}>Listed Events</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profileData.stats.combinedViews}</Text>
                    <Text style={styles.statLabel}>Combined Views</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profileData.stats.offers}</Text>
                    <Text style={styles.statLabel}>Offers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profileData.stats.deals}</Text>
                    <Text style={styles.statLabel}>Deals</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>4.8★</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>
              </View>

              {/* About Section */}
              <View style={styles.aboutCard}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>{profileData.bio}</Text>
                
                <View style={styles.categoriesSection}>
                  <Text style={styles.subsectionTitle}>Categories</Text>
                  <View style={styles.categoriesGrid}>
                    {profileData.categories.map((category, index) => (
                      <View key={index} style={styles.categoryTag}>
                        <Text style={styles.categoryText}>{category}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.linksSection}>
                  <TouchableOpacity style={styles.linkButton}>
                    <MaterialIcons name="link" size={20} color="#673ab7" />
                    <Text style={styles.linkText}>sallymcnulty.com</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.linkButton}>
                    <MaterialIcons name="location-on" size={20} color="#673ab7" />
                    <Text style={styles.linkText}>Los Angeles, CA</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Media Package */}
              <View style={styles.mediaPackageCard}>
                <View style={styles.mediaPackageHeader}>
                  <Text style={styles.sectionTitle}>Media Package</Text>
                  <TouchableOpacity style={styles.downloadButton}>
                    <Feather name="download" size={18} color="#673ab7" />
                    <Text style={styles.downloadText}>Download</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mediaPackageContent}>
                  <View style={styles.mediaItem}>
                    <MaterialIcons name="photo-library" size={24} color="#673ab7" />
                    <Text style={styles.mediaItemText}>Brand Guidelines</Text>
                  </View>
                  <View style={styles.mediaItem}>
                    <MaterialIcons name="videocam" size={24} color="#673ab7" />
                    <Text style={styles.mediaItemText}>Video Samples</Text>
                  </View>
                  <View style={styles.mediaItem}>
                    <MaterialIcons name="analytics" size={24} color="#673ab7" />
                    <Text style={styles.mediaItemText}>Analytics Report</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.rightColumn}>
              {/* Social Platforms */}
              <View style={styles.socialCard}>
                <Text style={styles.sectionTitle}>Social Platforms</Text>
                <View style={styles.socialPlatformsList}>
                  {profileData.socialPlatforms.map((platform, index) => (
                    <View key={index} style={styles.socialPlatformItem}>
                      <View style={styles.socialPlatformLeft}>
                        <View style={[styles.socialIcon, styles[`${platform.platform}Icon`]]}>
                          {platform.platform === 'youtube' && <FontAwesome5 name="youtube" size={20} color="#fff" />}
                          {platform.platform === 'instagram' && <FontAwesome5 name="instagram" size={20} color="#fff" />}
                          {platform.platform === 'tiktok' && <FontAwesome5 name="tiktok" size={18} color="#fff" />}
                          {platform.platform === 'facebook' && <FontAwesome5 name="facebook-f" size={20} color="#fff" />}
                        </View>
                        <View style={styles.socialInfo}>
                          <Text style={styles.socialPlatformName}>{platform.platform}</Text>
                          <Text style={styles.socialFollowers}>{platform.followers} followers</Text>
                        </View>
                      </View>
                      <View style={styles.socialPlatformRight}>
                        {platform.verified && (
                          <MaterialIcons name="verified" size={16} color="#1DA1F2" style={styles.verifiedIcon} />
                        )}
                        <TouchableOpacity>
                          <Text style={styles.viewLink}>View →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Activity */}
              <View style={styles.activityCard}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityList}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <MaterialIcons name="local-offer" size={16} color="#673ab7" />
                    </View>
                    <Text style={styles.activityText}>Completed deal with Nike</Text>
                    <Text style={styles.activityTime}>2 days ago</Text>
                  </View>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <MaterialIcons name="star" size={16} color="#FFB800" />
                    </View>
                    <Text style={styles.activityText}>Received 5-star review</Text>
                    <Text style={styles.activityTime}>5 days ago</Text>
                  </View>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
                    </View>
                    <Text style={styles.activityText}>Reached 500K milestone</Text>
                    <Text style={styles.activityTime}>1 week ago</Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsCard}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsList}>
                  <TouchableOpacity style={styles.quickActionButton}>
                    <MaterialIcons name="schedule" size={20} color="#673ab7" />
                    <Text style={styles.quickActionText}>Schedule Meeting</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionButton}>
                    <MaterialIcons name="request-quote" size={20} color="#673ab7" />
                    <Text style={styles.quickActionText}>Request Quote</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionButton}>
                    <MaterialIcons name="assignment" size={20} color="#673ab7" />
                    <Text style={styles.quickActionText}>View Portfolio</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: 48,
    minHeight: 320,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  heroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  profileImageContainer: {
    position: 'relative',
    zIndex: 20,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d4af8c',
    borderWidth: 4,
    borderColor: 'white',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarCap: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    height: 40,
    backgroundColor: '#2c2c2c',
    borderRadius: 20,
  },
  avatarCapBrim: {
    position: 'absolute',
    top: 40,
    left: -5,
    right: -5,
    height: 15,
    backgroundColor: '#3a3a3a',
    borderRadius: 30,
  },
  avatarFace: {
    position: 'absolute',
    top: 30,
    left: 25,
    right: 25,
    bottom: 50,
    backgroundColor: '#f4d1ae',
    borderRadius: 35,
  },
  avatarEyes: {
    position: 'absolute',
    top: 45,
    left: 35,
    right: 35,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarBody: {
    position: 'absolute',
    top: 65,
    left: 10,
    right: 10,
    bottom: 5,
    backgroundColor: '#4a4a4a',
    borderRadius: 30,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#673ab7',
    borderRadius: 20,
    padding: 2,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 25,
  },
  profileMainInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  macroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: '#673ab7',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: '#673ab7',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,
  },
  heroRight: {
    position: 'relative',
    width: 400,
    height: 200,
    zIndex: 1,
  },
  racingCarContainer: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 300,
    height: 150,
    zIndex: 10,
  },
  carBody: {
    width: 300,
    height: 80,
    backgroundColor: '#ff1493',
    borderRadius: 20,
    position: 'absolute',
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carStripe: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  carNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  carWindshield: {
    width: 180,
    height: 50,
    backgroundColor: '#ff69b4',
    borderRadius: 15,
    position: 'absolute',
    top: 20,
    left: 50,
    opacity: 0.8,
  },
  carWheel: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#666',
    position: 'absolute',
    bottom: 10,
  },
  frontWheel: {
    left: 30,
  },
  rearWheel: {
    right: 30,
  },
  carSpoiler: {
    width: 60,
    height: 25,
    backgroundColor: '#8b008b',
    borderRadius: 5,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  carExhaust: {
    width: 30,
    height: 15,
    backgroundColor: '#666',
    borderRadius: 8,
    position: 'absolute',
    bottom: 25,
    left: -15,
  },
  buyThisButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#673ab7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 30,
  },
  chainIcon: {
    width: 16,
    height: 16,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  buyThisText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mainContent: {
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
    padding: 32,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 32,
  },
  leftColumn: {
    flex: 2,
    gap: 24,
  },
  rightColumn: {
    flex: 1,
    gap: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#673ab7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  bioText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTag: {
    backgroundColor: '#673ab7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  linksSection: {
    flexDirection: 'row',
    gap: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    color: '#673ab7',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaPackageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  mediaPackageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#673ab7',
  },
  downloadText: {
    color: '#673ab7',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaPackageContent: {
    gap: 16,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  mediaItemText: {
    fontSize: 16,
    color: '#444',
  },
  socialCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  socialPlatformsList: {
    gap: 16,
  },
  socialPlatformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  socialPlatformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeIcon: {
    backgroundColor: '#FF0000',
  },
  instagramIcon: {
    backgroundColor: '#E4405F',
  },
  tiktokIcon: {
    backgroundColor: '#000000',
  },
  facebookIcon: {
    backgroundColor: '#1877F2',
  },
  socialInfo: {
    gap: 2,
  },
  socialPlatformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  socialFollowers: {
    fontSize: 14,
    color: '#666',
  },
  socialPlatformRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedIcon: {
    marginRight: 4,
  },
  viewLink: {
    color: '#673ab7',
    fontSize: 14,
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  quickActionsList: {
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '500',
  },
});

export default SallyMcNultyDesktop;