const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Testing complete marketer role switching flow...');
  
  // Handle browser alerts
  page.on('dialog', async dialog => {
    console.log(`🔔 ${dialog.type()}: "${dialog.message()}"`);
    await dialog.accept();
  });
  
  try {
    // Start at profile page
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    // Check initial state (should be Creator after our previous test)
    const initialState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                  bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                  bodyText.includes('followers') ? 'Creator' : 'Unknown',
        path: window.location.pathname
      };
    });

    console.log('👤 Starting state:', initialState);

    // Switch to Marketer if we're currently Creator
    if (initialState.userRole === 'Creator' || initialState.userName === 'Emma Thompson') {
      console.log('\n🔄 Switching from Creator to Marketer...');
      
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

      // Click switch button (should default to Marketer)
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const switchButton = elements.find(el => {
          const text = el.textContent?.trim() || '';
          return text.includes('Switch to') && text.length < 100;
        });
        if (switchButton) switchButton.click();
      });

      // Wait for role switch and navigation
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Check final state - should be on explore page as marketer
    const finalState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                  bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                  bodyText.includes('followers') ? 'Creator' : 'Unknown',
        path: window.location.pathname,
        url: window.location.href,
        title: document.title,
        pageContent: {
          hasExploreContent: bodyText.includes('Explore') || bodyText.includes('Creator') || bodyText.includes('Discover'),
          hasSearchFunctionality: bodyText.includes('Search') || bodyText.includes('Filter'),
          hasCreatorCards: bodyText.includes('Followers') || bodyText.includes('@'),
          sampleContent: bodyText.substring(0, 300)
        }
      };
    });

    console.log('\n📊 FINAL STATE ANALYSIS:');
    console.log(`👤 User: ${finalState.userName} (${finalState.userRole})`);
    console.log(`🌐 URL: ${finalState.url}`);
    console.log(`📄 Title: ${finalState.title}`);
    console.log(`🧭 Path: ${finalState.path}`);

    console.log('\n📱 EXPLORE PAGE CONTENT:');
    console.log(`✅ Has explore content: ${finalState.pageContent.hasExploreContent}`);
    console.log(`🔍 Has search functionality: ${finalState.pageContent.hasSearchFunctionality}`);
    console.log(`👥 Has creator cards: ${finalState.pageContent.hasCreatorCards}`);
    console.log(`📝 Sample content: "${finalState.pageContent.sampleContent}"`);

    // Verify this is the correct marketer experience
    if (finalState.path.includes('explore') && finalState.userRole === 'Marketer') {
      console.log('\n🎉 SUCCESS! Marketer role switching works perfectly!');
      console.log('✅ Correctly navigated to explore page for creator discovery');
      console.log('✅ User profile shows as Marketer');
      console.log('✅ URL structure is correct: /(tabs)/explore');
    } else {
      console.log('\n⚠️ Unexpected state - please check role switching logic');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Marketer flow test complete');
})();