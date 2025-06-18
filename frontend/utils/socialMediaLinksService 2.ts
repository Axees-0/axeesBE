import { useState, useEffect } from 'react';

export interface SocialMediaLink {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin' | 'other';
  url: string;
  username?: string;
  isVerified?: boolean;
  followerCount?: number;
}

export interface SocialMediaPlatform {
  id: string;
  name: string;
  icon: string;
  baseUrl: string;
  usernamePattern?: RegExp;
}

export const SOCIAL_PLATFORMS: Record<string, SocialMediaPlatform> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    baseUrl: 'https://instagram.com/',
    usernamePattern: /^[a-zA-Z0-9._]{1,30}$/,
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    baseUrl: 'https://twitter.com/',
    usernamePattern: /^[a-zA-Z0-9_]{1,15}$/,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    baseUrl: 'https://facebook.com/',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    baseUrl: 'https://youtube.com/',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    baseUrl: 'https://tiktok.com/@',
    usernamePattern: /^[a-zA-Z0-9._]{1,24}$/,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    baseUrl: 'https://linkedin.com/in/',
  },
};

export function useSocialMediaLinks(userId?: string) {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder implementation
      // In real app, this would fetch from API
      setLinks([]);
    } catch (err) {
      setError('Failed to load social media links');
    } finally {
      setIsLoading(false);
    }
  };

  const addLink = async (link: Omit<SocialMediaLink, 'id'>) => {
    const newLink: SocialMediaLink = {
      ...link,
      id: Date.now().toString(),
    };
    setLinks(prev => [...prev, newLink]);
    return newLink;
  };

  const updateLink = (linkId: string, updates: Partial<SocialMediaLink>) => {
    setLinks(prev =>
      prev.map(link =>
        link.id === linkId ? { ...link, ...updates } : link
      )
    );
  };

  const deleteLink = (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));
  };

  const validateUsername = (platform: string, username: string): boolean => {
    const platformConfig = SOCIAL_PLATFORMS[platform];
    if (!platformConfig?.usernamePattern) return true;
    return platformConfig.usernamePattern.test(username);
  };

  const formatSocialUrl = (platform: string, username: string): string => {
    const platformConfig = SOCIAL_PLATFORMS[platform];
    if (!platformConfig) return username;
    return `${platformConfig.baseUrl}${username}`;
  };

  useEffect(() => {
    if (userId) {
      loadLinks();
    }
  }, [userId]);

  return {
    links,
    isLoading,
    error,
    addLink,
    updateLink,
    deleteLink,
    validateUsername,
    formatSocialUrl,
    platforms: SOCIAL_PLATFORMS,
  };
}