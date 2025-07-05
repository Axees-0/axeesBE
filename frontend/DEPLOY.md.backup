# Deployment Instructions

## Quick Deploy

To deploy the frontend to Netlify:

```bash
npm run deploy
```

## Manual Deployment

If the automated deployment fails, follow these steps:

### 1. Build the Project

```bash
npm run export:web
```

This creates a `dist/` folder with the production build.

### 2. Deploy to Netlify

#### Option A: Using Netlify CLI

```bash
# Login to Netlify (if needed)
npx netlify login

# Link to your site (if needed)
npx netlify link

# Deploy to production
npx netlify deploy --dir=dist --prod
```

#### Option B: Using Netlify Dashboard

1. Go to https://app.netlify.com
2. Navigate to your site: polite-ganache-3a4e1b
3. Drag and drop the `dist` folder onto the deployment area

### 3. Verify Deployment

Your site will be live at: https://polite-ganache-3a4e1b.netlify.app

## What's Changed

The v2 profile page now:
- Matches the UAM005PublicProfile design exactly
- Uses demo data instead of API calls
- Has consistent styling with purple accents (#430B92)
- Displays social media platforms with follower counts
- Shows achievements and business ventures sections

## Troubleshooting

### Build Fails
- Check for TypeScript errors: `npm run lint`
- Clear cache: `rm -rf dist && npm run export:web`

### Deployment Auth Issues
- Logout and login again: `npx netlify logout && npx netlify login`
- Check your Netlify token is valid

### Site Not Updating
- Clear browser cache
- Wait 2-3 minutes for CDN to update
- Check deployment logs in Netlify dashboard