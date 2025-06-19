const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('🔍 Testing Role Switcher functionality...');
  
  try {
    // Navigate to profile page
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('body', { timeout: 5000 });

    const profileAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      return {
        totalElements: document.querySelectorAll('*').length,
        hasProfile: bodyText.includes('Profile'),
        hasRoleSwitcher: bodyText.includes('Switch Role') || bodyText.includes('🔄'),
        currentRole: (() => {
          if (bodyText.includes('Creator') && bodyText.includes('followers')) {
            return 'Creator';
          } else if (bodyText.includes('Marketer') || bodyText.includes('Brand')) {
            return 'Marketer';
          } else {
            return 'Unknown';
          }
        })(),
        hasDemoMode: bodyText.includes('Demo') || bodyText.includes('DEMO'),
        roleSwitchButtonText: (() => {
          const buttons = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent?.includes('Switch Role') || el.textContent?.includes('🔄')
          );
          return buttons.length > 0 ? buttons[0].textContent : 'Button not found';
        })(),
        content: bodyText.substring(0, 500).replace(/\s+/g, ' ').trim()
      };
    });

    console.log('✅ Profile Page Analysis:');
    console.log(`   Total elements: ${profileAnalysis.totalElements}`);
    console.log(`   Has profile content: ${profileAnalysis.hasProfile}`);
    console.log(`   Has role switcher: ${profileAnalysis.hasRoleSwitcher}`);
    console.log(`   Current role: ${profileAnalysis.currentRole}`);
    console.log(`   Demo mode: ${profileAnalysis.hasDemoMode}`);
    console.log(`   Role switch button: "${profileAnalysis.roleSwitchButtonText}"`);
    console.log(`   Content preview: "${profileAnalysis.content}"`);

    // Try to click the role switcher button if it exists
    if (profileAnalysis.hasRoleSwitcher) {
      console.log('\n🔄 Attempting to click role switcher...');
      
      const switcherClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent?.includes('Switch Role') || el.textContent?.includes('🔄')
        );
        if (buttons.length > 0) {
          buttons[0].click();
          return true;
        }
        return false;
      });

      if (switcherClicked) {
        console.log('✅ Role switcher button clicked');
        
        // Wait a moment for modal to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const modalAnalysis = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          return {
            hasModal: bodyText.includes('Demo Mode: Switch Role'),
            hasCreatorOption: bodyText.includes('Creator') && bodyText.includes('🎨'),
            hasMarketerOption: bodyText.includes('Marketer') && bodyText.includes('💼'),
            modalContent: bodyText.includes('Demo Mode: Switch Role') ? 
              bodyText.substring(bodyText.indexOf('Demo Mode: Switch Role'), bodyText.indexOf('Demo Mode: Switch Role') + 300) : 
              'Modal not found'
          };
        });

        console.log('📱 Modal Analysis:');
        console.log(`   Modal visible: ${modalAnalysis.hasModal}`);
        console.log(`   Has creator option: ${modalAnalysis.hasCreatorOption}`);
        console.log(`   Has marketer option: ${modalAnalysis.hasMarketerOption}`);
        console.log(`   Modal content: "${modalAnalysis.modalContent}"`);
      } else {
        console.log('❌ Failed to click role switcher button');
      }
    } else {
      console.log('❌ Role switcher button not found');
    }

  } catch (error) {
    console.log(`❌ Error testing role switcher: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Role switcher test complete');
})();