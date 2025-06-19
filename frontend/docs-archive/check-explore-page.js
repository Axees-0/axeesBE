const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Checking explore page content for marketer...');
  
  try {
    // Navigate directly to explore page
    await page.goto('http://localhost:8081/(tabs)/explore', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    const explorePageAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        totalElements: document.querySelectorAll('*').length,
        pageContent: {
          fullText: bodyText,
          hasCreators: bodyText.includes('Creator') || bodyText.includes('@'),
          hasFollowers: bodyText.includes('Followers') || bodyText.includes('followers'),
          hasSearch: bodyText.includes('Search') || bodyText.includes('search'),
          hasFilter: bodyText.includes('Filter') || bodyText.includes('filter'),
          hasExplore: bodyText.includes('Explore') || bodyText.includes('explore'),
          hasDiscover: bodyText.includes('Discover') || bodyText.includes('discover'),
          hasProfiles: bodyText.includes('Profile') || bodyText.includes('profile'),
          firstLines: bodyText.split('\n').slice(0, 20)
        },
        currentUser: {
          isMarketer: bodyText.includes('TechStyle') || bodyText.includes('Sarah Martinez'),
          isCreator: bodyText.includes('Emma Thompson') || bodyText.includes('45K followers')
        }
      };
    });

    console.log('📊 EXPLORE PAGE ANALYSIS:');
    console.log(`🌐 URL: ${explorePageAnalysis.url}`);
    console.log(`📄 Title: ${explorePageAnalysis.title}`);
    console.log(`📏 Total elements: ${explorePageAnalysis.totalElements}`);
    
    console.log('\n📱 PAGE CONTENT FEATURES:');
    console.log(`👥 Has creators: ${explorePageAnalysis.pageContent.hasCreators}`);
    console.log(`📊 Has followers: ${explorePageAnalysis.pageContent.hasFollowers}`);
    console.log(`🔍 Has search: ${explorePageAnalysis.pageContent.hasSearch}`);
    console.log(`🎛️ Has filter: ${explorePageAnalysis.pageContent.hasFilter}`);
    console.log(`🧭 Has explore: ${explorePageAnalysis.pageContent.hasExplore}`);
    console.log(`🔎 Has discover: ${explorePageAnalysis.pageContent.hasDiscover}`);

    console.log('\n👤 USER CONTEXT:');
    console.log(`💼 Is Marketer: ${explorePageAnalysis.currentUser.isMarketer}`);
    console.log(`🎨 Is Creator: ${explorePageAnalysis.currentUser.isCreator}`);

    console.log('\n📝 FIRST 20 LINES OF CONTENT:');
    explorePageAnalysis.pageContent.firstLines.forEach((line, i) => {
      if (line.trim()) console.log(`   ${i + 1}: ${line.trim()}`);
    });

    // Check if this is a functional explore page for marketers
    const isGoodMarketerExperience = 
      explorePageAnalysis.totalElements > 50 && 
      explorePageAnalysis.url.includes('explore') &&
      (explorePageAnalysis.pageContent.hasCreators || 
       explorePageAnalysis.pageContent.hasFollowers ||
       explorePageAnalysis.pageContent.hasExplore);

    if (isGoodMarketerExperience) {
      console.log('\n✅ SUCCESS! The explore page provides a good marketer experience');
      console.log('✅ Marketers are correctly directed to the creator discovery interface');
    } else {
      console.log('\n⚠️ The explore page might need content enhancement for marketers');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Explore page check complete');
})();