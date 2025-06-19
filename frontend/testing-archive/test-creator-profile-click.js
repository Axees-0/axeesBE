const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Testing Emma Thompson profile click navigation...');
  
  try {
    // Navigate to explore page
    await page.goto('http://localhost:8081/', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    console.log('📄 Loaded explore page');

    // Analyze Emma Thompson's profile card
    const emmaAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const elements = Array.from(document.querySelectorAll('*'));
      
      // Find Emma Thompson related elements
      const emmaElements = elements.filter(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Emma Thompson') || text.includes('@emma');
      });

      // Find clickable Emma elements
      const clickableEmmaElements = elements.filter(el => {
        const text = el.textContent?.trim() || '';
        const style = getComputedStyle(el);
        const isClickable = style.cursor === 'pointer' || 
                           el.onclick || 
                           el.tagName === 'BUTTON' ||
                           el.tagName === 'A';
        
        return (text.includes('Emma Thompson') || text.includes('@emma')) && isClickable;
      });

      return {
        hasEmmaContent: bodyText.includes('Emma Thompson'),
        emmaElementsCount: emmaElements.length,
        clickableEmmaElementsCount: clickableEmmaElements.length,
        emmaElements: emmaElements.slice(0, 5).map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim().substring(0, 100),
          isClickable: getComputedStyle(el).cursor === 'pointer' || !!el.onclick,
          className: el.className
        })),
        clickableEmmaElements: clickableEmmaElements.map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim().substring(0, 100),
          className: el.className,
          hasHref: el.href || 'none'
        }))
      };
    });

    console.log('👤 Emma Thompson Analysis:');
    console.log(`✅ Has Emma content: ${emmaAnalysis.hasEmmaContent}`);
    console.log(`📊 Emma elements found: ${emmaAnalysis.emmaElementsCount}`);
    console.log(`🖱️ Clickable Emma elements: ${emmaAnalysis.clickableEmmaElementsCount}`);
    
    console.log('\n📝 Emma Elements:');
    emmaAnalysis.emmaElements.forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.tagName}: "${el.text}" (clickable: ${el.isClickable})`);
    });

    console.log('\n🖱️ Clickable Emma Elements:');
    emmaAnalysis.clickableEmmaElements.forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.tagName}: "${el.text}" (href: ${el.hasHref})`);
    });

    if (emmaAnalysis.clickableEmmaElementsCount > 0) {
      console.log('\n🖱️ Attempting to click Emma Thompson profile...');
      
      const clickResult = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        
        // Try to find the best Emma element to click
        const emmaElement = elements.find(el => {
          const text = el.textContent?.trim() || '';
          const style = getComputedStyle(el);
          const isClickable = style.cursor === 'pointer' || el.onclick || el.tagName === 'A';
          
          return (text.includes('Emma Thompson') || text.includes('@emma')) && 
                 isClickable && 
                 text.length < 200; // Avoid huge elements
        });

        if (emmaElement) {
          const initialUrl = window.location.href;
          emmaElement.click();
          
          return {
            success: true,
            elementText: emmaElement.textContent?.trim().substring(0, 100),
            elementTag: emmaElement.tagName,
            initialUrl
          };
        }

        return { success: false, error: 'No suitable Emma element found' };
      });

      console.log('🖱️ Click result:', clickResult);

      if (clickResult.success) {
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check where we ended up
        const afterClick = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          return {
            currentUrl: window.location.href,
            currentPath: window.location.pathname,
            title: document.title,
            hasProfileContent: bodyText.includes('Profile') || bodyText.includes('Followers'),
            hasEmmaDetails: bodyText.includes('Emma Thompson'),
            isDetailPage: bodyText.includes('Contact') || bodyText.includes('Send Message') || bodyText.includes('Follow'),
            contentPreview: bodyText.substring(0, 300)
          };
        });

        console.log('\n📊 AFTER CLICK ANALYSIS:');
        console.log(`🌐 URL: ${afterClick.currentUrl}`);
        console.log(`📄 Title: ${afterClick.title}`);
        console.log(`👤 Has Emma details: ${afterClick.hasEmmaDetails}`);
        console.log(`📋 Has profile content: ${afterClick.hasProfileContent}`);
        console.log(`🔍 Is detail page: ${afterClick.isDetailPage}`);
        console.log(`📝 Content preview: "${afterClick.contentPreview}"`);

        // Evaluate if navigation worked
        if (afterClick.currentUrl !== clickResult.initialUrl) {
          console.log('\n✅ Navigation occurred!');
          if (afterClick.hasEmmaDetails && afterClick.isDetailPage) {
            console.log('🎉 SUCCESS! Navigated to Emma Thompson\'s profile page');
          } else {
            console.log('⚠️ Navigation occurred but may not be the right profile page');
          }
        } else {
          console.log('\n❌ No navigation occurred - profile link may not be working');
        }
      }
    } else {
      console.log('\n❌ No clickable Emma Thompson elements found');
      console.log('💡 Profile cards may need navigation functionality added');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Emma Thompson profile click test complete');
})();