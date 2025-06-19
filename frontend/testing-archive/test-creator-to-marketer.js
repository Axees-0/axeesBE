const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🎯 Testing Creator → Marketer role switch and navigation...');
  
  // Handle browser alerts
  page.on('dialog', async dialog => {
    console.log(`🔔 ${dialog.type()}: "${dialog.message()}"`);
    await dialog.accept();
  });
  
  try {
    // First, make sure we're in Creator mode by going to deals page
    await page.goto('http://localhost:8081/deals', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    // Check current state
    const currentState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                  bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                  bodyText.includes('followers') || bodyText.includes('45K') ? 'Creator' : 'Unknown',
        path: window.location.pathname
      };
    });

    console.log('👤 Current state:', currentState);

    // Navigate to profile to access role switcher
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    console.log('\n🔄 Opening role switcher from Creator profile...');
    
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

    // Check what role is pre-selected (should be Marketer since we're Creator)
    const modalState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const elements = Array.from(document.querySelectorAll('*'));
      const switchButton = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Switch to') && text.length < 100;
      });
      
      return {
        modalVisible: bodyText.includes('Demo Mode: Switch Role'),
        switchButtonText: switchButton ? switchButton.textContent?.trim() : 'Not found',
        currentlyViewing: bodyText.includes('Currently viewing as:') ? 
          bodyText.substring(bodyText.indexOf('Currently viewing as:'), bodyText.indexOf('Currently viewing as:') + 50) : 'Not found'
      };
    });

    console.log('📱 Modal state:', modalState);

    if (modalState.switchButtonText.includes('Marketer')) {
      console.log('✅ Correct! Pre-selected to switch to Marketer');
      
      // Click switch button to go to Marketer
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const switchButton = elements.find(el => {
          const text = el.textContent?.trim() || '';
          return text.includes('Switch to Marketer') && text.length < 100;
        });
        if (switchButton) switchButton.click();
      });

      // Wait for role switch and navigation
      console.log('⏳ Waiting for switch to Marketer and navigation...');
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Check final destination (should be explore page)
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
          hasError: bodyText.includes('Unmatched Route') || bodyText.includes('Page could not be found'),
          isExplorePage: window.location.pathname === '/' || bodyText.includes('Explore Creators'),
          contentPreview: bodyText.substring(0, 300)
        };
      });

      console.log('\n📊 FINAL STATE AFTER SWITCH TO MARKETER:');
      console.log(`🌐 URL: ${finalState.url}`);
      console.log(`📄 Title: ${finalState.title}`);
      console.log(`👤 User: ${finalState.userName} (${finalState.userRole})`);
      console.log(`🏠 Is Explore Page: ${finalState.isExplorePage}`);
      console.log(`❌ Has Error: ${finalState.hasError}`);
      console.log(`📝 Content Preview: "${finalState.contentPreview}"`);

      // Evaluate success
      if (!finalState.hasError && finalState.isExplorePage && finalState.userRole === 'Marketer') {
        console.log('\n🎉 PERFECT! Creator → Marketer navigation works correctly!');
        console.log('✅ Successfully switched from Creator to Marketer');
        console.log('✅ Navigated to explore page (/) without errors');
        console.log('✅ User profile updated to Marketer');
      } else if (finalState.hasError) {
        console.log('\n❌ Navigation error detected');
      } else {
        console.log('\n⚠️ Role switch may have succeeded but navigation needs verification');
      }
    } else {
      console.log('❌ Expected to see "Switch to Marketer" but got:', modalState.switchButtonText);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Creator → Marketer test complete');
})();