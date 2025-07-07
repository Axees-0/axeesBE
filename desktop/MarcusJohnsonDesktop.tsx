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
import { router } from 'expo-router';
import { 
  Feather, 
  MaterialIcons, 
  Ionicons,
  FontAwesome5,
  AntDesign,
} from '@expo/vector-icons';
import { BrandColors } from '@/constants/Colors';

const MarcusJohnsonDesktop = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 1250;
  const isTablet = width >= 780 && width <= 1250;
  const isMobile = width < 780;
  
  const profileData = {
    name: "Marcus Johnson",
    username: "@techmarc",
    bio: "Tech Reviewer | Smart Home Enthusiast | Future Tech Explorer. Building the future with AI, IoT, and cutting-edge gadgets.",
    categories: ["Technology", "Reviews", "Tutorials", "Innovation"],
    stats: {
      totalFollowers: "279K",
      listedEvents: "68",
      combinedViews: "12M+",
      offers: "234",
      deals: "156"
    },
    socialPlatforms: [
      { name: "youtube", followers: "234K" }
    ]
  };

  // Responsive container style
  const containerStyle = [
    styles.container,
    isDesktop && styles.desktopWrapper,
    isTablet && styles.tabletContainer,
    isMobile && styles.mobileContainer
  ];

  return (
    <View style={containerStyle}>
      <View style={[
        styles.profileContainer, 
        isDesktop && styles.desktopProfileContainer,
        isTablet && styles.tabletProfileContainer
      ]}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.timeText}>9:41</Text>
        <View style={styles.statusIcons}>
          <View style={styles.signalIcon} />
          <View style={styles.wifiIcon} />
          <View style={styles.batteryIcon} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* Cover Image Section */}
      <View style={styles.coverImageSection}>
        {/* Cover Image */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80' }}
          style={styles.coverImage}
          contentFit="cover"
        />
        
        {/* Top Left Buttons */}
        <View style={styles.topLeftButtons}>
          <TouchableOpacity style={styles.circleButton}>
            <MaterialIcons name="qr-code-scanner" size={20} color={BrandColors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleButton}>
            <MaterialIcons name="content-copy" size={20} color={BrandColors.primary[500]} />
          </TouchableOpacity>
        </View>
        
        {/* Buy This Button */}
        <TouchableOpacity style={styles.buyThisButton}>
          <Feather name="link" size={14} color="white" />
          <Text style={styles.buyThisText}>buythis</Text>
        </TouchableOpacity>
        
        {/* Profile Card Overlay */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.profilePicture}
            contentFit="cover"
          />
          <View style={styles.profileTextInfo}>
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileUsername}>{profileData.username}</Text>
          </View>
          <View style={styles.macroSection}>
            <Text style={styles.macroText}>Macro</Text>
            <TouchableOpacity>
              <Feather name="link" size={16} color={BrandColors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content Section */}
      <ScrollView style={styles.content}>
        {/* Categories */}
        <View style={styles.categoriesSection}>
          {profileData.categories.map((category, index) => (
            <View key={index} style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>

        {/* Social Icons */}
        <View style={styles.socialIcons}>
          <TouchableOpacity style={[styles.socialIcon, styles.youtube]}>
            <FontAwesome5 name="youtube" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, styles.twitter]}>
            <FontAwesome5 name="twitter" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, styles.linkedin]}>
            <FontAwesome5 name="linkedin" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, styles.github]}>
            <FontAwesome5 name="github" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statHeader}>Total Followers</Text>
              <Text style={styles.statValue}>{profileData.stats.totalFollowers}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statHeader}>Listed Events</Text>
              <Text style={styles.statValue}>{profileData.stats.listedEvents}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statHeader}>Combined Views</Text>
              <Text style={styles.statValue}>{profileData.stats.combinedViews}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statHeader}>Offers</Text>
              <Text style={styles.statValue}>{profileData.stats.offers}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statHeader}>Deals</Text>
              <Text style={styles.statValue}>{profileData.stats.deals}</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <Text style={styles.bioText}>{profileData.bio}</Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.mediaPackageButton}>
            <AntDesign name="download" size={16} color={BrandColors.primary[500]} />
            <Text style={styles.mediaPackageText}>Media Package</Text>
          </TouchableOpacity>
        </View>

        {/* Social Stats */}
        <View style={styles.socialStatsSection}>
          <Text style={styles.socialStatsHeader}>Social Stats</Text>
          <Text style={styles.otherPlatforms}>Other Platforms</Text>
          <View style={styles.youtubeState}>
            <View style={styles.youtubeStatIcon}>
              <FontAwesome5 name="youtube" size={20} color="white" />
            </View>
            <Text style={styles.followerCount}>{profileData.socialPlatforms[0].followers}</Text>
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.viewLinkButton}>
              <Text style={styles.viewLink}>View</Text>
              <Feather name="external-link" size={14} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="compass-outline" size={24} color="rgba(255,255,255,0.6)" />
          <Text style={styles.navText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetags-outline" size={24} color="rgba(255,255,255,0.6)" />
          <Text style={styles.navText}>Deals/Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubbles-outline" size={24} color="rgba(255,255,255,0.6)" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="rgba(255,255,255,0.6)" />
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="person" size={24} color="white" />
          <Text style={[styles.navText, styles.activeNavText]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  desktopWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: 20,
  },
  mobileContainer: {
    width: '100%',
    alignSelf: 'center',
    transition: 'all 0.3s ease-in-out',
  },
  tabletContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: 40,
    backgroundColor: '#f0f0f0',
    transition: 'all 0.3s ease-in-out',
  },
  profileContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
  },
  desktopProfileContainer: {
    height: 956,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  tabletProfileContainer: {
    width: '100%',
    height: 1000,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 15,
    transition: 'all 0.3s ease-in-out',
  },
  statusBar: {
    backgroundColor: '#f5f5f5',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  signalIcon: {
    width: 18,
    height: 12,
    backgroundColor: '#000',
  },
  wifiIcon: {
    width: 16,
    height: 12,
    backgroundColor: '#000',
  },
  batteryIcon: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 2,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#1a1a1a',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  coverImageSection: {
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  topLeftButtons: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyThisButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: BrandColors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buyThisText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
    transform: [{ translateY: 30 }],
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  profileTextInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 16,
    color: '#666',
  },
  macroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
  },
  categoriesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  categoryTag: {
    backgroundColor: BrandColors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtube: {
    backgroundColor: '#FF0000',
  },
  twitter: {
    backgroundColor: '#1DA1F2',
  },
  linkedin: {
    backgroundColor: '#0077B5',
  },
  github: {
    backgroundColor: '#333333',
  },
  statsSection: {
    backgroundColor: '#f8f8f8',
    marginHorizontal: -16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  statHeader: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  bioText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mediaPackageButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#ddd',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mediaPackageText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  socialStatsSection: {
    marginBottom: 80,
    paddingHorizontal: 16,
  },
  socialStatsHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  otherPlatforms: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  youtubeState: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: -4,
  },
  youtubeStatIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  followerCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  spacer: {
    flex: 1,
  },
  viewLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewLink: {
    fontSize: 14,
    color: '#666',
  },
  bottomNav: {
    backgroundColor: BrandColors.primary[500],
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
    paddingTop: 12,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeNavItem: {
    opacity: 1,
  },
  navText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 4,
  },
  activeNavText: {
    color: 'white',
  },
});

export default MarcusJohnsonDesktop;