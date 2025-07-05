# Deployment Issue - Build Timeout

## Problem
The `expo export --platform web` command is timing out during the static rendering phase. This appears to be hanging at the "Static rendering is enabled" step.

## Previous Deployment Method
Based on the project structure, it seems the previous deployment method may have been different. The timeout suggests the static rendering process is encountering an issue.

## Immediate Solutions

### Option 1: Deploy Previous Build
If you have access to Netlify dashboard:
1. Check if there's a previous successful build in Netlify
2. Rollback to that version temporarily

### Option 2: Disable Static Rendering
Modify `app.json` to disable static rendering:
```json
"web": {
  "bundler": "metro",
  "output": "single",  // Change from "static" to "single"
  "favicon": "./assets/icon-2.png"
}
```

Then run:
```bash
npx expo export --platform web
```

### Option 3: Use Development Build
For immediate deployment of the v2 profile changes:
```bash
# Start dev server
npm run web

# Use a tool like ngrok to expose it temporarily
npx ngrok http 19006
```

## What Changed in v2 Profile
The profile page (`/app/profile/[id].tsx`) now:
- Uses demo data from `@/demo/DemoData` 
- Matches UAM005PublicProfile design exactly
- Has proper styling with #430B92 purple accents
- Shows social platforms with follower counts
- Displays achievements and business ventures

## Root Cause
The build timeout could be due to:
1. Static rendering trying to pre-render all routes
2. Memory issues during the build
3. Circular dependencies in the static generation

## Recommended Fix
1. Temporarily disable static rendering
2. Deploy the build
3. Investigate the static rendering issue separately

## Alternative: Manual Deployment
If you have a previous working build in `dist/` or can get one:
```bash
# Deploy directly with netlify CLI
npx netlify deploy --dir=dist --prod --site=polite-ganache-3a4e1b
```