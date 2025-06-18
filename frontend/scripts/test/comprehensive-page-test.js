const puppeteer = require('puppeteer');

// Comprehensive test of all frontend pages
async function testAllPages() {
  let browser;
  
  const pages = [
    // Tab pages
    { url: '/', name: 'Home/Explore', category: 'tabs' },
    { url: '/deals', name: 'Deals', category: 'tabs' },
    { url: '/messages', name: 'Messages', category: 'tabs' },
    { url: '/notifications', name: 'Notifications', category: 'tabs' },
    { url: '/profile', name: 'Profile', category: 'tabs' },
    
    // Authentication pages
    { url: '/UAM001Login', name: 'Login', category: 'auth' },
    { url: '/URM01CreateAccount', name: 'Create Account', category: 'auth' },
    { url: '/URM01Phone', name: 'Phone Setup', category: 'auth' },
    { url: '/URM02Name', name: 'Name Setup', category: 'auth' },
    { url: '/URM03Username', name: 'Username Setup', category: 'auth' },
    { url: '/URM05SetEmail', name: 'Email Setup', category: 'auth' },
    { url: '/URM06SetPassword', name: 'Password Setup', category: 'auth' },
    { url: '/ULM02ForgotPassword', name: 'Forgot Password', category: 'auth' },
    { url: '/ULM3OTP', name: 'OTP Verification', category: 'auth' },
    { url: '/ULM4ResetPassword', name: 'Reset Password', category: 'auth' },
    
    // Offer Management pages
    { url: '/UOM02MarketerOfferDetail', name: 'Offer Detail', category: 'offers' },
    { url: '/UOM04MarketerCustomOffer', name: 'Custom Offer', category: 'offers' },
    { url: '/UOM05MarketerOfferCounter', name: 'Offer Counter', category: 'offers' },
    { url: '/UOM07MarketerOfferHistoryList', name: 'Offer History', category: 'offers' },
    { url: '/UOM08MarketerDealHistoryList', name: 'Deal History', category: 'offers' },
    { url: '/UOM10CreatorOfferDetails', name: 'Creator Offer Details', category: 'offers' },
    { url: '/UOM11CreatorOfferCounterEdit', name: 'Creator Counter Edit', category: 'offers' },
    { url: '/UOM13CreatorUploadProof', name: 'Upload Proof', category: 'offers' },
    
    // Payment pages
    { url: '/UOEPM01PaymentHistoryCreator', name: 'Creator Payment History', category: 'payments' },
    { url: '/UOEPM02WithdrawMoneyCreator', name: 'Creator Withdraw', category: 'payments' },
    { url: '/UOEPM03TransactionDetailsCreator', name: 'Creator Transaction Details', category: 'payments' },
    { url: '/UOEPM04AddNewMethodCreator', name: 'Add Payment Method', category: 'payments' },
    { url: '/UOEPM05PaymentHistoryMarketer', name: 'Marketer Payment History', category: 'payments' },
    
    // Settings and Profile pages
    { url: '/UAM003NotificationSettings', name: 'Notification Settings', category: 'settings' },
    { url: '/UAM02EditCreatorProfile', name: 'Edit Profile', category: 'settings' },
    { url: '/UAM05InviteList', name: 'Invite List', category: 'settings' },
    
    // Utility pages
    { url: '/privacy-policy', name: 'Privacy Policy', category: 'utility' },
    { url: '/VerifyEmailScreen', name: 'Email Verification', category: 'utility' },
  ];
  
  const results = {
    total: pages.length,
    passed: 0,
    failed: 0,
    categories: {},
    details: []
  };
  
  try {
    console.log('🚀 Starting comprehensive page validation...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Set up error tracking
    const pageErrors = [];
    const consoleErrors = [];
    
    page.on('pageerror', error => {
      pageErrors.push({ message: error.message, stack: error.stack });
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Test each page
    for (let i = 0; i < pages.length; i++) {
      const pageInfo = pages[i];
      const testResult = {
        url: pageInfo.url,
        name: pageInfo.name,
        category: pageInfo.category,
        status: 'unknown',
        loadTime: 0,
        elementCount: 0,
        hasContent: false,
        hasErrors: false,
        authRedirect: false,
        details: []
      };
      
      console.log(`📄 [${i + 1}/${pages.length}] Testing ${pageInfo.name} (${pageInfo.url})`);
      
      try {
        const startTime = Date.now();
        
        // Clear previous errors
        pageErrors.length = 0;
        consoleErrors.length = 0;
        
        // Navigate to page
        await page.goto(`http://localhost:8081${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
        
        // Wait for React rendering
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        testResult.loadTime = Date.now() - startTime;
        
        // Analyze page content
        const analysis = await page.evaluate(() => {
          const body = document.body;
          const content = body.innerText || '';
          const elementCount = document.querySelectorAll('*').length;
          
          // Check for various indicators
          const indicators = {
            hasContent: content.length > 100,
            hasLoadingState: content.includes('Loading') || content.includes('loading'),
            hasErrorState: content.includes('Error') || content.includes('error') || content.includes('404'),
            hasAuthElements: content.includes('Login') || content.includes('Sign up') || content.includes('authenticate'),
            hasFormElements: document.querySelectorAll('input, button, form').length > 0,
            hasNavigationElements: document.querySelectorAll('nav, [role="navigation"]').length > 0,
            hasReactElements: document.querySelectorAll('[data-reactroot]').length > 0,
            currentUrl: window.location.href,
            titleText: document.title
          };
          
          return {
            content: content.substring(0, 200), // First 200 chars
            elementCount,
            ...indicators
          };
        });
        
        testResult.elementCount = analysis.elementCount;
        testResult.hasContent = analysis.hasContent;
        testResult.hasErrors = analysis.hasErrorState || pageErrors.length > 0 || consoleErrors.length > 0;
        testResult.authRedirect = analysis.currentUrl.includes('Login') || analysis.currentUrl.includes('UAM001Login');
        
        // Determine status
        if (testResult.hasErrors) {
          testResult.status = 'error';
          testResult.details.push('Page has errors');
        } else if (testResult.authRedirect && pageInfo.category !== 'auth') {
          testResult.status = 'auth-protected';
          testResult.details.push('Redirected to authentication (expected for protected routes)');
        } else if (analysis.hasContent && analysis.elementCount > 50) {
          testResult.status = 'success';
          testResult.details.push(`Loaded successfully with ${analysis.elementCount} elements`);
        } else if (analysis.hasLoadingState) {
          testResult.status = 'loading';
          testResult.details.push('Page is in loading state');
        } else {
          testResult.status = 'warning';
          testResult.details.push('Page loaded but content is minimal');
        }
        
        // Add content preview
        if (analysis.content) {
          testResult.details.push(`Content preview: "${analysis.content}"`);
        }
        
        // Track category results
        if (!results.categories[pageInfo.category]) {
          results.categories[pageInfo.category] = { total: 0, passed: 0, failed: 0 };
        }
        results.categories[pageInfo.category].total++;
        
        if (testResult.status === 'success' || testResult.status === 'auth-protected') {
          results.passed++;
          results.categories[pageInfo.category].passed++;
          console.log(`   ✅ ${testResult.status === 'auth-protected' ? 'Protected (redirected)' : 'Success'} - ${testResult.loadTime}ms`);
        } else if (testResult.status === 'error') {
          results.failed++;
          results.categories[pageInfo.category].failed++;
          console.log(`   ❌ Error - ${pageErrors.length + consoleErrors.length} issues detected`);
        } else {
          console.log(`   ⚠️  ${testResult.status} - ${testResult.loadTime}ms`);
        }
        
      } catch (error) {
        testResult.status = 'failed';
        testResult.details.push(`Navigation failed: ${error.message}`);
        results.failed++;
        if (results.categories[pageInfo.category]) {
          results.categories[pageInfo.category].failed++;
        }
        console.log(`   ❌ Failed - ${error.message}`);
      }
      
      results.details.push(testResult);
    }
    
    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE PAGE VALIDATION RESULTS');
    console.log('═'.repeat(50));
    console.log(`Total Pages Tested: ${results.total}`);
    console.log(`Successful: ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
    console.log(`Failed: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);
    
    console.log('\n📋 Results by Category:');
    Object.entries(results.categories).forEach(([category, stats]) => {
      const successRate = Math.round(stats.passed/stats.total*100);
      console.log(`   ${category}: ${stats.passed}/${stats.total} (${successRate}%) ✅`);
    });
    
    console.log('\n🔍 Detailed Results:');
    results.details.forEach(result => {
      const statusIcon = {
        'success': '✅',
        'auth-protected': '🔒',
        'error': '❌',
        'failed': '💥',
        'warning': '⚠️',
        'loading': '⏳'
      }[result.status] || '❓';
      
      console.log(`\n${statusIcon} ${result.name} (${result.url})`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Load time: ${result.loadTime}ms`);
      console.log(`   Elements: ${result.elementCount}`);
      result.details.forEach(detail => {
        console.log(`   • ${detail}`);
      });
    });
    
    // Summary assessment
    const overallSuccessRate = Math.round(results.passed/results.total*100);
    console.log('\n🎯 OVERALL ASSESSMENT:');
    if (overallSuccessRate >= 80) {
      console.log(`🎉 EXCELLENT: ${overallSuccessRate}% success rate - Frontend is working well!`);
    } else if (overallSuccessRate >= 60) {
      console.log(`👍 GOOD: ${overallSuccessRate}% success rate - Most pages working, some issues to address`);
    } else {
      console.log(`⚠️ NEEDS WORK: ${overallSuccessRate}% success rate - Significant issues detected`);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return results;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run comprehensive test
testAllPages().then(results => {
  console.log('\n🏁 Comprehensive page validation complete');
}).catch(error => {
  console.error('Fatal error:', error);
});