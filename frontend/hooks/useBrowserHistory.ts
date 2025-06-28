/**
 * Hook to handle browser history navigation and sync with Expo Router
 * This ensures that browser Back/Forward buttons properly update the app content
 */

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Platform } from 'react-native';

interface UseBrowserHistoryOptions {
  onLocationChange?: (pathname: string) => void;
}

export function useBrowserHistory(options: UseBrowserHistoryOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);
  const { onLocationChange } = options;

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handlePopState = (event: PopStateEvent) => {
      // Get the current URL pathname
      const currentPathname = window.location.pathname;
      
      // If the pathname has changed from what Expo Router thinks it is,
      // we need to sync the router state
      if (currentPathname !== pathname) {
        // Use a timeout to ensure the router state is updated after the browser navigation
        setTimeout(() => {
          // Force router to navigate to the browser's current location
          router.push(currentPathname);
          
          // Call optional callback
          if (onLocationChange) {
            onLocationChange(currentPathname);
          }
        }, 0);
      }
    };

    // Listen for browser back/forward button events
    window.addEventListener('popstate', handlePopState);

    // Also monitor pathname changes to ensure sync
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
      // Ensure browser URL matches router state
      if (window.location.pathname !== pathname) {
        window.history.pushState({}, '', pathname);
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router, onLocationChange]);

  // Track pathname changes for debugging
  useEffect(() => {
    if (pathname !== previousPathname.current) {
      console.log(`🔄 Navigation: ${previousPathname.current} → ${pathname}`);
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return {
    pathname,
    previousPathname: previousPathname.current
  };
}