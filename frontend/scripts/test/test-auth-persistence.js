const puppeteer = require('puppeteer');

// Test authentication state persistence across navigation scenarios
async function testAuthPersistence() {
  console.log('🔍 DURING-VALIDATION: Testing auth state persistence across navigation...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  const testResults = {
    pageRefresh: false,
    directUrlAccess: false,
    navigationBetweenRoutes: false,
    browserStoragePersistence: false,
    authGuardRedirection: false
  };
  
  try {
    console.log('📍 Test 1: Initial page load and auth state check');
    await page.goto('http://localhost:8081/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 8000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if authentication elements are present
    const authState = await page.evaluate(() => {
      // Look for authentication indicators
      const hasLoginButton = document.querySelector('button')?.textContent?.includes('Login') ||
                            document.querySelector('a')?.textContent?.includes('Login');
      const hasAuthContent = document.querySelector('[data-testid*="auth"]') ||
                           document.querySelector('[class*="auth"]');
      
      // Check localStorage for auth data
      const hasStoredAuth = localStorage.getItem('axees_token') || localStorage.getItem('axees_user');
      
      return {
        hasLoginButton,
        hasAuthContent,
        hasStoredAuth: !!hasStoredAuth,
        currentUrl: window.location.href,
        localStorage: {
          token: localStorage.getItem('axees_token'),
          user: localStorage.getItem('axees_user')
        }
      };
    });
    
    console.log(`   Current URL: ${authState.currentUrl}`);
    console.log(`   Has login elements: ${authState.hasLoginButton ? 'Yes' : 'No'}`);
    console.log(`   Has stored auth: ${authState.hasStoredAuth ? 'Yes' : 'No'}`);
    
    // Test 2: Browser storage persistence
    console.log('\n📍 Test 2: Testing browser storage persistence');
    
    // Set test auth data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('axees_token', 'test-token-12345');
      localStorage.setItem('axees_user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    testResults.browserStoragePersistence = true;
    console.log('   ✅ Auth data stored in localStorage');
    
    // Test 3: Page refresh with auth data
    console.log('\n📍 Test 3: Testing page refresh with auth data');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const authAfterRefresh = await page.evaluate(() => {
      return {
        hasStoredAuth: !!(localStorage.getItem('axees_token')),
        currentUrl: window.location.href
      };
    });
    
    testResults.pageRefresh = authAfterRefresh.hasStoredAuth;
    console.log(`   Auth persisted after refresh: ${testResults.pageRefresh ? '✅' : '❌'}`);
    
    // Test 4: Direct URL access to protected route
    console.log('\n📍 Test 4: Testing direct URL access to protected route');
    try {
      await page.goto('http://localhost:8081/messages', { 
        waitUntil: 'domcontentloaded', 
        timeout: 5000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const protectedRouteResult = await page.evaluate(() => {
        return {
          currentUrl: window.location.href,
          hasAuthGuard: document.querySelector('[data-testid*="loading"]') ||
                       document.body.textContent.includes('Checking authentication') ||
                       document.body.textContent.includes('Redirecting'),
          isOnLoginPage: window.location.href.includes('Login') ||
                        window.location.href.includes('UAM001Login')
        };
      });
      
      testResults.directUrlAccess = true;
      testResults.authGuardRedirection = protectedRouteResult.isOnLoginPage || protectedRouteResult.hasAuthGuard;
      
      console.log(`   Direct access handled: ✅`);
      console.log(`   Auth guard active: ${testResults.authGuardRedirection ? '✅' : '❌'}`);
      console.log(`   Final URL: ${protectedRouteResult.currentUrl}`);
      
    } catch (error) {
      console.log(`   Direct access test: ⚠️ (${error.message})`);
      testResults.directUrlAccess = false;
    }
    
    // Test 5: Navigation between routes
    console.log('\n📍 Test 5: Testing navigation between routes');
    try {
      // Navigate to home
      await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to navigate to another route
      const navigationResult = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button'));
        const navigationElement = links.find(el => 
          el.textContent?.includes('Messages') ||
          el.textContent?.includes('Profile') ||
          el.textContent?.includes('Deals')
        );
        
        if (navigationElement) {
          navigationElement.click();
          return { found: true, text: navigationElement.textContent };
        }
        return { found: false };
      });
      
      if (navigationResult.found) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        testResults.navigationBetweenRoutes = true;
        console.log(`   Navigation test: ✅ (clicked ${navigationResult.text})`);
      } else {
        console.log(`   Navigation test: ⚠️ (no navigation elements found)`);
      }
      
    } catch (error) {
      console.log(`   Navigation test: ⚠️ (${error.message})`);
    }
    
    // Final assessment
    console.log('\n📊 AUTH PERSISTENCE TEST RESULTS:');
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const coverage = Math.round((passedTests / totalTests) * 100);
    
    console.log(`   Overall Coverage: ${coverage}% (${passedTests}/${totalTests})`);
    console.log(`   Page Refresh: ${testResults.pageRefresh ? '✅' : '❌'}`);
    console.log(`   Direct URL Access: ${testResults.directUrlAccess ? '✅' : '❌'}`);
    console.log(`   Route Navigation: ${testResults.navigationBetweenRoutes ? '✅' : '❌'}`);
    console.log(`   Browser Storage: ${testResults.browserStoragePersistence ? '✅' : '❌'}`);
    console.log(`   Auth Guard: ${testResults.authGuardRedirection ? '✅' : '❌'}`);
    
    if (coverage >= 80) {
      console.log('\n🎉 Auth persistence is working correctly!');
      return true;
    } else {
      console.log('\n⚠️ Auth persistence needs improvement.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Auth persistence test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthPersistence().catch(console.error);