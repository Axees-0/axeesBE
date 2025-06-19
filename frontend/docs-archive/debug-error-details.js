const puppeteer = require('puppeteer');

async function captureJSErrors() {
  let browser;
  try {
    console.log('🔍 Starting JavaScript error capture...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture all console messages with full error details
    page.on('console', async msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.log(`\n❌ [CONSOLE ERROR] ${text}`);
        
        // Try to get more error details
        try {
          const args = await Promise.all(
            msg.args().map(async (arg) => {
              try {
                const jsonValue = await arg.jsonValue();
                return jsonValue;
              } catch (e) {
                // If can't get JSON value, try to get error info differently
                const remoteObject = arg._remoteObject;
                if (remoteObject && remoteObject.type === 'object' && remoteObject.subtype === 'error') {
                  return {
                    name: remoteObject.className,
                    description: remoteObject.description,
                  };
                }
                return arg.toString();
              }
            })
          );
          
          if (args.length > 0) {
            console.log(`🔍 [ERROR ARGS]`, JSON.stringify(args, null, 2));
          }
        } catch (e) {
          console.log(`🔍 [ERROR ARG EXTRACTION FAILED]`, e.message);
        }
      } else if (type === 'warn' && text.includes('shadow')) {
        // Skip deprecated shadow warnings
      } else if (type === 'warn' && text.includes('Route')) {
        // Skip route warnings
      } else {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });
    
    // Capture JavaScript errors with full stack traces
    page.on('pageerror', error => {
      console.log(`\n💥 [PAGE ERROR] ${error.message}`);
      console.log(`📍 [STACK TRACE]\n${error.stack}`);
    });
    
    // Capture unhandled promise rejections
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`🌐 [FAILED REQUEST] ${response.url()} - ${response.status()}`);
      }
    });
    
    console.log('\n🌐 Loading deals page...');
    
    try {
      const response = await page.goto('http://localhost:8081/deals', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      console.log(`📡 Response: ${response.status()}`);
    } catch (e) {
      console.log(`❌ Navigation error: ${e.message}`);
    }
    
    // Wait for React and any potential errors
    console.log('⏳ Waiting for React to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if we can execute JavaScript to see what's actually rendered
    try {
      const pageInfo = await page.evaluate(() => {
        const errors = [];
        
        // Check for global errors
        if (window.onerror) {
          errors.push('window.onerror is set');
        }
        
        // Check for React error boundaries
        const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
        if (errorBoundaries.length > 0) {
          errors.push(`Found ${errorBoundaries.length} error boundaries`);
        }
        
        // Check if deals component mounted
        const hasDealsContent = document.body.innerText.includes('Deals') || 
                               document.body.innerText.includes('offers') ||
                               document.body.innerText.includes('$');
        
        return {
          url: window.location.href,
          title: document.title,
          bodyTextLength: document.body.innerText.length,
          bodyText: document.body.innerText,
          hasDealsContent,
          errors,
          elementsWithErrors: document.querySelectorAll('[class*="error"]').length,
          reactErrorMessages: [...document.querySelectorAll('*')].map(el => el.textContent).filter(text => 
            text && (text.includes('Error') || text.includes('Failed'))
          ).slice(0, 5),
        };
      });
      
      console.log('\n📊 PAGE INFO:');
      console.log('===================');
      console.log(`URL: ${pageInfo.url}`);
      console.log(`Title: ${pageInfo.title}`);
      console.log(`Body text length: ${pageInfo.bodyTextLength}`);
      console.log(`Has deals content: ${pageInfo.hasDealsContent}`);
      console.log(`Elements with errors: ${pageInfo.elementsWithErrors}`);
      console.log(`Global errors: ${pageInfo.errors.join(', ') || 'None'}`);
      console.log(`React error messages: ${pageInfo.reactErrorMessages.join(', ') || 'None'}`);
      
      console.log('\n📄 FULL BODY TEXT:');
      console.log('===================');
      console.log(pageInfo.bodyText);
      
    } catch (evalError) {
      console.log(`❌ Page evaluation error: ${evalError.message}`);
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureJSErrors().then(() => {
  console.log('\n🏁 Error capture complete');
}).catch(error => {
  console.error('💥 Fatal script error:', error);
});