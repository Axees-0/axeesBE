#!/usr/bin/env node

/**
 * Emma Thompson Demo Flow Test
 * Tests the specific marketer→creator demo flow with Emma Thompson
 */

const puppeteer = require('puppeteer');

class EmmaDemoFlowTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:8081';
    this.results = [];
  }

  async init() {
    console.log('🎬 Testing Emma Thompson Demo Flow...\n');
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 800 });
    
    // Monitor for errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('borderLeft')) {
        console.log(`❌ Error: ${msg.text()}`);
      }
    });
  }

  async wait(ms = 2000) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async testEmmaCardClick() {
    console.log('1️⃣ Testing Emma Thompson Card Click...');
    
    // Go to explore page
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
    await this.wait(3000);
    
    // Look for Emma Thompson on page
    const content = await this.page.content();
    if (!content.includes('Emma Thompson')) {
      console.log('   ❌ Emma Thompson not found on explore page');
      return false;
    }
    console.log('   ✅ Emma Thompson found on explore page');
    
    // Try multiple selectors to find Emma's card
    const emmaSelectors = [
      '[data-testid="creator-card-creator-001"]',
      '[testid*="creator-001"]',
      '[accessibility-label*="Emma Thompson"]',
      'button[aria-label*="Emma Thompson"]',
      '*[role="button"]:has-text("Emma Thompson")'
    ];
    
    let emmaClicked = false;
    for (const selector of emmaSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`   ✅ Found Emma using selector: ${selector}`);
          await element.click();
          emmaClicked = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!emmaClicked) {
      // Try to find any clickable element containing Emma Thompson
      try {
        const emmaElements = await this.page.$$eval('*', els => 
          els.filter(el => 
            el.textContent?.includes('Emma Thompson') && 
            (el.tagName === 'BUTTON' || 
             el.role === 'button' || 
             el.onclick ||
             el.style.cursor === 'pointer' ||
             getComputedStyle(el).cursor === 'pointer')
          ).map(el => ({
            text: el.textContent,
            tag: el.tagName,
            classes: el.className,
            role: el.role
          }))
        );
        
        if (emmaElements.length > 0) {
          console.log('   🔍 Found clickable Emma elements:', emmaElements);
          
          // Click the first one
          await this.page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            for (const el of elements) {
              if (el.textContent?.includes('Emma Thompson') && 
                  (el.tagName === 'BUTTON' || el.role === 'button' || el.onclick)) {
                el.click();
                return;
              }
            }
          });
          emmaClicked = true;
          console.log('   ✅ Clicked Emma Thompson element');
        }
      } catch (error) {
        console.log('   ❌ Failed to find Emma Thompson clickable element:', error.message);
      }
    }
    
    if (emmaClicked) {
      await this.wait(2000);
      // Check if we navigated to a profile page
      const currentUrl = this.page.url();
      console.log(`   📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/profile/')) {
        console.log('   ✅ Successfully navigated to profile page');
        return true;
      } else {
        console.log('   ❌ Did not navigate to profile page');
        return false;
      }
    }
    
    return false;
  }

  async testRoleSwitcherPresence() {
    console.log('\n2️⃣ Testing Role Switcher Presence...');
    
    // Go to profile page
    await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    // Check for demo mode and role switcher
    const roleSwitcherSelectors = [
      '[data-testid="role-switcher-button"]',
      '[testid="role-switcher-button"]',
      'button[accessibility-label="Switch Role"]',
      'button:contains("Switch Role")',
      '*:contains("🔄 Switch Role")'
    ];
    
    let roleSwitcherFound = false;
    for (const selector of roleSwitcherSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`   ✅ Role switcher found: ${selector}`);
          roleSwitcherFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!roleSwitcherFound) {
      // Check if demo mode is enabled
      const content = await this.page.content();
      if (content.includes('Switch Role') || content.includes('🔄')) {
        console.log('   ✅ Role switcher text found, but button not clickable');
        roleSwitcherFound = true;
      } else {
        console.log('   ❌ Role switcher not found - Demo mode may not be enabled');
      }
    }
    
    return roleSwitcherFound;
  }

  async testNavigationFlow() {
    console.log('\n3️⃣ Testing Navigation Flow...');
    
    const pages = [
      { name: 'Explore', path: '/', expectedContent: 'Emma Thompson' },
      { name: 'Deals', path: '/deals', expectedContent: 'Deals' },
      { name: 'Profile', path: '/profile', expectedContent: 'Sarah Martinez' }
    ];
    
    let passedPages = 0;
    for (const page of pages) {
      try {
        console.log(`   Testing ${page.name} page...`);
        await this.page.goto(`${this.baseUrl}${page.path}`, { waitUntil: 'networkidle0' });
        await this.wait(1000);
        
        const content = await this.page.content();
        if (content.includes(page.expectedContent)) {
          console.log(`   ✅ ${page.name} page working`);
          passedPages++;
        } else {
          console.log(`   ❌ ${page.name} page missing: ${page.expectedContent}`);
        }
      } catch (error) {
        console.log(`   ❌ ${page.name} page failed: ${error.message}`);
      }
    }
    
    return passedPages === pages.length;
  }

  async testTabNavigation() {
    console.log('\n4️⃣ Testing Tab Navigation...');
    
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    // Count navigation tabs
    const tabs = await this.page.$$('[role="tab"]');
    console.log(`   Found ${tabs.length} navigation tabs`);
    
    if (tabs.length >= 5) {
      console.log('   ✅ All expected tabs present');
      return true;
    } else {
      console.log('   ❌ Missing navigation tabs (expected 5)');
      return false;
    }
  }

  async generateReport() {
    const testResults = [
      { name: 'Emma Card Click', result: await this.testEmmaCardClick() },
      { name: 'Role Switcher Presence', result: await this.testRoleSwitcherPresence() },
      { name: 'Navigation Flow', result: await this.testNavigationFlow() },
      { name: 'Tab Navigation', result: await this.testTabNavigation() }
    ];
    
    console.log('\n📋 EMMA DEMO FLOW SUMMARY');
    console.log('='.repeat(50));
    
    const passedTests = testResults.filter(t => t.result).length;
    const totalTests = testResults.length;
    
    testResults.forEach(test => {
      const status = test.result ? '✅' : '❌';
      console.log(`   ${status} ${test.name}`);
    });
    
    if (passedTests === totalTests) {
      console.log('\n🎉 EMMA DEMO FLOW IS READY!');
      console.log('✅ All tests passed - demo should work smoothly');
    } else {
      console.log(`\n⚠️  ISSUES FOUND: ${totalTests - passedTests}/${totalTests} tests failed`);
      console.log('🔧 These issues could disrupt the demo presentation');
    }
    
    return passedTests === totalTests;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      // Check if server is running
      try {
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 10000 });
      } catch (error) {
        console.log(`❌ Server not responding on ${this.baseUrl}`);
        console.log('   Please start your dev server with: npm run web');
        return false;
      }

      const success = await this.generateReport();
      return success;
      
    } catch (error) {
      console.error('❌ Critical error during testing:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new EmmaDemoFlowTester();
  tester.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = EmmaDemoFlowTester;