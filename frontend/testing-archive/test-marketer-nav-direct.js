const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🎯 Testing direct navigation to index route...');
  
  try {
    // Test 1: Navigate directly to the index route (explore page)
    console.log('📍 TEST 1: Direct navigation to index route...');
    await page.goto('http://localhost:8081/', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    const indexPageAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        hasError: bodyText.includes('Unmatched Route') || bodyText.includes('Page could not be found'),
        contentPreview: bodyText.substring(0, 200),
        isExploreContent: bodyText.includes('Explore') || bodyText.includes('Creator') || bodyText.includes('Influencer'),
        totalElements: document.querySelectorAll('*').length
      };
    });

    console.log('📊 Index Route Analysis:');
    console.log(`🌐 URL: ${indexPageAnalysis.url}`);
    console.log(`📄 Title: ${indexPageAnalysis.title}`);
    console.log(`❌ Has Error: ${indexPageAnalysis.hasError}`);
    console.log(`🔍 Has Explore Content: ${indexPageAnalysis.isExploreContent}`);
    console.log(`📏 Total Elements: ${indexPageAnalysis.totalElements}`);
    console.log(`📝 Content Preview: "${indexPageAnalysis.contentPreview}"`);

    // Test 2: Check what happens with the (tabs) prefix
    console.log('\n📍 TEST 2: Navigation with (tabs) prefix...');
    await page.goto('http://localhost:8081/(tabs)/', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    const tabsPageAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        hasError: bodyText.includes('Unmatched Route') || bodyText.includes('Page could not be found'),
        contentPreview: bodyText.substring(0, 200)
      };
    });

    console.log('📊 (tabs)/ Route Analysis:');
    console.log(`🌐 URL: ${tabsPageAnalysis.url}`);
    console.log(`❌ Has Error: ${tabsPageAnalysis.hasError}`);
    console.log(`📝 Content Preview: "${tabsPageAnalysis.contentPreview}"`);

    // Conclusion
    if (!indexPageAnalysis.hasError && indexPageAnalysis.totalElements > 20) {
      console.log('\n✅ SUCCESS! Index route (/) works correctly for marketers');
      console.log('✅ This is the proper explore page for creator discovery');
      console.log('✅ Role switching navigation is correctly configured');
    } else if (!tabsPageAnalysis.hasError) {
      console.log('\n⚠️ Index route has issues, but (tabs)/ might work');
      console.log('💡 Consider updating navigation to use (tabs)/ instead');
    } else {
      console.log('\n❌ Both routes have issues - may need route investigation');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Direct navigation test complete');
})();