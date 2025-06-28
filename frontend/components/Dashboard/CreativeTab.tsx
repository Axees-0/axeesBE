import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Color } from '@/GlobalStyles';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: string;
  duration: string;
  category: 'seo' | 'pr' | 'content' | 'design' | 'strategy';
  isPopular?: boolean;
}

export const CreativeTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const services: Service[] = [
    // SEO Services
    {
      id: 'seo-audit',
      title: 'SEO Audit & Strategy',
      description: 'Complete website audit with keyword research, competitor analysis, and actionable SEO roadmap.',
      icon: '🔍',
      price: '$2,500',
      duration: '2-3 weeks',
      category: 'seo',
      isPopular: true
    },
    {
      id: 'content-seo',
      title: 'SEO Content Creation',
      description: 'High-quality, SEO-optimized blog posts and landing pages that rank and convert.',
      icon: '📝',
      price: '$500/article',
      duration: '1 week',
      category: 'seo'
    },
    {
      id: 'local-seo',
      title: 'Local SEO Optimization',
      description: 'Optimize for local search results, Google My Business, and local directories.',
      icon: '📍',
      price: '$1,500',
      duration: '3-4 weeks',
      category: 'seo'
    },

    // PR Services
    {
      id: 'pr-campaign',
      title: 'PR Campaign Management',
      description: 'End-to-end PR campaign including media outreach, press releases, and relationship building.',
      icon: '📰',
      price: '$5,000/month',
      duration: '3-6 months',
      category: 'pr',
      isPopular: true
    },
    {
      id: 'media-outreach',
      title: 'Media Outreach',
      description: 'Targeted outreach to relevant journalists, bloggers, and media outlets in your industry.',
      icon: '📢',
      price: '$2,000',
      duration: '2-3 weeks',
      category: 'pr'
    },
    {
      id: 'crisis-management',
      title: 'Crisis Management',
      description: 'Rapid response PR strategy to protect and restore your brand reputation.',
      icon: '🛡️',
      price: '$3,500',
      duration: '1-2 weeks',
      category: 'pr'
    },

    // Content Services
    {
      id: 'content-strategy',
      title: 'Content Strategy & Planning',
      description: 'Comprehensive content calendar, strategy, and guidelines for consistent brand messaging.',
      icon: '📊',
      price: '$3,000',
      duration: '2-3 weeks',
      category: 'content'
    },
    {
      id: 'video-production',
      title: 'Video Content Production',
      description: 'Professional video content creation from concept to final edit for social media and campaigns.',
      icon: '🎥',
      price: '$2,500/video',
      duration: '2-4 weeks',
      category: 'content',
      isPopular: true
    },
    {
      id: 'social-content',
      title: 'Social Media Content Package',
      description: '30 days of custom social media content including graphics, captions, and posting schedule.',
      icon: '📱',
      price: '$1,200',
      duration: '1-2 weeks',
      category: 'content'
    },

    // Design Services
    {
      id: 'brand-identity',
      title: 'Brand Identity Design',
      description: 'Complete brand identity package including logo, colors, fonts, and brand guidelines.',
      icon: '🎨',
      price: '$4,500',
      duration: '3-4 weeks',
      category: 'design'
    },
    {
      id: 'web-design',
      title: 'Website Design & Development',
      description: 'Custom website design and development optimized for conversions and user experience.',
      icon: '💻',
      price: '$8,500',
      duration: '6-8 weeks',
      category: 'design'
    },
    {
      id: 'graphics-package',
      title: 'Marketing Graphics Package',
      description: 'Custom graphics for social media, ads, presentations, and marketing materials.',
      icon: '🖼️',
      price: '$800',
      duration: '1 week',
      category: 'design'
    },

    // Strategy Services
    {
      id: 'marketing-strategy',
      title: 'Digital Marketing Strategy',
      description: 'Comprehensive digital marketing strategy including channels, budgets, and KPIs.',
      icon: '🎯',
      price: '$4,000',
      duration: '2-3 weeks',
      category: 'strategy',
      isPopular: true
    },
    {
      id: 'influencer-strategy',
      title: 'Influencer Marketing Strategy',
      description: 'Strategic planning for influencer campaigns including creator selection and campaign optimization.',
      icon: '⭐',
      price: '$2,500',
      duration: '1-2 weeks',
      category: 'strategy'
    },
    {
      id: 'conversion-optimization',
      title: 'Conversion Rate Optimization',
      description: 'Analyze and optimize your funnels, landing pages, and user journey for better conversions.',
      icon: '📈',
      price: '$3,500',
      duration: '4-6 weeks',
      category: 'strategy'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Services', icon: '🏠' },
    { id: 'seo', name: 'SEO', icon: '🔍' },
    { id: 'pr', name: 'PR', icon: '📰' },
    { id: 'content', name: 'Content', icon: '📝' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'strategy', name: 'Strategy', icon: '🎯' }
  ];

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      Alert.alert(
        'Request Service',
        `Would you like to request a consultation for ${service.title}?`,
        [
          { text: 'Skip for Now', style: 'cancel' },
          { 
            text: 'Request Consultation', 
            onPress: () => requestConsultation(service)
          }
        ]
      );
    }
  };

  const requestConsultation = (service: Service) => {
    Alert.alert(
      'Consultation Requested',
      `Thank you! Our team will contact you within 24 hours to discuss your ${service.title} needs.`,
      [{ text: 'OK' }]
    );
  };

  const renderServiceCard = (service: Service) => (
    <TouchableOpacity
      key={service.id}
      style={[styles.serviceCard, service.isPopular && styles.popularService]}
      onPress={() => setExpandedService(expandedService === service.id ? null : service.id)}
    >
      {service.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>POPULAR</Text>
        </View>
      )}
      
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceIcon}>{service.icon}</Text>
        <View style={styles.serviceMainInfo}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.servicePrice}>{service.price}</Text>
        </View>
        <Text style={styles.serviceDuration}>{service.duration}</Text>
      </View>
      
      <Text style={styles.serviceDescription}>{service.description}</Text>
      
      {expandedService === service.id && (
        <View style={styles.expandedContent}>
          <View style={styles.serviceFeatures}>
            <Text style={styles.featuresTitle}>What's Included:</Text>
            {getServiceFeatures(service.category).map((feature, index) => (
              <Text key={index} style={styles.featureItem}>• {feature}</Text>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.requestButton}
            onPress={() => handleServiceSelect(service.id)}
          >
            <Text style={styles.requestButtonText}>Request Consultation</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const getServiceFeatures = (category: string): string[] => {
    const features = {
      seo: [
        'Comprehensive website audit',
        'Keyword research & analysis',
        'Competitor analysis',
        'Technical SEO recommendations',
        'Content optimization strategy',
        'Monthly progress reports'
      ],
      pr: [
        'Media list development',
        'Press release writing',
        'Journalist outreach',
        'Media relationship building',
        'Coverage tracking & reporting',
        'Crisis communication planning'
      ],
      content: [
        'Content strategy development',
        'Editorial calendar creation',
        'SEO-optimized writing',
        'Social media adaptation',
        'Performance analytics',
        'Brand voice consistency'
      ],
      design: [
        'Custom design concepts',
        'Brand guidelines',
        'Multiple revisions included',
        'Source files provided',
        'Print & digital optimization',
        'Ongoing design support'
      ],
      strategy: [
        'Market research & analysis',
        'Competitive intelligence',
        'Goal setting & KPIs',
        'Channel strategy',
        'Budget allocation',
        'Implementation roadmap'
      ]
    };
    
    return features[category] || ['Comprehensive service delivery', 'Expert consultation', 'Detailed reporting'];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧠 Creative Services</Text>
        <Text style={styles.headerSubtitle}>
          Professional marketing agency services to amplify your campaigns
        </Text>
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Services List */}
      <ScrollView style={styles.servicesContainer} showsVerticalScrollIndicator={false}>
        {filteredServices.map(renderServiceCard)}
        
        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Need Custom Solutions?</Text>
          <Text style={styles.ctaDescription}>
            Our team can create bespoke marketing solutions tailored to your specific needs.
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => Alert.alert(
              'Custom Consultation',
              'Our strategists will contact you to discuss your unique requirements.',
              [{ text: 'OK' }]
            )}
          >
            <Text style={styles.ctaButtonText}>Schedule Custom Consultation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  categoriesContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: Color.cSK430B92500,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
  },
  servicesContainer: {
    flex: 1,
    padding: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  popularService: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  serviceMainInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.cSK430B92500,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  serviceFeatures: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
  requestButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaContainer: {
    backgroundColor: '#e7f3ff',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: Color.cSK430B92500,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreativeTab;