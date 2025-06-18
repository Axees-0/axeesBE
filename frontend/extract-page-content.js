#!/usr/bin/env node

/**
 * Extract and analyze actual page content
 * Works without puppeteer by analyzing the served HTML and assets
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class ContentExtractor {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
    this.content = {
      html: '',
      scripts: [],
      styles: [],
      errors: [],
      bundleContent: '',
      reactComponents: []
    };
  }

  async extract() {
    console.log('🔍 Extracting page content from', this.baseUrl);
    console.log('='.repeat(60));
    
    // Step 1: Get main HTML
    await this.getMainHTML();
    
    // Step 2: Extract script URLs
    await this.extractScripts();
    
    // Step 3: Get main bundle content
    await this.getMainBundle();
    
    // Step 4: Analyze content
    await this.analyzeContent();
    
    // Step 5: Report findings
    this.report();
  }

  async getMainHTML() {
    return new Promise((resolve) => {
      http.get(this.baseUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          this.content.html = data;
          console.log(`\n✅ HTML loaded (${data.length} bytes)`);
          
          // Check for error page
          if (data.includes('expo-static-error')) {
            const errorMatch = data.match(/"message":\{"content":"([^"]+)"/);
            if (errorMatch) {
              this.content.errors.push(errorMatch[1]);
              console.log('❌ Error detected:', errorMatch[1].substring(0, 100) + '...');
            }
          }
          
          resolve();
        });
      }).on('error', (err) => {
        console.log('❌ Failed to load page:', err.message);
        resolve();
      });
    });
  }

  async extractScripts() {
    const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*>/g;
    let match;
    
    while ((match = scriptRegex.exec(this.content.html)) !== null) {
      this.content.scripts.push(match[1]);
    }
    
    console.log(`\n📦 Found ${this.content.scripts.length} script(s):`);
    this.content.scripts.forEach(script => {
      console.log(`   - ${script.substring(0, 60)}...`);
    });
  }

  async getMainBundle() {
    const bundleUrl = this.content.scripts.find(s => s.includes('bundle'));
    if (!bundleUrl) {
      console.log('\n❌ No bundle URL found');
      return;
    }

    console.log(`\n📥 Fetching main bundle: ${bundleUrl.substring(0, 60)}...`);
    
    return new Promise((resolve) => {
      const fullUrl = new URL(bundleUrl, this.baseUrl);
      http.get(fullUrl.href, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          this.content.bundleContent = data;
          console.log(`✅ Bundle loaded (${(data.length / 1024).toFixed(1)} KB)`);
          
          // Extract some key information
          this.extractBundleInfo(data);
          resolve();
        });
      }).on('error', (err) => {
        console.log('❌ Failed to load bundle:', err.message);
        resolve();
      });
    });
  }

  extractBundleInfo(bundle) {
    // Look for React components
    const componentRegex = /export\s+(?:default\s+)?function\s+(\w+)|const\s+(\w+)\s*=.*?=>/g;
    const components = new Set();
    let match;
    
    while ((match = componentRegex.exec(bundle)) !== null) {
      const name = match[1] || match[2];
      if (name && /^[A-Z]/.test(name)) { // React components start with capital
        components.add(name);
      }
    }
    
    this.content.reactComponents = Array.from(components);
    
    // Look for demo data
    this.content.hasDemoData = bundle.includes('Summer Collection') || 
                               bundle.includes('5000') ||
                               bundle.includes('Emma Thompson');
    
    // Look for navigation
    this.content.hasNavigation = bundle.includes('Explore') && 
                                bundle.includes('Deals') &&
                                bundle.includes('Messages');
  }

  async analyzeContent() {
    console.log('\n📊 Content Analysis:');
    console.log('='.repeat(40));
    
    // HTML Analysis
    console.log('\n1. HTML Structure:');
    console.log(`   - Has React root: ${this.content.html.includes('id="root"') ? '✅' : '❌'}`);
    console.log(`   - Has styles: ${this.content.html.includes('<style') ? '✅' : '❌'}`);
    console.log(`   - Title tag: ${this.extractTitle() || '❌ Empty'}`);
    
    // Bundle Analysis
    if (this.content.bundleContent) {
      console.log('\n2. JavaScript Bundle:');
      console.log(`   - Size: ${(this.content.bundleContent.length / 1024).toFixed(1)} KB`);
      console.log(`   - React components found: ${this.content.reactComponents.length}`);
      console.log(`   - Has demo data: ${this.content.hasDemoData ? '✅' : '❌'}`);
      console.log(`   - Has navigation: ${this.content.hasNavigation ? '✅' : '❌'}`);
      
      if (this.content.reactComponents.length > 0) {
        console.log(`   - Sample components: ${this.content.reactComponents.slice(0, 5).join(', ')}`);
      }
    }
    
    // Error Analysis
    if (this.content.errors.length > 0) {
      console.log('\n3. Errors Detected:');
      this.content.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    // Demo Content Check
    console.log('\n4. Demo Content Check:');
    const expectedContent = [
      { name: 'Explore tab', pattern: 'Explore' },
      { name: 'Deals tab', pattern: 'Deals' },
      { name: 'Messages tab', pattern: 'Messages' },
      { name: 'High-value deal', pattern: '5000|5,000' },
      { name: 'Demo creator', pattern: 'Emma Thompson' },
      { name: 'Demo brand', pattern: 'TechStyle' },
    ];
    
    expectedContent.forEach(({ name, pattern }) => {
      const found = new RegExp(pattern).test(this.content.bundleContent);
      console.log(`   - ${name}: ${found ? '✅' : '❌'}`);
    });
  }

  extractTitle() {
    const match = this.content.html.match(/<title[^>]*>([^<]*)<\/title>/);
    return match ? match[1] : null;
  }

  report() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONTENT EXTRACTION SUMMARY');
    console.log('='.repeat(60));
    
    const hasErrors = this.content.errors.length > 0;
    const hasContent = this.content.bundleContent.length > 0;
    const hasDemo = this.content.hasDemoData;
    const hasNav = this.content.hasNavigation;
    
    if (!hasErrors && hasContent && hasDemo && hasNav) {
      console.log('\n✅ Page appears to be loading correctly!');
      console.log('✅ Demo content is present in the bundle');
      console.log('✅ Navigation structure is in place');
      console.log('\n🎯 Next step: Open http://localhost:8081 in a browser');
      console.log('   You should see the Axees demo with 5 navigation tabs');
    } else {
      console.log('\n⚠️  Issues detected:');
      if (hasErrors) console.log('   - Compilation/runtime errors present');
      if (!hasContent) console.log('   - Bundle not loading properly');
      if (!hasDemo) console.log('   - Demo data not found in bundle');
      if (!hasNav) console.log('   - Navigation components missing');
      
      console.log('\n🔧 Recommended actions:');
      console.log('   1. Check the errors above');
      console.log('   2. Run the content validator to auto-fix issues');
      console.log('   3. Ensure Metro bundler is running without errors');
    }
  }
}

// Run the extractor
const extractor = new ContentExtractor();
extractor.extract().catch(console.error);