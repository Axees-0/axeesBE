const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔄 Testing role switching with browser alerts...');
  
  // Handle browser alerts/confirms
  page.on('dialog', async dialog => {
    console.log(`🔔 Alert detected: "${dialog.message()}"`);
    console.log(`🔔 Alert type: ${dialog.type()}`);
    
    if (dialog.message().includes('Switch to')) {
      console.log('✅ Confirming role switch...');
      await dialog.accept();
    } else if (dialog.message().includes('Role Switched!')) {
      console.log('🎉 Role switch confirmation received!');
      await dialog.accept();
    } else {
      await dialog.accept();
    }
  });
  
  try {
    // Navigate to profile page
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    // Check initial user state
    const initialUser = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        name: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
              bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        role: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
              bodyText.includes('followers') || bodyText.includes('45K') ? 'Creator' : 'Unknown',
        bodyTextSample: bodyText.substring(0, 200)
      };
    });

    console.log('👤 Initial user state:', initialUser);

    // Step 1: Click role switcher button to open modal
    console.log('\n🖱️ Step 1: Opening role switcher modal...');
    await page.evaluate(() => {
      const touchableElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = getComputedStyle(el);
        return style.cursor === 'pointer' || el.onclick || el.tagName === 'BUTTON';
      });

      const switchElement = touchableElements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Switch Role') || text.includes('🔄');
      });

      if (switchElement) {
        switchElement.click();
      }
    });

    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Select the opposite role in the modal
    console.log('🎯 Step 2: Selecting role in modal...');
    const roleSelection = await page.evaluate((currentRole) => {
      const bodyText = document.body.innerText;
      
      if (!bodyText.includes('Demo Mode: Switch Role')) {
        return { success: false, error: 'Modal not visible' };
      }

      // Find and click the role we want to switch TO
      const allElements = Array.from(document.querySelectorAll('*'));
      
      let targetRole = currentRole === 'Marketer' ? 'creator' : 'marketer';
      let targetEmoji = targetRole === 'creator' ? '🎨' : '💼';
      
      // Find the role card for the target role
      const roleCard = allElements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes(targetEmoji) && 
               text.includes(targetRole === 'creator' ? 'Creator' : 'Marketer') &&
               text.length > 50 && text.length < 1000; // Reasonable size for a card
      });

      if (roleCard) {
        roleCard.click();
        return { 
          success: true, 
          targetRole,
          cardFound: true
        };
      }

      return { success: false, error: 'Target role card not found' };
    }, initialUser.role);

    console.log('🎯 Role selection result:', roleSelection);

    if (!roleSelection.success) {
      console.log('❌ Failed to select role:', roleSelection.error);
      return;
    }

    // Wait a moment for selection to register
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Click the Switch button to trigger the confirmation
    console.log('🔘 Step 3: Clicking Switch button...');
    const switchClick = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      
      const switchButton = allElements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Switch to') && 
               el.tagName !== 'HTML' && 
               text.length < 100;
      });

      if (switchButton) {
        switchButton.click();
        return { success: true, buttonText: switchButton.textContent?.trim() };
      }

      return { success: false, error: 'Switch button not found' };
    });

    console.log('🔘 Switch button result:', switchClick);

    if (!switchClick.success) {
      console.log('❌ Switch button not found:', switchClick.error);
      return;
    }

    // Wait for alerts to be handled and navigation to complete
    console.log('⏳ Waiting for role switch and navigation...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Check final state - might be on a different page now
    const finalCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const currentUrl = window.location.href;
      
      return {
        name: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
              bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        role: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
              bodyText.includes('followers') || bodyText.includes('45K') ? 'Creator' : 'Unknown',
        currentUrl,
        currentPath: window.location.pathname,
        bodyTextSample: bodyText.substring(0, 300),
        title: document.title
      };
    });

    console.log('\n📊 FINAL STATE:');
    console.log('👤 Final user:', finalCheck);

    // Analysis
    console.log('\n📊 ROLE SWITCH ANALYSIS:');
    console.log(`   Initial: ${initialUser.name} (${initialUser.role})`);
    console.log(`   Final:   ${finalCheck.name} (${finalCheck.role})`);
    console.log(`   URL Changed: ${finalCheck.currentPath !== '/profile'}`);

    if (initialUser.role !== finalCheck.role || finalCheck.currentPath !== '/profile') {
      console.log('🎉 SUCCESS! Role switching is working!');
      
      if (finalCheck.role !== initialUser.role) {
        console.log(`✅ User profile changed from ${initialUser.role} to ${finalCheck.role}`);
      }
      
      if (finalCheck.currentPath !== '/profile') {
        console.log(`✅ Navigation occurred to: ${finalCheck.currentPath}`);
        console.log('   (This is expected as role switch includes navigation)');
      }
    } else {
      console.log('❌ No role switch detected');
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Role switch with alerts test complete');
})();