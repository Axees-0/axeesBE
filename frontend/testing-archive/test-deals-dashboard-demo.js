const puppeteer = require('puppeteer');

async function testDealsDashboardDemo() {
  console.log('🚀 Testing Deals Dashboard for Demo Presentation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to deals page
    console.log('📱 Loading deals dashboard...');
    await page.goto('http://localhost:8081/deals', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Checking deals dashboard demo content...');
    
    // Check for demo content indicators
    const demoContentChecks = [
      { selector: 'text=Deals/Offers', description: 'Page title' },
      { selector: 'text=Emma Thompson', description: 'Demo creator Emma' },
      { selector: 'text=Marcus Johnson', description: 'Demo creator Marcus' },
      { selector: 'text=Sofia Rodriguez', description: 'Demo creator Sofia' },
      { selector: 'text=Pending Response', description: 'Offer status' },
      { selector: 'text=Accepted', description: 'Accepted status' },
      { selector: 'text=In Progress', description: 'In Progress status' },
      { selector: 'text=Completed', description: 'Completed status' }
    ];
    
    let demoContent = 0;
    for (const check of demoContentChecks) {
      try {
        await page.waitForSelector(check.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${check.description}`);
        demoContent++;
      } catch (e) {
        console.log(`  ❌ Missing: ${check.description}`);
      }
    }
    
    console.log(`\n📊 Demo Content Status: ${demoContent}/${demoContentChecks.length} items found`);
    
    // Check for analytics content (if visible)
    console.log('\n🔍 Checking for analytics/metrics content...');
    
    const analyticsChecks = [
      { selector: 'text=$45,600', description: 'Total earnings metric' },
      { selector: 'text=$12,800', description: 'Monthly earnings' },
      { selector: 'text=47', description: 'Total deals count' },
      { selector: 'text=89%', description: 'Success rate' },
      { selector: 'text=Instagram', description: 'Platform data' }
    ];
    
    let analyticsContent = 0;
    for (const check of analyticsChecks) {
      try {
        await page.waitForSelector(check.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${check.description}`);
        analyticsContent++;
      } catch (e) {
        console.log(`  ❌ Missing: ${check.description}`);
      }
    }
    
    console.log(`\n📊 Analytics Content: ${analyticsContent}/${analyticsChecks.length} metrics found`);
    
    // Test tab switching if present
    console.log('\n🔄 Testing dashboard navigation...');
    
    try {
      // Look for deals/analytics tabs
      const tabElements = await page.$$('text=Deals, text=Analytics, text=Offers');
      if (tabElements.length > 0) {
        console.log('  ✅ Found dashboard tabs - testing navigation');
        
        // Test clicking a tab
        try {
          await page.click('text=Deals');
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('  ✅ Tab navigation working');
        } catch (e) {
          console.log('  ⚠️  Tab navigation needs verification');
        }
      } else {
        console.log('  ℹ️  No tab navigation found (single view dashboard)');
      }
    } catch (e) {
      console.log('  ⚠️  Dashboard navigation needs investigation');
    }
    
    // Overall assessment
    const totalContent = demoContent + analyticsContent;
    const maxContent = demoContentChecks.length + analyticsChecks.length;
    const contentPercentage = (totalContent / maxContent) * 100;
    
    console.log(`\n🎯 DEALS DASHBOARD DEMO ASSESSMENT:`);
    console.log(`   Content Completeness: ${totalContent}/${maxContent} (${contentPercentage.toFixed(0)}%)`);
    
    if (contentPercentage >= 60) {
      console.log(`✅ DEMO READY: Deals dashboard has sufficient content for presentation`);
      if (demoContent >= 6) {
        console.log(`✅ Core offer data present - good for marketer demo`);
      }
      if (analyticsContent >= 3) {
        console.log(`✅ Analytics metrics present - good for performance demo`);
      }
    } else {
      console.log(`⚠️  NEEDS IMPROVEMENT: Dashboard content insufficient for demo`);
    }
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDealsDashboardDemo();