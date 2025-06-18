const puppeteer = require('puppeteer');

async function debugBrowser() {
  let browser;
  try {
    console.log('🚀 Starting browser debug session...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
      console.log(`[STACK] ${error.stack}`);
    });
    
    // Capture failed requests
    page.on('requestfailed', request => {
      console.log(`[REQUEST FAILED] ${request.url()}`);
      console.log(`[FAILURE REASON] ${request.failure().errorText}`);
    });
    
    // Test the basic page first
    console.log('\n📱 Testing http://localhost:8081/test-basic...');
    try {
      await page.goto('http://localhost:8081/test-basic', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the page content
      const content = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log('[PAGE CONTENT]', content);
      
      // Check if React rendered properly
      const hasReactContent = content.includes('React Native Web is working');
      console.log(`[REACT STATUS] ${hasReactContent ? '✅ Working' : '❌ Not working'}`);
      
    } catch (error) {
      console.log(`[NAVIGATION ERROR] ${error.message}`);
    }
    
    // Test the main page
    console.log('\n🏠 Testing http://localhost:8081...');
    try {
      await page.goto('http://localhost:8081', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the page content
      const content = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log('[PAGE CONTENT]', content || 'Page appears to be blank');
      
      // Check if there are any visible elements
      const elementCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      console.log(`[ELEMENT COUNT] ${elementCount} DOM elements found`);
      
    } catch (error) {
      console.log(`[NAVIGATION ERROR] ${error.message}`);
    }

    // Test the deals page specifically
    console.log('\n💼 Testing http://localhost:8081/deals...');
    try {
      await page.goto('http://localhost:8081/deals', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to render and API calls to complete
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Get the page content
      const content = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log('[DEALS PAGE CONTENT]', content || 'Deals page appears to be blank');
      
      // Check for specific deal content
      const hasDeals = content.includes('Summer Fashion') || 
                      content.includes('Tech Product') || 
                      content.includes('deal') || 
                      content.includes('Deal');
      
      console.log(`[DEALS STATUS] ${hasDeals ? '✅ Deal content found' : '❌ No deal content detected'}`);
      
      // Check for loading state
      const hasLoading = content.includes('Loading') || content.includes('loading');
      console.log(`[LOADING STATE] ${hasLoading ? '⏳ Still loading' : '✅ Load complete'}`);
      
      // Check DOM structure
      const dealsElementCount = await page.evaluate(() => {
        const dealsElements = document.querySelectorAll('[data-testid*="deal"], .deal, [class*="deal"]');
        return dealsElements.length;
      });
      
      console.log(`[DEALS ELEMENTS] ${dealsElementCount} deal-related elements found`);
      
      // Check for errors in content
      const hasErrors = content.includes('Error') || content.includes('error') || content.includes('404');
      console.log(`[ERROR STATUS] ${hasErrors ? '❌ Errors detected' : '✅ No errors detected'}`);
      
    } catch (error) {
      console.log(`[DEALS NAVIGATION ERROR] ${error.message}`);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the debug session
debugBrowser().then(() => {
  console.log('\n🏁 Debug session complete');
}).catch(error => {
  console.error('Fatal error:', error);
});