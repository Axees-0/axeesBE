const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔄 Testing COMPLETE role switching flow...');
  
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
              bodyText.includes('followers') ? 'Creator' : 'Unknown',
        bodyTextSample: bodyText.substring(0, 300)
      };
    });

    console.log('👤 Initial user state:', initialUser);

    // Click role switcher button
    console.log('🖱️ Clicking role switcher button...');
    const clickResult = await page.evaluate(() => {
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
        return { success: true };
      }
      return { success: false };
    });

    if (!clickResult.success) {
      console.log('❌ Failed to click role switcher');
      return;
    }

    // Wait for modal
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Modal should be open now');

    // Check modal state and click the opposite role
    const modalInteraction = await page.evaluate((currentRole) => {
      const bodyText = document.body.innerText;
      
      if (!bodyText.includes('Demo Mode: Switch Role')) {
        return { success: false, error: 'Modal not found' };
      }

      // Find role cards
      const allElements = Array.from(document.querySelectorAll('*'));
      
      // Look for Creator or Marketer role cards
      const creatorCard = allElements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Creator') && text.includes('🎨') && text.length < 500;
      });
      
      const marketerCard = allElements.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('Marketer') && text.includes('💼') && text.length < 500;
      });

      // Click the opposite role
      let targetCard = null;
      let targetRole = '';
      
      if (currentRole === 'Marketer' && creatorCard) {
        targetCard = creatorCard;
        targetRole = 'Creator';
      } else if (currentRole === 'Creator' && marketerCard) {
        targetCard = marketerCard;
        targetRole = 'Marketer';
      } else if (creatorCard) {
        // Default to creator if we're not sure
        targetCard = creatorCard;
        targetRole = 'Creator';
      }

      if (targetCard) {
        try {
          targetCard.click();
          return { 
            success: true, 
            targetRole,
            cardText: targetCard.textContent?.substring(0, 100)
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: false, error: 'No suitable role card found' };
    }, initialUser.role);

    console.log('🎯 Modal interaction result:', modalInteraction);

    if (!modalInteraction.success) {
      console.log('❌ Failed to interact with modal:', modalInteraction.error);
      return;
    }

    // Wait a moment for selection
    await new Promise(resolve => setTimeout(resolve, 500));

    // Look for and click the Switch button
    console.log('🔘 Looking for Switch button...');
    const switchButtonClick = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      
      // Look for switch/confirm button
      const switchButton = allElements.find(el => {
        const text = el.textContent?.trim() || '';
        return (text.includes('Switch to') || text === 'Switch') && 
               el.tagName !== 'HTML' && 
               text.length < 100;
      });

      if (switchButton) {
        try {
          switchButton.click();
          return { 
            success: true, 
            buttonText: switchButton.textContent?.trim()
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: false, error: 'Switch button not found' };
    });

    console.log('🔘 Switch button click result:', switchButtonClick);

    if (!switchButtonClick.success) {
      console.log('❌ Failed to click switch button:', switchButtonClick.error);
      return;
    }

    // Wait for role switch to complete
    console.log('⏳ Waiting for role switch to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if user changed
    const finalUser = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        name: bodyText.includes('Sarah Martinez') ? 'Sarah Martinez' : 
              bodyText.includes('Emma Thompson') ? 'Emma Thompson' : 'Unknown',
        role: bodyText.includes('TechStyle Brand') ? 'Marketer' : 
              bodyText.includes('followers') || bodyText.includes('45K') ? 'Creator' : 'Unknown',
        bodyTextSample: bodyText.substring(0, 300),
        currentUrl: window.location.href,
        title: document.title
      };
    });

    console.log('👤 Final user state:', finalUser);

    // Compare initial vs final
    console.log('\n📊 ROLE SWITCH COMPARISON:');
    console.log(`   Initial: ${initialUser.name} (${initialUser.role})`);
    console.log(`   Final:   ${finalUser.name} (${finalUser.role})`);

    if (initialUser.name !== finalUser.name || initialUser.role !== finalUser.role) {
      console.log('🎉 SUCCESS! Role switch completed successfully!');
      console.log(`✅ User switched from ${initialUser.role} to ${finalUser.role}`);
      
      if (finalUser.role === 'Creator') {
        console.log('👨‍🎨 Now viewing as Creator with follower count and engagement metrics');
      } else if (finalUser.role === 'Marketer') {
        console.log('👔 Now viewing as Marketer with company and campaign metrics');
      }
    } else {
      console.log('❌ Role switch did not complete - user profile unchanged');
      console.log('🔍 This might indicate an issue with the role switching logic');
    }

  } catch (error) {
    console.log(`❌ Error during role switch test: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Complete role switch test finished');
})();