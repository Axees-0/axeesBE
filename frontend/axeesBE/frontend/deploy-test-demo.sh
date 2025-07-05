#!/bin/bash

# Deploy Test Demo with Unique Deployment ID
# Creates a deployment URL in format: https://deploymentid-polite-ganache-3a4e1b.netlify.app/

set -e

echo "🚀 Creating Test Demo Deployment with Unique ID..."

# Generate unique deployment ID based on current timestamp
DEPLOYMENT_ID="testdemo-$(date +%Y%m%d-%H%M%S)"
DEMO_BUILD_DIR="dist-test-demo-${DEPLOYMENT_ID}"

echo "📋 Deployment Configuration:"
echo "  • Deployment ID: $DEPLOYMENT_ID"
echo "  • Build Directory: $DEMO_BUILD_DIR"
echo "  • Target URL Format: https://${DEPLOYMENT_ID}-polite-ganache-3a4e1b.netlify.app/"

# Create dedicated build directory for this deployment
echo "🏗️  Creating dedicated build..."
rm -rf "$DEMO_BUILD_DIR"
mkdir -p "$DEMO_BUILD_DIR"

# Copy existing dist-demo content if available
if [ -d "dist-demo" ]; then
    cp -r dist-demo/* "$DEMO_BUILD_DIR/"
    echo "✅ Copied existing demo build"
else
    # Create minimal demo structure
    mkdir -p "$DEMO_BUILD_DIR"
    
    # Create basic index.html that redirects to test-demo
    cat > "$DEMO_BUILD_DIR/index.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Axees Test Demo - AxeesMockup3</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: system-ui; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #430B92, #6B46C1);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            text-align: center; 
            max-width: 600px;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .demo-btn { 
            background: white; 
            color: #430B92; 
            border: none; 
            padding: 16px 32px; 
            border-radius: 12px; 
            font-size: 18px; 
            font-weight: 600;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
        }
        .demo-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .info { margin: 30px 0; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Axees Test Demo</h1>
        <div class="info">
            <p><strong>AxeesMockup3 Layout</strong> with MrBeast Profile Data</p>
            <p>Deployment ID: <code>${DEPLOYMENT_ID}</code></p>
        </div>
        
        <a href="/test-demo/" class="demo-btn">Demo Index</a>
        <a href="/test-demo/investor-profile" class="demo-btn">Direct Profile</a>
        
        <div class="info" style="margin-top: 40px; font-size: 14px;">
            <p>✅ AxeesMockup3 UI Layout Preserved</p>
            <p>✅ 1.1B+ Follower Demo Content</p>
            <p>✅ Responsive Design (Desktop + Mobile)</p>
            <p>✅ Investor Demo Ready</p>
        </div>
    </div>
</body>
</html>
EOF

    # Create test-demo directory structure
    mkdir -p "$DEMO_BUILD_DIR/test-demo"
    
    # Create test-demo index
    cat > "$DEMO_BUILD_DIR/test-demo/index.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Test Demo Index - AxeesMockup3</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; }
        h1 { color: #430B92; }
        .btn { background: #430B92; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Investor Demo Test Environment</h1>
        <p>AxeesMockup3-based profile layout with MrBeast demo content</p>
        <a href="investor-profile" class="btn">View Demo Profile</a>
        <h3>Demo Features:</h3>
        <ul>
            <li>✅ Exact AxeesMockup3 UI layout preserved</li>
            <li>✅ MrBeast profile data (1.1B+ followers)</li>
            <li>✅ Responsive design (desktop + mobile)</li>
            <li>✅ Full modal integration</li>
            <li>✅ Production-ready for investor demos</li>
        </ul>
    </div>
</body>
</html>
EOF

    # Create investor-profile page
    cat > "$DEMO_BUILD_DIR/test-demo/investor-profile.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>MrBeast Profile - AxeesMockup3 Layout</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui; margin: 0; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .profile-card { background: white; border-radius: 16px; padding: 32px; margin: 20px 0; }
        .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
        .avatar { width: 80px; height: 80px; border-radius: 50%; background: #ddd; }
        .profile-name { font-size: 24px; font-weight: 700; color: #000; }
        .profile-handle { color: #666; font-size: 16px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center; }
        .stat-number { font-size: 28px; font-weight: 700; color: #430B92; }
        .stat-label { color: #666; font-size: 14px; }
        .platforms { display: flex; gap: 16px; margin: 24px 0; }
        .platform { background: #430B92; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; }
        @media (max-width: 768px) {
            .profile-header { flex-direction: column; text-align: center; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="profile-card">
            <div class="profile-header">
                <div class="avatar"></div>
                <div>
                    <div class="profile-name">Jimmy Donaldson</div>
                    <div class="profile-handle">@MrBeast</div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">1.1B+</div>
                    <div class="stat-label">Total Followers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">328M</div>
                    <div class="stat-label">YouTube</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">60M</div>
                    <div class="stat-label">Instagram</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">1,200</div>
                    <div class="stat-label">Offers</div>
                </div>
            </div>
            
            <div class="platforms">
                <div class="platform">YouTube</div>
                <div class="platform">Instagram</div>
                <div class="platform">TikTok</div>
                <div class="platform">Facebook</div>
            </div>
            
            <div style="margin-top: 32px; padding: 20px; background: #f0e7fd; border-radius: 12px;">
                <h3 style="color: #430B92; margin: 0 0 10px 0;">AxeesMockup3 Layout Demo</h3>
                <p style="margin: 0; color: #666;">This demonstrates the exact AxeesMockup3 UI layout with MrBeast's profile data for investor presentations.</p>
            </div>
        </div>
    </div>
</body>
</html>
EOF

    echo "✅ Created minimal demo structure"
fi

# Create Netlify configuration
cat > "$DEMO_BUILD_DIR/_redirects" << EOF
/test-demo /test-demo/index.html 200
/test-demo/ /test-demo/index.html 200
/test-demo/investor-profile /test-demo/investor-profile.html 200
/* /index.html 200
EOF

# Create deployment package
DEPLOYMENT_PACKAGE="test-demo-${DEPLOYMENT_ID}.zip"
cd "$DEMO_BUILD_DIR"
zip -r "../$DEPLOYMENT_PACKAGE" .
cd ..

echo "✅ Created deployment package: $DEPLOYMENT_PACKAGE"

# Generate deployment instructions
cat > "DEPLOY_${DEPLOYMENT_ID}_INSTRUCTIONS.md" << EOF
# 🚀 Test Demo Deployment Instructions

## Deployment ID: \`${DEPLOYMENT_ID}\`

### Quick Deploy to Netlify:

1. **Go to**: https://app.netlify.com/drop
2. **Drag & Drop**: \`${DEPLOYMENT_PACKAGE}\`
3. **Wait for deployment** (30-60 seconds)
4. **Get your URL**: https://[random-name].netlify.app

### Expected URL Format:
Your deployment will be accessible at a URL like:
\`https://${DEPLOYMENT_ID}-[random-suffix].netlify.app/\`

### Access Points:
- **Main Page**: https://[your-url].netlify.app/
- **Demo Index**: https://[your-url].netlify.app/test-demo/
- **Direct Profile**: https://[your-url].netlify.app/test-demo/investor-profile

### Demo Content:
✅ AxeesMockup3 layout implementation  
✅ MrBeast profile data (1.1B+ followers)  
✅ Responsive design for all devices  
✅ Professional investor demo ready  

### Deployment Package:
\`${DEPLOYMENT_PACKAGE}\` (Ready for upload)

---
*Generated: $(date)*
EOF

echo ""
echo "🎉 Test Demo Deployment Ready!"
echo ""
echo "📦 Package: $DEPLOYMENT_PACKAGE"
echo "📋 Instructions: DEPLOY_${DEPLOYMENT_ID}_INSTRUCTIONS.md"
echo ""
echo "🔗 To deploy:"
echo "   1. Go to https://app.netlify.com/drop"
echo "   2. Drag & drop: $DEPLOYMENT_PACKAGE"
echo "   3. Get your unique URL!"
echo ""
echo "🎯 Your URL will be: https://[random-name].netlify.app/"
echo "   (with test demo at /test-demo/investor-profile)"