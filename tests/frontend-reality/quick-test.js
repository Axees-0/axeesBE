const puppeteer = require('puppeteer');

async function quickTest() {
  console.log('🔍 Quick frontend test...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    executablePath: '/usr/bin/chromium-browser'
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  
  try {
    console.log('⏳ Loading http://localhost:19006...');
    const response = await page.goto('http://localhost:19006', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    console.log('✅ Page loaded with status:', response.status());
    
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const url = page.url();
    console.log('🔗 Final URL:', url);
    
    // Check for basic elements
    const bodyExists = await page.evaluate(() => !!document.body);
    console.log('🎯 Body element found:', bodyExists);
    
    const scriptCount = await page.evaluate(() => document.scripts.length);
    console.log('📜 Script tags found:', scriptCount);
    
    // Check for React/Expo indicators
    const hasReact = await page.evaluate(() => {
      return !!(window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || document.querySelector('[data-reactroot]'));
    });
    console.log('⚛️  React detected:', hasReact);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error);