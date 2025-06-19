const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Testing Alert.alert availability in web environment...');
  
  try {
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    const alertTest = await page.evaluate(() => {
      // Test if Alert is available
      const hasAlert = typeof Alert !== 'undefined';
      const hasReactNativeAlert = typeof window.Alert !== 'undefined';
      
      // Test if we can access react-native Alert
      let reactNativeAlertAvailable = false;
      try {
        // This is how React Native imports work in web
        const { Alert: RNAlert } = require('react-native');
        reactNativeAlertAvailable = typeof RNAlert?.alert === 'function';
      } catch (e) {
        // require might not work in browser
      }

      // Test browser native alert
      const hasBrowserAlert = typeof window.alert === 'function';
      const hasBrowserConfirm = typeof window.confirm === 'function';

      return {
        hasAlert,
        hasReactNativeAlert,
        reactNativeAlertAvailable,
        hasBrowserAlert,
        hasBrowserConfirm,
        globalKeys: Object.keys(window).filter(key => key.toLowerCase().includes('alert')),
        reactNativeKeys: Object.keys(window).filter(key => key.toLowerCase().includes('react'))
      };
    });

    console.log('📱 Alert availability test:', alertTest);

    // Test if we can trigger a browser alert
    console.log('🧪 Testing browser alert...');
    
    page.on('dialog', async dialog => {
      console.log(`✅ Browser dialog detected: ${dialog.type()} - "${dialog.message()}"`);
      await dialog.accept();
    });

    await page.evaluate(() => {
      if (window.alert) {
        window.alert('Test browser alert');
      } else {
        console.log('Browser alert not available');
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test if we can trigger a browser confirm
    console.log('🧪 Testing browser confirm...');
    
    const confirmResult = await page.evaluate(() => {
      if (window.confirm) {
        return window.confirm('Test browser confirm');
      }
      return false;
    });

    console.log('📊 Confirm result:', confirmResult);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Alert availability test complete');
})();