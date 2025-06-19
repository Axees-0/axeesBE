const puppeteer = require('puppeteer');

async function debugDealsPage() {
  let browser;
  try {
    console.log('🔍 Starting detailed deals page analysis...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
      console.log(`[STACK] ${error.stack}`);
    });
    
    console.log('\n💼 Analyzing deals page in detail...');
    await page.goto('http://localhost:8081/deals', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait longer for React rendering
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get detailed page analysis
    const analysis = await page.evaluate(() => {
      const body = document.body;
      
      return {
        // Full text content
        fullText: body.innerText,
        
        // HTML structure
        innerHTML: body.innerHTML.length > 5000 ? 
          body.innerHTML.substring(0, 5000) + '...[TRUNCATED]' : 
          body.innerHTML,
        
        // Element counts
        totalElements: document.querySelectorAll('*').length,
        divElements: document.querySelectorAll('div').length,
        textElements: document.querySelectorAll('text, span, p').length,
        
        // Look for specific patterns
        dealElements: {
          dataTestId: document.querySelectorAll('[data-testid*="deal"]').length,
          dealClass: document.querySelectorAll('[class*="deal"]').length,
          offerClass: document.querySelectorAll('[class*="offer"]').length,
          cardElements: document.querySelectorAll('[class*="card"]').length,
        },
        
        // Check for specific content
        contentChecks: {
          hasOffers: body.innerText.includes('Offers') || body.innerText.includes('offers'),
          hasDemos: body.innerText.includes('demo') || body.innerText.includes('Demo'),
          hasCreators: body.innerText.includes('Creator') || body.innerText.includes('creator'),
          hasAmounts: body.innerText.includes('$') && body.innerText.match(/\$\d+/),
          hasEmptyState: body.innerText.includes('No offers') || body.innerText.includes('empty'),
        },
        
        // Auth context
        authElements: document.querySelectorAll('[data-testid*="auth"], [class*="auth"]').length,
        
        // Check for loading states  
        loadingElements: document.querySelectorAll('[class*="loading"], [data-testid*="loading"]').length,
      };
    });
    
    console.log('\n📊 DETAILED ANALYSIS RESULTS:');
    console.log('=====================================');
    
    console.log('\n🔢 ELEMENT COUNTS:');
    console.log(`Total DOM elements: ${analysis.totalElements}`);
    console.log(`Div elements: ${analysis.divElements}`);
    console.log(`Text elements: ${analysis.textElements}`);
    console.log(`Auth elements: ${analysis.authElements}`);
    console.log(`Loading elements: ${analysis.loadingElements}`);
    
    console.log('\n🎯 DEAL-SPECIFIC ELEMENTS:');
    console.log(`data-testid="deal": ${analysis.dealElements.dataTestId}`);
    console.log(`class="*deal*": ${analysis.dealElements.dealClass}`);
    console.log(`class="*offer*": ${analysis.dealElements.offerClass}`);
    console.log(`class="*card*": ${analysis.dealElements.cardElements}`);
    
    console.log('\n✅ CONTENT CHECKS:');
    console.log(`Has "Offers" text: ${analysis.contentChecks.hasOffers}`);
    console.log(`Has demo content: ${analysis.contentChecks.hasDemos}`);
    console.log(`Has creator content: ${analysis.contentChecks.hasCreators}`);
    console.log(`Has dollar amounts: ${analysis.contentChecks.hasAmounts}`);
    console.log(`Has empty state: ${analysis.contentChecks.hasEmptyState}`);
    
    console.log('\n📄 FULL PAGE TEXT:');
    console.log('=====================================');
    console.log(analysis.fullText);
    
    console.log('\n🔧 HTML STRUCTURE (first 2000 chars):');
    console.log('=====================================');
    console.log(analysis.innerHTML.substring(0, 2000));
    
  } catch (error) {
    console.error('Analysis error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugDealsPage().then(() => {
  console.log('\n🏁 Detailed analysis complete');
}).catch(error => {
  console.error('Fatal error:', error);
});