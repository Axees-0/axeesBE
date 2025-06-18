const puppeteer = require('puppeteer');

async function testAllFrontendPages() {
  let browser;
  try {
    console.log('🚀 Testing ALL frontend pages...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[ERROR] ${msg.text()}`);
      }
    });
    
    // Define all pages to test
    const pages = [
      // Tab routes
      { name: 'Home/Explore', path: '/', expectedContent: ['Explore', 'Sort'] },
      { name: 'Deals', path: '/deals', expectedContent: ['Deals'] },
      { name: 'Messages', path: '/messages', expectedContent: ['Messages'] },
      { name: 'Notifications', path: '/notifications', expectedContent: ['Notifications'] },
      { name: 'Profile', path: '/profile', expectedContent: ['Profile'] },
      
      // Auth routes
      { name: 'Login', path: '/UAM001Login', expectedContent: ['Login', 'Sign'] },
      { name: 'Register', path: '/URM01CreateAccount', expectedContent: ['Create', 'Account'] },
      { name: 'Forgot Password', path: '/ULM02ForgotPassword', expectedContent: ['Forgot', 'Password'] },
      
      // User routes
      { name: 'Settings', path: '/UAM03Settings', expectedContent: ['Settings'] },
      { name: 'Edit Profile', path: '/UAM02EditCreatorProfile', expectedContent: ['Profile', 'Edit'] },
      
      // Offer/Deal routes
      { name: 'Create Offer', path: '/UOM01SelectPreMadeOffer', expectedContent: ['Offer'] },
      { name: 'Offer History', path: '/UOM07MarketerOfferHistoryList', expectedContent: ['Offer'] },
      
      // Payment routes
      { name: 'Payment History', path: '/UOEPM05PaymentHistoryMarketer', expectedContent: ['Payment'] },
      { name: 'Withdraw Money', path: '/UOEPM02WithdrawMoneyCreator', expectedContent: ['Withdraw'] }
    ];
    
    console.log(`Testing ${pages.length} pages...\n`);
    
    const results = {
      success: [],
      failed: [],
      errors: []
    };
    
    for (const pageInfo of pages) {
      console.log(`\n📍 Testing: ${pageInfo.name} (${pageInfo.path})`);
      
      try {
        const response = await page.goto(`http://localhost:8081${pageInfo.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        const status = response.status();
        console.log(`   Status: ${status}`);
        
        // Wait for content
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get page content
        const content = await page.evaluate(() => document.body.innerText);
        const title = await page.title();
        
        console.log(`   Title: ${title}`);
        
        // Check for expected content
        const foundContent = pageInfo.expectedContent.filter(text => 
          content.toLowerCase().includes(text.toLowerCase())
        );
        
        const success = foundContent.length > 0 && status === 200;
        
        if (success) {
          console.log(`   ✅ Page loaded successfully`);
          console.log(`   Found: ${foundContent.join(', ')}`);
          results.success.push(pageInfo.name);
        } else {
          console.log(`   ❌ Page issues detected`);
          console.log(`   Expected: ${pageInfo.expectedContent.join(', ')}`);
          console.log(`   Found: ${foundContent.join(', ') || 'None'}`);
          results.failed.push(pageInfo.name);
        }
        
        // Check for error messages
        if (content.includes('Error') || content.includes('error')) {
          console.log(`   ⚠️  Error text detected in content`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to load: ${error.message}`);
        results.errors.push({ page: pageInfo.name, error: error.message });
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.success.length}/${pages.length}`);
    console.log(`❌ Failed: ${results.failed.length}/${pages.length}`);
    console.log(`🚫 Errors: ${results.errors.length}/${pages.length}`);
    
    if (results.success.length > 0) {
      console.log('\n✅ Working pages:');
      results.success.forEach(page => console.log(`   - ${page}`));
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Pages with issues:');
      results.failed.forEach(page => console.log(`   - ${page}`));
    }
    
    if (results.errors.length > 0) {
      console.log('\n🚫 Pages with errors:');
      results.errors.forEach(({ page, error }) => console.log(`   - ${page}: ${error}`));
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
testAllFrontendPages().then(() => {
  console.log('\n✅ Frontend page testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});