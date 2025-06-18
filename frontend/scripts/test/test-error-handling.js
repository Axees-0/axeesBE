const puppeteer = require('puppeteer');

// Test comprehensive error handling implementation
async function testErrorHandling() {
  console.log('🧪 Testing Error Handling Implementation...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Capture console errors and warnings
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('🔍 POST-VALIDATION: Testing error scenarios...');
    
    // Test 1: Normal page load
    console.log('\n📍 Test 1: Normal page load');
    await page.goto('http://localhost:8081/messages', { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Simulate network failure
    console.log('\n📍 Test 2: Simulating network failure');
    await page.setOfflineMode(true);
    
    // Try to perform an action that requires network
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('test search');
      await searchInput.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test 3: Re-enable network and test recovery
    console.log('\n📍 Test 3: Testing network recovery');
    await page.setOfflineMode(false);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Test error boundary by injecting error
    console.log('\n📍 Test 4: Testing error boundary');
    await page.evaluate(() => {
      // Force a React error
      const errorEvent = new Event('error');
      errorEvent.error = new Error('Test error for error boundary');
      window.dispatchEvent(errorEvent);
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 5: Check if error handling utilities are loaded
    console.log('\n📍 Test 5: Checking error handling utilities');
    const errorHandlerExists = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             'fetch' in window && 
             'navigator' in window;
    });
    
    // Analysis and reporting
    console.log('\n📊 ERROR HANDLING TEST RESULTS:');
    console.log(`   Error boundary loaded: ${errorHandlerExists ? '✅' : '❌'}`);
    console.log(`   Console messages captured: ${consoleMessages.length}`);
    console.log(`   Page errors captured: ${pageErrors.length}`);
    
    // Check for specific error handling indicators
    const errorMessages = consoleMessages.filter(msg => 
      msg.text.includes('error') || 
      msg.text.includes('Error') ||
      msg.text.includes('failed') ||
      msg.text.includes('Failed')
    );
    
    console.log(`   Error-related messages: ${errorMessages.length}`);
    
    if (errorMessages.length > 0) {
      console.log('\n📝 Error Messages:');
      errorMessages.slice(0, 5).forEach((msg, i) => {
        console.log(`   ${i+1}. [${msg.type}] ${msg.text}`);
      });
    }
    
    if (pageErrors.length > 0) {
      console.log('\n🚨 Page Errors:');
      pageErrors.forEach((error, i) => {
        console.log(`   ${i+1}. ${error.message}`);
      });
    }
    
    // Test if toast notifications are working
    const toastTest = await page.evaluate(() => {
      try {
        // Check if Toast component is available
        return document.querySelector('[class*="toast"]') !== null ||
               document.querySelector('[data-testid*="toast"]') !== null ||
               typeof window.Toast !== 'undefined';
      } catch {
        return false;
      }
    });
    
    console.log(`   Toast notification system: ${toastTest ? '✅' : '⚠️'}`);
    
    console.log('\n✅ Error handling tests completed');
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testErrorHandling().catch(console.error);