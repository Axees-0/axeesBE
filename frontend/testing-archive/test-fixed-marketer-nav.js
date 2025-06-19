const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🎯 Testing FIXED marketer navigation...');
  
  // Handle browser alerts
  page.on('dialog', async dialog => {
    console.log(`🔔 ${dialog.type()}: "${dialog.message()}"`);
    await dialog.accept();
  });
  
  try {
    // Start at profile page
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    console.log('📄 Starting at profile page');

    // Switch to Marketer role
    console.log('\n🔄 Switching to Marketer role...');
    
    // Open role switcher
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const button = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text === '🔄 Switch Role' && text.length < 50;
      });
      if (button) button.click();
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check what role is pre-selected
    const modalState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const elements = Array.from(document.querySelectorAll('*'));
      const switchButton = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Switch to') && text.length < 100;
      });
      
      return {
        modalVisible: bodyText.includes('Demo Mode: Switch Role'),
        switchButtonText: switchButton ? switchButton.textContent?.trim() : 'Not found'
      };
    });

    console.log('📱 Modal state:', modalState);

    // Click switch button
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const switchButton = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Switch to') && text.length < 100;
      });
      if (switchButton) switchButton.click();
    });

    // Wait for role switch and navigation
    console.log('⏳ Waiting for role switch and navigation...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Check final destination
    const finalState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                  bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                  bodyText.includes('followers') ? 'Creator' : 'Unknown',
        pageType: window.location.pathname.includes('deals') ? 'Deals' :
                  window.location.pathname === '/' ? 'Explore' : 'Other',
        hasError: bodyText.includes('Unmatched Route') || bodyText.includes('Page could not be found'),
        contentPreview: bodyText.substring(0, 200)
      };
    });

    console.log('\n📊 FINAL DESTINATION ANALYSIS:');
    console.log(`🌐 URL: ${finalState.url}`);
    console.log(`📄 Title: ${finalState.title}`);
    console.log(`👤 User: ${finalState.userName} (${finalState.userRole})`);
    console.log(`📱 Page Type: ${finalState.pageType}`);
    console.log(`❌ Has Error: ${finalState.hasError}`);
    console.log(`📝 Content Preview: "${finalState.contentPreview}"`);

    // Evaluate success
    if (!finalState.hasError && finalState.pageType === 'Explore') {
      console.log('\n🎉 SUCCESS! Marketer navigation is now working correctly!');
      console.log('✅ Role switch completed without errors');
      console.log('✅ Navigated to correct explore page (index route)');
      console.log('✅ No "Unmatched Route" errors');
    } else if (finalState.hasError) {
      console.log('\n❌ Still has navigation errors - route may need further investigation');
    } else {
      console.log('\n⚠️ Unexpected destination - may need route adjustment');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Fixed marketer navigation test complete');
})();