# Sentry Error Tracking Integration

## Overview
Sentry has been integrated for production error tracking with smart filtering to reduce noise.

## Key Features

### 1. Production-Only
- Sentry only initializes in production (`NODE_ENV === 'production'`)
- No performance impact in development
- DSN configured via environment variable

### 2. Smart Error Filtering
Automatically filters out:
- Network request failures
- Aborted requests
- Firebase permission errors
- ResizeObserver browser warnings

### 3. User Context
- Automatically attaches user ID, email, and username to errors
- Helps track user-specific issues
- Sanitizes sensitive data

### 4. Performance Monitoring
- 10% transaction sampling rate
- Tracks route changes and API calls
- Monitors page load performance

## Setup Instructions

1. **Environment Variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Add your Sentry DSN
   EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

2. **Verify Integration**
   - Build for production: `npm run build`
   - Errors will appear in Sentry dashboard
   - User context will be attached automatically

## Error Boundary
The app is wrapped with Sentry's error boundary via `withSentry()`:
- Catches React component errors
- Reports to Sentry in production
- Shows fallback UI to users

## Filtered Errors
The following errors are ignored to reduce noise:
- `Network request failed`
- `AbortError`
- `messaging/permission-blocked`
- `ResizeObserver loop limit exceeded`

## Testing
To test Sentry in production mode:
```bash
NODE_ENV=production npm run web
```

Then trigger an error:
```javascript
// Add to any component
throw new Error('Test Sentry Integration');
```

## Breadcrumbs
Sentry tracks user actions as breadcrumbs:
- Navigation changes
- API calls
- User interactions
- Console logs (except debug level)

## Next Steps
1. Set up Sentry project and get DSN
2. Configure alerts for critical errors
3. Create custom error boundaries for specific features
4. Add source maps for better stack traces