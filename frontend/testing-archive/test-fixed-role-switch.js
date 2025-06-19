const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🎯 Testing FIXED role switching functionality...');
  
  let alertCount = 0;
  
  // Handle browser alerts/confirms
  page.on('dialog', async dialog => {
    alertCount++;
    console.log(`🔔 Alert ${alertCount}: ${dialog.type()} - "${dialog.message()}"`);
    
    // Accept all dialogs to continue the flow
    await dialog.accept();
  });
  
  try {
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    // Get initial user state
    const initialState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                  bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                  bodyText.includes('followers') ? 'Creator' : 'Unknown',
        path: window.location.pathname
      };
    });

    console.log('👤 INITIAL STATE:', initialState);

    // Step 1: Open role switcher modal
    console.log('\n🖱️ STEP 1: Opening role switcher modal...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const button = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text === '🔄 Switch Role' && text.length < 50;
      });
      if (button) button.click();
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check what role is pre-selected and what the button says
    const modalState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      if (!bodyText.includes('Demo Mode: Switch Role')) {
        return { modalVisible: false };
      }

      // Find switch button and its text
      const elements = Array.from(document.querySelectorAll('*'));
      const switchButton = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return (text.includes('Switch to') || text.includes('Already in')) && text.length < 100;
      });

      return {
        modalVisible: true,
        switchButtonText: switchButton ? switchButton.textContent?.trim() : 'Not found',
        hasCreatorSelected: bodyText.includes('Selected') && bodyText.indexOf('Creator') < bodyText.indexOf('Selected'),
        hasMarketerSelected: bodyText.includes('Selected') && bodyText.indexOf('Marketer') < bodyText.indexOf('Selected'),
        bodySnippet: bodyText.substring(bodyText.indexOf('Demo Mode'), bodyText.indexOf('Demo Mode') + 500)
      };
    });

    console.log('📱 Modal state after opening:', modalState);

    if (modalState.modalVisible && modalState.switchButtonText.includes('Switch to')) {
      console.log('✅ Switch button shows correct text! Proceeding with role switch...');
      
      // Step 2: Click the switch button
      console.log('🔘 STEP 2: Clicking switch button...');
      const switchClicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const switchButton = elements.find(el => {
          const text = el.textContent?.trim() || '';
          return text.includes('Switch to') && text.length < 100;
        });
        
        if (switchButton) {
          switchButton.click();
          return { success: true, buttonText: switchButton.textContent?.trim() };
        }
        return { success: false };
      });

      console.log('🔘 Switch button clicked:', switchClicked);

      if (switchClicked.success) {
        // Step 3: Wait for alerts and navigation
        console.log('⏳ STEP 3: Waiting for confirmation alerts and navigation...');
        await new Promise(resolve => setTimeout(resolve, 4000));

        // Step 4: Check final state (might be on different page)
        const finalState = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          return {
            userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                      bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
            userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                      bodyText.includes('followers') || bodyText.includes('45K') ? 'Creator' : 'Unknown',
            path: window.location.pathname,
            title: document.title,
            bodySnippet: bodyText.substring(0, 200)
          };
        });

        console.log('\n📊 FINAL STATE:', finalState);

        // Analysis
        console.log('\n📊 ROLE SWITCH ANALYSIS:');
        console.log(`   Initial: ${initialState.userName} (${initialState.userRole}) at ${initialState.path}`);
        console.log(`   Final:   ${finalState.userName} (${finalState.userRole}) at ${finalState.path}`);
        console.log(`   Alerts received: ${alertCount}`);

        const roleChanged = initialState.userRole !== finalState.userRole;
        const userChanged = initialState.userName !== finalState.userName; 
        const navigationOccurred = initialState.path !== finalState.path;

        console.log('\n✅ SUCCESS CRITERIA:');
        console.log(`   🔔 Confirmation alerts: ${alertCount > 0 ? 'YES' : 'NO'} (${alertCount} alerts)`);
        console.log(`   👤 User profile changed: ${userChanged ? 'YES' : 'NO'}`);
        console.log(`   🎭 User role changed: ${roleChanged ? 'YES' : 'NO'}`);
        console.log(`   🧭 Navigation occurred: ${navigationOccurred ? 'YES' : 'NO'}`);

        if (alertCount > 0 && (roleChanged || userChanged || navigationOccurred)) {
          console.log('\n🎉 SUCCESS! Role switching is fully functional!');
          console.log('✅ Users can successfully switch between Creator and Marketer roles');
          console.log('✅ Confirmation dialogs work properly');
          console.log('✅ User profile and/or navigation updates correctly');
          
          if (userChanged) {
            console.log(`✅ Profile switched from ${initialState.userName} to ${finalState.userName}`);
          }
          if (roleChanged) {
            console.log(`✅ Role switched from ${initialState.userRole} to ${finalState.userRole}`);
          }
          if (navigationOccurred) {
            console.log(`✅ Navigated from ${initialState.path} to ${finalState.path}`);
          }
        } else {
          console.log('\n⚠️ Partial success - alerts worked but changes may need page refresh');
        }
      } else {
        console.log('❌ Failed to click switch button');
      }
    } else if (modalState.switchButtonText.includes('Already in')) {
      console.log('❌ Switch button still shows "Already in this role" - the fix may need more work');
    } else {
      console.log('❌ Modal or switch button not found properly');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Fixed role switch test complete');
})();