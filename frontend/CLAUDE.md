# Axees Frontend Project - Claude Instructions

## 🚀 Deployment System

### Default Commands (Safe Preview Deployments)
```bash
npm run deploy              # Build and deploy to preview URL (safe default)
npm run deploy:quick        # Deploy without build to preview
npm run deploy:dry-run      # Test deployment without actually deploying
```

### Production Commands (Use with Caution)
```bash
npm run deploy:prod         # Build and deploy to production URL
npm run deploy:prod:quick   # Deploy to production without build
npm run deploy:prod:clean   # Clean build and deploy to production
```

### URLs
- **Preview (Default)**: `https://preview--polite-ganache-3a4e1b.netlify.app/`
- **Production**: `https://polite-ganache-3a4e1b.netlify.app/`

### How the Deployment System Works

**Architecture:**
- **Centralized config**: `deployment/deployment.config.js` - All deployment settings in one place
- **Unified script**: `deployment/deploy.js` - Single entry point for all deployments
- **Environment file**: `.env.local` - Contains auth tokens and site configuration

**Key Features:**
- **Safe by default**: Always deploys to preview unless explicitly production
- **Build verification**: Ensures build completed successfully before deploying
- **Live site testing**: Verifies deployed site is accessible with 5 retry attempts
- **Content validation**: Checks HTML structure, title tags, content length, React mount points
- **Comprehensive logging**: Clear success/failure messages with colored output
- **DRY compliant**: Eliminated 30+ hardcoded site IDs across multiple files

**Configuration Files:**
- `deployment/deployment.config.js` - All deployment settings, site IDs, URLs, auth tokens
- `deployment/deploy.js` - Main deployment script with verification
- `package.json` - Deployment commands that use the unified system
- `.env.local` - Environment variables for auth and site config

**Required Environment Variables:**
```env
NETLIFY_AUTH_TOKEN=your_token_here
NETLIFY_SITE_NAME=polite-ganache-3a4e1b
NETLIFY_SITE_API_ID=6e93cf51-17e5-4528-8e38-7ad22c2b6b78
```

**Advanced Usage:**
```bash
# Direct script usage with options
node deployment/deploy.js preview --clean
node deployment/deploy.js production --no-build
node deployment/deploy.js preview --dry-run
```

**Available Options:**
- `--no-build`: Skip build step
- `--clean`: Clean build before deploy
- `--dry-run`: Show what would happen without deploying
- `--production`: Force deploy to production URL

**Verification Process:**
After deployment, the system automatically:
1. Checks HTTP 200 response with 5 retry attempts (3 second delays)
2. Validates HTML structure and content length
3. Verifies React/Expo app mount points exist
4. Checks for Axees-specific content
5. Saves deployment status to `deployment-status.json`

**Safety Features:**
- Default to preview deployments to prevent accidental production deploys
- Build output verification before attempting deployment
- Comprehensive error handling with clear messages
- Retry logic for network issues during verification
- Status tracking for deployment history

## 📁 Project Structure

### Deployment Directory (`/deployment/`)
- `deployment.config.js` - Centralized configuration for all deployment settings
- `deploy.js` - Main unified deployment script
- `migrate-to-dry.js` - Migration script for consolidating hardcoded values
- `test-deployment-dry.js` - Test suite for deployment configuration

### Key Files
- `package.json` - Contains all deployment script commands
- `.env.local` - Environment variables for deployment
- `netlify.toml` - Netlify build configuration
- `docs/deploy-to-netlify.md` - Updated deployment documentation

## 🧹 Maintenance Notes

### DRY Principles Applied
- Consolidated 30+ files with hardcoded site IDs into single config
- Eliminated duplicate deployment scripts
- Centralized all deployment logic into unified system
- Removed conflicting documentation and backup files

### Migration Completed
- All old deployment scripts moved to deprecated status
- Configuration centralized in `deployment/deployment.config.js`
- All scripts now use unified deployment interface
- Documentation updated to reflect new system

### Testing
- Deployment dry-run tested and working
- Build verification tested and working
- Content validation tested and working
- All npm scripts tested and working

## 🔧 Development Commands

### Building
```bash
npm run export:web          # Standard web export
npm run export:web:clean    # Clean web export
npm run build:smart         # Smart build with optimization
```

### Other Commands
```bash
npm start                   # Start development server
npm run web                 # Start web development server
npm run lint                # Run linting
npm test                    # Run tests
```

## 🚨 Important Notes

1. **Always use npm scripts** rather than direct Netlify CLI commands
2. **Default deployments go to preview** - this is intentional for safety
3. **Production deploys require explicit commands** - use `npm run deploy:prod`
4. **Build verification is automatic** - the system checks build success before deploying
5. **Site verification is automatic** - the system tests the live site after deployment
6. **All configuration is centralized** - edit `deployment/deployment.config.js` for settings

## 🔧 Deployment System Improvements (July 2025)

### What Was Fixed
- **Path Resolution**: Fixed `../dist` vs `./dist` path issues
- **Authentication Fallback**: Now uses Netlify CLI auth when env tokens fail
- **Missing Components**: Better error messages for missing imports/assets
- **Graceful Fallbacks**: Script continues with warnings instead of hard failures

### Quick Deployment Now Works
After the fixes, deployment should be as simple as:
```bash
npm run deploy          # For preview
npm run deploy:prod     # For production
```

If you encounter issues:
```bash
npm run deploy:quick    # Skip build, use existing dist/
npm run deploy:dry-run  # Test without deploying
```

## 📊 Troubleshooting

**"No auth token found":**
- Check `.env.local` contains `NETLIFY_AUTH_TOKEN`
- Verify token is valid and has site access

**"Build failed":**
- Try `npm run deploy:clean` for a clean build
- Check build logs for specific errors

**"Deployment verification failed":**
- Check the deployment URL manually
- Deployment may still be processing (Netlify can take time)
- Network issues may cause verification to fail even if deployment succeeded

**"Site not accessible":**
- Wait a few minutes for Netlify processing
- Check Netlify dashboard for deployment status
- Verify DNS settings if using custom domain