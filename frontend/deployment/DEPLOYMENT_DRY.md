# 🚀 DRY Deployment System Documentation

## Overview

This document describes the refactored deployment system that follows DRY (Don't Repeat Yourself) principles. All deployment configuration and logic is now centralized to eliminate duplication and improve maintainability.

## Architecture

### 1. **Centralized Configuration** (`deployment.config.js`)

The single source of truth for all deployment-related configuration:

- **Site IDs and URLs** - No more hardcoded '${NETLIFY_SITE_NAME}' scattered across files
- **Build settings** - Timeouts, memory limits, commands
- **Token management** - Centralized auth token retrieval
- **Logging utilities** - Consistent colored output across all scripts
- **Environment configs** - Production, staging, development settings

### 2. **Unified Entry Point** (`scripts/deploy.js`)

Single deployment script that replaces multiple redundant scripts:

```bash
npm run deploy              # Preview with build (default)
npm run deploy:quick        # Preview without build  
npm run deploy:prod         # Production deployment
npm run deploy:prod:quick   # Production without build
npm run deploy:staging      # Deploy to staging
npm run deploy:clean        # Clean build and deploy to preview
npm run deploy:prod:clean   # Clean build and deploy to production
npm run deploy:dry-run      # Test deployment without executing
```

### 3. **Automated Migration** (`scripts/migrate-hardcoded-values.js`)

Updates all files containing hardcoded values to use the centralized config:

```bash
node scripts/migrate-hardcoded-values.js
```

## Deployment Behavior

**Default Behavior (Safe):**
- All deployments go to preview URL: `https://preview--polite-ganache-3a4e1b.netlify.app/`
- Use `npm run deploy` or `npm run deploy:quick` for preview deployments

**Production Deployment (Explicit):**
- Only when explicitly requested: `npm run deploy:prod`
- Deploys to production URL: `https://polite-ganache-3a4e1b.netlify.app/`

## Environment Variables

Add to `.env.local`:

```env
# Netlify Configuration
NETLIFY_AUTH_TOKEN=your_token_here
NETLIFY_SITE_NAME=${NETLIFY_SITE_NAME}
NETLIFY_SITE_API_ID=${NETLIFY_SITE_API_ID}

# Optional: Override default sites
NETLIFY_STAGING_SITE_ID=your-staging-site
NETLIFY_DEV_SITE_ID=your-dev-site
```

## Testing

Run the comprehensive test suite to verify the DRY refactoring:

```bash
node scripts/test-deployment-dry.js
```

Tests include:
- Configuration loading
- Token retrieval
- Site ID resolution
- Build command resolution
- Deployment script functionality
- Detection of remaining hardcoded values

## Migration Guide

### Before (Multiple Scripts)
```javascript
// In unified-deploy.js
const CONFIG = {
  defaultSite: '${NETLIFY_SITE_NAME}',
  buildTimeout: 300000
};

// In deploy-from-temp.js
const siteId = '${NETLIFY_SITE_NAME}';
const timeout = 300000;

// In various scripts
const token = process.env.NETLIFY_AUTH_TOKEN || readFileSync('.netlify-token');
```

### After (Single Config)
```javascript
// In any script
const deployConfig = require('./deployment.config');
const siteId = deployConfig.getSiteId('production');
const token = deployConfig.getAuthToken();
```

## Benefits

1. **Single Source of Truth** - All configuration in one place
2. **No Hardcoded Values** - Site IDs and tokens from config/env
3. **Safe by Default** - Preview deployments unless explicitly requesting production
4. **Consistent Interface** - One deployment command with environment parameter
5. **Easier Testing** - Centralized config makes mocking easier
6. **Better Maintainability** - Change once, applies everywhere

## File Structure

```
frontend/
├── deployment.config.js        # Central configuration
├── scripts/
│   ├── deploy.js              # Unified deployment script
│   ├── test-deployment-dry.js # Test suite
│   └── migrate-hardcoded-values.js # Migration tool
├── package.json               # Updated npm scripts
└── .env.local                # Environment variables
```

## Removed/Deprecated Files

The following files are no longer needed after DRY refactoring:

- `scripts/deployment/deploy-from-temp.js` - Functionality absorbed into deploy.js
- Multiple `netlify.toml` files - Consolidated to root netlify.toml
- Hardcoded site IDs in documentation - Now use environment variables

## Troubleshooting

### Token Not Found
```bash
# Check token sources in order:
echo $NETLIFY_AUTH_TOKEN
cat .env.local | grep NETLIFY_AUTH_TOKEN
cat ~/.netlify-token
```

### Site ID Issues
```bash
# Verify site configuration
node -e "console.log(require('./deployment.config').getSiteId('production'))"
```

### Build Failures
```bash
# Test build command resolution
node -e "console.log(require('./deployment.config').getBuildCommand('production'))"
```

## Next Steps

1. Run migration script to update hardcoded values
2. Test deployment with dry-run
3. Update CI/CD pipelines to use new scripts
4. Remove deprecated deployment scripts

---

*Last Updated: 2025-07-05*
*DRY Principles Applied to Deployment System*