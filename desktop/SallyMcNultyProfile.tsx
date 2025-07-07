import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Dimensions,
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

const SallyMcNultyProfile = () => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 1024;
  const isMobile = width <= 768;

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
      { name: "instagram", followers: "132K" }
    ]
  };

  // Responsive container style
  const containerStyle = [
    styles.container,
    isDesktop && styles.desktopWrapper,
    isMobile && styles.mobileContainer
  ];

  return (
    <View style={containerStyle}>
      <View style={[styles.profileContainer, isDesktop && styles.desktopProfileContainer]}>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* Profile Header with Racing Car */}
      <View style={styles.profileHeader}>
        <LinearGradient
          colors={['#e91e63', '#ad1457', '#8e24aa', '#673ab7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {/* Buy This Button */}
          <TouchableOpacity style={styles.buyThisButton}>
            <View style={styles.chainIcon} />
            <Text style={styles.buyThisText}>buythis</Text>
          </TouchableOpacity>

          {/* Racing Car */}
          <View style={styles.racingCar}>
            <View style={styles.carBody} />
            <View style={styles.carWindshield} />
            <View style={[styles.carWheel, styles.leftWheel]} />
            <View style={[styles.carWheel, styles.rightWheel]} />
            <View style={styles.carSpoiler} />
          </View>

          {/* Profile Info Overlay */}
          <View style={styles.profileOverlay}>
            <View style={styles.profileLeft}>
              {/* Custom Avatar */}
              <View style={styles.profileAvatar}>
                <View style={styles.avatarCap} />
                <View style={styles.avatarCapBrim} />
                <View style={styles.avatarFace} />
                <View style={styles.avatarEyes} />
                <View style={styles.avatarBody} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileData.name}</Text>
                <Text style={styles.profileUsername}>{profileData.username}</Text>
              </View>
            </View>
            <View style={styles.profileRight}>
              <Text style={styles.macroText}>Macro</Text>
              <Text style={styles.linkIcon}>🔗</Text>
            </View>
          </View>
        </LinearGradient>
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
          <View style={[styles.socialIcon, styles.youtube]}>
            <View style={styles.youtubePlay} />
          </View>
          <View style={[styles.socialIcon, styles.instagram]}>
            <View style={styles.instagramCamera} />
            <View style={styles.instagramLens} />
          </View>
          <View style={[styles.socialIcon, styles.tiktok]}>
            <View style={styles.tiktokNote} />
          </View>
          <View style={[styles.socialIcon, styles.facebook]}>
            <Text style={styles.facebookF}>f</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeaders}>
            <Text style={styles.statHeader}>TOTAL FOLLOWERS</Text>
            <Text style={styles.statHeader}>LISTED EVENTS</Text>
            <Text style={styles.statHeader}>COMBINED VIEWS</Text>
            <Text style={styles.statHeader}>OFFERS</Text>
            <Text style={styles.statHeader}>DEALS</Text>
          </View>
          <View style={styles.statsValues}>
            <Text style={styles.statValue}>{profileData.stats.totalFollowers}</Text>
            <Text style={styles.statValue}>{profileData.stats.listedEvents}</Text>
            <Text style={styles.statValue}>{profileData.stats.combinedViews}</Text>
            <Text style={styles.statValue}>{profileData.stats.offers}</Text>
            <Text style={styles.statValue}>{profileData.stats.deals}</Text>
          </View>
        </View>

        {/* Bio */}
        <Text style={styles.bioText}>{profileData.bio}</Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.mediaPackageButton}>
            <Text style={styles.mediaPackageText}>⬇ Media Package</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Social Stats */}
        <View style={styles.socialStatsSection}>
          <Text style={styles.socialStatsHeader}>Social Stats</Text>
          <Text style={styles.otherPlatforms}>Other Platforms</Text>
          <View style={styles.instagramStat}>
            <View style={styles.instagramStatIcon}>
              <Text style={styles.instagramStatText}>📷</Text>
            </View>
            <Text style={styles.followerCount}>132K</Text>
            <View style={styles.spacer} />
            <Text style={styles.viewLink}>View 🔗</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <View style={[styles.navIcon, styles.exploreIcon]} />
          <Text style={styles.navText}>Explore</Text>
        </View>
        <View style={styles.navItem}>
          <View style={[styles.navIcon, styles.dealsIcon]} />
          <Text style={styles.navText}>Deals/Offers</Text>
        </View>
        <View style={styles.navItem}>
          <View style={[styles.navIcon, styles.messagesIcon]} />
          <Text style={styles.navText}>Messages</Text>
        </View>
        <View style={styles.navItem}>
          <View style={[styles.navIcon, styles.notificationsIcon]} />
          <Text style={styles.navText}>Notifications</Text>
        </View>
        <View style={[styles.navItem, styles.activeNavItem]}>
          <View style={[styles.navIcon, styles.profileIcon]} />
          <Text style={styles.navText}>Profile</Text>
        </View>
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
    maxWidth: 440,
    alignSelf: 'center',
  },
  profileContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
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
    position: 'relative',
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    fontSize: 18,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  profileHeader: {
    height: 140,
    position: 'relative',
    zIndex: 1,
  },
  gradientBackground: {
    flex: 1,
    position: 'relative',
    zIndex: 0,
  },
  buyThisButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#673ab7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 30,
  },
  chainIcon: {
    width: 14,
    height: 14,
    backgroundColor: 'white',
  },
  buyThisText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  racingCar: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    width: 140,
    height: 70,
    zIndex: 10,
  },
  carBody: {
    width: 140,
    height: 40,
    backgroundColor: '#ff1493',
    borderRadius: 12,
    position: 'absolute',
    bottom: 10,
  },
  carWindshield: {
    width: 90,
    height: 25,
    backgroundColor: '#ff69b4',
    borderRadius: 8,
    position: 'absolute',
    top: 10,
    left: 25,
  },
  carWheel: {
    width: 20,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    position: 'absolute',
    bottom: 5,
  },
  leftWheel: {
    left: 15,
  },
  rightWheel: {
    right: 15,
  },
  carSpoiler: {
    width: 30,
    height: 12,
    backgroundColor: '#8b008b',
    borderRadius: 2,
    position: 'absolute',
    top: 5,
    right: 5,
  },
  profileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
    zIndex: 20,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d4af8c',
    borderWidth: 3,
    borderColor: 'white',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarCap: {
    position: 'absolute',
    top: 5,
    left: 15,
    right: 15,
    height: 28,
    backgroundColor: '#2c2c2c',
    borderRadius: 14,
  },
  avatarCapBrim: {
    position: 'absolute',
    top: 25,
    left: -3,
    right: -3,
    height: 10,
    backgroundColor: '#3a3a3a',
    borderRadius: 25,
  },
  avatarFace: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    bottom: 35,
    backgroundColor: '#f4d1ae',
    borderRadius: 25,
  },
  avatarEyes: {
    position: 'absolute',
    top: 28,
    left: 28,
    right: 28,
    height: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarBody: {
    position: 'absolute',
    top: 42,
    left: 8,
    right: 8,
    bottom: 5,
    backgroundColor: '#4a4a4a',
    borderRadius: 20,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  profileRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  macroText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '600',
  },
  linkIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 24,
  },
  categoriesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryTag: {
    backgroundColor: '#673ab7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  categoryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  youtube: {
    backgroundColor: '#ff0000',
  },
  youtubePlay: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'white',
    borderTopWidth: 4,
    borderTopColor: 'transparent',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
    marginLeft: 1,
  },
  instagram: {
    backgroundColor: '#e1306c',
  },
  instagramCamera: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 3,
  },
  instagramLens: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 2,
  },
  tiktok: {
    backgroundColor: '#000',
  },
  tiktokNote: {
    width: 12,
    height: 16,
    backgroundColor: '#ff0050',
    borderRadius: 2,
  },
  facebook: {
    backgroundColor: '#1877f2',
  },
  facebookF: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statHeader: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  statsValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  bioText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  mediaPackageButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#673ab7',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  mediaPackageText: {
    color: '#673ab7',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#673ab7',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  editProfileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  socialStatsSection: {
    marginBottom: 20,
  },
  socialStatsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  otherPlatforms: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
  },
  instagramStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instagramStatIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#e1306c',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramStatText: {
    fontSize: 12,
  },
  followerCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  spacer: {
    flex: 1,
  },
  viewLink: {
    fontSize: 12,
    color: '#666',
  },
  bottomNav: {
    backgroundColor: '#673ab7',
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
  },
  navItem: {
    alignItems: 'center',
  },
  activeNavItem: {
    opacity: 1,
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  exploreIcon: {
    borderRadius: 12,
  },
  dealsIcon: {
    borderRadius: 2,
  },
  messagesIcon: {
    borderRadius: 8,
  },
  notificationsIcon: {
    borderRadius: 8,
  },
  profileIcon: {
    borderRadius: 12,
    backgroundColor: 'white',
  },
  navText: {
    color: 'white',
    fontSize: 10,
  },
});

export default SallyMcNultyProfile;