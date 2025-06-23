const puppeteer = require('puppeteer');

async function testRoleSwitchCancelBehavior() {
  console.log('Testing Role Switch Cancel Behavior Fix...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:19006/', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Go to profile page
    console.log('2. Navigating to profile page...');
    await page.click('[aria-label="Profile, tab, 4 of 4"]');
    await page.waitForTimeout(2000);

    // Test 1: Cancel button in modal
    console.log('\n3. Testing Cancel button in modal...');
    console.log('   - Opening role switcher...');
    await page.click('[testID="role-switcher-button"]');
    await page.waitForTimeout(1000);

    // Check if modal is visible
    const modalVisible = await page.$eval('[role="dialog"]', el => el !== null);
    console.log(`   - Modal is visible: ${modalVisible ? 'YES' : 'NO'}`);

    // Click Cancel button
    console.log('   - Clicking Cancel button...');
    await page.click('[aria-label="Cancel"]');
    await page.waitForTimeout(1000);

    // Check if modal is closed
    const modalClosedAfterCancel = await page.$$('[role="dialog"]').then(els => els.length === 0);
    console.log(`   - Modal closed after Cancel: ${modalClosedAfterCancel ? 'YES ✓' : 'NO ✗'}`);

    // Test 2: X close button
    console.log('\n4. Testing X close button...');
    console.log('   - Opening role switcher again...');
    await page.click('[testID="role-switcher-button"]');
    await page.waitForTimeout(1000);

    // Click X close button
    console.log('   - Clicking X close button...');
    await page.click('text=×');
    await page.waitForTimeout(1000);

    // Check if modal is closed
    const modalClosedAfterX = await page.$$('[role="dialog"]').then(els => els.length === 0);
    console.log(`   - Modal closed after X: ${modalClosedAfterX ? 'YES ✓' : 'NO ✗'}`);

    // Test 3: Cancel in confirmation dialog
    console.log('\n5. Testing Cancel in confirmation dialog...');
    console.log('   - Opening role switcher...');
    await page.click('[testID="role-switcher-button"]');
    await page.waitForTimeout(1000);

    // Click Switch button
    console.log('   - Clicking Switch button...');
    await page.click('button:has-text("Switch to")');
    await page.waitForTimeout(500);

    // Handle the confirmation dialog - click Cancel
    page.once('dialog', async dialog => {
      console.log(`   - Confirmation dialog appeared: "${dialog.message()}"`);
      console.log('   - Clicking Cancel in confirmation...');
      await dialog.dismiss();
    });

    await page.waitForTimeout(1500);

    // Check if modal is closed after canceling confirmation
    const modalClosedAfterConfirmCancel = await page.$$('[role="dialog"]').then(els => els.length === 0);
    console.log(`   - Modal closed after confirmation cancel: ${modalClosedAfterConfirmCancel ? 'YES ✓' : 'NO ✗'}`);

    // Test 4: ESC key (for web)
    console.log('\n6. Testing ESC key behavior...');
    console.log('   - Opening role switcher...');
    await page.click('[testID="role-switcher-button"]');
    await page.waitForTimeout(1000);

    // Press ESC key
    console.log('   - Pressing ESC key...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Check if modal is closed
    const modalClosedAfterEsc = await page.$$('[role="dialog"]').then(els => els.length === 0);
    console.log(`   - Modal closed after ESC: ${modalClosedAfterEsc ? 'YES ✓' : 'NO ✗'}`);

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Cancel button: ${modalClosedAfterCancel ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`X close button: ${modalClosedAfterX ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Confirmation cancel: ${modalClosedAfterConfirmCancel ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`ESC key: ${modalClosedAfterEsc ? 'PASS ✓' : 'FAIL ✗'}`);

    const allPassed = modalClosedAfterCancel && modalClosedAfterX && 
                      modalClosedAfterConfirmCancel && modalClosedAfterEsc;
    
    console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    console.log('\nTest completed. Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

// Run the test
testRoleSwitchCancelBehavior();