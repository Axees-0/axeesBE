# Deploy Frontend to Netlify

## Quick Deploy Method (Recommended)

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the project**:
   ```bash
   npm run export:web
   ```

3. **Deploy to Netlify**:
   ```bash
   netlify deploy --prod --dir=dist
   ```

## Alternative: Manual Deploy via Netlify Dashboard

1. **Build the project**:
   ```bash
   npm run export:web
   ```

2. **Zip the dist folder**:
   ```bash
   cd dist
   zip -r ../axees-frontend-build.zip .
   cd ..
   ```

3. **Upload to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `axees-frontend-build.zip` file
   - Or click "Browse to upload" and select the zip file

## Alternative: Git Deploy

1. **Push your code to a Git repository** (GitHub, GitLab, etc.)

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository
   - Set build command: `npm run export:web`
   - Set publish directory: `dist`

## Environment Variables for Production

If using Git deploy, add these environment variables in Netlify:
- `EXPO_PUBLIC_DEMO_MODE=true`
- `EXPO_PUBLIC_ENVIRONMENT=production`

## Features Included in This Build

✅ All 34 QA issues have been fixed:
- SPA routing with proper redirects
- Comprehensive accessibility improvements
- Enhanced keyboard navigation
- WCAG compliant color contrast
- User feedback and toast notifications
- Form validation improvements
- Mobile responsiveness fixes
- Authentication protection

The deployed site will have all the bug fixes and improvements implemented!