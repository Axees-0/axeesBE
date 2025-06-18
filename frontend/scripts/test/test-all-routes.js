const puppeteer = require('puppeteer');

async function testAllRoutes() {
  let browser;
  try {
    console.log('🚀 Testing all Expo Router web routes...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Define all routes to test
    const routes = [
      { name: 'Home/Explore', path: '/', expectedContent: ['Explore', 'Sort', 'Results'] },
      { name: 'Deals', path: '/deals', expectedContent: ['Deals', 'Offers'] },
      { name: 'Messages', path: '/messages', expectedContent: ['Messages'] },
      { name: 'Notifications', path: '/notifications', expectedContent: ['Notifications'] },
      { name: 'Profile', path: '/profile', expectedContent: ['Profile'] }
    ];
    
    // Test each route
    for (const route of routes) {
      console.log(`\n📍 Testing ${route.name} route: http://localhost:8081${route.path}`);
      
      try {
        const response = await page.goto(`http://localhost:8081${route.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Check response status
        const status = response.status();
        console.log(`   Status: ${status} ${status === 200 ? '✅' : '❌'}`);
        
        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get page content
        const content = await page.evaluate(() => document.body.innerText);
        
        // Check for expected content
        const foundContent = route.expectedContent.filter(text => 
          content.includes(text)
        );
        
        console.log(`   Expected content: ${foundContent.length}/${route.expectedContent.length} found`);
        foundContent.forEach(text => console.log(`     ✅ Found: "${text}"`));
        
        // Check if tabs are visible
        const tabsVisible = await page.evaluate(() => {
          const tabElements = document.querySelectorAll('[role="tab"], [class*="tab"]');
          return tabElements.length;
        });
        
        console.log(`   Tab navigation: ${tabsVisible > 0 ? `✅ ${tabsVisible} tabs visible` : '❌ No tabs found'}`);
        
        // Test direct URL access (refresh)
        await page.reload({ waitUntil: 'networkidle2' });
        const refreshStatus = await page.evaluate(() => document.readyState === 'complete');
        console.log(`   Direct access after refresh: ${refreshStatus ? '✅ Working' : '❌ Failed'}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Test browser navigation
    console.log('\n🔄 Testing browser navigation...');
    
    try {
      // Navigate to home
      await page.goto('http://localhost:8081/', { waitUntil: 'networkidle2' });
      
      // Navigate to deals
      await page.goto('http://localhost:8081/deals', { waitUntil: 'networkidle2' });
      
      // Go back
      await page.goBack({ waitUntil: 'networkidle2' });
      const backUrl = page.url();
      console.log(`   Back navigation: ${backUrl.endsWith('/') ? '✅ Returned to home' : '❌ Failed'}`);
      
      // Go forward
      await page.goForward({ waitUntil: 'networkidle2' });
      const forwardUrl = page.url();
      console.log(`   Forward navigation: ${forwardUrl.includes('/deals') ? '✅ Returned to deals' : '❌ Failed'}`);
      
    } catch (error) {
      console.log(`   ❌ Navigation error: ${error.message}`);
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
testAllRoutes().then(() => {
  console.log('\n✅ Route testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});