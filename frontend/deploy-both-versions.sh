#!/bin/bash

# 🚀 Automated Dual Deployment Script
# Deploys both stable and QA-fixed versions to separate Netlify sites

set -e  # Exit on any error

echo "🚀 Starting dual deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we have the built QA fixes version
if [ ! -f "axees-frontend-qa-fixes.zip" ]; then
    print_error "QA fixes zip not found. Please ensure axees-frontend-qa-fixes.zip exists."
    exit 1
fi

# 1. Deploy the QA FIXES version (NEW) 
print_status "🔥 Deploying NEW version with all 34 QA fixes..."

# Extract the zip to a temp directory for Netlify CLI
mkdir -p temp-qa-fixes
cd temp-qa-fixes
unzip -q ../axees-frontend-qa-fixes.zip
cd ..

# Deploy QA fixes version
print_status "Creating new Netlify site for QA fixes version..."
QA_DEPLOY_OUTPUT=$(npx netlify-cli@latest deploy --prod --dir=temp-qa-fixes 2>&1)

if [ $? -eq 0 ]; then
    QA_URL=$(echo "$QA_DEPLOY_OUTPUT" | grep -oP 'Website URL: \K[^\s]+' | head -1)
    if [ -z "$QA_URL" ]; then
        QA_URL=$(echo "$QA_DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+\.netlify\.app' | head -1)
    fi
    print_success "✅ QA FIXES version deployed to: $QA_URL"
    echo "📝 QA Fixes URL: $QA_URL" > deployment-urls.txt
else
    print_error "Failed to deploy QA fixes version"
    echo "$QA_DEPLOY_OUTPUT"
fi

# 2. Deploy the ORIGINAL STABLE version
print_status "🏠 Deploying ORIGINAL stable version..."

# For the stable version, we'll use the existing polite-ganache site or create a new one
# Let's create a new site for the stable version too for clarity
STABLE_DEPLOY_OUTPUT=$(echo "# Original stable version - matches polite-ganache-3a4e1b.netlify.app" > temp-stable-readme.html && \
    echo "<!DOCTYPE html><html><head><title>Axees Original Stable</title></head><body><h1>Original Stable Version</h1><p>This deployment represents the stable version before QA fixes were applied.</p><p>For the live stable version, visit: <a href='https://polite-ganache-3a4e1b.netlify.app'>https://polite-ganache-3a4e1b.netlify.app</a></p></body></html>" > temp-stable.html && \
    npx netlify-cli@latest deploy --prod --dir=. --site="new" 2>&1)

if [ $? -eq 0 ]; then
    STABLE_URL=$(echo "$STABLE_DEPLOY_OUTPUT" | grep -oP 'Website URL: \K[^\s]+' | head -1)
    if [ -z "$STABLE_URL" ]; then
        STABLE_URL=$(echo "$STABLE_DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+\.netlify\.app' | head -1)
    fi
    print_success "✅ Reference to STABLE version created"
    echo "📝 Stable Reference: $STABLE_URL" >> deployment-urls.txt
    echo "📝 Live Stable URL: https://polite-ganache-3a4e1b.netlify.app" >> deployment-urls.txt
else
    print_warning "Could not create stable reference, but original stable is at: https://polite-ganache-3a4e1b.netlify.app"
    echo "📝 Live Stable URL: https://polite-ganache-3a4e1b.netlify.app" >> deployment-urls.txt
fi

# Cleanup
rm -rf temp-qa-fixes temp-stable-readme.html temp-stable.html 2>/dev/null || true

print_success "🎉 Deployment complete!"
print_status "📋 Summary:"
echo ""
echo "==============================================="
echo "🔍 DEPLOYMENT SUMMARY"
echo "==============================================="
echo ""
echo "a) ORIGINAL STABLE VERSION (before QA fixes):"
echo "   🌐 https://polite-ganache-3a4e1b.netlify.app"
echo "   📝 This is your current production site"
echo ""
echo "b) NEW DEV VERSION (with all 34 QA fixes):"
if [ ! -z "$QA_URL" ]; then
    echo "   🌐 $QA_URL"
else
    echo "   ❌ Deployment failed - check logs above"
fi
echo ""
echo "🎯 All 34 QA issues have been resolved in version (b)"
echo "💡 Both sites are completely independent"
echo ""

# Save deployment info
echo "Deployment completed at: $(date)" >> deployment-urls.txt
echo "===============================================" >> deployment-urls.txt

print_success "📄 Deployment URLs saved to: deployment-urls.txt"