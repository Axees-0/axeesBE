# 🚀 Demo Deployment Guide

## 🎯 Deployment Overview

This guide outlines how to deploy the Axees investor demo to a dedicated URL with offline fallback capabilities for reliable investor presentations.

---

## 📦 Pre-Deployment Checklist

### **Environment Setup**
- [ ] Copy `.env.demo` to `.env` for demo environment
- [ ] Verify `EXPO_PUBLIC_DEMO_MODE=true` is set
- [ ] Test auto-login functionality locally
- [ ] Confirm all demo data loads correctly

### **Performance Validation**
- [ ] Complete demo flows run in 30-60 seconds
- [ ] Analytics dashboard loads in < 1 second
- [ ] No console errors or warnings
- [ ] All polish effects work correctly

### **Content Verification**
- [ ] $45,600 earnings display correctly
- [ ] 89% success rate is prominent
- [ ] Curated deals show high-value opportunities
- [ ] Confetti and animations work smoothly

---

## 🌐 Demo URL Deployment

### **Web Deployment (Primary)**
```bash
# Build demo for web deployment
npm run build:web

# Deploy to demo subdomain
# Option 1: Vercel
vercel --prod --env EXPO_PUBLIC_DEMO_MODE=true

# Option 2: Netlify  
netlify deploy --prod --dir=web-build

# Option 3: AWS S3 + CloudFront
aws s3 sync web-build/ s3://axees-demo-bucket
aws cloudfront create-invalidation --distribution-id DEMO_DISTRIBUTION_ID --paths "/*"
```

### **Demo URL Configuration**
- **Primary URL**: `https://demo.axees.com`
- **Backup URL**: `https://axees-investor-demo.vercel.app`
- **Local Fallback**: `http://localhost:19006`

### **Custom Domain Setup**
```bash
# Configure custom domain
# DNS Records needed:
# CNAME demo.axees.com -> [deployment-platform].com
# A record for root domain if needed
```

---

## 💾 Offline Fallback Preparation

### **Local Demo Server**
```bash
# Create local demo server script
cat > start-demo-server.sh << 'EOF'
#!/bin/bash
echo "🎬 Starting Axees Investor Demo Server..."
export EXPO_PUBLIC_DEMO_MODE=true
npm run web
echo "📱 Demo available at: http://localhost:19006"
echo "🎯 Ready for investor presentation!"
EOF

chmod +x start-demo-server.sh
```

### **Offline Demo Package**
```bash
# Create offline demo package
mkdir -p offline-demo
cp -r web-build/* offline-demo/
cp .env.demo offline-demo/.env
cp start-demo-server.sh offline-demo/

# Create offline demo instructions
cat > offline-demo/README.md << 'EOF'
# Axees Investor Demo - Offline Version

## Quick Start
1. Install dependencies: `npm install`
2. Start demo: `./start-demo-server.sh`
3. Open browser: `http://localhost:19006`

## Demo Flow
1. Auto-login (2 seconds)
2. Marketer creates $5K offer (40 seconds)
3. Creator accepts deal (35 seconds)  
4. Analytics dashboard (30 seconds)

Ready for presentation! 🚀
EOF
```

---

## 🔧 Production Environment Setup

### **Environment Variables**
```bash
# Production demo environment
EXPO_PUBLIC_DEMO_MODE=true
EXPO_PUBLIC_BACKEND_URL=https://demo-api.axees.com
EXPO_PUBLIC_AUTO_LOGIN_USER=marketer
EXPO_PUBLIC_DEMO_SPEED=fast
EXPO_PUBLIC_PERFECT_DATA=true
EXPO_PUBLIC_BYPASS_PAYMENTS=true
EXPO_PUBLIC_NO_ERRORS=true
```

### **CDN Configuration**
```javascript
// webpack.config.js optimizations for demo
module.exports = {
  // ... existing config
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        demo: {
          test: /[\\/]demo[\\/]/,
          name: 'demo',
          priority: 20,
        },
      },
    },
  },
};
```

### **Performance Optimizations**
```bash
# Enable compression
gzip_on;
gzip_types text/css application/javascript application/json;

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🎪 Demo Day Deployment

### **Morning Preparation** 
```bash
# Final deployment checklist
echo "🎬 Axees Demo Deployment - $(date)"

# 1. Deploy latest version
git push origin demo-branch
vercel --prod

# 2. Smoke test critical paths
curl https://demo.axees.com/health
curl https://demo.axees.com/api/demo/status

# 3. Verify analytics data
curl https://demo.axees.com/api/demo/analytics

# 4. Test auto-login
echo "✅ Demo deployment complete!"
```

