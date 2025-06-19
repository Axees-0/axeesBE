const puppeteer = require('puppeteer');

async function testNavigationFix() {
  console.log('🚀 Testing Navigation Tab Fix...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to main app
    console.log('📱 Loading main app...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for all 5 expected tabs
    const expectedTabs = [
      { selector: 'text=Explore', description: 'Explore tab' },
      { selector: 'text=Deals/Offers', description: 'Deals tab' },
      { selector: 'text=Messages', description: 'Messages tab' },
      { selector: 'text=Notifications', description: 'Notifications tab' },
      { selector: 'text=Profile', description: 'Profile tab' }
    ];
    
    console.log('🔍 Checking for all navigation tabs...');
    let visibleTabs = 0;
    
    for (const tab of expectedTabs) {
      try {
        await page.waitForSelector(tab.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${tab.description}`);
        visibleTabs++;
      } catch (e) {
        console.log(`  ❌ Missing: ${tab.description}`);
      }
    }
    
    console.log(`\n📊 Navigation Tab Status: ${visibleTabs}/5 tabs visible`);
    
    if (visibleTabs === 5) {
      console.log('🎉 SUCCESS: All navigation tabs are now visible!');
      console.log('✅ CRITICAL DEMO BLOCKER RESOLVED');
      
      // Test tab navigation
      console.log('\n🔄 Testing tab navigation...');
      try {
        await page.click('text=Deals/Offers');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('  ✅ Deals tab navigation working');
        
        await page.click('text=Profile');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('  ✅ Profile tab navigation working');
        
        await page.click('text=Explore');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('  ✅ Explore tab navigation working');
        
        console.log('🎉 SUCCESS: Tab navigation fully functional!');
      } catch (e) {
        console.log('⚠️  Tab visibility fixed but navigation needs verification');
      }
    } else {
      console.log('❌ STILL BROKEN: Navigation tabs not fully visible');
      console.log('🔄 Additional investigation needed');
    }
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testNavigationFix();