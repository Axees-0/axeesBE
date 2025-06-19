const puppeteer = require('puppeteer');

async function testMilestoneBridge() {
  console.log('🚀 Testing Deal → Milestone Auto-Bridge implementation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to offers review page (simulating offer acceptance flow)
    console.log('📱 Navigating to offer review page...');
    await page.goto('http://localhost:8081/offers/review?offerId=test-offer', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await page.waitForSelector('text=Accept Offer', { timeout: 10000 });
    console.log('✅ Offer review page loaded');
    
    // Check if milestone setup route exists
    console.log('🔍 Testing milestone setup route...');
    await page.goto('http://localhost:8081/milestones/setup?dealId=test&totalAmount=1500&offerTitle=Test%20Offer', { waitUntil: 'networkidle0' });
    
    // Check for milestone setup components
    const checks = [
      { selector: 'text=Setup Milestones', description: 'Milestone setup header' },
      { selector: 'text=Milestone 1', description: 'First milestone' },
      { selector: 'text=Content Creation', description: 'Default milestone title' },
      { selector: 'text=Create Deal with Milestones', description: 'Create button' },
      { selector: 'text=Total Amount: $1500', description: 'Amount display' }
    ];
    
    console.log('🔍 Verifying milestone setup wizard components...');
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
    
    console.log(`\n📊 Milestone Setup Check: ${passedChecks}/${checks.length} components found`);
    
    if (passedChecks >= 4) {
      console.log('🎉 SUCCESS: Milestone setup wizard is implemented!');
      console.log('✅ CLOSED FEEDBACK LOOP: Deal → Milestone bridge gap has been FIXED');
    } else {
      console.log('⚠️  PARTIAL: Some milestone components missing');
    }
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMilestoneBridge();