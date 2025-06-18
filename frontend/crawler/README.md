# Frontend Crawler System

A robust testing system that automatically validates your demo frontend by crawling all pages, testing interactions, and reporting results.

## Quick Start

```bash
# Make sure your dev server is running
npm run web

# Run complete demo testing suite (recommended)
npm run demo:test

# Or run individual components:
npm run demo:crawl        # Just the page crawler
npm run demo:discover     # Element discovery only
```

## What It Tests

### 🔍 Content Validation
- ✅ Expected content appears on each page
- ❌ Forbidden content (errors, loading messages) is absent
- 📊 Performance within acceptable limits

### 🎯 Interaction Testing
- 🖱️ Button clicks work correctly
- 🔗 Navigation between tabs functions
- 📱 All interactive elements respond

### 🌐 Page Coverage
- **Explore** (`/`) - Creator discovery page
- **Deals** (`/deals`) - High-value opportunities
- **Messages** (`/messages`) - Communication hub
- **Notifications** (`/notifications`) - Activity feed
- **Profile** (`/profile`) - User dashboard

## Configuration

Edit `crawler-config.js` to customize:

```javascript
module.exports = {
  baseUrl: 'http://localhost:8081',
  timing: {
    pageLoad: 5000,      // Wait for React hydration
    navigation: 2000,    // Wait after navigation
    interaction: 1000,   // Wait after click/press
    apiCall: 3000        // Wait for demo data to load
  },
  pages: [
    {
      name: 'Explore',
      path: '/',
      expectedContent: ['Emma Thompson', 'Marcus Johnson'],
      interactions: [
        {
          type: 'click',
          selector: '[role="tab"][aria-label*="Deals"]',
          description: 'Click Deals tab'
        }
      ]
    }
  ]
};
```

## Output Examples

### ✅ Success Output
```
🎯 OVERALL RESULT: ✅ ALL TESTS PASSED

🎉 Your demo is working perfectly!
   - All pages load correctly
   - All expected content is present
   - No forbidden error messages
   - All interactions work

✨ Ready for investor presentation!
```

### ❌ Issues Detected
```
🎯 OVERALL RESULT: ❌ SOME TESTS FAILED

🔧 Issues found that need attention:
   - 1 page(s) failed validation
   - 3 error(s) detected

📋 Detailed report saved to: /tmp/crawler-report-1234567890.json
```

## Files Overview

- **`crawler.js`** - Main crawler engine with Puppeteer
- **`crawler-config.js`** - Page definitions and test scenarios
- **`run-crawler.js`** - Simple runner with server checks
- **`element-discovery.js`** - Finds all interactive elements
- **`../test-demo.js`** - Complete testing suite runner

## Troubleshooting

### Server Not Running
```bash
❌ Server not responding on http://localhost:8081
   Please start your dev server with: npm run web
```

**Fix:** Start the development server first.

### Demo Mode Not Active
```bash
❌ Found forbidden: "Please standby while our system finds Influencers"
```

**Fix:** Ensure `.env` has `EXPO_PUBLIC_DEMO_MODE=true`

### Elements Not Found
```bash
❌ Missing required element: [role="tablist"]
```

**Fix:** Check that your React components are rendering correctly.

## Advanced Usage

### Element Discovery
Find all clickable elements on your pages:

```bash
node crawler/element-discovery.js
```

### Custom Validation
Create your own test scenarios by modifying `crawler-config.js`:

```javascript
interactions: [
  {
    type: 'click',
    selector: 'button[data-testid="submit"]',
    description: 'Test form submission',
    expectedResult: 'Success message appears'
  }
]
```

### Headless vs Visual
To run with browser visible (debugging):

```javascript
// In crawler.js
this.browser = await puppeteer.launch({
  headless: false,  // Shows browser window
  devtools: true    // Opens DevTools
});
```

## Integration with CI/CD

Add to your testing pipeline:

```yaml
# .github/workflows/demo-test.yml
- name: Test Demo Frontend
  run: |
    npm run web &
    sleep 10  # Wait for server
    npm run demo:test
```

## Performance Monitoring

The crawler tracks:
- ⏱️ Page load times
- 🔄 Interaction response times
- 📊 Element counts
- 🚨 Error frequencies

All metrics are saved in detailed JSON reports for analysis.