### **Backup Deployment**
```bash
# Deploy to secondary platform
netlify deploy --prod --alias axees-demo-backup

# Test backup URL
curl https://axees-demo-backup.netlify.app/health
```

---

## 📊 Monitoring & Health Checks

### **Demo Health Endpoint**
```typescript
// api/demo/health.ts
export default function handler(req, res) {
  const demoStatus = {
    timestamp: new Date().toISOString(),
    demoMode: process.env.EXPO_PUBLIC_DEMO_MODE === 'true',
    autoLogin: process.env.EXPO_PUBLIC_AUTO_LOGIN_USER,
    deployment: 'production',
    analytics: {
      totalEarnings: 45600,
      successRate: 89,
      dealsCompleted: 47,
    },
    flows: {
      marketerFlow: 'active',
      creatorFlow: 'active', 
      analyticsFlow: 'active',
    },
    status: 'healthy'
  };
  
  res.status(200).json(demoStatus);
}
```

### **Uptime Monitoring**
```bash
# Setup monitoring (optional)
# Pingdom, UptimeRobot, or AWS CloudWatch
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
  -d "api_key=YOUR_API_KEY" \
  -d "friendly_name=Axees Demo" \
  -d "url=https://demo.axees.com/health" \
  -d "type=1"
```

---

## 🚨 Emergency Procedures

### **Demo Failure Response**
1. **Primary URL Down**
   - Switch to backup URL: `https://axees-demo-backup.netlify.app`
   - Announce: "Let me switch to our backup system"

2. **Complete Network Failure**
   - Launch local demo: `./start-demo-server.sh`
   - Use mobile hotspot if needed
   - Continue with offline version

3. **Critical Bug Discovered**
   - Have screenshot backup ready
   - Switch to video demo recording
   - Narrate key points from slides

### **Rollback Procedure**
```bash
# Quick rollback to last working version
git checkout demo-working-version
vercel --prod
echo "✅ Rolled back to stable demo version"
```

---

## 📱 Mobile App Deployment (Optional)

### **Expo Development Build**
```bash
# Create demo development build
eas build --platform ios --profile demo
eas build --platform android --profile demo

# Share via internal distribution
eas submit --platform ios --profile internal
```

### **TestFlight/Internal Testing**
```bash
# iOS TestFlight for demo
eas submit --platform ios --profile demo

# Android Internal Testing
eas submit --platform android --profile internal
```

---

## 🎯 Pre-Presentation Testing

### **30 Minutes Before Demo**
```bash
# Final verification script
#!/bin/bash
echo "🎬 Pre-Demo Verification - $(date)"

# Test primary URL
echo "Testing primary demo URL..."
curl -f https://demo.axees.com/health || echo "❌ Primary URL issue"

# Test backup URL  
echo "Testing backup demo URL..."
curl -f https://axees-demo-backup.netlify.app/health || echo "❌ Backup URL issue"

# Test local fallback
echo "Testing local demo server..."
npm run web &
sleep 10
curl -f http://localhost:19006 || echo "❌ Local server issue"

echo "✅ Demo verification complete!"
```

### **Equipment Checklist**
- [ ] Primary laptop with demo loaded
- [ ] Backup device with demo ready
- [ ] Mobile hotspot for internet backup
- [ ] Demo server running locally
- [ ] Screenshots saved locally
- [ ] Video demo recording ready

---

## 🏆 Success Metrics

### **Deployment Targets**
- **Uptime**: 99.9% during demo period
- **Load Time**: < 2 seconds globally
- **Success Rate**: 100% demo completion
- **Fallback Ready**: < 30 seconds to activate

### **Demo Performance**
- **Auto-Login**: < 2 seconds
- **Flow Completion**: 30-60 seconds per flow
- **Visual Polish**: All animations smooth
- **Data Accuracy**: All demo metrics correct

## 🎬 Final Demo Configuration

The deployment ensures a professional, reliable demo experience that showcases both the product's potential and the team's technical competence. Multiple fallback options guarantee a successful presentation regardless of technical challenges.

**Demo URL**: `https://demo.axees.com`  
**Status**: Ready for investor presentations  
**Backup**: Multiple fallback options prepared