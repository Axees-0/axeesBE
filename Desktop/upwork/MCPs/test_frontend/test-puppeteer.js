#!/usr/bin/env node
/**
 * Direct Puppeteer test to validate browser automation works
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testPuppeteer() {
  console.log('🚀 Starting Puppeteer direct test...');
  
  let browser;
  
  try {
    // Launch browser
    console.log('📱 Launching browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('✅ Browser launched successfully');
    
    // Navigate to test page
    const testUrl = `file://${path.join(__dirname, 'examples', 'test-example.html')}`;
    console.log(`🌐 Navigating to: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'networkidle2' });
    console.log('✅ Navigation successful');
    
    // Test form interaction
    console.log('📝 Testing form interactions...');
    
    // Fill in the form
    await page.type('#username', 'testuser');
    await page.type('#password', 'testpass');
    console.log('✅ Form fields filled');
    
    // Click submit button
    await page.click('#submit-btn');
    console.log('✅ Submit button clicked');
    
    // Wait for success message
    await page.waitForSelector('#success-msg[style*="display: block"]', { timeout: 5000 });
    console.log('✅ Success message appeared');
    
    // Get success message text
    const successText = await page.$eval('#success-msg', el => el.textContent.trim());
    console.log(`📋 Success message: "${successText}"`);
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'test-success-direct.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Test error case
    console.log('🔄 Testing error case...');
    
    // Clear form and enter wrong credentials
    await page.evaluate(() => {
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    });
    
    await page.type('#username', 'wronguser');
    await page.type('#password', 'wrongpass');
    await page.click('#submit-btn');
    
    // Wait for error message
    await page.waitForSelector('#error-msg[style*="display: block"]', { timeout: 5000 });
    console.log('✅ Error message appeared');
    
    const errorText = await page.$eval('#error-msg', el => el.textContent.trim());
    console.log(`📋 Error message: "${errorText}"`);
    
    console.log('\n🎉 All Puppeteer tests passed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run test
if (require.main === module) {
  testPuppeteer()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = testPuppeteer;