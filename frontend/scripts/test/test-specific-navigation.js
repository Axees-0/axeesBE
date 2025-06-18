#!/usr/bin/env node

/**
 * TEST SPECIFIC NAVIGATION
 * Quick test to check if navigation is actually working
 */

const puppeteer = require('puppeteer');

async function testNavigation() {
    console.log('🧪 Testing specific navigation paths...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Capture console messages
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text()
            });
        });

        // Test 1: Home page
        console.log('📍 Testing Home page...');
        await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded' });
        const homeContent = await page.evaluate(() => {
            return {
                title: document.title,
                hasInfluencers: document.body.innerText.includes('Alex Thunder'),
                url: window.location.href,
                bodyLength: document.body.innerText.length
            };
        });
        console.log('   Title:', homeContent.title);
        console.log('   Has influencers:', homeContent.hasInfluencers ? '✅' : '❌');
        console.log('   Content length:', homeContent.bodyLength);
        console.log('');

        // Test 2: Navigate to Deals
        console.log('📍 Testing Deals navigation...');
        await page.goto('http://localhost:8081/deals', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for React to render
        
        const dealsContent = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 200),
                hasContent: document.body.innerText.length > 100
            };
        });
        console.log('   URL:', dealsContent.url);
        console.log('   Has content:', dealsContent.hasContent ? '✅' : '❌');
        console.log('   Body preview:', dealsContent.bodyText);
        console.log('');

        // Test 3: Check console errors
        const errors = consoleLogs.filter(log => log.type === 'error');
        const streamErrors = errors.filter(e => e.text.includes('stream') || e.text.includes('pipe'));
        
        console.log('🔍 Console Analysis:');
        console.log('   Total logs:', consoleLogs.length);
        console.log('   Errors:', errors.length);
        console.log('   Stream errors:', streamErrors.length);
        
        if (errors.length > 0) {
            console.log('\n❌ Errors found:');
            errors.slice(0, 3).forEach(error => {
                console.log('   -', error.text.substring(0, 100));
            });
        }

        // Test 4: Check if router is working
        console.log('\n🔧 Router Status:');
        const routerStatus = await page.evaluate(() => {
            return {
                hasRouter: typeof window !== 'undefined' && window.__EXPO_ROUTER_APP_ROOT__,
                pathname: window.location.pathname,
                hasReactRoot: document.getElementById('root') !== null
            };
        });
        console.log('   Expo Router:', routerStatus.hasRouter ? '✅ Active' : '❌ Not found');
        console.log('   Current path:', routerStatus.pathname);
        console.log('   React root:', routerStatus.hasReactRoot ? '✅ Found' : '❌ Missing');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) await browser.close();
    }
}

// Run test
testNavigation().catch(console.error);