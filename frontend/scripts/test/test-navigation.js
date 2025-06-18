const puppeteer = require('puppeteer');

// Navigation test scenarios
const testScenarios = [
  {
    name: 'Unauthenticated user accessing protected route',
    path: '/messages',
    expectedRedirect: '/UAM001Login',
    authState: false
  },
  {
    name: 'Unauthenticated user accessing notifications',
    path: '/notifications',
    expectedRedirect: '/UAM001Login',
    authState: false
  },
  {
    name: 'Unauthenticated user accessing profile',
    path: '/profile',
    expectedRedirect: '/UAM001Login',
    authState: false
  },
  {
    name: 'Authenticated user accessing login page',
    path: '/UAM001Login',
    expectedRedirect: '/',
    authState: true
  },
  {
    name: 'Authenticated user accessing registration',
    path: '/URM01CreateAccount',
    expectedRedirect: '/',
    authState: true
  },
  {
    name: 'Unauthenticated user accessing public route',
    path: '/',
    expectedRedirect: null,
    authState: false
  }
];

async function runNavigationTests() {
  console.log('🧪 Starting Navigation Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  for (const scenario of testScenarios) {
    console.log(`\n📍 Testing: ${scenario.name}`);
    console.log(`   Path: ${scenario.path}`);
    console.log(`   Auth State: ${scenario.authState ? 'Authenticated' : 'Unauthenticated'}`);
    
    const page = await browser.newPage();
    
    try {
      // Set up console logging
      page.on('console', msg => {
        if (msg.text().includes('AuthGuard') || msg.text().includes('NavigationDebugger')) {
          console.log(`   Browser: ${msg.text()}`);
        }
      });
      
      // Mock authentication state
      await page.evaluateOnNewDocument((isAuthenticated) => {
        // Mock AsyncStorage for auth token (AsyncStorage uses localStorage on web)
        if (isAuthenticated) {
          localStorage.setItem('axees_token', 'mock-token-123');
          localStorage.setItem('axees_user', JSON.stringify({ 
            id: '1', 
            email: 'test@example.com',
            name: 'Test User',
            userType: 'creator'
          }));
        } else {
          localStorage.removeItem('axees_token');
          localStorage.removeItem('axees_user');
        }
      }, scenario.authState);
      
      // Navigate to the test path
      const startTime = Date.now();
      await page.goto(`http://localhost:8081${scenario.path}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait a bit for any redirects to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get final URL
      const finalUrl = new URL(page.url());
      const finalPath = finalUrl.pathname;
      const loadTime = Date.now() - startTime;
      
      // Check if redirect happened as expected
      const passed = scenario.expectedRedirect 
        ? finalPath === scenario.expectedRedirect
        : finalPath === scenario.path;
      
      const result = {
        scenario: scenario.name,
        passed,
        initialPath: scenario.path,
        expectedPath: scenario.expectedRedirect || scenario.path,
        actualPath: finalPath,
        loadTime: `${loadTime}ms`,
        authState: scenario.authState
      };
      
      results.push(result);
      
      console.log(`   Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Final Path: ${finalPath}`);
      console.log(`   Load Time: ${loadTime}ms`);
      
      // Check for any navigation errors
      const errors = await page.evaluate(() => {
        return window.__navigationErrors || [];
      });
      
      if (errors.length > 0) {
        console.log(`   ⚠️  Navigation Errors: ${errors.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message,
        authState: scenario.authState
      });
    }
    
    await page.close();
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n- ${r.scenario}`);
      console.log(`  Expected: ${r.expectedPath || 'no redirect'}`);
      console.log(`  Actual: ${r.actualPath || 'error'}`);
      if (r.error) console.log(`  Error: ${r.error}`);
    });
  }
  
  // Performance check
  const avgLoadTime = results
    .filter(r => r.loadTime)
    .reduce((sum, r) => sum + parseInt(r.loadTime), 0) / results.length;
  
  console.log(`\n⚡ Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
  
  await browser.close();
  
  // Write detailed report
  const fs = require('fs');
  fs.writeFileSync('navigation-test-report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      avgLoadTime: `${avgLoadTime.toFixed(0)}ms`
    },
    results
  }, null, 2));
  
  console.log('\n📄 Detailed report saved to navigation-test-report.json');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runNavigationTests().catch(console.error);