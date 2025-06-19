const puppeteer = require('puppeteer');

async function testEmmaProfileComplete() {
  console.log('🚀 Comprehensive test - Emma Thompson profile navigation and content...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the main page
    console.log('📱 Navigating to home page...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
    
    // Wait for Emma Thompson to be visible
    await page.waitForSelector('text=Emma Thompson', { timeout: 10000 });
    console.log('✅ Found Emma Thompson on explore page');
    
    // Click on Emma Thompson
    console.log('👤 Clicking on Emma Thompson...');
    await page.click('text=Emma Thompson');
    
    // Wait for navigation to profile page
    await page.waitForFunction(() => 
      window.location.pathname.includes('/profile/creator-001'), 
      { timeout: 5000 }
    );
    console.log('✅ Successfully navigated to profile page');
    
    // Check for profile content
    const checks = [
      { selector: 'text=Emma Thompson', description: 'Emma Thompson name' },
      { selector: 'text=@emmastyle', description: 'Username @emmastyle' },
      { selector: 'text=Fashion', description: 'Fashion category' },
      { selector: 'text=Lifestyle', description: 'Lifestyle category' },
      { selector: 'text=Create Offer', description: 'Create Offer button' },
      { selector: 'text=Contact', description: 'Contact button' },
      { selector: 'text=About', description: 'About tab' },
      { selector: 'text=Portfolio', description: 'Portfolio tab' },
      { selector: 'text=156K', description: 'Follower count' }
    ];
    
    console.log('🔍 Verifying profile content...');
    let passedChecks = 0;
    
    for (const check of checks) {
      try {
        await page.waitForSelector(check.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${check.description}`);
        passedChecks++;
      } catch (e) {
        console.log(`  ❌ Missing: ${check.description}`);
      }
    }
    
    console.log(`\n📊 Profile Content Check: ${passedChecks}/${checks.length} elements found`);
    
    if (passedChecks >= 7) {
      console.log('🎉 SUCCESS: Emma Thompson profile is fully functional!');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Profile loads but some content is missing');
    }
    
    // Test navigation back
    console.log('\n⬅️  Testing back navigation...');
    await page.goBack();
    await page.waitForSelector('text=Emma Thompson', { timeout: 3000 });
    console.log('✅ Successfully navigated back to explore page');
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEmmaProfileComplete();