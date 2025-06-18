# Axees Frontend

A high-performance React Native + Expo app with advanced monitoring and security features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run web

# Performance audit
npm run perf
```

## 📊 Performance

- **Load Time**: 0.92 seconds (95.4% improvement from 20s)
- **Bundle Size**: Optimized with lazy loading and code splitting
- **Monitoring**: Real-time metrics dashboard in development

## 🔧 Key Features

### Performance Optimizations
- Lazy loading with React.lazy() and Suspense
- Webpack bundle splitting (vendor, React, common chunks)
- Optimized font loading (3 critical fonts initially)
- Deferred Firebase initialization

### Security
- Rate limiting for authentication (5 attempts, exponential backoff)
- Protected routes with simplified AuthGuard
- Secure environment variable handling

### Monitoring & Debugging
- Sentry error tracking (production only)
- Real-time metrics collection
- Navigation debugger (development)
- Performance audit tools

## 📱 Environment Setup

### Required Environment Variables
```bash
# Production Error Tracking
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production

# API Configuration
EXPO_PUBLIC_API_URL=https://api.axees.com
EXPO_PUBLIC_WEBSOCKET_URL=wss://api.axees.com

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 🛠️ Development Tools

### Performance Monitoring
```bash
# Run performance audit
npm run perf

# Analyze bundle size
npm run analyze

# View metrics dashboard
# Available in dev mode at top-right corner
```

### Debug Tools
- **Navigation Debugger**: Track route changes and navigation state
- **Metrics Dashboard**: Real-time performance and error metrics
- **Error Boundary**: Catches and reports React errors

## 🏗️ Architecture

### Core Components
- `AuthGuard`: Simplified route protection with declarative redirects
- `NavigationDebugger`: Development navigation tracking
- `MetricsDashboard`: Real-time performance monitoring
- `AuthRateLimiter`: Security rate limiting with exponential backoff

### Key Files
- `app/_layout.web.tsx`: Optimized root layout with lazy loading
- `components/AuthGuard.tsx`: Simplified authentication guard
- `utils/metrics.ts`: Performance and error metrics collection
- `utils/AuthRateLimiter.ts`: Authentication security
- `sentry.config.js`: Production error tracking

## 📋 Scripts

- `npm run web`: Start development server
- `npm run perf`: Run performance audit
- `npm run analyze`: Analyze bundle size with webpack-bundle-analyzer
- `npm run export:web`: Build production bundle
- `npm run lint`: Run ESLint

## 🚢 Deployment

See [deployment checklist](./docs/deployment-checklist.md) for production deployment steps.

### Pre-Deployment Checklist
- [ ] Performance audit passes (<3s load time)
- [ ] Environment variables configured
- [ ] Sentry DSN set for error tracking
- [ ] Bundle size within limits (<5MB)

## 📚 Documentation

- [Performance Optimization Results](./docs/stages/performance-optimization-results.md)
- [Troubleshooting Runbook](./docs/troubleshooting-runbook.md)
- [Deployment Checklist](./docs/deployment-checklist.md)
- [Security Implementation](./docs/stages/auth-rate-limiting-implementation.md)

## 🔍 Monitoring

### Error Tracking
- Sentry integration for production errors
- Smart filtering to reduce noise
- Automatic user context attachment

### Performance Metrics
- Page load times
- JavaScript errors
- Authentication failures
- Route change tracking

### Success Criteria
- ✅ Load time < 3 seconds (achieved: 0.92s)
- ✅ Zero navigation mounting errors
- ✅ Auth failures properly tracked and limited
- ✅ All production errors visible in Sentry

---

Built with performance and reliability in mind. Ready for production deployment.