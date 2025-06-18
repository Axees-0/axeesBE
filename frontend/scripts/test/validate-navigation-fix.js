#!/usr/bin/env node

/**
 * NAVIGATION FIX VALIDATION SCRIPT
 * 
 * Validates that our layout configuration fixes have resolved:
 * 1. Navigation timeouts
 * 2. Stream handling errors
 * 3. Page loading issues
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

class NavigationValidator {
    constructor() {
        this.results = {
            navigationFixed: false,
            streamErrors: [],
            pageLoadTimes: {},
            failedPages: [],
            successfulPages: [],
            consoleErrors: []
        };
    }

    async validate() {
        console.log('🔍 NAVIGATION FIX VALIDATION STARTING...\n');
        
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            // Test 1: Check if server is responding
            await this.testServerHealth();
            
            // Test 2: Test navigation to key pages
            await this.testPageNavigation(browser);
            
            // Test 3: Check for stream errors
            await this.checkStreamErrors(browser);
            
            // Test 4: Validate load times
            await this.validateLoadTimes();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            this.results.consoleErrors.push(error.message);
        } finally {
            if (browser) await browser.close();
        }
        
        return this.results;
    }

    async testServerHealth() {
        console.log('📡 Testing server health...');
        
        try {
            const response = await axios.get('http://localhost:8082', { 
                timeout: 5000,
                validateStatus: () => true 
            });
            
            if (response.status === 200) {
                console.log('✅ Frontend server is healthy\n');
            } else {
                console.log(`⚠️ Frontend server returned status ${response.status}\n`);
            }
        } catch (error) {
            console.log('❌ Frontend server not responding\n');
            throw new Error('Server not running - please restart Expo with "npm run web"');
        }
    }

    async testPageNavigation(browser) {
        console.log('🧭 Testing page navigation...');
        
        const pages = [
            { url: 'http://localhost:8082/', name: 'Home' },
            { url: 'http://localhost:8082/deals', name: 'Deals' },
            { url: 'http://localhost:8082/profile', name: 'Profile' },
            { url: 'http://localhost:8082/messages', name: 'Messages' },
            { url: 'http://localhost:8082/notifications', name: 'Notifications' }
        ];

        for (const pageInfo of pages) {
            const page = await browser.newPage();
            
            // Capture console errors
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    const text = msg.text();
                    if (text.includes('Cannot pipe') || text.includes('stream')) {
                        this.results.streamErrors.push({
                            page: pageInfo.name,
                            error: text
                        });
                    }
                    this.results.consoleErrors.push({
                        page: pageInfo.name,
                        error: text
                    });
                }
            });

            try {
                const startTime = Date.now();
                await page.goto(pageInfo.url, { 
                    waitUntil: 'networkidle0',
                    timeout: 10000 
                });
                const loadTime = Date.now() - startTime;
                
                this.results.pageLoadTimes[pageInfo.name] = loadTime;
                
                // Check if page has content
                const hasContent = await page.evaluate(() => {
                    return document.body.innerText.trim().length > 50;
                });
                
                if (hasContent && loadTime < 8000) {
                    this.results.successfulPages.push(pageInfo.name);
                    console.log(`✅ ${pageInfo.name}: Loaded in ${loadTime}ms`);
                } else {
                    this.results.failedPages.push(pageInfo.name);
                    console.log(`❌ ${pageInfo.name}: Failed or slow (${loadTime}ms)`);
                }
                
            } catch (error) {
                this.results.failedPages.push(pageInfo.name);
                console.log(`❌ ${pageInfo.name}: ${error.message}`);
            } finally {
                await page.close();
            }
        }
        console.log('');
    }

    async checkStreamErrors(browser) {
        console.log('🔍 Checking for stream errors...');
        
        const page = await browser.newPage();
        const streamErrors = [];
        
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Cannot pipe to') || 
                text.includes('closed stream') ||
                text.includes('Stream') ||
                text.includes('EPIPE')) {
                streamErrors.push(text);
            }
        });

        try {
            // Navigate to trigger potential stream errors
            await page.goto('http://localhost:8082/', { waitUntil: 'networkidle0' });
            await page.goto('http://localhost:8082/deals', { waitUntil: 'networkidle0' });
            
            // Wait a bit for any delayed errors
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            // Ignore navigation errors for this test
        } finally {
            await page.close();
        }

        if (streamErrors.length === 0) {
            console.log('✅ No stream errors detected\n');
        } else {
            console.log(`❌ Found ${streamErrors.length} stream errors\n`);
            this.results.streamErrors = this.results.streamErrors.concat(streamErrors);
        }
    }

    validateLoadTimes() {
        console.log('⏱️ Validating page load times...');
        
        const slowPages = Object.entries(this.results.pageLoadTimes)
            .filter(([page, time]) => time > 3000)
            .map(([page, time]) => `${page} (${time}ms)`);
            
        if (slowPages.length === 0) {
            console.log('✅ All pages load within 3 seconds\n');
        } else {
            console.log(`⚠️ Slow pages: ${slowPages.join(', ')}\n`);
        }
    }

    generateReport() {
        console.log('📊 VALIDATION REPORT');
        console.log('═'.repeat(50));
        
        // Overall status
        const allPagesWork = this.results.failedPages.length === 0;
        const noStreamErrors = this.results.streamErrors.length === 0;
        const fastLoading = Object.values(this.results.pageLoadTimes).every(time => time < 3000);
        
        this.results.navigationFixed = allPagesWork && noStreamErrors;
        
        console.log('\n🎯 OVERALL STATUS:');
        if (this.results.navigationFixed) {
            console.log('🎉 NAVIGATION ISSUES FIXED!');
        } else {
            console.log('❌ NAVIGATION ISSUES PERSIST');
        }
        
        // Detailed results
        console.log('\n📋 DETAILED RESULTS:');
        console.log(`✅ Successful pages: ${this.results.successfulPages.length}/5`);
        console.log(`❌ Failed pages: ${this.results.failedPages.length}/5`);
        console.log(`🔧 Stream errors: ${this.results.streamErrors.length}`);
        console.log(`⏱️ Average load time: ${this.calculateAverageLoadTime()}ms`);
        
        // Issues found
        if (this.results.failedPages.length > 0) {
            console.log('\n❌ FAILED PAGES:');
            this.results.failedPages.forEach(page => {
                console.log(`   - ${page}`);
            });
        }
        
        if (this.results.streamErrors.length > 0) {
            console.log('\n🔧 STREAM ERRORS:');
            this.results.streamErrors.slice(0, 3).forEach(error => {
                console.log(`   - ${error.substring(0, 80)}...`);
            });
        }
        
        // Next steps
        console.log('\n🔄 NEXT STEPS:');
        if (!this.results.navigationFixed) {
            console.log('1. Restart Expo development server: npm run web');
            console.log('2. Clear browser cache');
            console.log('3. Run validation again');
        } else {
            console.log('1. Continue with router configuration updates');
            console.log('2. Test authentication flow');
            console.log('3. Implement loading states');
        }
        
        console.log('═'.repeat(50));
    }

    calculateAverageLoadTime() {
        const times = Object.values(this.results.pageLoadTimes);
        if (times.length === 0) return 0;
        const sum = times.reduce((a, b) => a + b, 0);
        return Math.round(sum / times.length);
    }
}

// Run validation
if (require.main === module) {
    const validator = new NavigationValidator();
    validator.validate().then(results => {
        process.exit(results.navigationFixed ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = NavigationValidator;