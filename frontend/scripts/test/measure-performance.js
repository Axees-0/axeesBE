const puppeteer = require('puppeteer');

async function measurePerformance() {
  let browser;
  try {
    console.log('⚡ Measuring route loading performance...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const routes = [
      { name: 'Home', path: '/' },
      { name: 'Deals', path: '/deals' },
      { name: 'Messages', path: '/messages' },
      { name: 'Notifications', path: '/notifications' },
      { name: 'Profile', path: '/profile' }
    ];
    
    console.log('📊 Route Loading Times:');
    console.log('═'.repeat(60));
    
    for (const route of routes) {
      const page = await browser.newPage();
      
      // Enable performance metrics
      await page.evaluateOnNewDocument(() => {
        window.performanceMetrics = {
          navigationStart: 0,
          domContentLoaded: 0,
          loadComplete: 0,
          firstPaint: 0,
          firstContentfulPaint: 0
        };
        
        window.addEventListener('DOMContentLoaded', () => {
          window.performanceMetrics.domContentLoaded = Date.now();
        });
        
        window.addEventListener('load', () => {
          window.performanceMetrics.loadComplete = Date.now();
        });
      });
      
      // Measure cold start (first load)
      const coldStartTime = Date.now();
      await page.goto(`http://localhost:8081${route.path}`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      const coldLoadTime = Date.now() - coldStartTime;
      
      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          resourceCount: performance.getEntriesByType('resource').length,
          totalTransferSize: performance.getEntriesByType('resource').reduce((sum, r) => sum + (r.transferSize || 0), 0)
        };
      });
      
      // Measure warm start (cached load)
      await page.reload({ waitUntil: 'networkidle2' });
      const warmStartTime = Date.now();
      await page.goto(`http://localhost:8081${route.path}`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      const warmLoadTime = Date.now() - warmStartTime;
      
      // Display results
      console.log(`\n📍 ${route.name} (${route.path})`);
      console.log(`   Cold start: ${coldLoadTime}ms ${coldLoadTime < 2000 ? '✅' : coldLoadTime < 4000 ? '⚠️' : '❌'}`);
      console.log(`   Warm start: ${warmLoadTime}ms ${warmLoadTime < 1000 ? '✅' : warmLoadTime < 2000 ? '⚠️' : '❌'}`);
      console.log(`   First Paint: ${Math.round(metrics.firstPaint)}ms`);
      console.log(`   First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms`);
      console.log(`   Resources loaded: ${metrics.resourceCount}`);
      console.log(`   Total transfer size: ${(metrics.totalTransferSize / 1024).toFixed(2)} KB`);
      
      await page.close();
    }
    
    // Test navigation between routes
    console.log('\n\n📊 Route Navigation Performance:');
    console.log('═'.repeat(60));
    
    const navPage = await browser.newPage();
    await navPage.goto('http://localhost:8081/', { waitUntil: 'networkidle2' });
    
    for (let i = 1; i < routes.length; i++) {
      const fromRoute = routes[i - 1];
      const toRoute = routes[i];
      
      const navStartTime = Date.now();
      await navPage.goto(`http://localhost:8081${toRoute.path}`, { 
        waitUntil: 'networkidle2' 
      });
      const navTime = Date.now() - navStartTime;
      
      console.log(`\n   ${fromRoute.name} → ${toRoute.name}: ${navTime}ms ${navTime < 1000 ? '✅' : navTime < 2000 ? '⚠️' : '❌'}`);
    }
    
    await navPage.close();
    
    // Bundle size analysis
    console.log('\n\n📊 Bundle Size Analysis:');
    console.log('═'.repeat(60));
    
    const bundlePage = await browser.newPage();
    
    const jsResources = [];
    bundlePage.on('response', response => {
      const url = response.url();
      if (url.endsWith('.js') || url.includes('.js?')) {
        jsResources.push({
          url: url.split('/').pop().split('?')[0],
          size: parseInt(response.headers()['content-length'] || '0')
        });
      }
    });
    
    await bundlePage.goto('http://localhost:8081/', { waitUntil: 'networkidle2' });
    
    const totalBundleSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    console.log(`\n   Total JS bundle size: ${(totalBundleSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Number of JS files: ${jsResources.length}`);
    
    // Show largest bundles
    const largestBundles = jsResources
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
    
    console.log('\n   Largest bundles:');
    largestBundles.forEach(bundle => {
      console.log(`   - ${bundle.url}: ${(bundle.size / 1024).toFixed(2)} KB`);
    });
    
    await bundlePage.close();
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the measurement
measurePerformance().then(() => {
  console.log('\n\n✅ Performance measurement complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});