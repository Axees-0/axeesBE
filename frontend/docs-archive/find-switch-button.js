const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Finding the exact Switch button...');
  
  try {
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    // Step 1: Open modal
    console.log('🖱️ Opening modal...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const button = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text === '🔄 Switch Role' && text.length < 50;
      });
      if (button) button.click();
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Check all available buttons in modal
    const allButtons = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      if (!bodyText.includes('Demo Mode: Switch Role')) {
        return { modalVisible: false };
      }

      const elements = Array.from(document.querySelectorAll('*'));
      const clickableElements = elements.filter(el => {
        const style = getComputedStyle(el);
        return style.cursor === 'pointer' || 
               el.onclick || 
               el.tagName === 'BUTTON' ||
               el.getAttribute('role') === 'button';
      });

      const buttons = clickableElements.map(el => ({
        tagName: el.tagName,
        text: el.textContent?.trim().substring(0, 100),
        className: el.className,
        hasOnClick: !!el.onclick,
        isVisible: getComputedStyle(el).display !== 'none'
      })).filter(btn => btn.text && btn.text.length > 0 && btn.text.length < 200);

      return {
        modalVisible: true,
        totalButtons: buttons.length,
        buttons: buttons
      };
    });

    console.log('🔍 All buttons found:', allButtons);

    if (allButtons.modalVisible) {
      // Step 3: Select creator role and check button text changes
      console.log('🎯 Selecting Creator role...');
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const creatorCard = elements.find(el => {
          const text = el.textContent?.trim() || '';
          return text.includes('🎨') && text.includes('Creator') && text.length < 500;
        });
        if (creatorCard) creatorCard.click();
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Check button text after selection
      const afterSelection = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const clickableElements = elements.filter(el => {
          const style = getComputedStyle(el);
          return style.cursor === 'pointer' || el.onclick || el.tagName === 'BUTTON';
        });

        const switchButtons = clickableElements.filter(el => {
          const text = el.textContent?.trim() || '';
          return text.includes('Switch') && text.length < 100;
        }).map(el => ({
          text: el.textContent?.trim(),
          tagName: el.tagName,
          className: el.className,
          disabled: el.disabled || el.getAttribute('disabled'),
          style: {
            pointerEvents: getComputedStyle(el).pointerEvents,
            opacity: getComputedStyle(el).opacity
          }
        }));

        return {
          switchButtons,
          allTextContainingSwitch: elements.filter(el => 
            el.textContent?.includes('Switch')
          ).map(el => el.textContent?.trim().substring(0, 100))
        };
      });

      console.log('🔘 After selecting Creator:', afterSelection);

      // Step 5: Try to click the switch button
      if (afterSelection.switchButtons.length > 0) {
        console.log('🖱️ Attempting to click switch button...');
        
        const clickResult = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const switchButton = elements.find(el => {
            const text = el.textContent?.trim() || '';
            return text.includes('Switch to') && text.length < 100;
          });

          if (switchButton) {
            try {
              switchButton.click();
              return { 
                success: true, 
                buttonText: switchButton.textContent?.trim(),
                wasDisabled: switchButton.disabled || switchButton.getAttribute('disabled')
              };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }

          return { success: false, error: 'Button not found' };
        });

        console.log('✅ Click result:', clickResult);
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Switch button investigation complete');
})();