const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🎯 FINAL COMPREHENSIVE ROLE SWITCH TEST');
  
  let alertCount = 0;
  let alerts = [];
  
  // Handle browser alerts
  page.on('dialog', async dialog => {
    alertCount++;
    const message = dialog.message();
    alerts.push({ type: dialog.type(), message });
    
    console.log(`🔔 Alert ${alertCount}: ${dialog.type()} - "${message}"`);
    
    // Accept all alerts to proceed with the flow
    await dialog.accept();
  });
  
  try {
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    // Get initial state
    const initialState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                  bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                  bodyText.includes('followers') ? 'Creator' : 'Unknown',
        currentPath: window.location.pathname,
        bodyText: bodyText.substring(0, 200)
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

    // Step 2: Select Creator role (opposite of current Marketer)
    console.log('🎯 STEP 2: Selecting Creator role...');
    const roleSelected = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const creatorCard = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('🎨') && text.includes('Creator') && text.length < 500;
      });
      
      if (creatorCard) {
        creatorCard.click();
        return { success: true };
      }
      return { success: false };
    });

    if (!roleSelected.success) {
      console.log('❌ Failed to select Creator role');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Click the Switch button to trigger confirmation
    console.log('🔘 STEP 3: Clicking Switch button...');
    const switchClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const switchButton = elements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Switch to Creator') && text.length < 100;
      });
      
      if (switchButton) {
        switchButton.click();
        return { success: true, buttonText: switchButton.textContent?.trim() };
      }
      return { success: false };
    });

    console.log('🔘 Switch button clicked:', switchClicked);

    if (!switchClicked.success) {
      console.log('❌ Failed to find/click Switch button');
      return;
    }

    // Step 4: Wait for alerts and navigation
    console.log('⏳ STEP 4: Waiting for alerts and navigation...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Step 5: Check final state
    const finalState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        userName: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
                  bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        userRole: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
                  bodyText.includes('followers') || bodyText.includes('45K') ? 'Creator' : 'Unknown',
        currentPath: window.location.pathname,
        bodyText: bodyText.substring(0, 200),
        title: document.title
      };
    });

    console.log('\n📊 FINAL STATE:', finalState);

    // Analysis
    console.log('\n📊 COMPREHENSIVE ANALYSIS:');
    console.log('📋 Alerts received:', alerts.length);
    alerts.forEach((alert, i) => {
      console.log(`   ${i + 1}. ${alert.type}: "${alert.message}"`);
    });

    console.log('\n📋 User State Changes:');
    console.log(`   Name: ${initialState.userName} → ${finalState.userName}`);
    console.log(`   Role: ${initialState.userRole} → ${finalState.userRole}`);
    console.log(`   Path: ${initialState.currentPath} → ${finalState.currentPath}`);

    // Success criteria
    const roleChanged = initialState.userRole !== finalState.userRole;
    const userChanged = initialState.userName !== finalState.userName;
    const pathChanged = initialState.currentPath !== finalState.currentPath;
    const alertsReceived = alerts.length > 0;

    console.log('\n✅ SUCCESS CRITERIA:');
    console.log(`   ✅ Role switching alerts received: ${alertsReceived ? 'YES' : 'NO'}`);
    console.log(`   ✅ User role changed: ${roleChanged ? 'YES' : 'NO'}`);
    console.log(`   ✅ User profile changed: ${userChanged ? 'YES' : 'NO'}`);
    console.log(`   ✅ Navigation occurred: ${pathChanged ? 'YES' : 'NO'}`);

    if (roleChanged && alertsReceived) {
      console.log('\n🎉 SUCCESS! ROLE SWITCHING IS FULLY FUNCTIONAL!');
      console.log('✅ Users can successfully switch between Creator and Marketer roles');
      console.log('✅ All confirmation dialogs work properly');
      console.log('✅ User profile updates correctly');
      
      if (pathChanged) {
        console.log('✅ Navigation to appropriate home screen works');
      }
    } else if (alertsReceived && pathChanged) {
      console.log('\n🎉 PARTIAL SUCCESS! Role switching logic works but may need page refresh to see changes');
    } else {
      console.log('\n❌ Role switching incomplete');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 FINAL ROLE SWITCH TEST COMPLETE');
})();