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

interface PerformanceService {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: string;
  duration: string;
  category: 'analytics' | 'seo' | 'ads' | 'consulting' | 'automation';
  isPopular?: boolean;
  deliverables: string[];
  metrics: {
    avgIncrease: string;
    timeToSeeResults: string;
  };
}

interface PerformanceTemplate {
  id: string;
  name: string;
  description: string;
  services: string[];
  totalPrice: string;
  timeframe: string;
  expectedResults: string;
}

interface PerformanceGraph {
  title: string;
  data: Array<{ month: string; value: number }>;
  unit: string;
}

export const PerformanceServices = () => {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  const services: PerformanceService[] = [
    {
      id: 'analytics-1',
      title: 'Performance Analytics Setup',
      description: 'Comprehensive analytics setup and tracking for your campaigns',
      icon: 'analytics',
      price: '$199-399',
      duration: '3-5 days',
      category: 'analytics',
      isPopular: true,
      deliverables: ['Google Analytics Setup', 'Conversion Tracking', 'Custom Dashboard'],
      metrics: {
        avgIncrease: '1% improvement in ROI tracking',
        timeToSeeResults: '1-2 weeks'
      }
    },
    {
      id: 'analytics-2',
      title: 'ROI Optimization Analysis',
      description: 'Deep dive analysis to optimize your return on investment',
      icon: 'trending-up',
      price: '$299-599',
      duration: '5-7 days',
      category: 'analytics',
      deliverables: ['ROI Report', 'Optimization Plan', 'Monthly Reviews'],
      metrics: {
        avgIncrease: '1% ROI improvement',
        timeToSeeResults: '2-4 weeks'
      }
    },
    {
      id: 'seo-1',
      title: 'SEO Audit & Strategy',
      description: 'Complete SEO audit with actionable optimization strategy',
      icon: 'search',
      price: '$399-799',
      duration: '7-10 days',
      category: 'seo',
      isPopular: true,
      deliverables: ['Technical Audit', 'Keyword Strategy', 'Content Plan'],
      metrics: {
        avgIncrease: '1% increase in organic traffic',
        timeToSeeResults: '3-6 months'
      }
    },
    {
      id: 'seo-2',
      title: 'Local SEO Optimization',
      description: 'Optimize your local search presence and Google My Business',
      icon: 'location',
      price: '$299-599',
      duration: '5-7 days',
      category: 'seo',
      deliverables: ['GMB Optimization', 'Local Citations', 'Review Strategy'],
      metrics: {
        avgIncrease: '1% increase in local visibility',
        timeToSeeResults: '1-3 months'
      }
    },
    {
      id: 'ads-1',
      title: 'Paid Ads Campaign Setup',
      description: 'Professional setup and optimization of your paid advertising campaigns',
      icon: 'megaphone',
      price: '$499-999',
      duration: '7-14 days',
      category: 'ads',
      isPopular: true,
      deliverables: ['Campaign Setup', 'Ad Copy', 'Landing Page Review'],
      metrics: {
        avgIncrease: '1% improvement in CTR',
        timeToSeeResults: '1-2 weeks'
      }
    },
    {
      id: 'ads-2',
      title: 'Retargeting Campaign Setup',
      description: 'Strategic retargeting campaigns to convert warm leads',
      icon: 'refresh',
      price: '$299-699',
      duration: '5-7 days',
      category: 'ads',
      deliverables: ['Audience Setup', 'Creative Strategy', 'Funnel Optimization'],
      metrics: {
        avgIncrease: '1% increase in conversions',
        timeToSeeResults: '1-3 weeks'
      }
    },
    {
      id: 'consulting-1',
      title: 'Business Strategy Consultation',
      description: 'Strategic consultation to optimize your business processes',
      icon: 'people',
      price: '$599-1199',
      duration: '10-14 days',
      category: 'consulting',
      deliverables: ['Strategy Report', 'Action Plan', 'Monthly Check-ins'],
      metrics: {
        avgIncrease: '1% efficiency improvement',
        timeToSeeResults: '2-4 weeks'
      }
    },
    {
      id: 'consulting-2',
      title: 'Conversion Rate Optimization',
      description: 'Optimize your website and funnels for maximum conversions',
      icon: 'funnel',
      price: '$399-899',
      duration: '7-10 days',
      category: 'consulting',
      isPopular: true,
      deliverables: ['CRO Audit', 'A/B Test Plan', 'Implementation Guide'],
      metrics: {
        avgIncrease: '1% conversion rate increase',
        timeToSeeResults: '2-6 weeks'
      }
    },
    {
      id: 'automation-1',
      title: 'Marketing Automation Setup',
      description: 'Automate your marketing processes for better efficiency',
      icon: 'settings',
      price: '$499-999',
      duration: '7-14 days',
      category: 'automation',
      deliverables: ['Workflow Setup', 'Email Sequences', 'Integration Testing'],
      metrics: {
        avgIncrease: '1% time savings',
        timeToSeeResults: '1-2 weeks'
      }
    },
    {
      id: 'automation-2',
      title: 'Social Media Automation',
      description: 'Automate your social media posting and engagement',
      icon: 'time',
      price: '$299-599',
      duration: '5-7 days',
      category: 'automation',
      deliverables: ['Scheduling Setup', 'Content Calendar', 'Engagement Bots'],
      metrics: {
        avgIncrease: '1% engagement increase',
        timeToSeeResults: '1-4 weeks'
      }
    }
  ];

  const templates: PerformanceTemplate[] = [
    {
      id: 'template-1',
      name: 'Growth Accelerator',
      description: 'Complete growth package for scaling businesses',
      services: ['analytics-1', 'seo-1', 'ads-1', 'consulting-1'],
      totalPrice: '$1,499',
      timeframe: '21 days',
      expectedResults: '1% overall performance improvement'
    },
    {
      id: 'template-2',
      name: 'Digital Foundation',
      description: 'Essential digital marketing foundation setup',
      services: ['analytics-1', 'seo-2', 'automation-1'],
      totalPrice: '$899',
      timeframe: '14 days',
      expectedResults: '1% digital presence improvement'
    },
    {
      id: 'template-3',
      name: 'Conversion Optimizer',
      description: 'Focus on maximizing your conversion rates',
      services: ['analytics-2', 'consulting-2', 'ads-2'],
      totalPrice: '$1,199',
      timeframe: '18 days',
      expectedResults: '1% conversion rate improvement'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Services', icon: 'apps' },
    { id: 'analytics', name: 'Analytics', icon: 'analytics' },
    { id: 'seo', name: 'SEO', icon: 'search' },
    { id: 'ads', name: 'Advertising', icon: 'megaphone' },
    { id: 'consulting', name: 'Consulting', icon: 'people' },
    { id: 'automation', name: 'Automation', icon: 'settings' }
  ];

  // Sample performance graph data with 1% scale example
  const performanceGraph: PerformanceGraph = {
    title: 'Expected ROI Improvement Over Time',
    data: [
      { month: 'Month 1', value: 1.0 },
      { month: 'Month 2', value: 1.3 },
      { month: 'Month 3', value: 1.8 },
      { month: 'Month 4', value: 2.5 },
      { month: 'Month 5', value: 3.2 },
      { month: 'Month 6', value: 4.1 }
    ],
    unit: '%'
  };

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

  const handleTemplateSelect = (template: PerformanceTemplate) => {
    Alert.alert(
      'Select Template',
      `Would you like to add all services from "${template.name}" to your cart?\n\nExpected results: ${template.expectedResults}`,
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
      case 'analytics':
        return <Ionicons name="analytics" {...iconProps} />;
      case 'trending-up':
        return <Ionicons name="trending-up" {...iconProps} />;
      case 'search':
        return <Ionicons name="search" {...iconProps} />;
      case 'location':
        return <Ionicons name="location" {...iconProps} />;
      case 'megaphone':
        return <Ionicons name="megaphone" {...iconProps} />;
      case 'refresh':
        return <Ionicons name="refresh" {...iconProps} />;
      case 'people':
        return <Ionicons name="people" {...iconProps} />;
      case 'funnel':
        return <FontAwesome5 name="funnel-dollar" {...iconProps} />;
      case 'settings':
        return <Ionicons name="settings" {...iconProps} />;
      case 'time':
        return <Ionicons name="time" {...iconProps} />;
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
        <Text style={styles.headerTitle}>Performance Services</Text>
        <Text style={styles.headerSubtitle}>Business-focused support to drive results</Text>
      </View>

      {/* Performance Graph */}
      <View style={styles.graphSection}>
        <Text style={styles.graphTitle}>{performanceGraph.title}</Text>
        <Text style={styles.graphSubtitle}>Your ad is ready - See example of 1% improvement scale</Text>
        
        <View style={styles.graph}>
          <View style={styles.yAxis}>
            {[4, 3, 2, 1, 0].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value}%</Text>
            ))}
          </View>
          
          <View style={styles.graphContent}>
            <View style={styles.graphBars}>
              {performanceGraph.data.map((point, index) => (
                <View key={index} style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: `${(point.value / 4) * 100}%` }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{point.month.replace('Month ', 'M')}</Text>
                  <Text style={styles.barValue}>{point.value}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        <Text style={styles.graphNote}>
          💡 This example shows how performance services can compound for greater impact over time
        </Text>
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
          <Text style={styles.sectionSubtitle}>Proven packages for common business goals</Text>
          
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
                  <Text style={styles.templateResults}>🎯 {template.expectedResults}</Text>
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

                  <View style={styles.metricsSection}>
                    <Text style={styles.metricsTitle}>Expected Results:</Text>
                    <Text style={styles.metricsItem}>📈 {service.metrics.avgIncrease}</Text>
                    <Text style={styles.metricsItem}>⏱️ {service.metrics.timeToSeeResults}</Text>
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
  graphSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  graphSubtitle: {
    fontSize: 14,
    color: '#430B92',
    marginBottom: 16,
    fontWeight: '500',
  },
  graph: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 12,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  graphContent: {
    flex: 1,
    marginLeft: 10,
  },
  graphBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    backgroundColor: '#430B92',
    width: '80%',
    minHeight: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: '#430B92',
    fontWeight: '600',
  },
  graphNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
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
  templateResults: {
    fontSize: 12,
    color: '#430B92',
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
  metricsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  metricsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  metricsItem: {
    fontSize: 11,
    color: '#430B92',
    lineHeight: 16,
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