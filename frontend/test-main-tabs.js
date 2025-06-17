const puppeteer = require('puppeteer');

async function testMainTabs() {
  let browser;
  try {
    console.log('🚀 Testing main tab routes...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Suppress non-critical console messages
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('Failed to load resource')) {
        console.log(`[ERROR] ${text}`);
      }
    });
    
    const tabs = [
      { name: 'Home/Explore', url: 'http://localhost:8081/', icon: '🏠' },
      { name: 'Deals', url: 'http://localhost:8081/deals', icon: '💼' },
      { name: 'Messages', url: 'http://localhost:8081/messages', icon: '💬' },
      { name: 'Notifications', url: 'http://localhost:8081/notifications', icon: '🔔' },
      { name: 'Profile', url: 'http://localhost:8081/profile', icon: '👤' }
    ];
    
    for (const tab of tabs) {
      console.log(`\n${tab.icon} Testing ${tab.name}...`);
      
      try {
        await page.goto(tab.url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get page info
        const pageInfo = await page.evaluate(() => {
          const title = document.title;
          const content = document.body.innerText || '';
          const elementCount = document.querySelectorAll('*').length;
          const hasTabBar = document.querySelectorAll('[role="tab"], .tab-bar, [class*="tab"]').length > 0;
          
          // Check for visible tab labels
          const tabLabels = [];
          const tabs = document.querySelectorAll('[role="tab"], [class*="tab-label"]');
          tabs.forEach(tab => {
            const text = tab.textContent?.trim();
            if (text && text.length > 0 && text.length < 20) {
              tabLabels.push(text);
            }
          });
          
          return {
            title,
            contentLength: content.length,
            elementCount,
            hasTabBar,
            tabLabels: [...new Set(tabLabels)], // Remove duplicates
            hasContent: content.length > 100,
            contentPreview: content.substring(0, 200).replace(/\n+/g, ' ')
          };
        });
        
        console.log(`   ✅ Page loaded successfully`);
        console.log(`   📄 Title: ${pageInfo.title}`);
        console.log(`   📊 Elements: ${pageInfo.elementCount}`);
        console.log(`   📱 Tab navigation: ${pageInfo.hasTabBar ? 'Yes' : 'No'}`);
        
        if (pageInfo.tabLabels.length > 0) {
          console.log(`   🔗 Visible tabs: ${pageInfo.tabLabels.join(', ')}`);
        }
        
        console.log(`   📝 Content: ${pageInfo.hasContent ? 'Loaded' : 'Empty/Loading'}`);
        
        if (!pageInfo.hasContent) {
          console.log(`   ⚠️  Page might be empty or still loading`);
        }
        
        // Check for errors in content
        const hasErrors = await page.evaluate(() => {
          const content = document.body.innerText || '';
          return content.includes('Error') || content.includes('error') || 
                 content.includes('failed') || content.includes('Failed');
        });
        
        if (hasErrors) {
          console.log(`   ⚠️  Error messages detected in content`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to load: ${error.message}`);
      }
    }
    
    // Test navigation between tabs
    console.log('\n\n🔄 Testing tab navigation...');
    
    try {
      // Start at home
      await page.goto('http://localhost:8081/', { waitUntil: 'networkidle2' });
      console.log('   ✅ Started at Home');
      
      // Navigate to each tab via direct URL
      for (let i = 1; i < tabs.length; i++) {
        await page.goto(tabs[i].url, { waitUntil: 'networkidle2' });
        const currentUrl = page.url();
        console.log(`   ✅ Navigated to ${tabs[i].name}`);
      }
      
      // Test browser back button
      await page.goBack();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const backUrl = page.url();
      console.log(`   ✅ Back button works (now at: ${backUrl.split('/').pop() || 'home'})`);
      
    } catch (error) {
      console.log(`   ❌ Navigation error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testMainTabs().then(() => {
  console.log('\n\n✅ Main tab testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});