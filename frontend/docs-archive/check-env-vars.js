const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Checking environment variables in browser...');
  
  try {
    // Navigate to profile page
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    const envCheck = await page.evaluate(() => {
      // Check environment variables directly in the browser
      return {
        EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE,
        EXPO_PUBLIC_AUTO_LOGIN: process.env.EXPO_PUBLIC_AUTO_LOGIN,
        EXPO_PUBLIC_AUTO_LOGIN_USER: process.env.EXPO_PUBLIC_AUTO_LOGIN_USER,
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_')),
        
        // Check if role switcher button exists
        roleSwitcherExists: !!document.querySelector('*[data-testid="role-switcher"]') || 
                           !!Array.from(document.querySelectorAll('*')).find(el => 
                              el.textContent?.includes('🔄 Switch Role')
                           ),
        
        // Get all button texts
        buttonTexts: Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent?.includes('Switch') || el.textContent?.includes('🔄')
        ).map(el => el.textContent?.trim()).filter(Boolean)
      };
    });

    console.log('✅ Environment Check Results:');
    console.log(`   EXPO_PUBLIC_DEMO_MODE: ${envCheck.EXPO_PUBLIC_DEMO_MODE}`);
    console.log(`   EXPO_PUBLIC_AUTO_LOGIN: ${envCheck.EXPO_PUBLIC_AUTO_LOGIN}`);
    console.log(`   EXPO_PUBLIC_AUTO_LOGIN_USER: ${envCheck.EXPO_PUBLIC_AUTO_LOGIN_USER}`);
    console.log(`   NODE_ENV: ${envCheck.nodeEnv}`);
    console.log(`   All EXPO_PUBLIC_ keys: ${envCheck.allEnvKeys.join(', ')}`);
    console.log(`   Role switcher button exists: ${envCheck.roleSwitcherExists}`);
    console.log(`   Button texts with 'Switch' or '🔄': ${JSON.stringify(envCheck.buttonTexts, null, 2)}`);

  } catch (error) {
    console.log(`❌ Error checking environment: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Environment check complete');
})();