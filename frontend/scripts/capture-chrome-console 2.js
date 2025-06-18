const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });
  
  // Capture failed requests
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]', request.url(), request.failure().errorText);
  });
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait a bit for any delayed errors
    await page.waitForTimeout(5000);
    
    // Try to capture any error elements on the page
    const errorText = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [id*="error"]');
      return Array.from(errorElements).map(el => el.textContent).join('\n');
    });
    
    if (errorText) {
      console.log('[ERROR ELEMENTS]', errorText);
    }
    
  } catch (error) {
    console.log('[NAVIGATION ERROR]', error.message);
  }
  
  await browser.close();
})();