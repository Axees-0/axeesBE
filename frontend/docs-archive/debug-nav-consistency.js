const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const pages = [
    { url: 'http://localhost:8081/', name: 'Home' },
    { url: 'http://localhost:8081/deals', name: 'Deals' },
    { url: 'http://localhost:8081/messages', name: 'Messages' },
    { url: 'http://localhost:8081/profile', name: 'Profile' }
  ];

  for (const testPage of pages) {
    console.log(`\n🔍 Testing ${testPage.name} page navigation...`);
    
    try {
      await page.goto(testPage.url, { waitUntil: 'networkidle0', timeout: 10000 });
      await page.waitForSelector('body', { timeout: 5000 }); // Wait for content to render

      // Check for navigation bar
      const navInfo = await page.evaluate(() => {
        // Search for elements containing the expected navigation text
        const allElements = Array.from(document.querySelectorAll('*'));
        
        // Look for element containing multiple tab names
        const navCandidates = allElements.filter(el => {
          const text = el.textContent || '';
          const hasMultipleTabs = 
            (text.includes('Explore') && text.includes('Deals') && text.includes('Messages')) ||
            (text.includes('Explore') && text.includes('Profile')) ||
            (text.includes('Deals/Offers') && text.includes('Messages') && text.includes('Notifications'));
          return hasMultipleTabs;
        });

        console.log('Found', navCandidates.length, 'elements with multiple tab names');
        
        // Find the navigation container - prefer one with proper styling
        const tabBar = navCandidates.find(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return rect.width > 300 && // Must be reasonably wide
                 (style.backgroundColor === 'rgb(67, 11, 146)' || 
                  style.position === 'fixed' || 
                  style.position === 'absolute' ||
                  rect.bottom >= window.innerHeight - 120); // Near bottom of screen
        }) || navCandidates[0]; // fallback to first candidate

        if (!tabBar) {
          return { found: false, message: 'Navigation bar not found' };
        }

        const computedStyle = window.getComputedStyle(tabBar);
        const rect = tabBar.getBoundingClientRect();

        // Count tabs
        const tabs = tabBar.querySelectorAll('[role="tab"]') || 
                    tabBar.querySelectorAll('button') ||
                    tabBar.querySelectorAll('div[style*="flex: 1"]');

        // Get tab text content
        const tabTexts = Array.from(tabs).map(tab => 
          tab.textContent?.trim() || 'No text'
        ).filter(text => text !== 'No text');

        return {
          found: true,
          width: rect.width,
          height: rect.height,
          position: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right
          },
          styles: {
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            bottom: computedStyle.bottom,
            backgroundColor: computedStyle.backgroundColor,
            display: computedStyle.display
          },
          tabCount: tabs.length,
          tabTexts: tabTexts,
          innerHTML: tabBar.innerHTML.substring(0, 200) + '...'
        };
      });

      if (navInfo.found) {
        console.log(`✅ Navigation found:`);
        console.log(`   Width: ${navInfo.width}px (CSS: ${navInfo.styles.width})`);
        console.log(`   Height: ${navInfo.height}px`);
        console.log(`   Position: ${navInfo.styles.position} (bottom: ${navInfo.styles.bottom})`);
        console.log(`   Background: ${navInfo.styles.backgroundColor}`);
        console.log(`   Tab count: ${navInfo.tabCount}`);
        console.log(`   Tab labels: ${navInfo.tabTexts.join(', ')}`);
        console.log(`   Bounds: left=${navInfo.position.left}, right=${navInfo.position.right}`);
      } else {
        console.log(`❌ ${navInfo.message}`);
      }

    } catch (error) {
      console.log(`❌ Error loading ${testPage.name}: ${error.message}`);
    }
  }

  await browser.close();
  console.log('\n🏁 Navigation consistency test complete');
})();