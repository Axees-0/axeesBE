#!/bin/bash

# Axees Demo Deployment Script
echo "🚀 Starting Axees Demo Deployment..."

# Step 1: Verify build exists
if [ ! -d "dist" ]; then
    echo "❌ Build directory not found. Running build..."
    npm run export:web
fi

# Step 2: Verify Netlify CLI (install if needed)
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Step 3: Deploy to Netlify
echo "🌍 Deploying to Netlify..."
cd dist
netlify deploy --prod --dir . --message "Investor Demo Deployment"

echo "✅ Deployment complete!"
echo "🎬 Demo is now live for investor presentations"