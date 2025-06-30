# ⚠️ DEPRECATED DEPLOYMENT SCRIPTS

All scripts in this directory (except `unified-deploy.js`) are **DEPRECATED** and scheduled for removal.

## Migration Guide

### Old Script → New Command Mapping

| Old Script | New Command | Notes |
|------------|-------------|-------|
| `auto-deploy.js` | `npm run deploy` | Use unified deployment |
| `auto-netlify-deploy.js` | `npm run deploy` | Use unified deployment |
| `deploy.sh` | `npm run deploy` | Use unified deployment |
| `deploy-axees.sh` | `npm run deploy` | Use unified deployment |
| `deploy-both-versions.sh` | See dual deployment guide | Use separate site deployments |
| `deploy-dual-correct.sh` | See dual deployment guide | Use separate site deployments |
| `deploy-final-dual.js` | See dual deployment guide | Use separate site deployments |
| `deploy-simple-dual.js` | See dual deployment guide | Use separate site deployments |
| `deploy-simple.sh` | `npm run deploy:quick` | Quick deployment without build |
| `deploy-to-specific-site.js` | `npm run deploy --site SITE_ID` | Specify site with --site flag |
| `deploy-via-api.sh` | `npm run deploy --token TOKEN` | Use --token flag |
| `deploy-with-token.js` | `npm run deploy --token TOKEN` | Use --token flag |
| `direct-deploy.js` | `npm run deploy:quick` | Direct deployment |
| `direct-netlify-upload.js` | `npm run deploy --zip FILE` | Use --zip flag |
| `force-netlify-deploy.js` | `npm run deploy --prod` | Use --prod flag |
| `simple-deploy.js` | `npm run deploy:quick` | Quick deployment |

## Unified Deployment Script

All deployment functionality has been consolidated into:
```
scripts/deployment/unified-deploy.js
```

### Available Commands

```bash
# Standard deployment (build + deploy to production)
npm run deploy

# Quick deployment (no build)
npm run deploy:quick

# Clean build + deploy
npm run deploy:clean

# Deploy to staging
npm run deploy:staging

# Custom deployment
node scripts/deployment/unified-deploy.js [options]
```

### Options

- `--prod` - Deploy to production
- `--site <id>` - Deploy to specific site
- `--dir <path>` - Deploy from directory
- `--zip <file>` - Deploy from zip file
- `--token <token>` - Use specific token
- `--build` - Build before deploy
- `--clean` - Clean build before deploy

## Configuration

All deployment settings are now centralized in:
```
deployment.config.js
```

## Removal Timeline

These deprecated scripts will be removed in the next major update. Please update your workflows to use the unified deployment system.

## For Dual/Multiple Site Deployments

If you need to deploy to multiple sites:

1. Deploy to production:
   ```bash
   npm run deploy
   ```

2. Deploy to staging:
   ```bash
   npm run deploy:staging
   ```

3. Deploy to custom site:
   ```bash
   node scripts/deployment/unified-deploy.js --site YOUR_SITE_ID --build
   ```