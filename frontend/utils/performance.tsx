// Performance optimization utilities for the investor demo

import { Platform } from 'react-native';

/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceUtils {
  private static startTimes: Record<string, number> = {};
  
  /**
   * Start timing a performance metric
   */
  static startTiming(label: string) {
    this.startTimes[label] = Date.now();
  }
  
  /**
   * End timing and log performance metric
   */
  static endTiming(label: string): number {
    const endTime = Date.now();
    const startTime = this.startTimes[label];
    if (!startTime) {
      console.warn(`No start time found for ${label}`);
      return 0;
    }
    
    const duration = endTime - startTime;
    delete this.startTimes[label];
    
    if (__DEV__) {
      console.log(`⚡ Performance: ${label} took ${duration}ms`);
    }
    
    return duration;
  }
  
  /**
   * Measure component render time
   */
  static measureRender<T extends (...args: any[]) => any>(
    component: T,
    componentName: string
  ): T {
    return ((...args: any[]) => {
      this.startTiming(`${componentName}-render`);
      const result = component(...args);
      this.endTiming(`${componentName}-render`);
      return result;
    }) as T;
  }
  
  /**
   * Debounce function to prevent excessive calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }
  
  /**
   * Throttle function to limit call frequency
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Get optimized image source based on device capabilities
   */
  static getOptimizedImageSource(
    imagePath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ) {
    // For demo, use high-quality images but with proper sizing
    const { width = 300, height = 300, quality = 80 } = options;
    
    if (Platform.OS === 'web') {
      // For web, we can use URL parameters to optimize images
      return {
        uri: imagePath,
        width,
        height,
      };
    }
    
    return {
      uri: imagePath,
      cache: 'force-cache' as const,
    };
  }
  
  /**
   * Preload critical images for better performance
   */
  static preloadImages(imagePaths: string[]) {
    if (Platform.OS === 'web') {
      imagePaths.forEach(path => {
        const img = new Image();
        img.src = path;
      });
    }
  }
}

/**
 * Bundle optimization utilities
 */
export class BundleOptimizer {
  /**
   * Lazy load component with loading state
   */
  static createLazyComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    LoadingComponent?: React.ComponentType
  ) {
    const LazyComponent = React.lazy(importFunc);
    
    return (props: React.ComponentProps<T>) => (
      <React.Suspense 
        fallback={LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>}
      >
        <LazyComponent {...props} />
      </React.Suspense>
    );
  }
}

/**
 * Demo-specific performance optimizations
 */
export class DemoPerformance {
  /**
   * Critical assets to preload for smooth demo experience
   */
  static readonly CRITICAL_ASSETS = [
    require('@/assets/fill-logo.png'),
    require('@/assets/main-scene.gif'), // Analytics loading animation
    require('@/assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png'),
    require('@/assets/tiktok-icon.png'),
  ];
  
  /**
   * Initialize demo performance optimizations
   */
  static initializeDemo() {
    PerformanceUtils.startTiming('demo-initialization');
    
    // Preload critical assets
    const assetUrls = this.CRITICAL_ASSETS.map(asset => 
      typeof asset === 'string' ? asset : asset.uri || asset.default
    ).filter(Boolean);
    
    ImageOptimizer.preloadImages(assetUrls);
    
    if (__DEV__) {
      console.log('🚀 Demo performance optimizations initialized');
    }
    
    PerformanceUtils.endTiming('demo-initialization');
  }
  
  /**
   * Optimize analytics dashboard rendering
   */
  static optimizeAnalyticsDashboard() {
    // Defer non-critical chart rendering
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        resolve(true);
      });
    });
  }
  
  /**
   * Measure demo flow completion time
   */
  static measureDemoFlow(flowName: string) {
    return {
      start: () => PerformanceUtils.startTiming(`demo-flow-${flowName}`),
      end: () => {
        const duration = PerformanceUtils.endTiming(`demo-flow-${flowName}`);
        
        // Log flow performance for demo optimization
        if (duration > 60000) { // 60 seconds
          console.warn(`⚠️ Demo flow ${flowName} took ${duration}ms - consider optimization`);
        } else if (duration < 30000) { // 30 seconds
          console.log(`✅ Demo flow ${flowName} completed quickly: ${duration}ms`);
        }
        
        return duration;
      }
    };
  }
}

/**
 * Layout stability utilities to prevent layout shifts
 */
export class LayoutStability {
  /**
   * Create stable container with fixed dimensions
   */
  static createStableContainer(minHeight: number) {
    return {
      minHeight,
      overflow: 'hidden' as const,
    };
  }
  
  /**
   * Prevent cumulative layout shift with placeholder dimensions
   */
  static getPlaceholderDimensions(type: 'image' | 'chart' | 'card') {
    switch (type) {
      case 'image':
        return { width: 150, height: 150 };
      case 'chart':
        return { width: '100%', height: 200 };
      case 'card':
        return { minHeight: 100 };
      default:
        return {};
    }
  }
}

// Export React for lazy loading utility
import React from 'react';