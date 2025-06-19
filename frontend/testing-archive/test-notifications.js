const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Testing notifications page navigation...');
  
  try {
    await page.goto('http://localhost:8081/notifications', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    const pageContent = await page.evaluate(() => {
      return {
        text: document.body.innerText,
        navigationTabs: Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent?.includes('Explore') && 
          el.textContent?.includes('Deals') && 
          el.textContent?.includes('Messages')
        )?.textContent || 'Not found',
        hasNotifications: document.body.innerText.includes('New Offer Received') || 
                         document.body.innerText.includes('Notifications'),
        totalElements: document.querySelectorAll('*').length
      };
    });

    console.log('✅ Notifications page loaded:');
    console.log(`   Total elements: ${pageContent.totalElements}`);
    console.log(`   Has notifications content: ${pageContent.hasNotifications}`);
    console.log(`   Navigation tabs: ${pageContent.navigationTabs}`);
    
    if (pageContent.navigationTabs.includes('Explore') && 
        pageContent.navigationTabs.includes('Deals') && 
        pageContent.navigationTabs.includes('Messages')) {
      console.log('✅ Navigation bar is consistent!');
    } else {
      console.log('❌ Navigation bar has issues');
    }

  } catch (error) {
    console.log(`❌ Error loading notifications: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Notifications test complete');
})();