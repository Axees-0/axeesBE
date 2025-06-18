/**
 * Simple metrics collection for production monitoring
 * Tracks key performance and error metrics without external dependencies
 * Automatically collects page load times, JS errors, auth failures, and route changes
 * Updates every 10 seconds with 1000 metric memory limit for performance
 */

interface Metric {
  timestamp: number;
  type: 'pageLoad' | 'jsError' | 'authFailure' | 'routeChange' | 'apiError';
  value: number;
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private intervalId?: NodeJS.Timeout;
  private maxMetrics = 1000; // Keep last 1000 metrics in memory
  private flushInterval = 10000; // 10 seconds
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeCollectors();
      this.startFlushInterval();
    }
  }

  private initializeCollectors() {
    // Page Load Performance
    if ('performance' in window && 'addEventListener' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          this.track('pageLoad', perfData.loadEventEnd - perfData.fetchStart, {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            firstPaint: this.getFirstPaint(),
            url: window.location.pathname
          });
        }
      });
    }

    // JavaScript Errors
    window.addEventListener('error', (event) => {
      this.track('jsError', 1, {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.track('jsError', 1, {
        message: event.reason?.message || event.reason,
        type: 'unhandledRejection',
        stack: event.reason?.stack
      });
    });
  }

  private getFirstPaint(): number {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? Math.round(firstPaint.startTime) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Track a metric
   */
  track(type: Metric['type'], value: number, metadata?: Record<string, any>) {
    const metric: Metric = {
      timestamp: Date.now(),
      type,
      value,
      metadata
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log critical errors immediately in development
    if (type === 'jsError' && __DEV__ && console.error) {
      console.error('[Metrics] JS Error:', metadata);
    }
  }

  /**
   * Track route changes
   */
  trackRouteChange(from: string, to: string, duration?: number) {
    this.track('routeChange', duration || 0, { from, to });
  }

  /**
   * Track auth failures
   */
  trackAuthFailure(reason: string, identifier?: string) {
    this.track('authFailure', 1, { 
      reason, 
      identifier: identifier ? identifier.substring(0, 3) + '***' : undefined 
    });
  }

  /**
   * Track API errors
   */
  trackApiError(endpoint: string, status: number, message?: string) {
    this.track('apiError', 1, { endpoint, status, message });
  }

  /**
   * Get metrics summary
   */
  getSummary(minutes: number = 5): Record<string, any> {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const summary = {
      timeRange: `last ${minutes} minutes`,
      totalMetrics: recentMetrics.length,
      pageLoads: {
        count: 0,
        avgTime: 0,
        maxTime: 0
      },
      errors: {
        jsErrors: 0,
        apiErrors: 0,
        authFailures: 0
      },
      routes: {
        changes: 0,
        unique: new Set<string>()
      }
    };

    const loadTimes: number[] = [];

    recentMetrics.forEach(metric => {
      switch (metric.type) {
        case 'pageLoad':
          summary.pageLoads.count++;
          loadTimes.push(metric.value);
          summary.pageLoads.maxTime = Math.max(summary.pageLoads.maxTime, metric.value);
          break;
        case 'jsError':
          summary.errors.jsErrors++;
          break;
        case 'apiError':
          summary.errors.apiErrors++;
          break;
        case 'authFailure':
          summary.errors.authFailures++;
          break;
        case 'routeChange':
          summary.routes.changes++;
          if (metric.metadata?.to) {
            (summary.routes.unique as Set<string>).add(metric.metadata.to);
          }
          break;
      }
    });

    if (loadTimes.length > 0) {
      summary.pageLoads.avgTime = Math.round(
        loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      );
    }

    summary.routes.unique = Array.from(summary.routes.unique as Set<string>);

    return summary;
  }

  /**
   * Get recent metrics
   */
  getRecent(count: number = 100): Metric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval() {
    this.intervalId = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Flush metrics (send to server or log)
   */
  private flush() {
    const summary = this.getSummary(1); // Last minute
    
    // In production, send to analytics endpoint
    if (process.env.NODE_ENV === 'production' && summary.totalMetrics > 0) {
      // TODO: Send to analytics service
      // fetch('/api/metrics', { method: 'POST', body: JSON.stringify(summary) })
    }

    // Log summary in development (optional)
    if (__DEV__ && summary.totalMetrics > 0 && summary.errors.jsErrors > 0) {
      console.warn('[Metrics] Errors detected:', summary.errors);
    }
  }

  /**
   * Manual flush
   */
  forceFlush() {
    this.flush();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.metrics = [];
  }
}

// Singleton instance
let metricsInstance: MetricsCollector | null = null;

export function getMetrics(): MetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new MetricsCollector();
  }
  return metricsInstance;
}

// Convenience exports
export const metrics = {
  track: (type: Metric['type'], value: number, metadata?: Record<string, any>) => 
    getMetrics().track(type, value, metadata),
  
  trackRouteChange: (from: string, to: string, duration?: number) =>
    getMetrics().trackRouteChange(from, to, duration),
  
  trackAuthFailure: (reason: string, identifier?: string) =>
    getMetrics().trackAuthFailure(reason, identifier),
  
  trackApiError: (endpoint: string, status: number, message?: string) =>
    getMetrics().trackApiError(endpoint, status, message),
  
  getSummary: (minutes?: number) =>
    getMetrics().getSummary(minutes),
  
  getRecent: (count?: number) =>
    getMetrics().getRecent(count)
};