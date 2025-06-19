const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Debugging switch button click behavior...');
  
  // Track all console messages from the page
  page.on('console', msg => {
    console.log(`📝 Page console: ${msg.text()}`);
  });

  // Track all alerts/confirms/prompts
  page.on('dialog', async dialog => {
    console.log(`🔔 Dialog: ${dialog.type()} - "${dialog.message()}"`);
    await dialog.accept();
  });
  
  try {
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    console.log('📄 Profile page loaded');

    // Step 1: Open modal
    console.log('\n🖱️ Opening role switcher modal...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const button = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text === '🔄 Switch Role' && text.length < 50;
      });
      if (button) {
        console.log('Found and clicking role switcher button');
        button.click();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Analyze the switch button in detail
    const buttonAnalysis = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const switchButton = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Switch to') && text.length < 100;
      });

      if (switchButton) {
        const style = getComputedStyle(switchButton);
        return {
          found: true,
          text: switchButton.textContent?.trim(),
          tagName: switchButton.tagName,
          disabled: switchButton.disabled || switchButton.getAttribute('disabled'),
          pointerEvents: style.pointerEvents,
          opacity: style.opacity,
          hasOnClick: !!switchButton.onclick,
          classList: Array.from(switchButton.classList || []),
          parentText: switchButton.parentElement?.textContent?.substring(0, 100)
        };
      }

      return { found: false };
    });

    console.log('🔘 Switch button analysis:', buttonAnalysis);

    if (buttonAnalysis.found) {
      // Step 3: Try clicking with explicit event creation
      console.log('🖱️ Attempting to click switch button with detailed event...');
      
      const clickResult = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const switchButton = elements.find(el => {
          const text = el.textContent?.trim() || '';
          return text.includes('Switch to') && text.length < 100;
        });

        if (switchButton) {
          try {
            // Add console logging to see if click is registered
            console.log('About to click switch button:', switchButton.textContent?.trim());
            
            // Try multiple click methods
            switchButton.click();
            
            // Also try manual event dispatch
            const event = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            switchButton.dispatchEvent(event);
            
            // Try touch events for mobile compatibility
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true
            });
            switchButton.dispatchEvent(touchEvent);
            
            console.log('Successfully executed click events on switch button');
            
            return { 
              success: true, 
              buttonText: switchButton.textContent?.trim(),
              clickExecuted: true
            };
          } catch (error) {
            console.log('Error clicking switch button:', error.message);
            return { success: false, error: error.message };
          }
        }

        return { success: false, error: 'Switch button not found' };
      });

      console.log('✅ Click execution result:', clickResult);

      if (clickResult.success) {
        // Step 4: Wait and check for any changes
        console.log('⏳ Waiting for any changes or alerts...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        const afterClick = await page.evaluate(() => {
          return {
            currentUrl: window.location.href,
            currentPath: window.location.pathname,
            bodyHasModal: document.body.innerText.includes('Demo Mode: Switch Role'),
            pageTitle: document.title,
            anyErrors: window.console?.errors || []
          };
        });

        console.log('📊 After click state:', afterClick);
      }
    } else {
      console.log('❌ Switch button not found');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Switch button click debugging complete');
})();