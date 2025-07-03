# Deployment Scripts

This directory contains scripts for deploying the Axees frontend to Netlify.

## Primary Deployment Script

### `deploy.js` - Universal Deployment Script
The main deployment script that handles both single and dual package deployments.

**Usage:**
```bash
# Deploy both stable and QA packages
node deploy.js

# Deploy only QA fixes package
node deploy.js --qa-only

# Deploy only stable package  
node deploy.js --stable-only
```

**Features:**
- Automated Netlify CLI deployment
- Colored console output for better readability
- Comprehensive error handling
- Manual deployment fallback instructions
- Results saved to `final-deployment-results.json`

## Alternative Deployment Scripts

### `deploy-simple-dual.js`
Simplified version of dual deployment with automatic/manual fallback.

### `auto-netlify-deploy.js`
Uses Netlify API instead of CLI for deployment (requires API setup).

### `simple-deploy.js`
Supports alternative deployment platforms:
- Surge.sh deployment
- Local Python HTTP server
- Manual instructions

## Specialized Scripts

### `deploy-to-specific-site.js`
Deploys to a specific Netlify site ID (polite-ganache-3a4e1b).

### `force-netlify-deploy.js`
Attempts multiple deployment methods - useful for troubleshooting.

### `deploy-dual-correct.sh`
Builds stable version from git history before deployment.

## Helper Scripts

### `deploy.sh`
Basic shell wrapper for standard deployment flow.

### `deploy-simple.sh`
Generates deployment instructions and status files.

### `deploy-axees.sh`
Displays manual deployment instructions.

### `deploy-with-token.js`
Guide for token-based authentication setup.

## Deprecated Scripts

Scripts in `.deprecated/` have been archived due to duplication or incomplete implementation:
- `direct-deploy.js` - Duplicate of deploy.js
- `deploy-both-versions.sh` - Duplicate of deploy-simple-dual.js
- `auto-deploy.js` - Functionality merged into deploy.js
- `deploy-via-api.sh` - Incomplete implementation
- `direct-netlify-upload.js` - Incomplete implementation

## Quick Start

For most use cases, simply run:
```bash
npm run deploy
```

This uses the smart build system and deploys to Netlify production.