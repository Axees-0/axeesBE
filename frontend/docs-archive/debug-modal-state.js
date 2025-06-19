const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Debugging modal state step by step...');
  
  try {
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    console.log('📄 Profile page loaded');

    // Step 1: Check initial state
    const beforeClick = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasRoleSwitcher: bodyText.includes('Switch Role'),
        hasModal: bodyText.includes('Demo Mode: Switch Role'),
        bodyLength: bodyText.length,
        firstLines: bodyText.split('\n').slice(0, 10)
      };
    });
    console.log('📋 Before click:', beforeClick);

    // Step 2: Click and immediately check
    console.log('🖱️ Clicking role switcher...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const button = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text === '🔄 Switch Role' && text.length < 50;
      });
      if (button) {
        console.log('Found button, clicking...');
        button.click();
      }
    });

    // Step 3: Check immediately after click
    const immediatelyAfter = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasModal: bodyText.includes('Demo Mode: Switch Role'),
        hasCreatorOption: bodyText.includes('Creator') && bodyText.includes('🎨'),
        hasMarketerOption: bodyText.includes('Marketer') && bodyText.includes('💼'),
        bodyLength: bodyText.length,
        modalKeywords: [
          bodyText.includes('Demo Mode'),
          bodyText.includes('Switch Role'),
          bodyText.includes('Creator'),
          bodyText.includes('Marketer'),
          bodyText.includes('🎨'),
          bodyText.includes('💼')
        ]
      };
    });
    console.log('📋 Immediately after click:', immediatelyAfter);

    // Step 4: Wait and check again
    await new Promise(resolve => setTimeout(resolve, 500));
    const after500ms = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasModal: bodyText.includes('Demo Mode: Switch Role'),
        hasCreatorOption: bodyText.includes('Creator') && bodyText.includes('🎨'),
        bodyLength: bodyText.length
      };
    });
    console.log('📋 After 500ms:', after500ms);

    // Step 5: Wait more and check again  
    await new Promise(resolve => setTimeout(resolve, 1500));
    const after2seconds = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasModal: bodyText.includes('Demo Mode: Switch Role'),
        bodyLength: bodyText.length,
        currentContent: bodyText.substring(0, 200)
      };
    });
    console.log('📋 After 2 seconds:', after2seconds);

    // If modal is visible, try to interact with it
    if (after2seconds.hasModal) {
      console.log('✅ Modal is persistent! Trying to interact...');
      
      const interaction = await page.evaluate(() => {
        // Look for creator role option
        const elements = Array.from(document.querySelectorAll('*'));
        const creatorCard = elements.find(el => {
          const text = el.textContent?.trim() || '';
          return text.includes('🎨') && text.includes('Creator') && text.length < 500;
        });
        
        if (creatorCard) {
          try {
            creatorCard.click();
            return { success: true, action: 'clicked creator card' };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
        
        return { success: false, error: 'Creator card not found' };
      });
      
      console.log('🎯 Interaction result:', interaction);
    } else {
      console.log('❌ Modal not persistent - investigating why...');
      
      // Check for any error messages or console logs
      const logs = await page.evaluate(() => {
        return {
          errors: window.console?.errors || [],
          windowLocation: window.location.href,
          reactErrors: window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot || 'Not available'
        };
      });
      console.log('🔍 Debug info:', logs);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Modal state debugging complete');
})();