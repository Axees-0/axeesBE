import React, { useEffect } from 'react';
import { Platform } from 'react-native';

// Browser-specific features for PWA and enhanced web experience
export function useWebFeatures() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // 1. Register Service Worker for offline functionality
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => console.log('SW registered:', registration))
          .catch(error => console.log('SW registration failed:', error));
      });
    }

    // 2. Add Web App Manifest for PWA
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }

    // 3. Add theme color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = '#430B92'; // Axees brand color

    // 4. Add viewport meta tag for proper mobile rendering
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes';

    // 5. Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';

    // 6. Add online/offline detection
    const updateOnlineStatus = () => {
      const status = navigator.onLine ? 'online' : 'offline';
      document.body.setAttribute('data-connection-status', status);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('connection-change', { 
        detail: { online: navigator.onLine } 
      }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // 7. Add PWA install prompt handling
    let deferredPrompt: any;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Dispatch custom event that app can listen to
      window.dispatchEvent(new CustomEvent('pwa-install-available', { 
        detail: { prompt: deferredPrompt } 
      }));
    });

    // 8. Handle browser back button properly
    window.addEventListener('popstate', (event) => {
      // Prevent accidental app exit
      if (window.history.length <= 1) {
        if (window.confirm('Are you sure you want to leave Axees?')) {
          window.history.back();
        } else {
          window.history.pushState(null, '', window.location.href);
        }
      }
    });

    // 9. Add web-specific performance optimizations
    if ('requestIdleCallback' in window) {
      // Defer non-critical tasks
      (window as any).requestIdleCallback(() => {
        // Preload important routes
        const routes = ['/deals', '/messages', '/profile'];
        routes.forEach(route => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
        });
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
}

// Create Web App Manifest dynamically
export function createWebManifest() {
  if (Platform.OS !== 'web') return;

  const manifest = {
    name: 'Axees - Connect Creators & Brands',
    short_name: 'Axees',
    description: 'Connect with top creators and influencers for your brand campaigns',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#430B92',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['business', 'social'],
    lang: 'en-US',
    dir: 'ltr',
    prefer_related_applications: false
  };

  // Create blob URL for manifest
  const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/manifest+json'
  });
  const manifestURL = URL.createObjectURL(manifestBlob);

  // Update manifest link
  const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (link) {
    link.href = manifestURL;
  }
}

// Hook to detect PWA install status
export function usePWAInstall() {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = isStandalone || (window.navigator as any).standalone;
      setIsInstalled(isInstalled);
    };

    checkInstalled();

    // Listen for install prompt
    const handleInstallPrompt = () => setCanInstall(true);
    window.addEventListener('pwa-install-available', handleInstallPrompt);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallPrompt);
    };
  }, []);

  return { canInstall, isInstalled };
}

// Add this to your root layout
export function WebFeatures() {
  useWebFeatures();
  return null;
}

// Default export to satisfy Expo Router (this is a utility file, not a route)
export default function WebFeaturesPage() {
  return null;
}