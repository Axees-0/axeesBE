const puppeteer = require('puppeteer');

async function debugPageContent() {
  let browser;
  try {
    console.log('🚀 Starting detailed page content analysis...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log(`❌ [CONSOLE ERROR] ${msg.text()}`);
      }
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`❌ [PAGE ERROR] ${error.message}`);
    });
    
    console.log('\n🏠 Testing main page: http://localhost:8081...');
    
    try {
      await page.goto('http://localhost:8081', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for React to fully render
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get detailed page information
      const pageInfo = await page.evaluate(() => {
        // Check if page is blank
        const bodyText = document.body.innerText.trim();
        const hasContent = bodyText.length > 0;
        
        // Count elements
        const totalElements = document.querySelectorAll('*').length;
        const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }).length;
        
        // Look for React components
        const hasReactComponents = document.querySelectorAll('[data-reactroot], [data-react-component]').length > 0;
        
        // Look for common UI elements
        const hasButtons = document.querySelectorAll('button, [role="button"]').length;
        const hasInputs = document.querySelectorAll('input, textarea').length;
        const hasImages = document.querySelectorAll('img').length;
        const hasText = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6').length;
        
        // Get first 500 characters of visible text
        const visibleText = bodyText.substring(0, 500);
        
        // Check for loading states
        const hasLoadingIndicators = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]').length;
        
        // Check page title
        const pageTitle = document.title;
        
        return {
          hasContent,
          bodyTextLength: bodyText.length,
          totalElements,
          visibleElements,
          hasReactComponents,
          hasButtons,
          hasInputs,
          hasImages,
          hasText,
          visibleText,
          hasLoadingIndicators,
          pageTitle
        };
      });
      
      console.log('\n📊 PAGE ANALYSIS RESULTS:');
      console.log(`📄 Page Title: "${pageInfo.pageTitle}"`);
      console.log(`📝 Has Content: ${pageInfo.hasContent ? '✅ YES' : '❌ NO'}`);
      console.log(`📏 Body Text Length: ${pageInfo.bodyTextLength} characters`);
      console.log(`🏗️  Total DOM Elements: ${pageInfo.totalElements}`);
      console.log(`👁️  Visible Elements: ${pageInfo.visibleElements}`);
      console.log(`⚛️  React Components Found: ${pageInfo.hasReactComponents ? '✅ YES' : '❌ NO'}`);
      console.log(`🔘 Buttons Found: ${pageInfo.hasButtons}`);
      console.log(`📝 Input Fields Found: ${pageInfo.hasInputs}`);
      console.log(`🖼️  Images Found: ${pageInfo.hasImages}`);
      console.log(`📄 Text Elements Found: ${pageInfo.hasText}`);
      console.log(`⏳ Loading Indicators: ${pageInfo.hasLoadingIndicators}`);
      
      if (pageInfo.visibleText && pageInfo.visibleText.length > 0) {
        console.log('\n📖 VISIBLE TEXT CONTENT (first 500 chars):');
        console.log('─'.repeat(50));
        console.log(pageInfo.visibleText);
        console.log('─'.repeat(50));
      } else {
        console.log('\n⚠️  NO VISIBLE TEXT FOUND - Page appears blank');
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log('\n📸 Screenshot saved as debug-screenshot.png');
      
    } catch (error) {
      console.log(`❌ [NAVIGATION ERROR] ${error.message}`);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the debug session
debugPageContent().then(() => {
  console.log('\n🏁 Page content analysis complete');
}).catch(error => {
  console.error('Fatal error:', error);
});