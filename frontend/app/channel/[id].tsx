import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  SafeAreaView,
  Alert,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

// Components
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { WebSEO } from '../web-seo';
import { Color, FontFamily, FontSize } from '@/GlobalStyles';
import DesignSystem from '@/styles/DesignSystem';
import { DemoData } from '@/demo/DemoData';
import { DEMO_MODE } from '@/demo/DemoMode';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  inStock: boolean;
}

interface VideoContent {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  uploadedAt: Date;
  products: Product[];
  sponsoredBrands: string[];
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
};

const ChannelPage: React.FC = () => {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isMobileScreen = width <= BREAKPOINTS.mobile;
  const isWeb = Platform.OS === 'web';

  // Video player state
  const video = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);

  // Mock video content
  const videoContent: VideoContent = {
    id: id as string,
    title: "Summer Fashion Haul 2024 - Best Trends",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    creatorId: "creator-001",
    creatorName: "Emma Thompson",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    description: "Check out my latest summer fashion haul featuring amazing pieces from top brands! All items are linked below 💖",
    views: 125000,
    likes: 8900,
    comments: 342,
    duration: "12:45",
    uploadedAt: new Date(Date.now() - 86400000),
    products: [
      {
        id: "prod-001",
        name: "Floral Summer Dress",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
        description: "Light and breezy summer dress perfect for any occasion",
        inStock: true,
      },
      {
        id: "prod-002",
        name: "Designer Sunglasses",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
        description: "UV protection with style",
        inStock: true,
      },
      {
        id: "prod-003",
        name: "Canvas Tote Bag",
        price: 45.00,
        image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400",
        description: "Eco-friendly and spacious",
        inStock: false,
      },
    ],
    sponsoredBrands: ["Fashion Nova", "Revolve", "ASOS"],
  };

  // Related videos
  const relatedVideos = [
    {
      id: "vid-002",
      title: "Fall Wardrobe Essentials",
      thumbnail: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
      creator: "Sarah Chen",
      views: 89000,
      duration: "10:23",
    },
    {
      id: "vid-003",
      title: "Sustainable Fashion Guide",
      thumbnail: "https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400",
      creator: "Mike Johnson",
      views: 156000,
      duration: "15:10",
    },
  ];

  // Handle video playback status
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);

      // Show buy now overlay at specific timestamps
      const currentSeconds = Math.floor(status.positionMillis / 1000);
      if ([5, 30, 60].includes(currentSeconds) && !showBuyNow) {
        setShowBuyNow(true);
        setTimeout(() => setShowBuyNow(false), 5000);
      }
    }
  };

  // Play/pause toggle
  const togglePlayPause = async () => {
    if (video.current) {
      if (isPlaying) {
        await video.current.pauseAsync();
      } else {
        await video.current.playAsync();
      }
    }
  };

  // Add to cart
  const addToCart = (product: Product) => {
    setCart([...cart, product]);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart!`);
  };

  // Like video toggle
  const toggleLike = () => {
    if (likedVideos.includes(videoContent.id)) {
      setLikedVideos(likedVideos.filter(id => id !== videoContent.id));
    } else {
      setLikedVideos([...likedVideos, videoContent.id]);
    }
  };

  // Format numbers
  const formatViews = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 1000 / 60 / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <>
      <WebSEO 
        title={`${videoContent.title} - Channel | Axees`}
        description={videoContent.description}
        keywords={`${videoContent.creatorName}, video, content, ${videoContent.sponsoredBrands.join(', ')}`}
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/explore" />
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowCart(!showCart)}
            >
              <MaterialIcons name="shopping-cart" size={24} color={Color.cSK430B92500} />
              {cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/profile/' + videoContent.creatorId)}
            >
              <Image 
                source={{ uri: videoContent.creatorAvatar }}
                style={styles.creatorAvatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Video Player Section */}
          <View style={styles.videoContainer}>
            <Video
              ref={video}
              style={styles.video}
              source={{ uri: videoContent.videoUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
            
            {/* Custom Controls Overlay */}
            <TouchableOpacity
              style={styles.videoOverlay}
              activeOpacity={1}
              onPress={() => setShowControls(!showControls)}
            >
              {showControls && (
                <View style={styles.controlsContainer}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayPause}
                  >
                    <MaterialIcons 
                      name={isPlaying ? "pause" : "play-arrow"} 
                      size={48} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            {/* Buy Now Overlay */}
            {showBuyNow && videoContent.products.length > 0 && (
              <View style={styles.buyNowOverlay}>
                <LinearGradient
                  colors={['rgba(67, 11, 146, 0.95)', 'rgba(139, 92, 246, 0.95)']}
                  style={styles.buyNowGradient}
                >
                  <View style={styles.buyNowContent}>
                    <Image 
                      source={{ uri: videoContent.products[0].image }}
                      style={styles.buyNowImage}
                    />
                    <View style={styles.buyNowInfo}>
                      <Text style={styles.buyNowTitle}>{videoContent.products[0].name}</Text>
                      <Text style={styles.buyNowPrice}>${videoContent.products[0].price}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.buyNowButton}
                      onPress={() => addToCart(videoContent.products[0])}
                    >
                      <Text style={styles.buyNowButtonText}>Buy Now</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Video Info */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{videoContent.title}</Text>
            
            <View style={styles.videoStats}>
              <Text style={styles.viewCount}>{formatViews(videoContent.views)} views</Text>
              <Text style={styles.uploadTime}>{formatTimeAgo(videoContent.uploadedAt)}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={toggleLike}
              >
                <MaterialIcons 
                  name={likedVideos.includes(videoContent.id) ? "thumb-up" : "thumb-up-off-alt"} 
                  size={24} 
                  color={likedVideos.includes(videoContent.id) ? Color.cSK430B92500 : "#666"} 
                />
                <Text style={styles.actionText}>{formatViews(videoContent.likes)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="comment" size={24} color="#666" />
                <Text style={styles.actionText}>{videoContent.comments}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="share" size={24} color="#666" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="bookmark-outline" size={24} color="#666" />
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Creator Info */}
            <TouchableOpacity 
              style={styles.creatorInfo}
              onPress={() => router.push('/profile/' + videoContent.creatorId)}
            >
              <Image 
                source={{ uri: videoContent.creatorAvatar }}
                style={styles.creatorInfoAvatar}
              />
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{videoContent.creatorName}</Text>
                <Text style={styles.creatorFollowers}>2.1M followers</Text>
              </View>
              <TouchableOpacity style={styles.subscribeButton}>
                <Text style={styles.subscribeText}>Subscribe</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Description */}
            <View style={styles.description}>
              <Text style={styles.descriptionText}>{videoContent.description}</Text>
              
              {/* Sponsored Brands */}
              {videoContent.sponsoredBrands.length > 0 && (
                <View style={styles.sponsoredSection}>
                  <Text style={styles.sponsoredTitle}>Featured Brands</Text>
                  <View style={styles.sponsoredBrands}>
                    {videoContent.sponsoredBrands.map((brand, index) => (
                      <View key={index} style={styles.brandChip}>
                        <MaterialIcons name="verified" size={14} color={Color.cSK430B92500} />
                        <Text style={styles.brandName}>{brand}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Products Section */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {videoContent.products.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <Image 
                    source={{ uri: product.image }}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productPrice}>${product.price}</Text>
                    <TouchableOpacity
                      style={[
                        styles.addToCartButton,
                        !product.inStock && styles.outOfStockButton
                      ]}
                      onPress={() => product.inStock && addToCart(product)}
                      disabled={!product.inStock}
                    >
                      <Text style={styles.addToCartText}>
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Related Videos */}
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>More Videos</Text>
            {relatedVideos.map((video) => (
              <TouchableOpacity 
                key={video.id}
                style={styles.relatedVideo}
                onPress={() => router.push('/channel/' + video.id)}
              >
                <Image 
                  source={{ uri: video.thumbnail }}
                  style={styles.relatedThumbnail}
                />
                <View style={styles.relatedInfo}>
                  <Text style={styles.relatedTitle} numberOfLines={2}>{video.title}</Text>
                  <Text style={styles.relatedCreator}>{video.creator}</Text>
                  <View style={styles.relatedStats}>
                    <Text style={styles.relatedViews}>{formatViews(video.views)} views</Text>
                    <Text style={styles.relatedDuration}>{video.duration}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Cart Sidebar */}
        {showCart && (
          <View style={styles.cartSidebar}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Shopping Cart ({cart.length})</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.cartItems}>
              {cart.map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <Image source={{ uri: item.image }} style={styles.cartItemImage} />
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>${item.price}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.cartFooter}>
              <Text style={styles.cartTotal}>
                Total: ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
              </Text>
              <TouchableOpacity style={styles.checkoutButton}>
                <Text style={styles.checkoutText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.AccessibleColors.borderLight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Color.cSK430B92500,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  buyNowGradient: {
    borderRadius: 12,
    padding: 16,
  },
  buyNowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyNowImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  buyNowInfo: {
    flex: 1,
  },
  buyNowTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buyNowPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buyNowButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buyNowButtonText: {
    color: Color.cSK430B92500,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    ...DesignSystem.Typography.h2,
    marginBottom: 8,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  viewCount: {
    ...DesignSystem.Typography.bodyMedium,
    color: DesignSystem.AccessibleColors.textSecondary,
  },
  uploadTime: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DesignSystem.AccessibleColors.borderLight,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    ...DesignSystem.Typography.caption,
    color: '#666',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.AccessibleColors.borderLight,
  },
  creatorInfoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    ...DesignSystem.Typography.bodyMedium,
    fontWeight: '600',
  },
  creatorFollowers: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
  subscribeButton: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subscribeText: {
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    paddingVertical: 16,
  },
  descriptionText: {
    ...DesignSystem.Typography.body,
    marginBottom: 12,
  },
  sponsoredSection: {
    marginTop: 12,
  },
  sponsoredTitle: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    marginBottom: 8,
  },
  sponsoredBrands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.AccessibleColors.backgroundSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  brandName: {
    ...DesignSystem.Typography.caption,
    fontWeight: '600',
  },
  productsSection: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.AccessibleColors.borderLight,
  },
  sectionTitle: {
    ...DesignSystem.Typography.h3,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  productCard: {
    width: 180,
    marginLeft: 16,
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...DesignSystem.Typography.bodyMedium,
    marginBottom: 4,
  },
  productPrice: {
    ...DesignSystem.Typography.h3,
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  addToCartButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  outOfStockButton: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '600',
  },
  relatedSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.AccessibleColors.borderLight,
  },
  relatedVideo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  relatedThumbnail: {
    width: 140,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  relatedInfo: {
    flex: 1,
  },
  relatedTitle: {
    ...DesignSystem.Typography.bodyMedium,
    fontWeight: '600',
    marginBottom: 4,
  },
  relatedCreator: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    marginBottom: 4,
  },
  relatedStats: {
    flexDirection: 'row',
    gap: 12,
  },
  relatedViews: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
  relatedDuration: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
  },
  cartSidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.AccessibleColors.borderLight,
  },
  cartTitle: {
    ...DesignSystem.Typography.h3,
  },
  cartItems: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    ...DesignSystem.Typography.bodyMedium,
    marginBottom: 4,
  },
  cartItemPrice: {
    ...DesignSystem.Typography.h3,
    color: Color.cSK430B92500,
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.AccessibleColors.borderLight,
  },
  cartTotal: {
    ...DesignSystem.Typography.h3,
    marginBottom: 12,
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ChannelPage;