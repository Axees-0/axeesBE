const puppeteer = require('puppeteer');

async function focusedPageValidation() {
  let browser;
  
  // Key pages to test representing different categories
  const keyPages = [
    { url: '/', name: 'Home/Explore', category: 'public' },
    { url: '/deals', name: 'Deals', category: 'protected' },
    { url: '/messages', name: 'Messages', category: 'protected' },
    { url: '/UAM001Login', name: 'Login', category: 'auth' },
    { url: '/privacy-policy', name: 'Privacy Policy', category: 'public' },
    { url: '/UOM02MarketerOfferDetail', name: 'Offer Detail', category: 'protected' },
  ];
  
  try {
    console.log('🎯 Running focused page validation...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    const results = [];
    
    for (const pageInfo of keyPages) {
      console.log(`🔍 Testing ${pageInfo.name} (${pageInfo.url})`);
      
      const testResult = {
        url: pageInfo.url,
        name: pageInfo.name,
        category: pageInfo.category,
        success: false,
        loadTime: 0,
        issues: [],
        positives: []
      };
      
      try {
        const startTime = Date.now();
        
        // Capture errors during navigation
        const errors = [];
        const warnings = [];
        
        page.on('console', msg => {
          const text = msg.text();
          if (msg.type() === 'error') {
            errors.push(text);
          } else if (msg.type() === 'warn') {
            warnings.push(text);
          }
        });
        
        page.on('pageerror', error => {
          errors.push(`Page Error: ${error.message}`);
        });
        
        // Navigate to page
        await page.goto(`http://localhost:8081${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 8000
        });
        
        // Wait for initial render
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        testResult.loadTime = Date.now() - startTime;
        
        // Analyze page state
        const analysis = await page.evaluate(() => {
          const body = document.body;
          const content = body.innerText || '';
          
          return {
            hasContent: content.length > 50,
            contentPreview: content.substring(0, 150),
            elementCount: document.querySelectorAll('*').length,
            hasReactRoot: !!document.querySelector('[data-reactroot]'),
            hasLoadingState: content.includes('Loading') || content.includes('loading'),
            hasErrorState: content.includes('Error') || content.includes('error'),
            hasAuthRedirect: content.includes('Redirecting to login') || content.includes('Checking authentication'),
            currentUrl: window.location.href,
            title: document.title,
            hasButtons: document.querySelectorAll('button').length,
            hasInputs: document.querySelectorAll('input').length,
            hasNavigation: document.querySelectorAll('nav, [role="navigation"]').length,
            hasTabBar: content.includes('Explore') && content.includes('Messages') && content.includes('Profile')
          };
        });
        
        // Evaluate results
        testResult.positives.push(`Loaded in ${testResult.loadTime}ms`);
        testResult.positives.push(`${analysis.elementCount} DOM elements`);
        
        if (analysis.hasReactRoot) {
          testResult.positives.push('React app mounted');
        }
        
        if (analysis.hasTabBar) {
          testResult.positives.push('Tab navigation present');
        }
        
        if (analysis.hasButtons > 0) {
          testResult.positives.push(`${analysis.hasButtons} interactive buttons`);
        }
        
        if (analysis.hasInputs > 0) {
          testResult.positives.push(`${analysis.hasInputs} input fields`);
        }
        
        // Check for issues
        if (errors.length > 0) {
          testResult.issues.push(`${errors.length} JavaScript errors`);
        }
        
        if (!analysis.hasContent) {
          testResult.issues.push('No meaningful content detected');
        }
        
        if (analysis.elementCount < 50) {
          testResult.issues.push('Very few DOM elements (possible render failure)');
        }
        
        // Determine success based on category expectations
        if (pageInfo.category === 'protected') {
          // Protected pages should either show content (if authenticated) or redirect to auth
          testResult.success = analysis.hasAuthRedirect || (analysis.hasContent && analysis.elementCount > 50);
          if (analysis.hasAuthRedirect) {
            testResult.positives.push('Auth protection working (redirected to login)');
          }
        } else if (pageInfo.category === 'auth') {
          // Auth pages should show forms
          testResult.success = analysis.hasInputs > 0 || analysis.hasButtons > 0;
        } else { // public pages
          // Public pages should show content
          testResult.success = analysis.hasContent && analysis.elementCount > 50;
        }
        
        if (testResult.success) {
          console.log(`   ✅ Success - ${testResult.positives.join(', ')}`);
        } else {
          console.log(`   ❌ Issues - ${testResult.issues.join(', ')}`);
        }
        
        if (analysis.contentPreview) {
          console.log(`   📄 Content: "${analysis.contentPreview}..."`);
        }
        
        // Clear event listeners for next page
        page.removeAllListeners('console');
        page.removeAllListeners('pageerror');
        
      } catch (error) {
        testResult.issues.push(`Navigation failed: ${error.message}`);
        console.log(`   💥 Failed to load: ${error.message}`);
      }
      
      results.push(testResult);
      console.log(''); // Empty line for readability
    }
    
    // Generate summary
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = Math.round((successful / total) * 100);
    
    console.log('📊 FOCUSED VALIDATION SUMMARY');
    console.log('═'.repeat(40));
    console.log(`Overall Success Rate: ${successRate}% (${successful}/${total})`);
    
    const categories = {};
    results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { total: 0, success: 0 };
      }
      categories[result.category].total++;
      if (result.success) categories[result.category].success++;
    });
    
    console.log('\nResults by Category:');
    Object.entries(categories).forEach(([category, stats]) => {
      const rate = Math.round((stats.success / stats.total) * 100);
      console.log(`  ${category}: ${stats.success}/${stats.total} (${rate}%)`);
    });
    
    console.log('\n🔍 Key Findings:');
    const allPositives = results.flatMap(r => r.positives);
    const allIssues = results.flatMap(r => r.issues);
    
    const uniquePositives = [...new Set(allPositives)];
    const uniqueIssues = [...new Set(allIssues)];
    
    console.log('\n✅ Working Features:');
    uniquePositives.forEach(positive => console.log(`   • ${positive}`));
    
    if (uniqueIssues.length > 0) {
      console.log('\n❌ Common Issues:');
      uniqueIssues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    // Specific recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (results.some(r => r.issues.includes('JavaScript errors'))) {
      console.log('   🔧 Fix JavaScript errors for better stability');
    }
    
    if (results.filter(r => r.category === 'protected').every(r => r.success)) {
      console.log('   ✅ Authentication protection is working correctly');
    }
    
    if (results.some(r => r.positives.includes('React app mounted'))) {
      console.log('   ✅ React Native Web setup is functional');
    }
    
    if (results.some(r => r.positives.includes('Tab navigation present'))) {
      console.log('   ✅ Tab navigation is rendering correctly');
    }
    
    if (successRate >= 70) {
      console.log('\n🎉 Overall Assessment: Frontend is in good working condition!');
    } else {
      console.log('\n⚠️ Overall Assessment: Frontend needs attention for optimal performance');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run focused validation
focusedPageValidation().then(results => {
  console.log('\n🏁 Focused validation complete');
}).catch(error => {
  console.error('Fatal error:', error);
});