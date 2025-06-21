import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';

// Icons
import ArrowLeft from '@/assets/arrowleft021.svg';

interface PreMadeOffer {
  id: string;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  includes: string[];
  category: string;
  popular?: boolean;
}

const PreMadeOffersPage: React.FC = () => {
  const { creatorId } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  // Demo pre-made offer templates
  const preMadeOffers: PreMadeOffer[] = [
    {
      id: 'social-media-post',
      title: 'Social Media Post',
      description: 'Single Instagram post with your product/service featuring professional photography',
      price: 500,
      deliveryDays: 3,
      includes: ['1 Instagram post', 'Professional photos', 'Caption writing', 'Hashtag research'],
      category: 'Social Media',
      popular: true,
    },
    {
      id: 'story-series',
      title: 'Instagram Story Series',
      description: '5-part Instagram story series showcasing your brand with engaging content',
      price: 750,
      deliveryDays: 5,
      includes: ['5 Instagram stories', 'Interactive elements', 'Swipe-up links', 'Story highlights'],
      category: 'Social Media',
    },
    {
      id: 'video-review',
      title: 'Product Review Video',
      description: 'Detailed video review of your product with honest feedback and demonstration',
      price: 1200,
      deliveryDays: 7,
      includes: ['60-second video', 'Product demonstration', 'Honest review', 'Multiple takes'],
      category: 'Video Content',
      popular: true,
    },
    {
      id: 'unboxing-video',
      title: 'Unboxing Experience',
      description: 'Exciting unboxing video showing first impressions and product features',
      price: 800,
      deliveryDays: 5,
      includes: ['Unboxing video', 'First impressions', 'Feature highlights', 'Reaction content'],
      category: 'Video Content',
    },
    {
      id: 'brand-integration',
      title: 'Brand Integration Package',
      description: 'Comprehensive brand integration across multiple posts and stories',
      price: 2000,
      deliveryDays: 10,
      includes: ['3 feed posts', '10 stories', 'IGTV video', 'Brand mention guarantee'],
      category: 'Package Deal',
    },
    {
      id: 'event-coverage',
      title: 'Event Coverage',
      description: 'Live coverage of your event or product launch with real-time posting',
      price: 1500,
      deliveryDays: 1,
      includes: ['Live posting', 'Story coverage', 'Event highlights', 'Real-time engagement'],
      category: 'Live Content',
    },
  ];

  const handleOfferSelect = (offer: PreMadeOffer) => {
    setSelectedOffer(offer.id);
    // Navigate to offer details/configuration page
    router.push({
      pathname: '/offers/details',
      params: {
        creatorId,
        offerId: offer.id,
        offerType: 'premade'
      }
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Social Media': '#E91E63',
      'Video Content': '#9C27B0',
      'Package Deal': '#FF9800',
      'Live Content': '#4CAF50',
    };
    return colors[category] || '#757575';
  };

  return (
    <>
      <WebSEO 
        title="Pre-Made Offers | Axees"
        description="Choose from curated offer templates for creator collaborations"
        keywords="offers, templates, creator collaboration, influencer marketing"
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
          
          <Text style={styles.headerTitle}>Pre-Made Offers</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Choose Your Collaboration Type</Text>
            <Text style={styles.descriptionText}>
              Select from our curated offer templates. Each template is designed for specific campaign types and can be customized to your needs.
            </Text>
          </View>

          {/* Offer Categories */}
          <View style={styles.offersGrid}>
            {preMadeOffers.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                style={[
                  styles.offerCard,
                  selectedOffer === offer.id && styles.selectedOfferCard
                ]}
                onPress={() => handleOfferSelect(offer)}
              >
                {offer.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(offer.category) }]}>
                    <Text style={styles.categoryText}>{offer.category}</Text>
                  </View>
                </View>
                
                <Text style={styles.offerDescription}>{offer.description}</Text>
                
                <View style={styles.offerDetails}>
                  <View style={styles.priceSection}>
                    <Text style={styles.priceLabel}>Starting at</Text>
                    <Text style={styles.priceValue}>{formatPrice(offer.price)}</Text>
                  </View>
                  
                  <View style={styles.deliverySection}>
                    <Text style={styles.deliveryText}>
                      {offer.deliveryDays} day{offer.deliveryDays > 1 ? 's' : ''} delivery
                    </Text>
                  </View>
                </View>
                
                <View style={styles.includesSection}>
                  <Text style={styles.includesTitle}>Includes:</Text>
                  {offer.includes.slice(0, 3).map((item, index) => (
                    <Text key={index} style={styles.includeItem}>• {item}</Text>
                  ))}
                  {offer.includes.length > 3 && (
                    <Text style={styles.moreItems}>+{offer.includes.length - 3} more</Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => handleOfferSelect(offer)}
                >
                  <Text style={styles.selectButtonText}>Select & Configure</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Custom Offer Option */}
          <View style={styles.customOfferSection}>
            <Text style={styles.customOfferTitle}>Need Something Different?</Text>
            <Text style={styles.customOfferDescription}>
              Create a custom offer tailored to your specific needs and campaign goals.
            </Text>
            
            <TouchableOpacity 
              style={styles.customOfferButton}
              onPress={() => router.push({
                pathname: '/offers/custom',
                params: { creatorId }
              })}
            >
              <Text 
                style={styles.customOfferButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Create Custom Offer
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
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
    marginRight: 40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  descriptionSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  offersGrid: {
    padding: 20,
    gap: 16,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedOfferCard: {
    borderColor: Color.cSK430B92500,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceSection: {
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  deliverySection: {
    alignItems: 'flex-end',
  },
  deliveryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  includesSection: {
    marginBottom: 20,
  },
  includesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  includeItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 14,
    color: Color.cSK430B92500,
    fontWeight: '500',
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  customOfferSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
  },
  customOfferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 8,
  },
  customOfferDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  customOfferButton: {
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  customOfferButtonText: {
    color: Color.cSK430B92500,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});

export default PreMadeOffersPage;