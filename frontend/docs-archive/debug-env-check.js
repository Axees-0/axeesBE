const puppeteer = require('puppeteer');

async function checkEnvironmentVariables() {
  let browser;
  try {
    console.log('🔍 Checking environment variables on deals page...');
    
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
    
    console.log('\n🌐 Loading deals page...');
    await page.goto('http://localhost:8081/deals', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for React to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check environment variables in the browser context
    const envCheck = await page.evaluate(() => {
      return {
        // Check if process.env exists and what EXPO_PUBLIC_DEMO_MODE contains
        processEnvExists: typeof process !== 'undefined' && typeof process.env !== 'undefined',
        demoModeValue: typeof process !== 'undefined' && process.env ? process.env.EXPO_PUBLIC_DEMO_MODE : 'NO_PROCESS_ENV',
        allExpoVars: typeof process !== 'undefined' && process.env ? 
          Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_')).reduce((acc, key) => {
            acc[key] = process.env[key];
            return acc;
          }, {}) : 
          'NO_PROCESS_ENV',
        
        // Check what's on window object  
        windowEnv: window.process && window.process.env ? window.process.env.EXPO_PUBLIC_DEMO_MODE : 'NO_WINDOW_PROCESS',
        
        // Check if we can find any demo-related content in DOM
        demoInDom: document.body.innerText.toLowerCase().includes('demo'),
        pageTitle: document.title,
        bodyTextLength: document.body.innerText.length,
        currentUrl: window.location.href,
      };
    });
    
    console.log('\n📊 ENVIRONMENT CHECK RESULTS:');
    console.log('=====================================');
    console.log('Process.env exists:', envCheck.processEnvExists);
    console.log('EXPO_PUBLIC_DEMO_MODE value:', envCheck.demoModeValue);
    console.log('Window process env DEMO_MODE:', envCheck.windowEnv);
    console.log('All EXPO_PUBLIC_ vars:', JSON.stringify(envCheck.allExpoVars, null, 2));
    console.log('Demo content in DOM:', envCheck.demoInDom);
    console.log('Page title:', envCheck.pageTitle);
    console.log('Body text length:', envCheck.bodyTextLength);
    console.log('Current URL:', envCheck.currentUrl);
    
  } catch (error) {
    console.error('Environment check error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkEnvironmentVariables().then(() => {
  console.log('\n🏁 Environment check complete');
}).catch(error => {
  console.error('Fatal error:', error);
});