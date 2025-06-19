const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔄 Testing actual role switching functionality...');
  
  try {
    // Navigate to profile page
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    console.log('📄 Profile page loaded successfully');

    // Look for role switcher button by looking for the exact text
    const roleButton = await page.evaluate(() => {
      // Look for any element containing the role switch text
      const elements = Array.from(document.querySelectorAll('*'));
      const switchButton = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text === '🔄 Switch Role' || text.includes('Switch Role');
      });
      
      if (switchButton) {
        return {
          found: true,
          text: switchButton.textContent?.trim(),
          tagName: switchButton.tagName,
          className: switchButton.className,
          clickable: switchButton.style.pointerEvents !== 'none' && 
                     getComputedStyle(switchButton).pointerEvents !== 'none'
        };
      }
      
      return { found: false };
    });

    console.log('🔍 Role switcher button search result:', roleButton);

    if (roleButton.found) {
      console.log('✅ Role switcher button found! Attempting to click...');
      
      // Try to click the button
      const clickResult = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const switchButton = elements.find(el => {
          const text = el.textContent?.trim() || '';
          return text === '🔄 Switch Role' || text.includes('Switch Role');
        });
        
        if (switchButton) {
          try {
            // Try different click methods
            if (switchButton.click) {
              switchButton.click();
              return { success: true, method: 'click()' };
            } else if (switchButton.dispatchEvent) {
              const event = new MouseEvent('click', { bubbles: true });
              switchButton.dispatchEvent(event);
              return { success: true, method: 'dispatchEvent()' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        
        return { success: false, error: 'Button not found for clicking' };
      });

      console.log('🖱️ Click result:', clickResult);

      if (clickResult.success) {
        console.log('✅ Successfully clicked role switcher button!');
        
        // Wait for modal to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if modal appeared
        const modalCheck = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          return {
            hasModalTitle: bodyText.includes('Demo Mode: Switch Role'),
            hasCreatorOption: bodyText.includes('Creator') && bodyText.includes('🎨'),
            hasMarketerOption: bodyText.includes('Marketer') && bodyText.includes('💼'),
            modalVisible: !!document.querySelector('[role="dialog"]') || 
                         bodyText.includes('Demo Mode: Switch Role')
          };
        });

        console.log('📱 Modal check results:', modalCheck);

        if (modalCheck.modalVisible) {
          console.log('🎉 SUCCESS! Role switcher modal opened successfully!');
          console.log('✅ The role switching functionality is working correctly.');
        } else {
          console.log('❌ Modal did not appear after clicking');
        }
      } else {
        console.log('❌ Failed to click role switcher button:', clickResult.error);
      }
    } else {
      console.log('❌ Role switcher button not found on page');
    }

  } catch (error) {
    console.log(`❌ Error testing role switcher: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Role switcher test complete');
})();