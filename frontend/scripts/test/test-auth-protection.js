const puppeteer = require('puppeteer');

// Test auth protection implementation
async function testAuthProtection() {
  console.log('🔒 Testing Authentication Protection...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Listen for console logs to track auth redirects
  page.on('console', msg => {
    if (msg.text().includes('AuthGuard')) {
      console.log(`📱 ${msg.text()}`);
    }
  });
  
  try {
    // Clear any existing auth state
    console.log('🧹 Clearing authentication state...');
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Test 1: Access protected route without authentication
    console.log('🔒 TEST 1: Accessing protected /messages route (unauthenticated)');
    await page.goto('http://localhost:8081/messages', { waitUntil: 'networkidle0', timeout: 10000 });
    
    const currentUrl1 = page.url();
    console.log(`   Current URL: ${currentUrl1}`);
    
    if (currentUrl1.includes('/UAM001Login') || currentUrl1.includes('login')) {
      console.log('   ✅ PASS: Redirected to login page');
    } else if (currentUrl1.includes('/messages')) {
      console.log('   ❌ FAIL: Still on messages page (should redirect)');
    } else {
      console.log(`   ⚠️  UNKNOWN: Redirected to unexpected page: ${currentUrl1}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Access public route
    console.log('\n🌐 TEST 2: Accessing public / route (unauthenticated)');
    await page.goto('http://localhost:8081/', { waitUntil: 'networkidle0', timeout: 10000 });
    
    const currentUrl2 = page.url();
    console.log(`   Current URL: ${currentUrl2}`);
    
    if (currentUrl2 === 'http://localhost:8081/') {
      console.log('   ✅ PASS: Can access public home page');
    } else {
      console.log('   ❌ FAIL: Redirected away from public page');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Check for loading states
    console.log('\n⏳ TEST 3: Check auth loading states');
    await page.goto('http://localhost:8081/notifications', { waitUntil: 'domcontentloaded' });
    
    // Look for loading indicators
    const hasLoadingText = await page.evaluate(() => {
      return document.body.textContent.includes('Checking authentication') ||
             document.body.textContent.includes('Redirecting to login');
    });
    
    if (hasLoadingText) {
      console.log('   ✅ PASS: Shows loading states during auth checks');
    } else {
      console.log('   ⚠️  INFO: No loading states detected (may be too fast)');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Test all protected routes
    console.log('\n🔒 TEST 4: Testing all protected routes redirect correctly');
    const protectedRoutes = [
      '/notifications',
      '/profile', 
      '/deals',
      '/UOEPM01PaymentHistoryCreator',
      '/UOM02MarketerOfferDetail',
      '/UAM003NotificationSettings'
    ];
    
    let redirectCount = 0;
    for (const route of protectedRoutes) {
      try {
        await page.goto(`http://localhost:8081${route}`, { 
          waitUntil: 'networkidle0', 
          timeout: 8000 
        });
        
        const finalUrl = page.url();
        if (!finalUrl.includes(route)) {
          redirectCount++;
          console.log(`   ✅ ${route} → redirected`);
        } else {
          console.log(`   ❌ ${route} → not redirected`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${route} → timeout or error`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 SUMMARY: ${redirectCount}/${protectedRoutes.length} protected routes redirect correctly`);
    
    // Test 5: Performance check
    console.log('\n⚡ TEST 5: Auth check performance');
    const startTime = Date.now();
    await page.goto('http://localhost:8081/messages', { waitUntil: 'networkidle0', timeout: 10000 });
    const authTime = Date.now() - startTime;
    
    console.log(`   Auth redirect time: ${authTime}ms`);
    if (authTime < 3000) {
      console.log('   ✅ PASS: Fast auth checks (< 3s)');
    } else {
      console.log('   ⚠️  SLOW: Auth checks taking > 3s');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🔒 Authentication protection testing complete!');
}

// Run the test
testAuthProtection().catch(console.error);