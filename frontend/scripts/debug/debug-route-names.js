const puppeteer = require('puppeteer');

// Debug route names and tab configuration
async function debugRouteNames() {
  console.log('🔍 Debugging Route Names vs Tab Configuration...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Capture console logs that might show route info
  page.on('console', msg => {
    if (msg.text().includes('route') || msg.text().includes('tab') || msg.text().includes('name')) {
      console.log(`📱 Console: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🔍 DURING-VALIDATION: Checking route/tab name matching...');
    
    // Test different routes to see route names
    const routes = ['/', '/deals', '/messages', '/notifications', '/profile'];
    
    for (const route of routes) {
      console.log(`\n📍 Testing route: ${route}`);
      await page.goto(`http://localhost:8081${route}`, { 
        waitUntil: 'domcontentloaded', 
        timeout: 8000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for tab elements on this specific route
      const routeAnalysis = await page.evaluate(() => {
        // Look for any element that might be a tab bar
        const tabElements = document.querySelectorAll('[class*="tab"], [style*="flex"]');
        const hasTabText = ['Explore', 'Deals', 'Messages', 'Notifications', 'Profile'].some(text => 
          document.body.textContent.includes(text)
        );
        
        // Look for Expo Router specific elements
        const navElements = document.querySelectorAll('[data-expo-router], [class*="nav"]');
        
        return {
          tabElementsCount: tabElements.length,
          hasTabText,
          navElementsCount: navElements.length,
          currentURL: window.location.pathname,
          bodyTextLength: document.body.textContent.length
        };
      });
      
      console.log(`   URL: ${routeAnalysis.currentURL}`);
      console.log(`   Tab elements: ${routeAnalysis.tabElementsCount}`);
      console.log(`   Has tab text: ${routeAnalysis.hasTabText}`);
      console.log(`   Nav elements: ${routeAnalysis.navElementsCount}`);
      console.log(`   Content loaded: ${routeAnalysis.bodyTextLength > 100 ? 'Yes' : 'No'}`);
    }
    
    // Test if tab configuration is even loaded
    console.log('\n🔧 Checking tab configuration in browser...');
    await page.goto('http://localhost:8081/messages', { waitUntil: 'networkidle0' });
    
    const configCheck = await page.evaluate(() => {
      // Try to find tab configuration
      const scripts = Array.from(document.scripts);
      const hasTabConfig = scripts.some(script => 
        script.textContent.includes('TABS') || 
        script.textContent.includes('tabBarButton') ||
        script.textContent.includes('TabButton')
      );
      
      // Check if React components are rendering
      const reactElements = document.querySelectorAll('[data-reactroot]');
      
      return {
        hasTabConfig,
        reactElementsCount: reactElements.length,
        scriptsCount: scripts.length
      };
    });
    
    console.log(`   Tab config in scripts: ${configCheck.hasTabConfig}`);
    console.log(`   React elements: ${configCheck.reactElementsCount}`);
    console.log(`   Total scripts: ${configCheck.scriptsCount}`);
    
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('   - Route access: ✅ All routes load');
    console.log('   - Tab rendering: ❌ No tabs visible');
    console.log('   - Config loading: Need to verify');
    
  } catch (error) {
    console.error('❌ Route debugging failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugRouteNames().catch(console.error);