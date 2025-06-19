const puppeteer = require('puppeteer');

async function testEmmaProfileClick() {
  console.log('🚀 Testing Emma Thompson profile click navigation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the main page
    console.log('📱 Navigating to home page...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
    
    // Wait for the explore page to load
    await page.waitForSelector('text=Emma Thompson', { timeout: 10000 });
    console.log('✅ Explore page loaded with creators');
    
    // Find Emma Thompson's card and click it
    console.log('👤 Looking for Emma Thompson creator card...');
    await page.click('text=Emma Thompson');
    
    // Wait for navigation to profile page
    console.log('⏳ Waiting for profile page navigation...');
    await page.waitForFunction(() => 
      window.location.pathname.includes('/profile/creator-001'), 
      { timeout: 5000 }
    );
    
    // Verify we're on Emma's profile page
    try {
      await page.waitForSelector('text=Emma Thompson', { timeout: 3000 });
      console.log('🎉 SUCCESS: Successfully navigated to Emma Thompson\'s profile!');
      console.log('✅ Profile page loaded with Emma Thompson\'s name visible');
    } catch (e) {
      console.log('❌ FAILED: Could not verify Emma Thompson profile page');
    }
    
    // Wait a moment to see the result
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEmmaProfileClick();