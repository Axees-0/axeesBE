# 🚀 Manual Netlify Deployment Instructions

Since CLI authentication is timing out, here are two quick alternatives:

## Option 1: Drag & Drop (30 seconds)

1. Open https://app.netlify.com in your browser
2. You should see a section "Sites" with a drag-and-drop area
3. Open your file manager to: `/home/Mike/projects/axees/axeesBE/frontend/dist`
4. Drag the entire `dist` folder onto the Netlify page
5. Netlify will instantly deploy and give you a URL!

## Option 2: GitHub Connected Site

If you already have a Netlify site connected to the axeesBE repo:

1. Go to your Netlify dashboard
2. Find the site connected to `Axees-0/axeesBE`
3. Go to "Site settings" → "Build & deploy"
4. Change the production branch to `investor-demo-only`
5. Trigger a new deploy

## Option 3: Create New Site from GitHub

1. Click "New site from Git" in Netlify
2. Choose GitHub → `Axees-0/axeesBE`
3. Set:
   - Branch: `investor-demo-only`
   - Base directory: `frontend`
   - Build command: `npm run export:web`
   - Publish directory: `frontend/dist`
4. Click "Deploy site"

## Your Build is Ready!

The `dist` folder contains:
- ✅ 294 optimized files
- ✅ Demo mode enabled (`DEMO_MODE=true`)
- ✅ Auto-login as marketer
- ✅ 15 creator profiles
- ✅ Professional analytics dashboard

Just need to get it on Netlify's servers!