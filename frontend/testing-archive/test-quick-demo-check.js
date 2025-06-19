#!/usr/bin/env node

/**
 * Quick Demo Check - Fast validation of critical demo elements
 */

const puppeteer = require('puppeteer');

class QuickDemoChecker {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:8081';
    this.results = [];
    this.criticalIssues = [];
  }

  async init() {
    console.log('🎬 Quick Demo Check - Critical Elements...\n');
    
    this.browser = await puppeteer.launch({
      headless: true, // Run headless for speed
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 800 });
  }

  async checkPage(name, path, expectedElements) {
    try {
      console.log(`📍 Checking ${name} page...`);
      await this.page.goto(`${this.baseUrl}${path}`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = await this.page.content();
      const missing = [];
      
      for (const element of expectedElements) {
        if (!content.includes(element)) {
          missing.push(element);
        }
      }
      
      if (missing.length === 0) {
        console.log(`   ✅ ${name} - All elements present`);
        return true;
      } else {
        console.log(`   ❌ ${name} - Missing: ${missing.join(', ')}`);
        this.criticalIssues.push(`${name}: Missing ${missing.join(', ')}`);
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ ${name} - Error: ${error.message}`);
      this.criticalIssues.push(`${name}: Page load error`);
      return false;
    }
  }

  async checkNavigationTabs() {
    console.log('📍 Checking Navigation Tabs...');
    
    try {
      await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const tabs = await this.page.$$('[role="tab"]');
      const tabCount = tabs.length;
      
      if (tabCount >= 5) {
        console.log(`   ✅ Navigation - ${tabCount} tabs found`);
        return true;
      } else {
        console.log(`   ❌ Navigation - Only ${tabCount} tabs found (expected 5)`);
        this.criticalIssues.push('Navigation: Missing tabs');
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Navigation - Error: ${error.message}`);
      this.criticalIssues.push('Navigation: Check failed');
      return false;
    }
  }

  async checkRoleSwitcher() {
    console.log('📍 Checking Role Switcher...');
    
    try {
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = await this.page.content();
      
      if (content.includes('Switch Role') || content.includes('🔄')) {
        console.log('   ✅ Role Switcher - Found');
        return true;
      } else {
        console.log('   ❌ Role Switcher - Not found');
        this.criticalIssues.push('Role Switcher: Not available');
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Role Switcher - Error: ${error.message}`);
      this.criticalIssues.push('Role Switcher: Check failed');
      return false;
    }
  }

  async run() {
    try {
      await this.init();
      
      console.log('🔍 Running Critical Demo Checks...\n');
      
      // Test critical pages and their key elements
      const checks = [
        {
          name: 'Explore Page',
          test: () => this.checkPage('Explore', '/', [
            'Emma Thompson',
            'Marcus Johnson', 
            'Sofia Rodriguez'
          ])
        },
        {
          name: 'Deals Page',
          test: () => this.checkPage('Deals', '/deals', [
            'Deals',
            'Sarah Martinez'
          ])
        },
        {
          name: 'Profile Page', 
          test: () => this.checkPage('Profile', '/profile', [
            'Sarah Martinez',
            'TechStyle Brand'
          ])
        },
        {
          name: 'Messages Page',
          test: () => this.checkPage('Messages', '/messages', [
            'Messages'
          ])
        },
        {
          name: 'Navigation Tabs',
          test: () => this.checkNavigationTabs()
        },
        {
          name: 'Role Switcher',
          test: () => this.checkRoleSwitcher()
        }
      ];
      
      let passed = 0;
      for (const check of checks) {
        const result = await check.test();
        if (result) passed++;
      }
      
      // Generate summary
      console.log('\n📋 DEMO READINESS SUMMARY');
      console.log('='.repeat(50));
      
      if (passed === checks.length) {
        console.log('✅ DEMO IS READY FOR PRESENTATION!');
        console.log('🎉 All critical elements are working');
        console.log('\n📝 DEMO FLOW VALIDATED:');
        console.log('   • Creator discovery (Emma Thompson visible)');
        console.log('   • Navigation between all sections');
        console.log('   • Demo data properly loaded');
        console.log('   • Role switcher available for demo transitions');
        return true;
      } else {
        console.log('❌ DEMO HAS CRITICAL ISSUES');
        console.log(`📊 ${passed}/${checks.length} checks passed`);
        
        if (this.criticalIssues.length > 0) {
          console.log('\n🚨 CRITICAL ISSUES THAT WILL BREAK DEMO:');
          this.criticalIssues.forEach((issue, i) => {
            console.log(`   ${i + 1}. ${issue}`);
          });
          
          console.log('\n🔧 RECOMMENDED FIXES:');
          if (this.criticalIssues.some(i => i.includes('Emma Thompson'))) {
            console.log('   • Check demo data loading in explore page');
          }
          if (this.criticalIssues.some(i => i.includes('Navigation'))) {
            console.log('   • Check tab navigation component');
          }
          if (this.criticalIssues.some(i => i.includes('Role Switcher'))) {
            console.log('   • Ensure DEMO_MODE is enabled in environment');
          }
        }
        return false;
      }
      
    } catch (error) {
      console.error('❌ Critical error during demo check:', error);
      return false;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const checker = new QuickDemoChecker();
  checker.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = QuickDemoChecker;