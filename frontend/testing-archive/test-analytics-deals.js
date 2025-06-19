const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const testPages = [
    { url: 'http://localhost:8081/analytics', name: 'Analytics Page' },
    { url: 'http://localhost:8081/deals-test', name: 'Deals Test Page' }
  ];

  for (const testPage of testPages) {
    console.log(`\n🔍 Testing ${testPage.name}...`);
    
    try {
      await page.goto(testPage.url, { waitUntil: 'networkidle0', timeout: 10000 });
      await page.waitForSelector('body', { timeout: 5000 });

      const pageAnalysis = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        
        return {
          // Basic page info
          totalElements: document.querySelectorAll('*').length,
          pageTitle: document.title,
          hasContent: bodyText.length > 100,
          
          // Navigation analysis
          navigationTabs: (() => {
            const navElements = Array.from(document.querySelectorAll('*')).filter(el => 
              el.textContent?.includes('Explore') && 
              el.textContent?.includes('Deals') && 
              el.textContent?.includes('Messages')
            );
            return navElements.length > 0 ? 'Found consistent navigation' : 'Navigation not found';
          })(),
          
          // Content analysis
          contentSummary: (() => {
            if (bodyText.includes('Analytics') || bodyText.includes('analytics')) {
              return 'Analytics content detected';
            } else if (bodyText.includes('TEST DEALS') || bodyText.includes('Demo Deal')) {
              return 'Test deals content detected';
            } else if (bodyText.includes('404') || bodyText.includes('Not Found')) {
              return 'Page not found';
            } else if (bodyText.includes('Error')) {
              return 'Error detected';
            } else {
              return 'Unknown content type';
            }
          })(),
          
          // Key content snippets
          keyContent: bodyText.substring(0, 300).replace(/\s+/g, ' ').trim(),
          
          // Check for specific features
          hasCharts: bodyText.includes('chart') || bodyText.includes('Chart') || bodyText.includes('graph'),
          hasMetrics: bodyText.includes('metric') || bodyText.includes('Metric') || bodyText.includes('$'),
          hasTestElements: bodyText.includes('TEST') || bodyText.includes('test') || bodyText.includes('Demo'),
          
          // Navigation consistency check
          navigationConsistent: (() => {
            const purpleElements = Array.from(document.querySelectorAll('*')).filter(el => {
              const style = window.getComputedStyle(el);
              return style.backgroundColor === 'rgb(67, 11, 146)' || 
                     style.backgroundColor.includes('67, 11, 146');
            });
            return purpleElements.length > 0 ? 'Purple navigation elements found' : 'No purple navigation found';
          })()
        };
      });

      console.log(`✅ ${testPage.name} Analysis:`);
      console.log(`   Total DOM elements: ${pageAnalysis.totalElements}`);
      console.log(`   Page title: ${pageAnalysis.pageTitle}`);
      console.log(`   Has content: ${pageAnalysis.hasContent}`);
      console.log(`   Content type: ${pageAnalysis.contentSummary}`);
      console.log(`   Navigation: ${pageAnalysis.navigationTabs}`);
      console.log(`   Navigation elements: ${pageAnalysis.navigationConsistent}`);
      console.log(`   Has charts: ${pageAnalysis.hasCharts}`);
      console.log(`   Has metrics: ${pageAnalysis.hasMetrics}`);
      console.log(`   Has test elements: ${pageAnalysis.hasTestElements}`);
      console.log(`   Key content: "${pageAnalysis.keyContent}"`);

    } catch (error) {
      console.log(`❌ Error loading ${testPage.name}: ${error.message}`);
    }

    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await browser.close();
  console.log('\n🏁 Analytics and deals-test analysis complete');
})();