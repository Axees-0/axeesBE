const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🎯 Testing precise role switcher button...');
  
  try {
    // Navigate to profile page
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    console.log('📄 Profile page loaded successfully');

    // Look for role switcher button specifically
    const buttonAnalysis = await page.evaluate(() => {
      // Find all buttons and clickable elements
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], div[onclick], span[onclick]'));
      const touchableElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = getComputedStyle(el);
        return style.cursor === 'pointer' || 
               el.onclick || 
               el.getAttribute('role') === 'button' ||
               el.tagName === 'BUTTON';
      });

      // Look for elements with role switch text
      const switchElements = touchableElements.filter(el => {
        const text = el.textContent?.trim() || '';
        const hasRoleText = text.includes('Switch Role') || text.includes('🔄');
        const isReasonableSize = text.length < 100; // Exclude massive elements like HTML
        return hasRoleText && isReasonableSize;
      });

      return {
        totalButtons: buttons.length,
        totalTouchableElements: touchableElements.length,
        switchElements: switchElements.map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          className: el.className,
          id: el.id,
          hasClickHandler: !!el.onclick,
          role: el.getAttribute('role'),
          style: {
            cursor: getComputedStyle(el).cursor,
            pointerEvents: getComputedStyle(el).pointerEvents,
            display: getComputedStyle(el).display
          }
        }))
      };
    });

    console.log('🔍 Button analysis:', buttonAnalysis);

    if (buttonAnalysis.switchElements.length > 0) {
      console.log(`✅ Found ${buttonAnalysis.switchElements.length} role switch element(s)!`);
      
      // Try to click the first switch element
      const clickResult = await page.evaluate(() => {
        const touchableElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = getComputedStyle(el);
          return style.cursor === 'pointer' || 
                 el.onclick || 
                 el.getAttribute('role') === 'button' ||
                 el.tagName === 'BUTTON';
        });

        const switchElement = touchableElements.find(el => {
          const text = el.textContent?.trim() || '';
          const hasRoleText = text.includes('Switch Role') || text.includes('🔄');
          const isReasonableSize = text.length < 100;
          return hasRoleText && isReasonableSize;
        });

        if (switchElement) {
          try {
            // Create a proper click event
            const rect = switchElement.getBoundingClientRect();
            const event = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2
            });
            
            switchElement.dispatchEvent(event);
            
            return { 
              success: true, 
              elementText: switchElement.textContent?.trim().substring(0, 50),
              elementTag: switchElement.tagName 
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        
        return { success: false, error: 'No suitable switch element found' };
      });

      console.log('🖱️ Click result:', clickResult);

      if (clickResult.success) {
        console.log('✅ Successfully clicked role switcher!');
        
        // Wait for potential modal/state change
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for modal or any changes
        const afterClickCheck = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          return {
            hasModalTitle: bodyText.includes('Demo Mode: Switch Role'),
            hasCreatorOption: bodyText.includes('Creator') && bodyText.includes('🎨'),
            hasMarketerOption: bodyText.includes('Marketer') && bodyText.includes('💼'),
            hasModal: !!document.querySelector('[class*="modal"]') || 
                     !!document.querySelector('[style*="position: fixed"]') ||
                     bodyText.includes('Demo Mode: Switch Role'),
            pageChanges: document.title,
            bodyTextSample: bodyText.substring(0, 200)
          };
        });

        console.log('📱 After click check:', afterClickCheck);

        if (afterClickCheck.hasModal || afterClickCheck.hasModalTitle) {
          console.log('🎉 SUCCESS! Role switcher functionality is working!');
        } else {
          console.log('⚠️ Click succeeded but no modal detected. Checking for navigation...');
        }
      } else {
        console.log('❌ Failed to click:', clickResult.error);
      }
    } else {
      console.log('❌ No role switch elements found');
      console.log('💡 Available buttons found:', buttonAnalysis.totalButtons);
      console.log('💡 Total touchable elements:', buttonAnalysis.totalTouchableElements);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Precise button test complete');
})();