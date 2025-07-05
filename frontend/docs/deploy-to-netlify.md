# Deploy Frontend to Netlify

## 🚀 Recommended Method: Use Centralized Deployment System

**The easiest and safest way to deploy:**

### Deploy to Preview (Safe Default)
```bash
npm run deploy              # Build and deploy to preview URL
npm run deploy:quick        # Deploy without build
npm run deploy:dry-run      # Test without actually deploying
```

### Deploy to Production (Explicit)
```bash
npm run deploy:prod         # Build and deploy to production URL
npm run deploy:prod:quick   # Deploy to production without build
npm run deploy:prod:clean   # Clean build and deploy to production
```

**URLs:**
- Preview: `https://preview--polite-ganache-3a4e1b.netlify.app/`
- Production: `https://polite-ganache-3a4e1b.netlify.app/`

## ⚙️ Setup Requirements

1. **Environment Variables** (in `.env.local`):
   ```env
   NETLIFY_AUTH_TOKEN=your_token_here
   NETLIFY_SITE_NAME=polite-ganache-3a4e1b
   NETLIFY_SITE_API_ID=6e93cf51-17e5-4528-8e38-7ad22c2b6b78
   ```

2. **Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

## 🔍 What the Deployment System Does

✅ **Build Verification**: Ensures build completed successfully  
✅ **Live Site Testing**: Verifies deployed site is accessible  
✅ **Content Validation**: Checks HTML structure and content  
✅ **Error Prevention**: Safe defaults to prevent accidental production deploys  
✅ **Comprehensive Logging**: Clear success/failure messages  

## 📊 Manual Methods (Legacy - Use Only If Needed)

### Option 1: Direct Netlify CLI
```bash
# Build first
npm run export:web

# Deploy to preview
netlify deploy --dir=dist

# Deploy to production (careful!)
netlify deploy --prod --dir=dist
```

### Option 2: Manual Upload
```bash
# Build and zip
npm run export:web
cd dist && zip -r ../build.zip . && cd ..

# Upload at netlify.com dashboard
```

### Option 3: Git Deploy
- Connect repository to Netlify
- Build command: `npm run export:web`
- Publish directory: `dist`

## 🛠️ Troubleshooting

**"No auth token found"**
```bash
# Check your token setup
echo $NETLIFY_AUTH_TOKEN
cat .env.local | grep NETLIFY_AUTH_TOKEN
```

**"Build failed"**
```bash
# Try a clean build
npm run deploy:clean
```

**"Deployment verification failed"**
- Check the manual verification link provided
- Deployment may still be processing

## 📋 Environment Variables for Production

Add these in Netlify dashboard for Git deployments:
- `EXPO_PUBLIC_DEMO_MODE=true`
- `EXPO_PUBLIC_ENVIRONMENT=production`

## ✨ Features Included

✅ All QA issues fixed  
✅ SPA routing with proper redirects  
✅ Comprehensive accessibility improvements  
✅ Enhanced keyboard navigation  
✅ WCAG compliant color contrast  
✅ User feedback and toast notifications  
✅ Form validation improvements  
✅ Mobile responsiveness fixes  
✅ Authentication protection  

---

**💡 Tip:** Always use `npm run deploy` (preview) for testing and `npm run deploy:prod` only when ready for production!