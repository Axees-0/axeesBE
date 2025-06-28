/**
 * Basic Bug Hunt Runner
 * 
 * Runs frontend tests that don't require authentication credentials
 * This allows us to test basic functionality without configuring real user credentials
 */

const puppeteer = require('puppeteer');

class BasicBugHunter {
    constructor() {
        this.startTime = Date.now();
        this.bugs = [];
        this.frontendUrl = 'http://localhost:19006';
    }

    async runBasicTests() {
        console.log('🎯 BASIC FRONTEND BUG HUNT');
        console.log('=========================');
        console.log(`Testing: ${this.frontendUrl}`);
        console.log('');

        try {
            await this.testBasicPageLoading();
            await this.testBasicNavigation();
            await this.testBasicResponsiveness();
            await this.testBasicPerformance();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Basic bug hunt failed:', error.message);
            this.generateErrorReport(error);
        }
    }

    async testBasicPageLoading() {
        console.log('📄 Testing: Basic page loading');
        
        let browser, page;
        
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });
            
            page = await browser.newPage();
            
            // Test home page load
            const startTime = Date.now();
            const response = await page.goto(this.frontendUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            const loadTime = Date.now() - startTime;
            
            if (!response.ok()) {
                this.logBug('HIGH', 'Page Load Failed', `Home page returned ${response.status()}`);
            }
            
            if (loadTime > 5000) {
                this.logBug('MEDIUM', 'Slow Page Load', `Page took ${loadTime}ms to load (>5s)`);
            }
            
            // Check for basic React/Expo elements
            const hasReactRoot = await page.$('#root, #__next, [data-reactroot]');
            if (!hasReactRoot) {
                this.logBug('HIGH', 'React App Not Loading', 'No React root element found');
            }
            
            // Check for JavaScript errors
            const jsErrors = [];
            page.on('pageerror', error => {
                jsErrors.push(error.message);
            });
            
            await page.waitForTimeout(2000);
            
            if (jsErrors.length > 0) {
                this.logBug('HIGH', 'JavaScript Errors', `${jsErrors.length} JS errors: ${jsErrors[0]}`);
            }
            
            console.log(`  ✅ Page loaded in ${loadTime}ms`);
            
        } catch (error) {
            this.logBug('CRITICAL', 'Page Load Failure', `Cannot load page: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }
    }

    async testBasicNavigation() {
        console.log('🧭 Testing: Basic navigation');
        
        let browser, page;
        
        try {
            browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            page = await browser.newPage();
            
            await page.goto(this.frontendUrl, { waitUntil: 'networkidle2' });
            
            // Look for common navigation elements
            const navElements = await page.$$('nav, [role="navigation"], .navigation, .navbar, .header');
            if (navElements.length === 0) {
                this.logBug('LOW', 'No Navigation', 'No navigation elements found');
            }
            
            // Test common links
            const testPaths = ['/login', '/register', '/dashboard', '/profile'];
            
            for (const path of testPaths) {
                try {
                    const fullUrl = `${this.frontendUrl}${path}`;
                    const response = await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 10000 });
                    
                    if (response.status() === 404) {
                        console.log(`  ⚠️  Route ${path} returns 404 (may be expected)`);
                    } else if (!response.ok()) {
                        this.logBug('MEDIUM', 'Route Error', `Route ${path} returns ${response.status()}`);
                    } else {
                        console.log(`  ✅ Route ${path} accessible`);
                    }
                } catch (error) {
                    console.log(`  ⚠️  Route ${path} failed: ${error.message}`);
                }
            }
            
        } catch (error) {
            this.logBug('MEDIUM', 'Navigation Test Failed', error.message);
        } finally {
            if (browser) await browser.close();
        }
    }

    async testBasicResponsiveness() {
        console.log('📱 Testing: Basic responsiveness');
        
        let browser, page;
        
        try {
            browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            page = await browser.newPage();
            
            // Test mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(this.frontendUrl, { waitUntil: 'networkidle2' });
            
            // Check for horizontal scrollbars (responsive issue)
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            
            if (hasHorizontalScroll) {
                this.logBug('MEDIUM', 'Horizontal Scroll', 'Page has horizontal scrollbar on mobile viewport');
            }
            
            // Test desktop viewport
            await page.setViewport({ width: 1920, height: 1080 });
            await page.reload({ waitUntil: 'networkidle2' });
            
            console.log('  ✅ Responsiveness basic checks completed');
            
        } catch (error) {
            this.logBug('MEDIUM', 'Responsiveness Test Failed', error.message);
        } finally {
            if (browser) await browser.close();
        }
    }

    async testBasicPerformance() {
        console.log('⚡ Testing: Basic performance');
        
        let browser, page;
        
        try {
            browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            page = await browser.newPage();
            
            // Enable performance tracking
            await page.coverage.startJSCoverage();
            
            const startTime = Date.now();
            await page.goto(this.frontendUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            // Check memory usage
            const metrics = await page.metrics();
            const memoryMB = metrics.JSHeapUsedSize / 1024 / 1024;
            
            if (memoryMB > 50) {
                this.logBug('LOW', 'High Memory Usage', `Page uses ${memoryMB.toFixed(1)}MB memory`);
            }
            
            // Check for large bundle size
            const jsCoverage = await page.coverage.stopJSCoverage();
            const totalBytes = jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
            const bundleSizeMB = totalBytes / 1024 / 1024;
            
            if (bundleSizeMB > 5) {
                this.logBug('MEDIUM', 'Large Bundle Size', `JavaScript bundle is ${bundleSizeMB.toFixed(1)}MB`);
            }
            
            console.log(`  ✅ Load time: ${loadTime}ms, Memory: ${memoryMB.toFixed(1)}MB, Bundle: ${bundleSizeMB.toFixed(1)}MB`);
            
        } catch (error) {
            this.logBug('MEDIUM', 'Performance Test Failed', error.message);
        } finally {
            if (browser) await browser.close();
        }
    }

    logBug(severity, category, description) {
        this.bugs.push({
            severity,
            category,
            description,
            timestamp: new Date().toISOString(),
            url: this.frontendUrl
        });
        console.log(`  ${severity}: ${category} - ${description}`);
    }

    generateReport() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('🏁 BASIC BUG HUNT COMPLETE');
        console.log('='.repeat(60));
        
        const criticalBugs = this.bugs.filter(b => b.severity === 'CRITICAL' || b.severity === 'HIGH');
        const mediumBugs = this.bugs.filter(b => b.severity === 'MEDIUM');
        const lowBugs = this.bugs.filter(b => b.severity === 'LOW');
        
        console.log('\n📊 SUMMARY');
        console.log('----------');
        console.log(`Total Bugs Found: ${this.bugs.length}`);
        console.log(`Critical/High: ${criticalBugs.length}`);
        console.log(`Medium: ${mediumBugs.length}`);
        console.log(`Low: ${lowBugs.length}`);
        console.log(`Test Duration: ${duration}s`);
        
        if (criticalBugs.length > 0) {
            console.log('\n🚨 CRITICAL/HIGH SEVERITY BUGS');
            console.log('-----------------------------');
            criticalBugs.forEach((bug, i) => {
                console.log(`\n${i + 1}. ${bug.category}`);
                console.log(`   ${bug.description}`);
            });
        }
        
        console.log('\n💡 NEXT STEPS');
        console.log('-------------');
        if (criticalBugs.length === 0) {
            console.log('✅ Basic frontend functionality appears working');
            console.log('📋 To run comprehensive tests:');
            console.log('   1. Configure real test credentials in .env file');
            console.log('   2. Set up backend API endpoint');
            console.log('   3. Run: node run-comprehensive-bug-hunt.js');
        } else {
            console.log('⚠️  Fix critical issues before proceeding to comprehensive tests');
        }
    }

    generateErrorReport(error) {
        console.log('\n❌ BASIC BUG HUNT FAILED');
        console.log('------------------------');
        console.log('Error:', error.message);
        console.log('This may indicate the frontend is not properly running');
    }
}

// Run if called directly
if (require.main === module) {
    const hunter = new BasicBugHunter();
    hunter.runBasicTests()
        .then(() => {
            console.log('\n✅ Basic bug hunt completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Basic bug hunt failed:', error);
            process.exit(1);
        });
}

module.exports = BasicBugHunter;