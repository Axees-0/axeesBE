import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

interface CreativeService {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: string;
  duration: string;
  category: 'video' | 'photo' | 'design' | 'writing' | 'strategy';
  isPopular?: boolean;
  deliverables: string[];
  samples: string[];
}

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  services: string[];
  totalPrice: string;
  timeframe: string;
}

export const CreativeServices = () => {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  const services: CreativeService[] = [
    {
      id: 'video-1',
      title: 'UGC Video Creation',
      description: 'Professional user-generated content videos with authentic storytelling',
      icon: 'videocam',
      price: '$299-599',
      duration: '5-7 days',
      category: 'video',
      isPopular: true,
      deliverables: ['15-30s Video', 'Raw Footage', '3 Versions'],
      samples: ['sample1.mp4', 'sample2.mp4']
    },
    {
      id: 'video-2',
      title: 'Product Demo Videos',
      description: 'Engaging product demonstrations that showcase features and benefits',
      icon: 'play-circle',
      price: '$399-799',
      duration: '7-10 days',
      category: 'video',
      deliverables: ['Product Demo', 'Tutorial Style', 'CTA Overlay'],
      samples: ['demo1.mp4', 'demo2.mp4']
    },
    {
      id: 'photo-1',
      title: 'Lifestyle Photography',
      description: 'High-quality lifestyle photos featuring your product in natural settings',
      icon: 'camera',
      price: '$199-399',
      duration: '3-5 days',
      category: 'photo',
      isPopular: true,
      deliverables: ['10-15 Photos', 'Edited & Unedited', 'Multiple Angles'],
      samples: ['photo1.jpg', 'photo2.jpg']
    },
    {
      id: 'photo-2',
      title: 'Product Flat Lays',
      description: 'Aesthetic flat lay photography perfect for social media',
      icon: 'images',
      price: '$149-299',
      duration: '2-3 days',
      category: 'photo',
      deliverables: ['5-8 Styled Photos', 'Different Compositions', 'Social Ready'],
      samples: ['flatlay1.jpg', 'flatlay2.jpg']
    },
    {
      id: 'design-1',
      title: 'Social Media Graphics',
      description: 'Custom graphics and templates for your social media campaigns',
      icon: 'color-palette',
      price: '$99-199',
      duration: '2-4 days',
      category: 'design',
      deliverables: ['5-10 Graphics', 'Instagram & TikTok Sizes', 'Brand Aligned'],
      samples: ['graphic1.png', 'graphic2.png']
    },
    {
      id: 'design-2',
      title: 'Brand Assets Package',
      description: 'Complete brand asset package including logos, colors, and guidelines',
      icon: 'brush',
      price: '$499-999',
      duration: '7-14 days',
      category: 'design',
      isPopular: true,
      deliverables: ['Logo Variations', 'Color Palette', 'Brand Guidelines'],
      samples: ['brand1.pdf', 'brand2.pdf']
    },
    {
      id: 'writing-1',
      title: 'Caption Writing',
      description: 'Engaging captions that drive engagement and conversions',
      icon: 'create',
      price: '$49-99',
      duration: '1-2 days',
      category: 'writing',
      deliverables: ['10-20 Captions', 'Hashtag Research', 'CTA Included'],
      samples: ['captions1.txt', 'captions2.txt']
    },
    {
      id: 'writing-2',
      title: 'Blog Content Creation',
      description: 'SEO-optimized blog posts that establish thought leadership',
      icon: 'document-text',
      price: '$199-399',
      duration: '5-7 days',
      category: 'writing',
      deliverables: ['1500-3000 Words', 'SEO Optimized', 'Research Included'],
      samples: ['blog1.pdf', 'blog2.pdf']
    },
    {
      id: 'strategy-1',
      title: 'Content Strategy Plan',
      description: 'Comprehensive content strategy tailored to your brand goals',
      icon: 'analytics',
      price: '$399-799',
      duration: '7-10 days',
      category: 'strategy',
      isPopular: true,
      deliverables: ['30-Day Calendar', 'Content Pillars', 'Performance KPIs'],
      samples: ['strategy1.pdf', 'strategy2.pdf']
    },
    {
      id: 'strategy-2',
      title: 'Influencer Campaign Plan',
      description: 'Strategic influencer campaign planning and execution roadmap',
      icon: 'people',
      price: '$299-599',
      duration: '5-7 days',
      category: 'strategy',
      deliverables: ['Campaign Brief', 'Influencer List', 'Timeline & Budget'],
      samples: ['campaign1.pdf', 'campaign2.pdf']
    }
  ];

  const templates: ServiceTemplate[] = [
    {
      id: 'template-1',
      name: 'Product Launch Package',
      description: 'Complete package for launching a new product',
      services: ['video-1', 'photo-1', 'design-1', 'strategy-1'],
      totalPrice: '$999',
      timeframe: '14 days'
    },
    {
      id: 'template-2',
      name: 'Social Media Boost',
      description: 'Enhance your social media presence with content and strategy',
      services: ['photo-2', 'design-1', 'writing-1', 'strategy-2'],
      totalPrice: '$599',
      timeframe: '10 days'
    },
    {
      id: 'template-3',
      name: 'Brand Identity Starter',
      description: 'Build your brand from the ground up',
      services: ['design-2', 'writing-2', 'strategy-1'],
      totalPrice: '$899',
      timeframe: '21 days'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Services', icon: 'apps' },
    { id: 'video', name: 'Video', icon: 'videocam' },
    { id: 'photo', name: 'Photography', icon: 'camera' },
    { id: 'design', name: 'Design', icon: 'color-palette' },
    { id: 'writing', name: 'Writing', icon: 'create' },
    { id: 'strategy', name: 'Strategy', icon: 'analytics' }
  ];

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = searchText === '' || 
      service.title.toLowerCase().includes(searchText.toLowerCase()) ||
      service.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleServiceSelect = (serviceId: string) => {
    const newSelection = new Set(selectedServices);
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId);
    } else {
      newSelection.add(serviceId);
    }
    setSelectedServices(newSelection);
  };

  const handleTemplateSelect = (template: ServiceTemplate) => {
    Alert.alert(
      'Select Template',
      `Would you like to add all services from "${template.name}" to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add to Cart', 
          onPress: () => {
            const newSelection = new Set(selectedServices);
            template.services.forEach(serviceId => newSelection.add(serviceId));
            setSelectedServices(newSelection);
            Alert.alert('Success', `Added ${template.name} services to your selection`);
          }
        }
      ]
    );
  };

  const getIconComponent = (iconName: string, size: number = 24, color: string = '#430B92') => {
    const iconProps = { size, color };
    switch (iconName) {
      case 'videocam':
        return <Ionicons name="videocam" {...iconProps} />;
      case 'play-circle':
        return <Ionicons name="play-circle" {...iconProps} />;
      case 'camera':
        return <Ionicons name="camera" {...iconProps} />;
      case 'images':
        return <Ionicons name="images" {...iconProps} />;
      case 'color-palette':
        return <Ionicons name="color-palette" {...iconProps} />;
      case 'brush':
        return <Ionicons name="brush" {...iconProps} />;
      case 'create':
        return <Ionicons name="create" {...iconProps} />;
      case 'document-text':
        return <Ionicons name="document-text" {...iconProps} />;
      case 'analytics':
        return <Ionicons name="analytics" {...iconProps} />;
      case 'people':
        return <Ionicons name="people" {...iconProps} />;
      case 'apps':
        return <Ionicons name="apps" {...iconProps} />;
      default:
        return <Ionicons name="star" {...iconProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Creative Services</Text>
        <Text style={styles.headerSubtitle}>Professional content creation for your brand</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              {getIconComponent(category.icon, 20, selectedCategory === category.id ? '#ffffff' : '#666')}
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Templates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="layers" size={20} color="#430B92" /> Service Templates
          </Text>
          <Text style={styles.sectionSubtitle}>Pre-built packages for common needs</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.templateContainer}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateTitle}>{template.name}</Text>
                    <Text style={styles.templatePrice}>{template.totalPrice}</Text>
                  </View>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                  <Text style={styles.templateTimeframe}>⏱️ {template.timeframe}</Text>
                  <Text style={styles.templateServices}>
                    {template.services.length} services included
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Services Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="grid" size={20} color="#430B92" /> Individual Services
          </Text>
          <Text style={styles.sectionSubtitle}>
            Found {filteredServices.length} services • {selectedServices.size} selected
          </Text>

          <View style={styles.servicesGrid}>
            {filteredServices.map((service) => {
              const isSelected = selectedServices.has(service.id);
              return (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                  onPress={() => handleServiceSelect(service.id)}
                >
                  {service.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.selectionCheckbox}
                    onPress={() => handleServiceSelect(service.id)}
                  >
                    {isSelected ? (
                      <Ionicons name="checkbox" size={24} color="#430B92" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#ccc" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.serviceIcon}>
                    {getIconComponent(service.icon, 32)}
                  </View>

                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>

                  <View style={styles.serviceDetails}>
                    <Text style={styles.servicePrice}>{service.price}</Text>
                    <Text style={styles.serviceDuration}>⏰ {service.duration}</Text>
                  </View>

                  <View style={styles.deliverables}>
                    <Text style={styles.deliverablesTitle}>Deliverables:</Text>
                    {service.deliverables.map((item, index) => (
                      <Text key={index} style={styles.deliverableItem}>• {item}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {selectedServices.size > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.actionText}>
            {selectedServices.size} service{selectedServices.size !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity 
            style={styles.requestQuoteButton}
            onPress={() => Alert.alert('Quote Request', 'Feature coming soon!')}
          >
            <Text style={styles.requestQuoteText}>Request Quote</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoryScroll: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  categoryButtonActive: {
    backgroundColor: '#430B92',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  mainContent: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  templateContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  templateCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 280,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  templatePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#430B92',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  templateTimeframe: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  templateServices: {
    fontSize: 12,
    color: '#430B92',
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  serviceCardSelected: {
    borderColor: '#430B92',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  serviceIcon: {
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    marginBottom: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#430B92',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#666',
  },
  deliverables: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  deliverablesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deliverableItem: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  requestQuoteButton: {
    backgroundColor: '#430B92',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  requestQuoteText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});