const puppeteer = require('puppeteer');

async function testAuthRoutes() {
  let browser;
  try {
    console.log('🔐 Testing authentication and protected routes...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Test 1: Access protected routes without authentication
    console.log('📍 Test 1: Accessing protected routes without authentication');
    
    const protectedRoutes = [
      { name: 'Messages', path: '/messages' },
      { name: 'Notifications', path: '/notifications' },
      { name: 'Profile', path: '/profile' }
    ];
    
    for (const route of protectedRoutes) {
      try {
        await page.goto(`http://localhost:8081${route.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const url = page.url();
        const content = await page.evaluate(() => document.body.innerText);
        
        console.log(`\n   ${route.name} (${route.path}):`);
        console.log(`   - Current URL: ${url}`);
        console.log(`   - Redirected to login: ${url.includes('login') ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Page accessible: ${!url.includes('login') ? '✅ Yes' : '❌ No'}`);
        
        if (content.includes('Login') || content.includes('Sign in')) {
          console.log(`   - Shows login prompt: ✅ Yes`);
        } else {
          console.log(`   - Content shown: ${content.substring(0, 50)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error accessing ${route.name}: ${error.message}`);
      }
    }
    
    // Test 2: Check if auth state persists across direct URL access
    console.log('\n\n📍 Test 2: Auth state persistence with direct URL access');
    
    // Clear storage first
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Simulate setting auth token (as if user logged in)
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });
    
    await page.evaluate(() => {
      // Simulate auth state in AsyncStorage/localStorage
      localStorage.setItem('axees_token', 'fake-test-token');
      localStorage.setItem('axees_user', JSON.stringify({
        _id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });
    
    // Now test direct access to protected routes
    console.log('\n   Testing direct access with simulated auth:');
    
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:8081${route.path}`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const url = page.url();
      const hasAuthData = await page.evaluate(() => {
        return localStorage.getItem('axees_token') !== null;
      });
      
      console.log(`\n   ${route.name}:`);
      console.log(`   - Auth data persisted: ${hasAuthData ? '✅ Yes' : '❌ No'}`);
      console.log(`   - Route accessible: ${!url.includes('login') ? '✅ Yes' : '❌ No'}`);
    }
    
    // Test 3: Deep linking behavior
    console.log('\n\n📍 Test 3: Deep linking behavior');
    
    // Clear auth and try to access a deep link
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    const deepLink = 'http://localhost:8081/profile';
    await page.goto(deepLink, { waitUntil: 'networkidle2' });
    
    const finalUrl = page.url();
    const savedRedirect = await page.evaluate(() => {
      return sessionStorage.getItem('redirectAfterLogin');
    });
    
    console.log(`   - Attempted to access: ${deepLink}`);
    console.log(`   - Current URL: ${finalUrl}`);
    console.log(`   - Redirect saved: ${savedRedirect ? `✅ Yes (${savedRedirect})` : '❌ No'}`);
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testAuthRoutes().then(() => {
  console.log('\n\n✅ Authentication route testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});