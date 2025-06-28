import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import {
  Ionicons,
  MaterialIcons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  AntDesign
} from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');

const CreativeToolsPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  // Creative tools categories
  const categories = [
    { id: 'all', name: 'All Tools', icon: 'apps' },
    { id: 'design', name: 'Design', icon: 'palette' },
    { id: 'video', name: 'Video', icon: 'videocam' },
    { id: 'photo', name: 'Photo', icon: 'camera' },
    { id: 'ai', name: 'AI Tools', icon: 'auto-awesome' },
  ];

  // Creative tools data
  const tools = [
    {
      id: '1',
      name: 'Content Calendar',
      description: 'Plan and schedule your content',
      category: 'planning',
      icon: <MaterialIcons name="calendar-today" size={32} color="#430B92" />,
      color: '#EDE9FE',
      action: 'Open',
    },
    {
      id: '2',
      name: 'Brand Kit',
      description: 'Your brand assets in one place',
      category: 'design',
      icon: <MaterialCommunityIcons name="palette-swatch" size={32} color="#8B5CF6" />,
      color: '#F3E8FF',
      action: 'View',
    },
    {
      id: '3',
      name: 'Video Editor',
      description: 'Edit videos for social media',
      category: 'video',
      icon: <MaterialIcons name="video-library" size={32} color="#3B82F6" />,
      color: '#DBEAFE',
      action: 'Create',
    },
    {
      id: '4',
      name: 'Photo Filters',
      description: 'Professional filters and effects',
      category: 'photo',
      icon: <MaterialIcons name="photo-filter" size={32} color="#10B981" />,
      color: '#D1FAE5',
      action: 'Browse',
    },
    {
      id: '5',
      name: 'Caption Generator',
      description: 'AI-powered caption suggestions',
      category: 'ai',
      icon: <MaterialCommunityIcons name="text-box-multiple" size={32} color="#F59E0B" />,
      color: '#FEF3C7',
      action: 'Generate',
    },
    {
      id: '6',
      name: 'Hashtag Research',
      description: 'Find trending hashtags',
      category: 'research',
      icon: <MaterialCommunityIcons name="pound" size={32} color="#EC4899" />,
      color: '#FCE7F3',
      action: 'Research',
    },
    {
      id: '7',
      name: 'Templates Library',
      description: 'Ready-to-use content templates',
      category: 'design',
      icon: <MaterialIcons name="dashboard-customize" size={32} color="#6366F1" />,
      color: '#E0E7FF',
      action: 'Browse',
    },
    {
      id: '8',
      name: 'Analytics Dashboard',
      description: 'Track content performance',
      category: 'analytics',
      icon: <Ionicons name="analytics" size={32} color="#059669" />,
      color: '#D1FAE5',
      action: 'View',
    },
  ];

  // Featured templates
  const templates = [
    {
      id: '1',
      name: 'Instagram Story',
      image: require('@/assets/empty-image.png'),
      uses: '2.3k',
    },
    {
      id: '2',
      name: 'TikTok Video',
      image: require('@/assets/empty-image.png'),
      uses: '1.8k',
    },
    {
      id: '3',
      name: 'Product Showcase',
      image: require('@/assets/empty-image.png'),
      uses: '3.1k',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <UniversalBackButton fallbackRoute="/" />
        <Text style={styles.headerTitle}>Creative Tools</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Feather name="help-circle" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tools..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                activeCategory === category.id && styles.activeCategoryChip
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              <MaterialIcons
                name={category.icon as any}
                size={18}
                color={activeCategory === category.id ? '#fff' : '#6B7280'}
              />
              <Text style={[
                styles.categoryText,
                activeCategory === category.id && styles.activeCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <TouchableOpacity key={tool.id} style={styles.toolCard}>
              <View style={[styles.toolIconContainer, { backgroundColor: tool.color }]}>
                {tool.icon}
              </View>
              <Text style={styles.toolName}>{tool.name}</Text>
              <Text style={styles.toolDescription}>{tool.description}</Text>
              <TouchableOpacity style={styles.toolButton}>
                <Text style={styles.toolButtonText}>{tool.action}</Text>
                <Feather name="arrow-right" size={16} color="#430B92" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Templates */}
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Templates</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesContainer}
          >
            {templates.map((template) => (
              <TouchableOpacity key={template.id} style={styles.templateCard}>
                <Image
                  source={template.image}
                  style={styles.templateImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.templateGradient}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <View style={styles.templateStats}>
                    <Feather name="users" size={14} color="#fff" />
                    <Text style={styles.templateUses}>{template.uses} uses</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Pro Tips */}
        <View style={styles.proTipsSection}>
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          <View style={styles.tipCard}>
            <LinearGradient
              colors={['#430B92', '#5A1BAB']}
              style={styles.tipGradient}
            >
              <MaterialIcons name="lightbulb" size={24} color="#fff" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Boost Engagement</Text>
                <Text style={styles.tipText}>
                  Use our AI caption generator to create engaging captions that resonate with your audience
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <LinearGradient
              colors={['#430B92', '#5A1BAB']}
              style={styles.gradientButton}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.buttonText}>Create New Content</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <MaterialIcons name="folder-open" size={20} color="#430B92" />
            <Text style={styles.secondaryButtonText}>My Projects</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  helpButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  activeCategoryChip: {
    backgroundColor: '#430B92',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeCategoryText: {
    color: '#fff',
  },
  toolsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: (screenWidth - 52) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  toolIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#430B92',
  },
  templatesSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#430B92',
    fontWeight: '500',
  },
  templatesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  templateCard: {
    width: 200,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  templateGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateUses: {
    fontSize: 14,
    color: '#fff',
  },
  proTipsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  tipCard: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipGradient: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 20,
  },
  quickActions: {
    padding: 20,
    gap: 12,
  },
  quickActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#430B92',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#430B92',
  },
});

export default CreativeToolsPage;