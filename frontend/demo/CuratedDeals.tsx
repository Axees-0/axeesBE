/**
 * Curated Deals List for Demo
 * Simplified creator deals interface showing high-value opportunities
 */

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
import { DEMO_MODE, demoLog } from './DemoMode';
import { DemoData } from './DemoData';

const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function CuratedDeals() {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINTS.TABLET;
  const isMobile = width < BREAKPOINTS.TABLET;

  // Curated high-value deals for demo
  const curatedDeals = [
    {
      id: 'demo-deal-1',
      offerName: 'Summer Collection Launch 2024',
      brandName: 'TechStyle Brand',
      amount: 5000,
      platforms: ['instagram', 'tiktok'],
      description: 'Showcase our vibrant summer collection with authentic lifestyle content...',
      status: 'Available',
      applicants: 23,
      brandLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
      featured: true,
    },
    {
      id: 'demo-deal-2', 
      offerName: 'Tech Product Launch',
      brandName: 'Innovation Co',
      amount: 3500,
      platforms: ['youtube', 'instagram'],
      description: 'Review our latest tech product and show real-world usage...',
      status: 'Available',
      applicants: 18,
      brandLogo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop&crop=face',
      featured: false,
    },
    {
      id: 'demo-deal-3',
      offerName: 'Fitness Challenge Campaign', 
      brandName: 'ActiveLife',
      amount: 2800,
      platforms: ['tiktok', 'instagram'],
      description: 'Document your 30-day fitness journey using our equipment...',
      status: 'Available',
      applicants: 31,
      brandLogo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=face',
      featured: false,
    },
  ];

  const handleDealPress = (deal: any) => {
    if (DEMO_MODE) {
      demoLog(`Opening curated deal: ${deal.offerName}`);
      // Navigate to the demo offer details
      router.push({
        pathname: '/UOM10CreatorOfferDetails',
        params: { offerId: deal.id },
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return require('@/assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png');
      case 'youtube':
        return require('@/assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png');
      case 'tiktok':
        return require('@/assets/tiktok-icon.png');
      default:
        return require('@/assets/letter-s.png');
    }
  };

  if (!DEMO_MODE) {
    return null; // Only show in demo mode
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, isWide && styles.wideContent]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>High-Value Opportunities</Text>
            <Text style={styles.pageSubtitle}>Curated deals from premium brands</Text>
          </View>

          {/* Featured Deal */}
          {curatedDeals
            .filter(deal => deal.featured)
            .map((deal) => (
              <TouchableOpacity
                key={deal.id}
                style={styles.featuredDeal}
                onPress={() => handleDealPress(deal)}
              >
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>⭐ FEATURED</Text>
                </View>
                
                <View style={styles.dealHeader}>
                  <Image
                    source={{ uri: deal.brandLogo }}
                    style={styles.brandLogo}
                    placeholder={require('@/assets/empty-image.png')}
                  />
                  <View style={styles.dealInfo}>
                    <Text style={styles.dealTitle}>{deal.offerName}</Text>
                    <Text style={styles.brandName}>{deal.brandName}</Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={styles.dealAmount}>${deal.amount.toLocaleString()}</Text>
                    <Text style={styles.amountLabel}>Offer</Text>
                  </View>
                </View>

                <View style={styles.platformsRow}>
                  {deal.platforms.map((platform, index) => (
                    <View key={index} style={styles.platformBadge}>
                      <Image
                        source={getPlatformIcon(platform)}
                        style={styles.platformIcon}
                      />
                    </View>
                  ))}
                  <Text style={styles.applicantsText}>
                    {deal.applicants} creators applied
                  </Text>
                </View>

                <Text style={styles.dealDescription} numberOfLines={2}>
                  {deal.description}
                </Text>

                <View style={styles.actionContainer}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{deal.status}</Text>
                  </View>
                  <Text style={styles.ctaText}>Tap to view details →</Text>
                </View>
              </TouchableOpacity>
            ))}

          {/* Regular Deals */}
          <Text style={styles.sectionTitle}>More Opportunities</Text>
          {curatedDeals
            .filter(deal => !deal.featured)
            .map((deal) => (
              <TouchableOpacity
                key={deal.id}
                style={styles.dealCard}
                onPress={() => handleDealPress(deal)}
              >
                <View style={styles.dealHeader}>
                  <Image
                    source={{ uri: deal.brandLogo }}
                    style={styles.brandLogoSmall}
                    placeholder={require('@/assets/empty-image.png')}
                  />
                  <View style={styles.dealInfo}>
                    <Text style={styles.dealTitleSmall}>{deal.offerName}</Text>
                    <Text style={styles.brandNameSmall}>{deal.brandName}</Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={styles.dealAmountSmall}>${deal.amount.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.platformsRowSmall}>
                  {deal.platforms.map((platform, index) => (
                    <Image
                      key={index}
                      source={getPlatformIcon(platform)}
                      style={styles.platformIconSmall}
                    />
                  ))}
                  <Text style={styles.applicantsTextSmall}>
                    {deal.applicants} applied
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

          {/* Success Message */}
          <View style={styles.successNote}>
            <Text style={styles.successTitle}>🎯 Perfect Match Zone</Text>
            <Text style={styles.successText}>
              You're seeing premium deals that match your 156K followers and 8.7% engagement rate
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  wideContent: {
    marginHorizontal: '10%',
  },
  header: {
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6C6C6C',
  },
  featuredDeal: {
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#430B92',
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#430B92',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    marginTop: 8,
  },
  dealCard: {
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2D0FB',
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  brandLogoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  dealInfo: {
    flex: 1,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  dealTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
    color: '#6C6C6C',
  },
  brandNameSmall: {
    fontSize: 12,
    color: '#6C6C6C',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  dealAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#430B92',
  },
  dealAmountSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#430B92',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6C6C6C',
  },
  platformsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformsRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformBadge: {
    width: 30,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  platformIcon: {
    width: 18,
    height: 18,
  },
  platformIconSmall: {
    width: 16,
    height: 16,
  },
  applicantsText: {
    fontSize: 12,
    color: '#6C6C6C',
    marginLeft: 'auto',
  },
  applicantsTextSmall: {
    fontSize: 11,
    color: '#6C6C6C',
    marginLeft: 'auto',
  },
  dealDescription: {
    fontSize: 14,
    color: '#6C6C6C',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ctaText: {
    color: '#430B92',
    fontSize: 14,
    fontWeight: '500',
  },
  successNote: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 20,
  },
});