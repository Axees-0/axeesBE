const puppeteer = require('puppeteer');

async function testEmmaClick() {
  console.log('🚀 Simple test - Emma Thompson click detection...');
  
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
    console.log('✅ Found Emma Thompson on the page');
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Click on Emma Thompson
    console.log('👤 Clicking on Emma Thompson...');
    await page.click('text=Emma Thompson');
    
    // Wait a moment for any navigation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check new URL
    const newUrl = page.url();
    console.log(`📍 New URL: ${newUrl}`);
    
    if (newUrl !== currentUrl) {
      console.log('🎉 SUCCESS: Navigation detected!');
      if (newUrl.includes('/profile/creator-001')) {
        console.log('✅ Correctly navigated to Emma Thompson\'s profile');
      } else {
        console.log('⚠️  Navigated but not to expected profile URL');
      }
    } else {
      console.log('❌ No navigation detected - click may not be working');
    }
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEmmaClick();