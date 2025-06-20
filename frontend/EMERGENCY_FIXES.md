# 🚨 EMERGENCY DEMO FIX PROTOCOL

## **IF DEMO FAILS DURING PRESENTATION**

### **Fix 1: White Screen (React App Not Loading)**
```bash
# Quick diagnosis
curl -s "https://polite-ganache-3a4e1b.netlify.app/" | grep "entry-"

# If JavaScript bundle missing/broken:
cd /home/Mike/projects/axees/axeesBE/frontend
npm run export:web
echo "/*    /index.html   200" > dist/_redirects
netlify deploy --dir=dist --prod
```

### **Fix 2: Demo Mode Not Working (No Auto-Login)**
```bash
# Check environment variables
grep -r "EXPO_PUBLIC_DEMO_MODE" .env.production

# If missing, add:
echo "EXPO_PUBLIC_DEMO_MODE=true" >> .env.production
echo "EXPO_PUBLIC_AUTO_LOGIN_USER=marketer" >> .env.production

# Rebuild
npm run export:web
netlify deploy --dir=dist --prod
```

### **Fix 3: Navigation Broken**
```bash
# Check main layout file
head -50 app/_layout.tsx

# If Stack.Screen missing, ensure these exist:
# - <Stack.Screen name="(tabs)" />
# - <Stack.Screen name="profile/[id]" />
```

### **Fix 4: Creator Data Missing**
```bash
# Verify demo data exists
ls demo/DemoData.ts

# Check if demo data being imported
grep -r "DemoData" app/
```

### **Fix 5: Mobile View Broken**
Add to any broken component's styles:
```css
@media (max-width: 768px) {
  .container {
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
  }
}
```

## **NUCLEAR OPTION: Static Backup Page**

If everything fails, replace index.html with this working static version:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Axees - Creator Platform Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; }
        .hero { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #430B92, #5B0CA8); color: white; }
        .logo { font-size: 48px; font-weight: bold; margin-bottom: 20px; }
        .tagline { font-size: 24px; opacity: 0.9; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; padding: 60px 20px; max-width: 1200px; margin: 0 auto; }
        .feature { text-align: center; padding: 30px; }
        .feature h3 { color: #430B92; font-size: 24px; margin-bottom: 15px; }
        .stats { background: #f8f9fa; padding: 60px 20px; text-align: center; }
        .stat { display: inline-block; margin: 0 40px; }
        .stat-number { font-size: 48px; font-weight: bold; color: #430B92; }
        .stat-label { font-size: 16px; color: #666; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="logo">axees</div>
        <div class="tagline">The Future of Creator-Brand Partnerships</div>
        <p style="margin-top: 30px; font-size: 18px;">Live Demo Platform</p>
    </div>
    
    <div class="features">
        <div class="feature">
            <h3>🎯 Smart Matching</h3>
            <p>AI-powered algorithm connects brands with perfect creators based on audience alignment, engagement rates, and campaign goals.</p>
        </div>
        <div class="feature">
            <h3>💰 Transparent Pricing</h3>
            <p>Clear, upfront pricing with no hidden fees. Creators set their rates, brands get predictable costs.</p>
        </div>
        <div class="feature">
            <h3>📊 Real-Time Analytics</h3>
            <p>Track campaign performance with detailed metrics, ROI analysis, and audience insights.</p>
        </div>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-number">15K+</div>
            <div class="stat-label">Active Creators</div>
        </div>
        <div class="stat">
            <div class="stat-number">500+</div>
            <div class="stat-label">Brand Partners</div>
        </div>
        <div class="stat">
            <div class="stat-number">89%</div>
            <div class="stat-label">Success Rate</div>
        </div>
    </div>
    
    <script>
        console.log('✅ Static backup page loaded successfully');
        console.log('🎬 This is the emergency fallback for investor demos');
    </script>
</body>
</html>
```

## **DEPLOYMENT COMMANDS**

```bash
# Emergency redeploy
cd /home/Mike/projects/axees/axeesBE/frontend
netlify deploy --dir=dist --prod

# If that fails, deploy static backup
cp EMERGENCY_BACKUP.html dist/index.html
netlify deploy --dir=dist --prod

# Verify deployment
curl -I https://polite-ganache-3a4e1b.netlify.app
```

## **TESTING COMMANDS**

```bash
# Quick smoke test
curl -s "https://polite-ganache-3a4e1b.netlify.app/" | grep -E "(axees|creator|demo)" | head -5

# Check for errors
curl -s "https://polite-ganache-3a4e1b.netlify.app/" | grep -i error

# Verify JavaScript loads
curl -I "https://polite-ganache-3a4e1b.netlify.app/_expo/static/js/web/entry-*.js"
```

---

**🎯 Remember: Better to have a working static page than a broken React app during investor presentation!**