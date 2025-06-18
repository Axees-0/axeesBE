const puppeteer = require('puppeteer');

async function testCrossPlatform() {
  let browser;
  try {
    console.log('🌐 Testing cross-platform user experience...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Test different viewport sizes
    const viewports = [
      { name: 'Mobile', width: 375, height: 667, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1' },
      { name: 'Tablet', width: 768, height: 1024, userAgent: 'Mozilla/5.0 (iPad; CPU OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1' },
      { name: 'Desktop', width: 1440, height: 900, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height}):`);
      
      const page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.setUserAgent(viewport.userAgent);
      
      // Test home page
      await page.goto('http://localhost:8081/', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check tab visibility
      const tabsVisible = await page.evaluate(() => {
        const tabs = document.querySelectorAll('[role="tab"], [class*="tab"]');
        return tabs.length > 0;
      });
      
      console.log(`   - Tab navigation visible: ${tabsVisible ? '✅ Yes' : '❌ No'}`);
      
      // Check responsive layout
      const layoutInfo = await page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        const tabBar = document.querySelector('[class*="tabBar"], [role="tablist"]');
        
        return {
          hasHorizontalScroll: body.scrollWidth > body.clientWidth,
          fontSize: computedStyle.fontSize,
          tabBarHeight: tabBar ? tabBar.offsetHeight : 0
        };
      });
      
      console.log(`   - Horizontal scroll: ${layoutInfo.hasHorizontalScroll ? '❌ Yes (bad)' : '✅ No (good)'}`);
      console.log(`   - Base font size: ${layoutInfo.fontSize}`);
      console.log(`   - Tab bar height: ${layoutInfo.tabBarHeight}px`);
      
      // Test navigation to different routes
      const routes = ['/deals', '/messages', '/profile'];
      let navigationSuccess = true;
      
      for (const route of routes) {
        try {
          await page.goto(`http://localhost:8081${route}`, { waitUntil: 'networkidle2' });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          navigationSuccess = false;
          console.log(`   ❌ Failed to navigate to ${route}`);
        }
      }
      
      console.log(`   - Route navigation: ${navigationSuccess ? '✅ All routes work' : '❌ Some routes failed'}`);
      
      // Check for platform-specific styles
      const platformStyles = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="web"], [class*="ios"], [class*="android"]');
        return elements.length;
      });
      
      console.log(`   - Platform-specific styles: ${platformStyles > 0 ? `✅ Found ${platformStyles} elements` : '⚠️  None found'}`);
      
      await page.close();
    }
    
    // Test performance across platforms
    console.log('\n\n⚡ Performance comparison:');
    
    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height });
      
      const startTime = Date.now();
      await page.goto('http://localhost:8081/', { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      // Measure time to interactive
      await page.evaluate(() => {
        return new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve);
          }
        });
      });
      
      const interactiveTime = Date.now() - startTime;
      
      console.log(`\n   ${viewport.name}:`);
      console.log(`   - Initial load: ${loadTime}ms`);
      console.log(`   - Time to interactive: ${interactiveTime}ms`);
      console.log(`   - Performance: ${loadTime < 3000 ? '✅ Good' : loadTime < 5000 ? '⚠️  Moderate' : '❌ Slow'}`);
      
      await page.close();
    }
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testCrossPlatform().then(() => {
  console.log('\n\n✅ Cross-platform testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});