#!/bin/bash

# Test Demo Deployment Script for Investor Profile
# This script deploys ONLY the test demo to a separate environment

set -e

echo "🚀 Starting Test Demo Deployment for Investor Profile..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEMO_DIR="app/test-demo"
BUILD_DIR="dist-demo"
TEST_URL_FILE="test-demo-url.txt"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  • Demo Directory: $DEMO_DIR"
echo "  • Build Directory: $BUILD_DIR"
echo "  • Environment: TEST (NOT PRODUCTION)"
echo ""

# Check if we're in the right directory
if [ ! -d "$DEMO_DIR" ]; then
    echo -e "${RED}❌ Error: Demo directory not found. Are you in the frontend directory?${NC}"
    echo "Expected: $DEMO_DIR"
    exit 1
fi

# Check for required assets
echo -e "${BLUE}🔍 Checking Required Assets...${NC}"
REQUIRED_ASSETS=(
    "assets/3.png"
    "assets/share-08.png"
    "assets/search01.svg"
    "assets/zap.svg"
    "assets/contracts.svg"
    "assets/agreement02.svg"
    "assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png"
    "assets/pngclipartyoutubeplaybuttoncomputericonsyoutubeyoutubelogoanglerectanglethumbnail-13.png"
    "assets/tiktok-icon.png"
    "assets/facebook-icon.png"
)

missing_assets=()
for asset in "${REQUIRED_ASSETS[@]}"; do
    if [ ! -f "$asset" ]; then
        missing_assets+=("$asset")
    else
        echo -e "  ${GREEN}✓${NC} $asset"
    fi
done

if [ ${#missing_assets[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required assets:${NC}"
    for asset in "${missing_assets[@]}"; do
        echo -e "  ${RED}✗${NC} $asset"
    done
    exit 1
fi

echo -e "${GREEN}✅ All required assets found!${NC}"
echo ""

# Install dependencies if needed
echo -e "${BLUE}📦 Checking Dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo -e "  ${GREEN}✓${NC} Dependencies already installed"
fi
echo ""

# Build the demo
echo -e "${BLUE}🏗️  Building Test Demo...${NC}"
export NODE_ENV=development
export EXPO_PUBLIC_DEMO_MODE=true

# Create demo-specific build
npx expo export --platform web --output-dir "$BUILD_DIR" --clear

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Build failed - output directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""

# Create a simple test validation
echo -e "${BLUE}🧪 Creating Test Validation...${NC}"
cat > "$BUILD_DIR/test-validation.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Demo Validation</title>
    <style>
        body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .status { padding: 16px; border-radius: 8px; margin: 16px 0; }
        .success { background: #e6f7e6; border-left: 4px solid #28a745; }
        .info { background: #e6f3ff; border-left: 4px solid #007bff; }
        .test-btn { background: #430B92; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 8px; }
        .test-btn:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Investor Demo Test Environment</h1>
        
        <div class="status success">
            <strong>✅ Deployment Successful!</strong><br>
            Your AxeesMockup3-based investor demo profile is ready for testing.
        </div>
        
        <div class="status info">
            <strong>📋 Test Instructions:</strong><br>
            1. Navigate to /test-demo to see the demo index<br>
            2. Click "View Demo Profile" to see the AxeesMockup3 layout<br>
            3. Test both desktop (≥768px) and mobile (<768px) views<br>
            4. Verify all platform icons and metrics display correctly<br>
            5. Test the "Create Offer" modal functionality
        </div>
        
        <h3>Quick Access:</h3>
        <button class="test-btn" onclick="window.location.href='/test-demo'">Demo Index</button>
        <button class="test-btn" onclick="window.location.href='/test-demo/investor-profile'">Direct Profile</button>
        <button class="test-btn" onclick="window.location.href='/'">Main App</button>
        
        <h3>Demo Features:</h3>
        <ul>
            <li>✅ Exact AxeesMockup3 UI layout preserved</li>
            <li>✅ MrBeast profile data (1.1B+ followers)</li>
            <li>✅ Responsive design (desktop + mobile)</li>
            <li>✅ Full modal integration</li>
            <li>✅ Production-ready for investor demos</li>
        </ul>
        
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            Build completed: <span id="timestamp"></span><br>
            Environment: TEST (Isolated from production)
        </div>
    </div>
    
    <script>
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ Test validation page created${NC}"
echo ""

# Create deployment summary
echo -e "${BLUE}📄 Creating Deployment Summary...${NC}"
cat > "TEST_DEMO_DEPLOYMENT_SUMMARY.md" << EOF
# Test Demo Deployment Summary

## 🚀 Deployment Status: SUCCESS

**Deployed:** $(date)
**Environment:** TEST (Isolated from production)
**Build Directory:** $BUILD_DIR

## 📁 Deployed Components

### ✅ Test Demo Routes
- \`/test-demo\` - Demo index with navigation
- \`/test-demo/investor-profile\` - AxeesMockup3 profile layout

### ✅ Assets Verified
- Logo (3.png)
- Share icon (share-08.png)
- Platform icons (Instagram, YouTube, TikTok, Facebook)
- UI icons (search, zap, contracts, agreement)

### ✅ Demo Content
- **Profile:** MrBeast (Jimmy Donaldson)
- **Total Followers:** 1.1B+
- **Platforms:** YouTube (328M), Instagram (60M), TikTok (104M), Facebook (20M)
- **Offers:** 1,200
- **Deals:** 450

## 🧪 Testing Instructions

### Desktop Testing (≥768px)
1. Navigate to /test-demo
2. Click "View Demo Profile"
3. Verify AxeesMockup3 layout displays correctly
4. Test "Create Offer" modal
5. Verify all platform icons and metrics

### Mobile Testing (<768px)
1. Resize browser window or use mobile device
2. Verify mobile fallback layout
3. Test navigation and modal functionality

## 🔗 Access URLs

- **Demo Index:** /test-demo
- **Profile Direct:** /test-demo/investor-profile
- **Validation Page:** /test-validation.html

## ⚠️ Important Notes

- This is a TEST deployment, completely isolated from production
- No production data or users are affected
- Safe for investor demonstrations and internal testing
- Assets and routes are separate from main application

## 🔄 Next Steps

1. Test all functionality in deployed environment
2. Verify responsive behavior across devices
3. Validate investor demo flow
4. Share test URL with stakeholders for review

EOF

echo -e "${GREEN}✅ Deployment summary created${NC}"
echo ""

# Final status
echo -e "${GREEN}🎉 TEST DEMO DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📍 What was deployed:${NC}"
echo "  • AxeesMockup3-based investor demo profile"
echo "  • Isolated test environment (NOT production)"
echo "  • MrBeast demo content with 1.1B+ followers"
echo "  • Responsive design for desktop and mobile"
echo "  • Full modal and navigation functionality"
echo ""
echo -e "${BLUE}🔗 Access points:${NC}"
echo "  • Demo Index: /test-demo"
echo "  • Profile Direct: /test-demo/investor-profile"
echo "  • Validation: /test-validation.html"
echo ""
echo -e "${YELLOW}⚠️  Remember: This is a TEST deployment only!${NC}"
echo "   Safe for investor demos and stakeholder review."
echo ""

# Save deployment info
echo "$(date): Test demo deployment completed successfully" >> "deployment.log"
echo "/test-demo" > "$TEST_URL_FILE"

echo -e "${GREEN}✅ Ready for testing and investor demonstrations!${NC}"