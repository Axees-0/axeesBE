#!/usr/bin/env node

/**
 * Simplified Demo Flow Testing - Focus on Critical Demo Blockers
 * Tests essential demo functionality for live presentation
 */

const puppeteer = require('puppeteer');

class SimpleDemoTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:8081';
    this.results = [];
    this.blockers = [];
  }

  async init() {
    console.log('🎬 Testing Critical Demo Flows...\n');
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 800 });
    
    // Monitor critical errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('borderLeft')) {
        console.log(`❌ Error: ${msg.text()}`);
        this.blockers.push(`Console Error: ${msg.text()}`);
      }
    });
  }

  async wait(ms = 2000) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async testPageLoads() {
    console.log('1️⃣ Testing Page Loads...');
    
    const pages = [
      { name: 'Home/Explore', path: '/', expectedContent: 'Emma Thompson' },
      { name: 'Deals', path: '/deals', expectedContent: 'Deals' },
      { name: 'Messages', path: '/messages', expectedContent: 'Messages' },
      { name: 'Notifications', path: '/notifications', expectedContent: 'Notifications' },
      { name: 'Profile', path: '/profile', expectedContent: 'Sarah Martinez' }
    ];

    let passedPages = 0;
    for (const page of pages) {
      try {
        console.log(`   Testing ${page.name}...`);
        await this.page.goto(`${this.baseUrl}${page.path}`, { waitUntil: 'networkidle0' });
        await this.wait(1000);
        
        const content = await this.page.content();
        if (content.includes(page.expectedContent)) {
          console.log(`   ✅ ${page.name} loads correctly`);
          passedPages++;
        } else {
          console.log(`   ❌ ${page.name} missing content: ${page.expectedContent}`);
          this.blockers.push(`${page.name} page missing expected content`);
        }
      } catch (error) {
        console.log(`   ❌ ${page.name} failed to load: ${error.message}`);
        this.blockers.push(`${page.name} page failed to load`);
      }
    }
    
    this.results.push({
      test: 'Page Loads',
      passed: passedPages,
      total: pages.length,
      success: passedPages === pages.length
    });
  }

  async testNavigation() {
    console.log('\n2️⃣ Testing Navigation...');
    
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    // Check if tab navigation exists
    const tabList = await this.page.$('[role="tablist"]');
    if (!tabList) {
      console.log('   ❌ Tab navigation not found');
      this.blockers.push('Critical: Tab navigation system missing');
      this.results.push({ test: 'Navigation', success: false, error: 'Tab navigation missing' });
      return;
    }

    // Test tab navigation
    const tabs = await this.page.$$('[role="tab"]');
    console.log(`   Found ${tabs.length} navigation tabs`);
    
    if (tabs.length < 5) {
      console.log('   ❌ Missing navigation tabs (expected 5)');
      this.blockers.push('Missing navigation tabs - incomplete tab structure');
      this.results.push({ test: 'Navigation', success: false, error: 'Incomplete tab structure' });
      return;
    }

    // Test clicking tabs
    let workingTabs = 0;
    for (let i = 0; i < Math.min(tabs.length, 5); i++) {
      try {
        await tabs[i].click();
        await this.wait(1000);
        workingTabs++;
      } catch (error) {
        console.log(`   ❌ Tab ${i + 1} click failed: ${error.message}`);
      }
    }
    
    console.log(`   ✅ ${workingTabs}/${tabs.length} tabs working`);
    this.results.push({
      test: 'Navigation',
      passed: workingTabs,
      total: tabs.length,
      success: workingTabs >= 5
    });
  }

  async testDemoData() {
    console.log('\n3️⃣ Testing Demo Data...');
    
    // Test creator data on explore page
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    const demoCreators = ['Emma Thompson', 'Marcus Johnson', 'Sofia Rodriguez'];
    const content = await this.page.content();
    
    let foundCreators = 0;
    for (const creator of demoCreators) {
      if (content.includes(creator)) {
        foundCreators++;
        console.log(`   ✅ Found creator: ${creator}`);
      } else {
        console.log(`   ❌ Missing creator: ${creator}`);
        this.blockers.push(`Demo creator missing: ${creator}`);
      }
    }
    
    // Test marketer profile data
    await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    const profileContent = await this.page.content();
    const profileData = ['Sarah Martinez', 'TechStyle Brand'];
    
    let foundProfileData = 0;
    for (const data of profileData) {
      if (profileContent.includes(data)) {
        foundProfileData++;
        console.log(`   ✅ Found profile data: ${data}`);
      } else {
        console.log(`   ❌ Missing profile data: ${data}`);
        this.blockers.push(`Profile data missing: ${data}`);
      }
    }
    
    this.results.push({
      test: 'Demo Data',
      creatorsFound: foundCreators,
      totalCreators: demoCreators.length,
      profileDataFound: foundProfileData,
      totalProfileData: profileData.length,
      success: foundCreators === demoCreators.length && foundProfileData === profileData.length
    });
  }

  async testRoleSwitching() {
    console.log('\n4️⃣ Testing Role Switching...');
    
    await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    // Look for role switcher with various possible selectors
    const roleSwitcherSelectors = [
      '[data-testid="role-switcher"]',
      '.role-switcher',
      'select[name*="role"]',
      'button[aria-label*="switch"]',
      'button[title*="switch"]'
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
      console.log('   ❌ Role switcher not found');
      this.blockers.push('Critical: Role switcher missing - cannot demo role transitions');
    }
    
    this.results.push({
      test: 'Role Switching',
      success: roleSwitcherFound
    });
  }

  async testInteractiveElements() {
    console.log('\n5️⃣ Testing Interactive Elements...');
    
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    // Count clickable elements
    const buttons = await this.page.$$('button');
    const links = await this.page.$$('a');
    const clickableElements = buttons.length + links.length;
    
    console.log(`   Found ${buttons.length} buttons, ${links.length} links`);
    
    // Test if at least some buttons are functional
    let workingButtons = 0;
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      try {
        await buttons[i].click();
        await this.wait(500);
        workingButtons++;
      } catch (error) {
        // Expected some buttons may not be clickable
      }
    }
    
    console.log(`   ✅ ${workingButtons} interactive elements working`);
    
    this.results.push({
      test: 'Interactive Elements',
      totalButtons: buttons.length,
      workingButtons: workingButtons,
      success: clickableElements > 10 && workingButtons > 0
    });
  }

  async testCriticalPaths() {
    console.log('\n6️⃣ Testing Critical Demo Paths...');
    
    // Test explore → profile navigation
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    let pathsWorking = 0;
    const totalPaths = 3;
    
    // Path 1: Explore page has creators
    const content = await this.page.content();
    if (content.includes('Emma Thompson') && content.includes('Marcus Johnson')) {
      console.log('   ✅ Creator discovery working');
      pathsWorking++;
    } else {
      console.log('   ❌ Creator discovery broken');
      this.blockers.push('Creator discovery not working - no creators visible');
    }
    
    // Path 2: Profile page shows marketer data
    await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    const profileContent = await this.page.content();
    if (profileContent.includes('Sarah Martinez') && profileContent.includes('TechStyle')) {
      console.log('   ✅ Marketer profile working');
      pathsWorking++;
    } else {
      console.log('   ❌ Marketer profile broken');
      this.blockers.push('Marketer profile not showing correct data');
    }
    
    // Path 3: Deals page loads
    await this.page.goto(`${this.baseUrl}/deals`, { waitUntil: 'networkidle0' });
    await this.wait(2000);
    
    const dealsContent = await this.page.content();
    if (dealsContent.includes('Deals') || dealsContent.includes('Analytics')) {
      console.log('   ✅ Deals page working');
      pathsWorking++;
    } else {
      console.log('   ❌ Deals page broken');
      this.blockers.push('Deals page not loading correctly');
    }
    
    this.results.push({
      test: 'Critical Paths',
      pathsWorking: pathsWorking,
      totalPaths: totalPaths,
      success: pathsWorking === totalPaths
    });
  }

  generateSummary() {
    console.log('\n📋 DEMO TESTING SUMMARY');
    console.log('='.repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const criticalBlockers = this.blockers.filter(b => b.includes('Critical')).length;
    
    if (passedTests === totalTests && criticalBlockers === 0) {
      console.log('✅ DEMO READY FOR PRESENTATION!');
      console.log('🎉 All critical flows working correctly');
      return true;
    } else {
      console.log('❌ DEMO HAS ISSUES THAT NEED ATTENTION');
      console.log(`📊 ${passedTests}/${totalTests} tests passed`);
      console.log(`🚨 ${criticalBlockers} critical blocker(s) found`);
    }
    
    console.log('\n🔍 TEST RESULTS:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.test}`);
    });
    
    if (this.blockers.length > 0) {
      console.log('\n🚫 BLOCKERS FOUND:');
      this.blockers.forEach(blocker => {
        const severity = blocker.includes('Critical') ? '🚨' : '⚠️';
        console.log(`   ${severity} ${blocker}`);
      });
    }
    
    return passedTests === totalTests && criticalBlockers === 0;
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

      // Run all tests
      await this.testPageLoads();
      await this.testNavigation();
      await this.testDemoData();
      await this.testRoleSwitching();
      await this.testInteractiveElements();
      await this.testCriticalPaths();
      
      return this.generateSummary();
      
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
  const tester = new SimpleDemoTester();
  tester.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SimpleDemoTester;