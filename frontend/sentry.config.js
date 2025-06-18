import * as Sentry from '@sentry/react-native';

// Production-only configuration
const isProduction = process.env.NODE_ENV === 'production';

export const initSentry = () => {
  if (!isProduction) {
    // Skip Sentry in development
    return;
  }

  Sentry.init({
    // DSN should be set via environment variable in production
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    
    // Set sample rates
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Release tracking
    release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    
    // Environment
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'production',
    
    // Debug mode (disable in production)
    debug: false,
    
    // Integrations
    integrations: [
      Sentry.reactNativeTracingIntegration({
        routingInstrumentation: Sentry.reactNavigationIntegration(),
        tracingOrigins: ['localhost', /^https:\/\/api\.axees\.com/, true],
      }),
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      
      // Ignore network errors that are expected
      if (error?.message?.includes('Network request failed')) {
        return null;
      }
      
      // Ignore cancelled requests
      if (error?.message?.includes('AbortError')) {
        return null;
      }
      
      // Ignore common Firebase messaging errors
      if (error?.message?.includes('messaging/permission-blocked')) {
        return null;
      }
      
      // Ignore ResizeObserver errors (common in web)
      if (error?.message?.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
      
      // Add user context if available
      const user = getUserFromStorage();
      if (user) {
        event.user = {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      }
      
      return event;
    },
    
    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy console logs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      
      // Sanitize sensitive data from navigation breadcrumbs
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
        // Remove any auth tokens from URLs
        breadcrumb.data.to = breadcrumb.data.to.replace(/token=[^&]+/g, 'token=***');
      }
      
      return breadcrumb;
    },
  });
};

// Helper function to get user from storage
function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem('axees_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// Error boundary wrapper
export const withSentry = Sentry.wrap;