import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useWebSEO(options: {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
}) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Update page title
    if (options.title) {
      document.title = `${options.title} | Axees`;
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      
      meta.content = content;
    };

    // Standard meta tags
    if (options.description) {
      updateMetaTag('description', options.description);
    }
    
    if (options.keywords) {
      updateMetaTag('keywords', options.keywords);
    }

    // Open Graph tags
    if (options.title) {
      updateMetaTag('og:title', options.title, true);
    }
    
    if (options.description) {
      updateMetaTag('og:description', options.description, true);
    }
    
    if (options.ogImage) {
      updateMetaTag('og:image', options.ogImage, true);
    }
    
    if (options.ogUrl) {
      updateMetaTag('og:url', options.ogUrl, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    if (options.title) {
      updateMetaTag('twitter:title', options.title);
    }
    if (options.description) {
      updateMetaTag('twitter:description', options.description);
    }
    if (options.ogImage) {
      updateMetaTag('twitter:image', options.ogImage);
    }

    // Cleanup function
    return () => {
      // Reset to default title when component unmounts
      document.title = 'Axees - Connect Creators & Brands';
    };
  }, [options.title, options.description, options.keywords, options.ogImage, options.ogUrl]);
}

// Export a component version for use in screens
export function WebSEO(props: {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
}) {
  useWebSEO(props);
  return null;
}

// Default export to satisfy Expo Router (this is a utility file, not a route)
export default function WebSEOPage() {
  return null;
}