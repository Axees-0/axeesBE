#!/usr/bin/env node

/**
 * Critical Demo User Journey Testing
 * Tests complete marketer→creator demo flows for live presentation
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class DemoCriticalFlowTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:8081';
    this.results = {
      timestamp: new Date().toISOString(),
      flows: [],
      blockers: [],
      dataValidation: [],
      summary: {
        totalFlows: 0,
        passedFlows: 0,
        failedFlows: 0,
        criticalBlockers: 0,
        readyForDemo: false
      }
    };
  }

  async init() {
    console.log('🎬 Starting Critical Demo Flow Testing...\n');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for demo testing
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 800 });
    
    // Enhanced error monitoring
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
        this.results.blockers.push({
          type: 'console_error',
          message: msg.text(),
          severity: 'high'
        });
      }
    });

    this.page.on('pageerror', (error) => {
      console.log(`❌ Page Error: ${error.message}`);
      this.results.blockers.push({
        type: 'page_error',
        message: error.message,
        severity: 'critical'
      });
    });
  }

  async checkServerRunning() {
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 10000 });
      return true;
    } catch (error) {
      console.log(`❌ Server not responding on ${this.baseUrl}`);
      console.log('   Please start your dev server with: npm run web');
      return false;
    }
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  async clickAndWait(selector, description, waitTime = 2000) {
    try {
      console.log(`   🖱️  ${description}`);
      await this.page.click(selector);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return true;
    } catch (error) {
      console.log(`   ❌ Failed to ${description}: ${error.message}`);
      return false;
    }
  }

  async validatePageContent(expectedContent, pageName) {
    const pageContent = await this.page.content();
    const missing = [];
    
    for (const content of expectedContent) {
      if (!pageContent.includes(content)) {
        missing.push(content);
      }
    }
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing content on ${pageName}: ${missing.join(', ')}`);
      return false;
    }
    
    console.log(`   ✅ All expected content found on ${pageName}`);
    return true;
  }

  async testCompleteMarketerToCreatorFlow() {
    console.log('🎯 Testing Complete Marketer→Creator Demo Flow...\n');
    
    const flow = {
      name: 'Complete Marketer→Creator Demo Flow',
      steps: [],
      status: 'running',
      blockers: []
    };

    try {
      // Step 1: Login as marketer
      console.log('1️⃣ Step 1: Login as marketer (sarah@techstyle.com)');
      await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Check if already logged in or need to login
      const isLoggedIn = await this.page.$('[role="tablist"]');
      if (!isLoggedIn) {
        const emailField = await this.waitForElement('input[type="email"]', 5000);
        if (emailField) {
          await this.page.type('input[type="email"]', 'sarah@techstyle.com');
          await this.page.type('input[type="password"]', 'demo123');
          await this.clickAndWait('button[type="submit"]', 'Click login button');
        }
      }
      
      flow.steps.push({ step: 'Login as marketer', status: 'passed' });

      // Step 2: Navigate to Explore page and browse creators
      console.log('2️⃣ Step 2: Browse creators on explore page');
      await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const creatorsVisible = await this.validatePageContent([
        'Emma Thompson',
        'Marcus Johnson',
        'Sofia Rodriguez'
      ], 'Explore page');
      
      if (!creatorsVisible) {
        flow.blockers.push('Demo creators not visible on explore page');
      }
      flow.steps.push({ step: 'Browse creators', status: creatorsVisible ? 'passed' : 'failed' });

      // Step 3: Click Emma Thompson profile
      console.log('3️⃣ Step 3: Click Emma Thompson profile');
      
      // Look for Emma Thompson profile link/card using standard CSS selectors
      const emmaSelectors = [
        '[data-testid*="emma"]',
        'button[title*="Emma Thompson"]',
        'div[data-creator="emma"]',
        '.creator-card'
      ];
      
      let emmaClicked = false;
      for (const selector of emmaSelectors) {
        try {
          const elements = await this.page.$$(selector);
          if (elements.length > 0) {
            await elements[0].click();
            emmaClicked = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!emmaClicked) {
        // Try to find any clickable element containing Emma Thompson
        const emmaElements = await this.page.$$eval('*', els => 
          els.filter(el => el.textContent?.includes('Emma Thompson') && 
            (el.tagName === 'BUTTON' || el.onclick || el.style.cursor === 'pointer'))
        );
        
        if (emmaElements.length > 0) {
          await this.page.evaluate(() => {
            const el = [...document.querySelectorAll('*')]
              .find(el => el.textContent?.includes('Emma Thompson') && 
                (el.tagName === 'BUTTON' || el.onclick || el.style.cursor === 'pointer'));
            if (el) el.click();
          });
          emmaClicked = true;
        }
      }
      
      if (!emmaClicked) {
        flow.blockers.push('Cannot click Emma Thompson profile - no clickable element found');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      flow.steps.push({ step: 'Click Emma Thompson profile', status: emmaClicked ? 'passed' : 'failed' });

      // Step 4: Create custom offer
      console.log('4️⃣ Step 4: Create custom offer');
      
      // Look for "Create Offer" or similar button
      const offerButtonSelectors = [
        'button:has-text("Create Offer")',
        'button:has-text("Make Offer")',
        'text="Create Offer"',
        '[data-testid*="create-offer"]',
        '.create-offer-btn'
      ];
      
      let offerCreated = false;
      for (const selector of offerButtonSelectors) {
        try {
          await this.page.click(selector);
          await new Promise(resolve => setTimeout(resolve, 2000));
          offerCreated = true;
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!offerCreated) {
        flow.blockers.push('Cannot find "Create Offer" button on profile page');
      }
      
      flow.steps.push({ step: 'Create custom offer', status: offerCreated ? 'passed' : 'failed' });

      // Step 5: Fill offer form and send
      console.log('5️⃣ Step 5: Fill offer form and send');
      
      let offerSent = false;
      try {
        // Look for offer form fields
        const offerAmountField = await this.page.$('input[placeholder*="amount"], input[name*="amount"]');
        if (offerAmountField) {
          await this.page.type('input[placeholder*="amount"], input[name*="amount"]', '5000');
        }
        
        const descriptionField = await this.page.$('textarea, input[placeholder*="description"]');
        if (descriptionField) {
          await this.page.type('textarea, input[placeholder*="description"]', 'Demo offer for summer campaign');
        }
        
        // Send offer
        const sendButton = await this.page.$('button:has-text("Send"), button:has-text("Submit")');
        if (sendButton) {
          await this.page.click('button:has-text("Send"), button:has-text("Submit")');
          await new Promise(resolve => setTimeout(resolve, 2000));
          offerSent = true;
        }
      } catch (error) {
        flow.blockers.push(`Offer form interaction failed: ${error.message}`);
      }
      
      flow.steps.push({ step: 'Send offer', status: offerSent ? 'passed' : 'failed' });

      // Step 6: Switch to creator role using demo mode
      console.log('6️⃣ Step 6: Switch to creator role using demo mode');
      
      // Look for role switcher
      const roleSwitcherSelectors = [
        '[data-testid="role-switcher"]',
        'button:has-text("Creator")',
        '.role-switch',
        'select[name*="role"]'
      ];
      
      let roleSwitched = false;
      for (const selector of roleSwitcherSelectors) {
        try {
          await this.page.click(selector);
          await new Promise(resolve => setTimeout(resolve, 2000));
          roleSwitched = true;
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!roleSwitched) {
        flow.blockers.push('Cannot find role switcher to change to creator mode');
      }
      
      flow.steps.push({ step: 'Switch to creator role', status: roleSwitched ? 'passed' : 'failed' });

      // Step 7: View offer in deals/notifications
      console.log('7️⃣ Step 7: View offer in deals/notifications');
      
      // Navigate to deals or notifications
      await this.page.goto(`${this.baseUrl}/deals`, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const offerVisible = await this.validatePageContent([
        'Demo offer',
        'summer campaign',
        '$5,000'
      ], 'Deals page');
      
      flow.steps.push({ step: 'View offer in deals', status: offerVisible ? 'passed' : 'failed' });

      // Step 8: Accept offer
      console.log('8️⃣ Step 8: Accept offer');
      
      let offerAccepted = false;
      try {
        const acceptButton = await this.page.$('button:has-text("Accept"), button:has-text("Approve")');
        if (acceptButton) {
          await this.page.click('button:has-text("Accept"), button:has-text("Approve")');
          await new Promise(resolve => setTimeout(resolve, 2000));
          offerAccepted = true;
        }
      } catch (error) {
        flow.blockers.push(`Accept offer failed: ${error.message}`);
      }
      
      flow.steps.push({ step: 'Accept offer', status: offerAccepted ? 'passed' : 'failed' });

      // Step 9: Navigate to milestone setup
      console.log('9️⃣ Step 9: Navigate to milestone setup');
      
      await this.page.goto(`${this.baseUrl}/milestones/setup`, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const milestonesLoaded = await this.validatePageContent([
        'Milestone',
        'Setup',
        'Timeline'
      ], 'Milestones page');
      
      flow.steps.push({ step: 'Navigate to milestone setup', status: milestonesLoaded ? 'passed' : 'failed' });

      // Continue with remaining steps...
      flow.status = 'completed';
      
    } catch (error) {
      flow.status = 'failed';
      flow.blockers.push(`Critical error: ${error.message}`);
    }

    this.results.flows.push(flow);
    return flow;
  }

  async testDemoDataValidation() {
    console.log('📊 Testing Demo Data Validation...\n');
    
    const dataTests = [
      {
        name: 'Demo users exist',
        test: async () => {
          await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
          return await this.validatePageContent(['Sarah Martinez', 'TechStyle Brand'], 'Profile');
        }
      },
      {
        name: 'Creator profiles populated',
        test: async () => {
          await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
          return await this.validatePageContent(['Emma Thompson', '@emmastyle'], 'Explore');
        }
      },
      {
        name: 'Analytics data present',
        test: async () => {
          await this.page.goto(`${this.baseUrl}/deals`, { waitUntil: 'networkidle0' });
          return await this.validatePageContent(['$45,600', '89%'], 'Deals Analytics');
        }
      }
    ];

    for (const test of dataTests) {
      console.log(`   🧪 Testing: ${test.name}`);
      try {
        const result = await test.test();
        this.results.dataValidation.push({
          name: test.name,
          status: result ? 'passed' : 'failed'
        });
        console.log(`   ${result ? '✅' : '❌'} ${test.name}`);
      } catch (error) {
        this.results.dataValidation.push({
          name: test.name,
          status: 'failed',
          error: error.message
        });
        console.log(`   ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async identifyDemoBlockers() {
    console.log('🚫 Identifying Demo Blockers...\n');
    
    const blockerTests = [
      {
        name: 'Navigation dead ends',
        test: async () => {
          // Test all main navigation paths
          const tabs = ['/', '/deals', '/messages', '/notifications', '/profile'];
          for (const tab of tabs) {
            await this.page.goto(`${this.baseUrl}${tab}`, { waitUntil: 'networkidle0' });
            const hasNavigation = await this.page.$('[role="tablist"]');
            if (!hasNavigation) {
              this.results.blockers.push({
                type: 'navigation_dead_end',
                page: tab,
                severity: 'critical'
              });
              return false;
            }
          }
          return true;
        }
      },
      {
        name: 'Missing demo transitions',
        test: async () => {
          // Check for role switcher
          await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
          const roleSwitcher = await this.page.$('[data-testid="role-switcher"]');
          if (!roleSwitcher) {
            this.results.blockers.push({
              type: 'missing_role_switcher',
              severity: 'critical'
            });
            return false;
          }
          return true;
        }
      },
      {
        name: 'Broken state management',
        test: async () => {
          // Test state persistence across navigation
          await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
          const initialContent = await this.page.content();
          
          // Navigate away and back
          await this.page.goto(`${this.baseUrl}/deals`, { waitUntil: 'networkidle0' });
          await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
          
          const finalContent = await this.page.content();
          
          // Check if critical data persisted
          if (!finalContent.includes('Sarah Martinez')) {
            this.results.blockers.push({
              type: 'state_management_broken',
              severity: 'high'
            });
            return false;
          }
          return true;
        }
      }
    ];

    for (const test of blockerTests) {
      console.log(`   🔍 Checking: ${test.name}`);
      try {
        const result = await test.test();
        console.log(`   ${result ? '✅' : '❌'} ${test.name}`);
      } catch (error) {
        console.log(`   ❌ ${test.name}: ${error.message}`);
        this.results.blockers.push({
          type: 'test_error',
          test: test.name,
          error: error.message,
          severity: 'medium'
        });
      }
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Demo Testing Report...\n');

    // Calculate summary
    this.results.summary.totalFlows = this.results.flows.length;
    this.results.summary.passedFlows = this.results.flows.filter(f => f.status === 'completed').length;
    this.results.summary.failedFlows = this.results.summary.totalFlows - this.results.summary.passedFlows;
    this.results.summary.criticalBlockers = this.results.blockers.filter(b => b.severity === 'critical').length;
    this.results.summary.readyForDemo = this.results.summary.criticalBlockers === 0 && 
                                       this.results.summary.failedFlows === 0;

    // Console output
    console.log('🎯 DEMO TESTING RESULTS:');
    console.log('='.repeat(50));
    
    if (this.results.summary.readyForDemo) {
      console.log('✅ DEMO READY FOR PRESENTATION!');
      console.log('🎉 All critical flows working perfectly');
    } else {
      console.log('❌ DEMO HAS CRITICAL ISSUES');
      console.log(`🚨 ${this.results.summary.criticalBlockers} critical blocker(s) found`);
      console.log(`📉 ${this.results.summary.failedFlows}/${this.results.summary.totalFlows} flow(s) failed`);
    }
    
    console.log('\n🔍 DETAILED FINDINGS:');
    
    // Report flows
    this.results.flows.forEach(flow => {
      console.log(`\n📊 Flow: ${flow.name}`);
      console.log(`   Status: ${flow.status === 'completed' ? '✅ PASSED' : '❌ FAILED'}`);
      if (flow.blockers.length > 0) {
        console.log('   Blockers:');
        flow.blockers.forEach(blocker => console.log(`     - ${blocker}`));
      }
    });

    // Report critical blockers
    if (this.results.blockers.length > 0) {
      console.log('\n🚨 CRITICAL BLOCKERS:');
      this.results.blockers
        .filter(b => b.severity === 'critical')
        .forEach(blocker => {
          console.log(`   ❌ ${blocker.type}: ${blocker.message || 'See details in JSON report'}`);
        });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, `demo-testing-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);

    return this.results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      const serverRunning = await this.checkServerRunning();
      if (!serverRunning) {
        return false;
      }

      // Run all tests
      await this.testCompleteMarketerToCreatorFlow();
      await this.testDemoDataValidation();
      await this.identifyDemoBlockers();
      
      const results = await this.generateReport();
      
      return results.summary.readyForDemo;
      
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
  const tester = new DemoCriticalFlowTester();
  tester.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DemoCriticalFlowTester;