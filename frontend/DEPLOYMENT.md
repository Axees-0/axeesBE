# 📚 Axees Frontend Deployment Guide

This is the comprehensive deployment guide for the Axees frontend application. All deployment-related information has been consolidated here.

## 🚀 Quick Start

### Deploy to Production
```bash
npm run deploy
```
This command will build the project and deploy to the production Netlify site.

### Deploy Without Building
```bash
npm run deploy:quick
```
Use this when you've already built the project and just need to deploy.

### Clean Build and Deploy
```bash
npm run deploy:clean
```
Forces a clean build (clears cache) before deploying.

## 📋 Prerequisites

1. **Node.js and npm** installed
2. **Netlify CLI** (will be auto-installed if needed)
3. **Netlify Account** with appropriate permissions
4. **API Token** (optional but recommended for CI/CD)

## 🔑 Authentication Setup

### Option 1: Interactive Login (Default)
The Netlify CLI will open a browser for authentication on first use.

### Option 2: API Token (Recommended)

1. **Get your token:**
   - Go to https://app.netlify.com/user/applications#personal-access-tokens
   - Click "New access token"
   - Name it (e.g., "Axees CLI Deployment")
   - Copy the token immediately (you won't see it again!)

2. **Set the token:**
   ```bash
   # Environment variable (temporary)
   export NETLIFY_AUTH_TOKEN="your-token-here"
   
   # Or save to file (permanent)
   echo "your-token-here" > ~/.netlify-token
   chmod 600 ~/.netlify-token
   ```

3. **Use in deployment:**
   ```bash
   # Automatic detection
   npm run deploy
   
   # Or explicit token
   node scripts/deployment/unified-deploy.js --token YOUR_TOKEN --prod
   ```

## 🛠️ Advanced Deployment Options

### Custom Site Deployment
```bash
# Deploy to specific Netlify site
node scripts/deployment/unified-deploy.js --site YOUR_SITE_ID --build

# Deploy to staging
npm run deploy:staging
```

### Deploy from Zip File
```bash
# Deploy a pre-built zip package
node scripts/deployment/unified-deploy.js --zip package.zip --prod
```

### Deploy from Custom Directory
```bash
# Deploy from specific directory
node scripts/deployment/unified-deploy.js --dir ./build --prod
```

## 📁 Project Structure

```
frontend/
├── dist/                    # Build output directory
├── scripts/
│   ├── deployment/
│   │   └── unified-deploy.js   # Main deployment script
│   └── smart-build.js          # Intelligent build system
├── deployment.config.js        # Deployment configuration
└── package.json               # NPM scripts
```

## ⚙️ Configuration

All deployment settings are centralized in `deployment.config.js`:

```javascript
module.exports = {
  netlify: {
    sites: {
      production: 'polite-ganache-3a4e1b',
      staging: null,  // Configure your staging site ID
      development: null
    }
  },
  build: {
    outputDir: 'dist',
    timeout: 300000  // 5 minutes
  }
  // ... more settings
}
```

## 🔄 CI/CD Integration

### GitHub Actions

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Netlify
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        run: npm run deploy
```

Don't forget to add `NETLIFY_AUTH_TOKEN` to your repository secrets!

## 🐛 Troubleshooting

### Build Failures

1. **Out of Memory:**
   ```bash
   # Increase memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run deploy
   ```

2. **Timeout Issues:**
   ```bash
   # Use quick deploy if build succeeds locally
   npm run build:smart
   npm run deploy:quick
   ```

### Deployment Failures

1. **Authentication Issues:**
   - Ensure your token is valid
   - Try logging out and back in: `netlify logout && netlify login`

2. **Site Not Found:**
   - Verify site ID in `deployment.config.js`
   - Check site exists: `netlify sites:list`

3. **Permission Errors:**
   - Ensure you have deploy permissions for the site
   - Check team membership if applicable

## 📊 Monitoring Deployments

### Check Deployment Status
```bash
# View recent deploys
netlify deploys --site polite-ganache-3a4e1b

# View deployment logs
netlify deploy --prod --dir=dist --debug
```

### Track Build Times
Build times are logged to `build-times.log`:
```bash
tail -f build-times.log
```

## 🎯 Best Practices

1. **Always test locally first:**
   ```bash
   npm run web  # Test in browser
   ```

2. **Use appropriate deployment method:**
   - `deploy` - For production releases
   - `deploy:quick` - For hotfixes (when already built)
   - `deploy:clean` - When dependencies change

3. **Version control your deployments:**
   - Tag releases: `git tag -a v1.0.0 -m "Release v1.0.0"`
   - Document changes in CHANGELOG.md

4. **Monitor deployment URLs:**
   - Check `deployment-url.txt` after each deploy
   - Verify deployment at the URL before announcing

## 🔄 Migration from Old Scripts

If you're using old deployment scripts, see `scripts/deployment/DEPRECATED_README.md` for migration instructions.

## 📞 Getting Help

- **Netlify Documentation:** https://docs.netlify.com
- **Issues:** Report at project repository
- **Logs:** Check `build-times.log` and Netlify dashboard

---

Last updated: 2024
Version: 2.0.0 (Unified Deployment System)