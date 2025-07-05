# 🚀 Deployment System

This directory contains the complete deployment system for the Axees frontend application.

## Structure

```
deployment/
├── README.md                    # This documentation
├── deployment.config.js         # Centralized configuration
├── deploy.js                   # Main deployment script
├── test-deployment-dry.js      # Testing script
├── migrate-hardcoded-values.js # Migration utility
├── DEPLOYMENT_DRY.md          # DRY methodology documentation
└── DEPLOYMENT_VERIFICATION.md  # Verification system docs
```

## Quick Start

### Deploy to Preview (Safe Default)
```bash
npm run deploy              # With build
npm run deploy:quick        # Without build
npm run deploy:dry-run      # Test without deploying
```

### Deploy to Production (Explicit)
```bash
npm run deploy:prod         # With build
npm run deploy:prod:quick   # Without build
npm run deploy:prod:clean   # Clean build + deploy
```

### Test the System
```bash
node deployment/test-deployment-dry.js
```

## Key Features

### 🔒 **Safe by Default**
- All deployments go to preview URL unless explicitly requesting production
- Preview URL: `https://preview--polite-ganache-3a4e1b.netlify.app/`
- Production URL: `https://polite-ganache-3a4e1b.netlify.app/`

### 🔍 **Comprehensive Verification**
- Build output validation
- Live site accessibility testing
- Content validation (HTML structure, title, no errors)
- Retry logic with graceful failure handling
- Detailed status reporting

### 🎯 **DRY Principles**
- Single configuration file for all deployment settings
- No hardcoded values scattered across the codebase
- Centralized token management
- Consistent logging and error handling

### ⚡ **Smart Deployment**
- Environment-specific configurations
- Build verification before deployment
- Post-deployment live site testing
- JSON status files for audit trails

## Configuration

All settings are centralized in `deployment.config.js`:

- **Site IDs and URLs**: Production, staging, development
- **Build settings**: Timeouts, memory limits, commands
- **Token management**: Multiple fallback sources
- **Verification**: Retry logic, content checks
- **Environment configs**: Per-environment build commands

## Output Files

The deployment system creates these files in the project root:

- `deployment-url.txt`: Contains the live deployment URL
- `deployment-status.json`: Detailed verification results
- `build-times.log`: Build performance tracking

## Environment Variables

Required in `.env.local`:
```env
NETLIFY_AUTH_TOKEN=your_token_here
NETLIFY_SITE_NAME=polite-ganache-3a4e1b
NETLIFY_SITE_API_ID=6e93cf51-17e5-4528-8e38-7ad22c2b6b78
```

## Error Handling

The system provides clear error messages and recovery suggestions:

- **Build failures**: Shows exact error and suggests fixes
- **Token issues**: Guides through token setup
- **Verification failures**: Provides manual verification links
- **Network issues**: Implements retry logic with delays

## Migration

If upgrading from the old deployment system:

1. Run the migration script:
   ```bash
   node deployment/migrate-hardcoded-values.js
   ```

2. Test the new system:
   ```bash
   node deployment/test-deployment-dry.js
   ```

3. Update any custom scripts to use the new paths

## Troubleshooting

### Common Issues

**"No auth token found"**
```bash
# Check token sources
echo $NETLIFY_AUTH_TOKEN
cat .env.local | grep NETLIFY_AUTH_TOKEN
```

**"Build output verification failed"**
```bash
# Check if dist directory exists and has content
ls -la dist/
```

**"Deployment verification failed"**
- Check the manual verification link provided
- Deployment may still be processing (retry in a few minutes)

## Development

To modify the deployment system:

1. **Configuration**: Edit `deployment.config.js`
2. **Main Logic**: Edit `deploy.js`
3. **Testing**: Update `test-deployment-dry.js`
4. **Documentation**: Update relevant markdown files

All changes should maintain backward compatibility and follow DRY principles.

---

*For detailed documentation, see the individual markdown files in this directory.*