import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Plus,
  ExternalLink,
  Edit3,
  Trash2,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';

export interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishedAt?: Date;
  scheduledFor?: Date;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  title?: string;
  description?: string;
  thumbnailUrl?: string;
}

interface SocialMediaLinksProps {
  dealId?: string;
  proofId?: string;
  milestoneId?: string;
  links?: SocialMediaLink[];
  onLinksChange?: (links: SocialMediaLink[]) => void;
  readonly?: boolean;
  compact?: boolean;
  allowEdit?: boolean;
  title?: string;
}

export default function SocialMediaLinks({
  dealId,
  proofId,
  milestoneId,
  links: propLinks = [],
  onLinksChange,
  readonly = false,
  compact = false,
  allowEdit = true,
  title = "Social Media Posts"
}: SocialMediaLinksProps) {
  const [links, setLinks] = useState<SocialMediaLink[]>(propLinks);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({
    platform: '',
    url: '',
    status: 'draft' as const,
    title: '',
    description: ''
  });

  // Load cached links on mount
  useEffect(() => {
    if (dealId) {
      loadLinksFromCache();
    }
  }, [dealId]);

  // Update parent when links change
  useEffect(() => {
    onLinksChange?.(links);
  }, [links, onLinksChange]);

  const loadLinksFromCache = async () => {
    try {
      const cacheKey = `socialLinks_${dealId}${proofId ? `_${proofId}` : ''}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedLinks = JSON.parse(cached);
        setLinks(cachedLinks);
      }
    } catch (error) {
      console.error('Failed to load social media links from cache:', error);
    }
  };

  const saveLinksToCache = async (updatedLinks: SocialMediaLink[]) => {
    try {
      const cacheKey = `socialLinks_${dealId}${proofId ? `_${proofId}` : ''}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedLinks));
    } catch (error) {
      console.error('Failed to save social media links to cache:', error);
    }
  };

  const generateId = () => `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addLink = () => {
    if (!newLink.platform.trim() || !newLink.url.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please provide both platform and URL',
        visibilityTime: 3000
      });
      return;
    }

    // Validate URL format
    if (!isValidUrl(newLink.url)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid URL',
        text2: 'Please provide a valid URL',
        visibilityTime: 3000
      });
      return;
    }

    const socialLink: SocialMediaLink = {
      id: generateId(),
      platform: newLink.platform,
      url: newLink.url,
      status: newLink.status,
      title: newLink.title,
      description: newLink.description
    };

    const updatedLinks = [...links, socialLink];
    setLinks(updatedLinks);
    saveLinksToCache(updatedLinks);

    // Reset form
    setNewLink({
      platform: '',
      url: '',
      status: 'draft',
      title: '',
      description: ''
    });

    Toast.show({
      type: 'success',
      text1: 'Link Added',
      text2: 'Social media link has been added',
      visibilityTime: 2000
    });
  };

  const updateLink = (id: string, updates: Partial<SocialMediaLink>) => {
    const updatedLinks = links.map(link => 
      link.id === id ? { ...link, ...updates } : link
    );
    setLinks(updatedLinks);
    saveLinksToCache(updatedLinks);
    setEditingId(null);

    Toast.show({
      type: 'success',
      text1: 'Link Updated',
      text2: 'Social media link has been updated',
      visibilityTime: 2000
    });
  };

  const removeLink = (id: string) => {
    Alert.alert(
      'Remove Link',
      'Are you sure you want to remove this social media link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedLinks = links.filter(link => link.id !== id);
            setLinks(updatedLinks);
            saveLinksToCache(updatedLinks);
            Toast.show({
              type: 'success',
              text1: 'Link Removed',
              text2: 'Social media link has been removed',
              visibilityTime: 2000
            });
          }
        }
      ]
    );
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Cannot Open Link',
          text2: 'Unable to open this URL',
          visibilityTime: 3000
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open link',
        visibilityTime: 3000
      });
    }
  };

  const copyLink = async (url: string) => {
    try {
      await Clipboard.setStringAsync(url);
      Toast.show({
        type: 'success',
        text1: 'Copied',
        text2: 'Link copied to clipboard',
        visibilityTime: 2000
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Copy Failed',
        text2: 'Failed to copy link',
        visibilityTime: 3000
      });
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getPlatformIcon = (platform: string) => {
    const iconProps = { width: 20, height: 20, color: '#430B92' };
    const platformLower = platform.toLowerCase();

    if (platformLower.includes('instagram')) {
      return <Instagram {...iconProps} />;
    } else if (platformLower.includes('youtube')) {
      return <Youtube {...iconProps} />;
    } else if (platformLower.includes('twitter') || platformLower.includes('x')) {
      return <Twitter {...iconProps} />;
    } else if (platformLower.includes('facebook')) {
      return <Facebook {...iconProps} />;
    } else {
      return <LinkIcon {...iconProps} />;
    }
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { width: 16, height: 16 };
    
    switch (status) {
      case 'published':
        return <CheckCircle {...iconProps} color="#10B981" />;
      case 'scheduled':
        return <Clock {...iconProps} color="#F59E0B" />;
      case 'draft':
        return <Edit3 {...iconProps} color="#6B7280" />;
      default:
        return <AlertCircle {...iconProps} color="#EF4444" />;
    }
  };

  const renderAddLinkForm = () => (
    <View style={[styles.addLinkForm, compact && styles.addLinkFormCompact]}>
      <Text style={styles.addLinkTitle}>Add Social Media Link</Text>
      
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.platformInput]}
          value={newLink.platform}
          onChangeText={(text) => setNewLink(prev => ({ ...prev, platform: text }))}
          placeholder="Platform (e.g., Instagram, YouTube)"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={[styles.input, styles.urlInput]}
          value={newLink.url}
          onChangeText={(text) => setNewLink(prev => ({ ...prev, url: text }))}
          placeholder="Post URL"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {!compact && (
        <>
          <TextInput
            style={styles.input}
            value={newLink.title}
            onChangeText={(text) => setNewLink(prev => ({ ...prev, title: text }))}
            placeholder="Post title (optional)"
            placeholderTextColor="#9CA3AF"
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            value={newLink.description}
            onChangeText={(text) => setNewLink(prev => ({ ...prev, description: text }))}
            placeholder="Post description (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </>
      )}

      <TouchableOpacity style={styles.addButton} onPress={addLink}>
        <Plus width={16} height={16} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Link</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLinkItem = (link: SocialMediaLink) => (
    <View key={link.id} style={[styles.linkItem, compact && styles.linkItemCompact]}>
      <View style={styles.linkHeader}>
        <View style={styles.linkPlatform}>
          {getPlatformIcon(link.platform)}
          <Text style={styles.platformName}>{link.platform}</Text>
          {getStatusIcon(link.status)}
        </View>
        
        {allowEdit && !readonly && (
          <View style={styles.linkActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copyLink(link.url)}
            >
              <Copy width={16} height={16} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openLink(link.url)}
            >
              <ExternalLink width={16} height={16} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditingId(link.id)}
            >
              <Edit3 width={16} height={16} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => removeLink(link.id)}
            >
              <Trash2 width={16} height={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {link.title && !compact && (
        <Text style={styles.linkTitle}>{link.title}</Text>
      )}
      
      {link.description && !compact && (
        <Text style={styles.linkDescription} numberOfLines={2}>
          {link.description}
        </Text>
      )}

      <Text style={styles.linkUrl} numberOfLines={1}>
        {link.url}
      </Text>

      {link.metrics && !compact && (
        <View style={styles.metrics}>
          {link.metrics.views && (
            <Text style={styles.metricText}>{link.metrics.views} views</Text>
          )}
          {link.metrics.likes && (
            <Text style={styles.metricText}>{link.metrics.likes} likes</Text>
          )}
          {link.metrics.comments && (
            <Text style={styles.metricText}>{link.metrics.comments} comments</Text>
          )}
        </View>
      )}

      {link.publishedAt && (
        <Text style={styles.publishDate}>
          Published: {link.publishedAt.toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>
        {title} {links.length > 0 && `(${links.length})`}
      </Text>

      {!readonly && allowEdit && renderAddLinkForm()}

      {links.length > 0 ? (
        <ScrollView style={styles.linksList} showsVerticalScrollIndicator={false}>
          {links.map(renderLinkItem)}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <LinkIcon width={32} height={32} color="#D1D5DB" />
          <Text style={styles.emptyText}>No social media links added yet</Text>
          {!readonly && (
            <Text style={styles.emptySubtext}>
              Add links to track your published content
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerCompact: {
    padding: 12,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 12,
  },
  addLinkForm: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addLinkFormCompact: {
    padding: 12,
  },
  addLinkTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  platformInput: {
    flex: 1,
  },
  urlInput: {
    flex: 2,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#430B92',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  linksList: {
    maxHeight: 400,
  },
  linkItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkItemCompact: {
    padding: 8,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkPlatform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  linkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  linkUrl: {
    fontSize: 12,
    color: '#430B92',
    backgroundColor: '#F0E7FD',
    padding: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  metrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 11,
    color: '#6B7280',
  },
  publishDate: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});