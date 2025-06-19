const puppeteer = require('puppeteer');

async function captureDetailedErrors() {
  let browser;
  try {
    console.log('🔍 Starting detailed error capture...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture all console messages with full details
    page.on('console', async msg => {
      const type = msg.type();
      const text = msg.text();
      
      // Get arguments for error details
      const args = await Promise.all(
        msg.args().map(async arg => {
          try {
            return await arg.jsonValue();
          } catch (e) {
            return arg.toString();
          }
        })
      );
      
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
      if (args.length > 0 && type === 'error') {
        console.log(`[ERROR DETAILS]`, args);
      }
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
      console.log(`[STACK] ${error.stack}`);
    });
    
    // Capture unhandled promise rejections
    page.on('requestfailed', request => {
      console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('\n🌐 Loading deals page with detailed error capture...');
    
    try {
      const response = await page.goto('http://localhost:8081/deals', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      console.log(`\n📡 Page response status: ${response.status()}`);
      console.log(`📡 Page response headers:`, await response.headers());
    } catch (e) {
      console.log(`\n❌ Page load error: ${e.message}`);
    }
    
    // Wait longer for React to fully load and render
    console.log('\n⏳ Waiting for React to render...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check what actually rendered
    const pageAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        bodyHTML: document.body.innerHTML.substring(0, 1000),
        bodyText: document.body.innerText,
        errorElements: document.querySelectorAll('[class*="error"], [id*="error"]').length,
        reactElements: document.querySelectorAll('[data-reactroot], [data-reactid]').length,
        totalElements: document.querySelectorAll('*').length,
        hasDealsRoute: window.location.pathname === '/deals',
        windowErrors: window.errors || 'No window.errors',
      };
    });
    
    console.log('\n📊 PAGE ANALYSIS:');
    console.log('=====================================');
    console.log('Page title:', pageAnalysis.title);
    console.log('URL path:', pageAnalysis.hasDealsRoute ? '/deals ✅' : 'Not /deals ❌');
    console.log('Total DOM elements:', pageAnalysis.totalElements);
    console.log('React elements:', pageAnalysis.reactElements);
    console.log('Error elements:', pageAnalysis.errorElements);
    console.log('Body text length:', pageAnalysis.bodyText.length);
    console.log('Window errors:', pageAnalysis.windowErrors);
    console.log('\n📄 FULL BODY TEXT:');
    console.log('-------------------------------------');
    console.log(pageAnalysis.bodyText);
    console.log('\n🔧 BODY HTML (first 1000 chars):');
    console.log('-------------------------------------');
    console.log(pageAnalysis.bodyHTML);
    
  } catch (error) {
    console.error('💥 Fatal error in error capture:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureDetailedErrors().then(() => {
  console.log('\n🏁 Detailed error capture complete');
}).catch(error => {
  console.error('💥 Script error:', error);
});