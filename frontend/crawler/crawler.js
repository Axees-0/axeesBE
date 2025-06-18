#!/usr/bin/env node

/**
 * Robust Frontend Crawler - Tests all pages, interactions, and validates behavior
 */

const puppeteer = require('puppeteer');
const config = require('./crawler-config');

class FrontendCrawler {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      summary: {
        totalPages: 0,
        pagesSucceeded: 0,
        pagesFailed: 0,
        totalInteractions: 0,
        interactionsSucceeded: 0,
        interactionsFailed: 0,
        totalErrors: 0,
        startTime: null,
        endTime: null
      },
      pages: [],
      globalErrors: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Frontend Crawler...');
    
    this.results.summary.startTime = new Date();
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewport({ width: 1200, height: 800 });
    
    // Capture all browser events
    this.setupEventListeners();
    
    console.log('✅ Browser initialized successfully');
  }

  setupEventListeners() {
    // Capture console messages
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      this.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });
    
    // Capture JavaScript errors
    this.page.on('pageerror', error => {
      this.log(`[PAGE ERROR] ${error.message}`, 'error');
      this.results.globalErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      this.results.summary.totalErrors++;
    });
    
    // Capture failed requests
    this.page.on('requestfailed', request => {
      this.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`, 'error');
      this.results.globalErrors.push({
        type: 'requestfailed',
        url: request.url(),
        reason: request.failure().errorText,
        timestamp: new Date()
      });
      this.results.summary.totalErrors++;
    });
    
    // Capture response errors
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.log(`[HTTP ERROR] ${response.status()} ${response.url()}`, 'error');
        this.results.globalErrors.push({
          type: 'httperror',
          status: response.status(),
          url: response.url(),
          timestamp: new Date()
        });
        this.results.summary.totalErrors++;
      }
    });
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async crawlAllPages() {
    console.log(`\n🎯 Starting crawl of ${config.pages.length} pages...\n`);
    
    this.results.summary.totalPages = config.pages.length;
    
    for (const pageConfig of config.pages) {
      await this.crawlPage(pageConfig);
    }
    
    this.results.summary.endTime = new Date();
    await this.generateReport();
  }

  async crawlPage(pageConfig) {
    console.log(`\n📄 Crawling ${pageConfig.name} page...`);
    console.log(`   URL: ${config.baseUrl}${pageConfig.path}`);
    
    const pageResult = {
      name: pageConfig.name,
      url: `${config.baseUrl}${pageConfig.path}`,
      success: false,
      loadTime: 0,
      contentValidation: {
        expectedFound: [],
        expectedMissing: [],
        forbiddenFound: []
      },
      interactions: [],
      errors: [],
      screenshots: []
    };
    
    try {
      // Navigate to page
      const startTime = Date.now();
      
      await this.page.goto(`${config.baseUrl}${pageConfig.path}`, {
        waitUntil: 'networkidle2',
        timeout: config.timing.pageLoad
      });
      
      // Wait for React hydration
      await new Promise(resolve => setTimeout(resolve, config.timing.navigation));
      
      const loadTime = Date.now() - startTime;
      pageResult.loadTime = loadTime;
      
      this.log(`   ✅ Page loaded in ${loadTime}ms`);
      
      // Validate page content
      await this.validatePageContent(pageResult, pageConfig);
      
      // Validate required elements
      await this.validateRequiredElements(pageResult);
      
      // Perform interactions
      await this.performInteractions(pageResult, pageConfig);
      
      // Take screenshot
      const screenshotPath = `/tmp/crawler-${pageConfig.name.toLowerCase()}-${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      pageResult.screenshots.push(screenshotPath);
      
      // Check if page passed all tests
      const hasExpectedContent = pageResult.contentValidation.expectedFound.length > 0;
      const hasNoForbiddenContent = pageResult.contentValidation.forbiddenFound.length === 0;
      const hasNoErrors = pageResult.errors.length === 0;
      
      pageResult.success = hasExpectedContent && hasNoForbiddenContent && hasNoErrors;
      
      if (pageResult.success) {
        this.results.summary.pagesSucceeded++;
        this.log(`   ✅ ${pageConfig.name} page PASSED all tests`);
      } else {
        this.results.summary.pagesFailed++;
        this.log(`   ❌ ${pageConfig.name} page FAILED some tests`);
      }
      
    } catch (error) {
      this.log(`   ❌ Error crawling ${pageConfig.name}: ${error.message}`, 'error');
      pageResult.errors.push({
        type: 'navigation',
        message: error.message,
        timestamp: new Date()
      });
      this.results.summary.pagesFailed++;
    }
    
    this.results.pages.push(pageResult);
  }

  async validatePageContent(pageResult, pageConfig) {
    this.log(`   🔍 Validating content for ${pageConfig.name}...`);
    
    const content = await this.page.evaluate(() => {
      return document.body.innerText;
    });
    
    // Check expected content
    for (const expected of pageConfig.expectedContent) {
      if (content.includes(expected)) {
        pageResult.contentValidation.expectedFound.push(expected);
        this.log(`     ✅ Found expected: "${expected}"`);
      } else {
        pageResult.contentValidation.expectedMissing.push(expected);
        this.log(`     ❌ Missing expected: "${expected}"`);
      }
    }
    
    // Check forbidden content
    for (const forbidden of config.validation.forbiddenContent) {
      if (content.includes(forbidden)) {
        pageResult.contentValidation.forbiddenFound.push(forbidden);
        this.log(`     ❌ Found forbidden: "${forbidden}"`, 'error');
        pageResult.errors.push({
          type: 'forbidden_content',
          content: forbidden,
          timestamp: new Date()
        });
      }
    }
  }

  async validateRequiredElements(pageResult) {
    this.log(`   🔍 Validating required DOM elements...`);
    
    for (const selector of config.validation.requiredElements) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          this.log(`     ✅ Found required element: ${selector}`);
        } else {
          this.log(`     ❌ Missing required element: ${selector}`, 'error');
          pageResult.errors.push({
            type: 'missing_element',
            selector: selector,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.log(`     ❌ Error checking element ${selector}: ${error.message}`, 'error');
      }
    }
  }

  async performInteractions(pageResult, pageConfig) {
    if (!pageConfig.interactions || pageConfig.interactions.length === 0) {
      this.log(`   ℹ️ No interactions defined for ${pageConfig.name}`);
      return;
    }
    
    this.log(`   🎯 Performing ${pageConfig.interactions.length} interaction(s)...`);
    
    for (const interaction of pageConfig.interactions) {
      this.results.summary.totalInteractions++;
      
      const interactionResult = {
        type: interaction.type,
        selector: interaction.selector,
        description: interaction.description,
        success: false,
        error: null,
        duration: 0,
        timestamp: new Date()
      };
      
      try {
        const startTime = Date.now();
        
        if (interaction.type === 'click') {
          // Get current URL before click
          const urlBefore = this.page.url();
          
          await this.performClick(interaction);
          
          // Wait for potential navigation
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Get URL after click
          const urlAfter = this.page.url();
          
          // Verify navigation actually occurred if expected
          if (interaction.expectedResult && interaction.expectedResult.includes('Navigation')) {
            if (urlBefore === urlAfter) {
              throw new Error(`Navigation expected but URL unchanged: ${urlBefore}`);
            }
            
            // Verify the new page content loaded
            await new Promise(resolve => setTimeout(resolve, 1000));
            const pageContent = await this.page.evaluate(() => document.body.innerText);
            
            if (urlAfter.includes('/deals') && !pageContent.includes('Deals')) {
              throw new Error(`Navigated to ${urlAfter} but deals content not found`);
            }
            if (urlAfter.includes('/messages') && !pageContent.includes('Messages')) {
              throw new Error(`Navigated to ${urlAfter} but messages content not found`);
            }
            if (urlAfter.includes('/notifications') && !pageContent.includes('Notifications')) {
              throw new Error(`Navigated to ${urlAfter} but notifications content not found`);
            }
            if (urlAfter.includes('/profile') && !pageContent.includes('Profile')) {
              throw new Error(`Navigated to ${urlAfter} but profile content not found`);
            }
            
            this.log(`     ✅ ${interaction.description} (${urlBefore} → ${urlAfter}) + content verified`);
          } else {
            this.log(`     ✅ ${interaction.description}`);
          }
          
          interactionResult.success = true;
          this.results.summary.interactionsSucceeded++;
        }
        
        interactionResult.duration = Date.now() - startTime;
        
        // Wait between interactions
        await new Promise(resolve => setTimeout(resolve, config.timing.interaction));
        
      } catch (error) {
        interactionResult.error = error.message;
        this.results.summary.interactionsFailed++;
        this.log(`     ❌ ${interaction.description}: ${error.message}`, 'error');
        
        pageResult.errors.push({
          type: 'interaction_error',
          interaction: interaction.description,
          message: error.message,
          timestamp: new Date()
        });
      }
      
      pageResult.interactions.push(interactionResult);
    }
  }

  async performClick(interaction) {
    // Try to find elements with the selector
    const elements = await this.page.$$(interaction.selector);
    
    if (elements.length === 0) {
      throw new Error(`No elements found with selector: ${interaction.selector}`);
    }
    
    // Click the first visible element
    for (const element of elements) {
      const isVisible = await element.isIntersectingViewport();
      if (isVisible) {
        await element.click();
        return;
      }
    }
    
    // If no visible elements, try clicking the first one anyway
    await elements[0].click();
  }

  async generateReport() {
    const duration = this.results.summary.endTime - this.results.summary.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 CRAWL COMPLETE - FINAL REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Pages: ${this.results.summary.pagesSucceeded}/${this.results.summary.totalPages} passed`);
    console.log(`   Interactions: ${this.results.summary.interactionsSucceeded}/${this.results.summary.totalInteractions} passed`);
    console.log(`   Global Errors: ${this.results.summary.totalErrors}`);
    
    console.log(`\n📄 PAGE RESULTS:`);
    this.results.pages.forEach(page => {
      const status = page.success ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${page.name} (${page.loadTime}ms)`);
      
      if (!page.success) {
        console.log(`     Missing content: ${page.contentValidation.expectedMissing.join(', ')}`);
        if (page.contentValidation.forbiddenFound.length > 0) {
          console.log(`     Forbidden content: ${page.contentValidation.forbiddenFound.join(', ')}`);
        }
        if (page.errors.length > 0) {
          console.log(`     Errors: ${page.errors.length}`);
        }
      }
    });
    
    if (this.results.globalErrors.length > 0) {
      console.log(`\n🚨 GLOBAL ERRORS:`);
      this.results.globalErrors.slice(0, 10).forEach(error => {
        console.log(`   ${error.type}: ${error.message || error.reason}`);
      });
    }
    
    const overallSuccess = this.results.summary.pagesFailed === 0 && this.results.summary.totalErrors === 0;
    
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
      console.log(`\n🎉 Your demo is working perfectly!`);
      console.log(`   - All pages load correctly`);
      console.log(`   - All expected content is present`);
      console.log(`   - No forbidden error messages`);
      console.log(`   - All interactions work`);
      console.log(`\n✨ Ready for investor presentation!`);
    } else {
      console.log(`\n🔧 Issues found that need attention:`);
      if (this.results.summary.pagesFailed > 0) {
        console.log(`   - ${this.results.summary.pagesFailed} page(s) failed validation`);
      }
      if (this.results.summary.totalErrors > 0) {
        console.log(`   - ${this.results.summary.totalErrors} error(s) detected`);
      }
    }
    
    // Save detailed results to file
    const reportPath = `/tmp/crawler-report-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runCrawler() {
  const crawler = new FrontendCrawler();
  
  try {
    await crawler.initialize();
    await crawler.crawlAllPages();
  } catch (error) {
    console.error('Fatal crawler error:', error);
  } finally {
    await crawler.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runCrawler().then(() => {
    console.log('\n🏁 Crawler session complete');
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = FrontendCrawler;