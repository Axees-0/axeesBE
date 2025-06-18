const puppeteer = require('puppeteer');
const fs = require('fs');

// Comprehensive performance audit for identifying 5-6 second load time bottlenecks
async function performanceAudit() {
  console.log('🚀 Starting Performance Audit...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    metrics: {},
    resources: [],
    coverage: {},
    recommendations: []
  };
  
  try {
    const page = await browser.newPage();
    
    // Enable performance and coverage tracking
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
    
    // Capture resource timing
    const resources = [];
    page.on('response', response => {
      const timing = response.timing();
      if (timing) {
        resources.push({
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          size: response.headers()['content-length'] || 0,
          duration: timing.requestTime ? timing.receiveHeadersEnd - timing.requestTime : 0,
          type: response.headers()['content-type']
        });
      }
    });
    
    // Performance observer
    await page.evaluateOnNewDocument(() => {
      window.__perfMetrics = {
        start: performance.now(),
        firstPaint: 0,
        firstContentfulPaint: 0,
        domInteractive: 0,
        domContentLoaded: 0,
        loadComplete: 0,
        largestContentfulPaint: 0
      };
      
      // Capture paint timings
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            window.__perfMetrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            window.__perfMetrics.firstContentfulPaint = entry.startTime;
          }
        }
      }).observe({ entryTypes: ['paint'] });
      
      // Capture LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        window.__perfMetrics.largestContentfulPaint = entries[entries.length - 1].startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // DOM timing
      document.addEventListener('DOMContentLoaded', () => {
        window.__perfMetrics.domContentLoaded = performance.now() - window.__perfMetrics.start;
      });
      
      window.addEventListener('load', () => {
        window.__perfMetrics.loadComplete = performance.now() - window.__perfMetrics.start;
      });
    });
    
    console.log('📊 Loading http://localhost:8081...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:8081', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const totalLoadTime = Date.now() - startTime;
    
    // Wait a bit more for any delayed metrics
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get performance metrics
    const perfMetrics = await page.evaluate(() => window.__perfMetrics);
    const performanceTiming = JSON.parse(await page.evaluate(() => 
      JSON.stringify(performance.timing)
    ));
    
    // Calculate key metrics
    results.metrics = {
      totalLoadTime: totalLoadTime,
      firstPaint: perfMetrics.firstPaint,
      firstContentfulPaint: perfMetrics.firstContentfulPaint,
      largestContentfulPaint: perfMetrics.largestContentfulPaint,
      domContentLoaded: perfMetrics.domContentLoaded,
      loadComplete: perfMetrics.loadComplete,
      ttfb: performanceTiming.responseStart - performanceTiming.navigationStart,
      domProcessing: performanceTiming.domComplete - performanceTiming.domLoading,
      resourceLoading: performanceTiming.loadEventEnd - performanceTiming.responseEnd
    };
    
    // Get JavaScript and CSS coverage
    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage()
    ]);
    
    // Calculate unused code
    let totalJSBytes = 0;
    let usedJSBytes = 0;
    const unusedJS = [];
    
    for (const entry of jsCoverage) {
      totalJSBytes += entry.text.length;
      let usedLength = 0;
      
      for (const range of entry.ranges) {
        usedLength += range.end - range.start;
      }
      
      usedJSBytes += usedLength;
      const unusedPercentage = ((entry.text.length - usedLength) / entry.text.length * 100);
      
      if (unusedPercentage > 50) {
        unusedJS.push({
          url: entry.url,
          totalBytes: entry.text.length,
          unusedBytes: entry.text.length - usedLength,
          unusedPercentage: unusedPercentage.toFixed(1)
        });
      }
    }
    
    results.coverage = {
      js: {
        total: totalJSBytes,
        used: usedJSBytes,
        unused: totalJSBytes - usedJSBytes,
        unusedPercentage: ((totalJSBytes - usedJSBytes) / totalJSBytes * 100).toFixed(1),
        files: unusedJS.sort((a, b) => b.unusedBytes - a.unusedBytes).slice(0, 10)
      }
    };
    
    // Analyze resources
    results.resources = resources
      .filter(r => r.size > 1000) // Only files > 1KB
      .sort((a, b) => b.size - a.size)
      .slice(0, 20); // Top 20 largest
    
    // Memory usage
    const memoryUsage = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
          totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2)
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      results.metrics.memoryUsageMB = memoryUsage.usedJSHeapSize;
    }
    
    // Generate recommendations based on findings
    if (results.metrics.totalLoadTime > 3000) {
      results.recommendations.push(
        `⚠️ Total load time is ${(totalLoadTime/1000).toFixed(1)}s - should be under 3s`
      );
    }
    
    if (results.coverage.js.unusedPercentage > 50) {
      results.recommendations.push(
        `⚠️ ${results.coverage.js.unusedPercentage}% of JavaScript is unused - implement code splitting`
      );
    }
    
    if (results.metrics.largestContentfulPaint > 2500) {
      results.recommendations.push(
        `⚠️ LCP is ${(results.metrics.largestContentfulPaint/1000).toFixed(1)}s - should be under 2.5s`
      );
    }
    
    const largeResources = results.resources.filter(r => r.size > 500000);
    if (largeResources.length > 0) {
      results.recommendations.push(
        `⚠️ Found ${largeResources.length} resources over 500KB - consider optimization`
      );
    }
    
    // Print results
    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`Total Load Time: ${(results.metrics.totalLoadTime/1000).toFixed(2)}s`);
    console.log(`First Paint: ${(results.metrics.firstPaint/1000).toFixed(2)}s`);
    console.log(`First Contentful Paint: ${(results.metrics.firstContentfulPaint/1000).toFixed(2)}s`);
    console.log(`Largest Contentful Paint: ${(results.metrics.largestContentfulPaint/1000).toFixed(2)}s`);
    console.log(`DOM Content Loaded: ${(results.metrics.domContentLoaded/1000).toFixed(2)}s`);
    console.log(`Time to First Byte: ${results.metrics.ttfb}ms`);
    
    console.log('\n📦 BUNDLE ANALYSIS:');
    console.log(`Total JavaScript: ${(results.coverage.js.total/1024/1024).toFixed(2)}MB`);
    console.log(`Unused JavaScript: ${(results.coverage.js.unused/1024/1024).toFixed(2)}MB (${results.coverage.js.unusedPercentage}%)`);
    
    console.log('\n🏆 TOP UNUSED JS FILES:');
    results.coverage.js.files.slice(0, 5).forEach(file => {
      const fileName = file.url.split('/').pop();
      console.log(`- ${fileName}: ${(file.unusedBytes/1024).toFixed(0)}KB unused (${file.unusedPercentage}%)`);
    });
    
    console.log('\n📊 LARGEST RESOURCES:');
    results.resources.slice(0, 5).forEach(resource => {
      const fileName = resource.url.split('/').pop();
      console.log(`- ${fileName}: ${(resource.size/1024).toFixed(0)}KB`);
    });
    
    console.log('\n💡 RECOMMENDATIONS:');
    results.recommendations.forEach(rec => console.log(rec));
    
    // Save detailed report
    fs.writeFileSync(
      'performance-audit-report.json', 
      JSON.stringify(results, null, 2)
    );
    console.log('\n📄 Detailed report saved to performance-audit-report.json');
    
    return results;
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    return null;
  } finally {
    await browser.close();
  }
}

// Run the audit
performanceAudit().then(results => {
  if (results && results.metrics.totalLoadTime > 3000) {
    console.log('\n🚨 CRITICAL: Load time exceeds 3 seconds!');
    console.log('Priority fixes needed for production readiness.');
  }
});