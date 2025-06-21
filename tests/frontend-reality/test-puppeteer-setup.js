/**
 * Test Puppeteer Setup and Browser Dependencies
 * 
 * This script verifies that Puppeteer can launch a browser
 * and perform basic operations needed for frontend testing
 */

const puppeteer = require('../../frontend/node_modules/puppeteer');

async function testPuppeteerSetup() {
    console.log('🔧 Testing Puppeteer Setup and Browser Dependencies...\n');
    
    try {
        console.log('1. Launching browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        console.log('✅ Browser launched successfully');
        
        console.log('2. Creating new page...');
        const page = await browser.newPage();
        console.log('✅ Page created successfully');
        
        console.log('3. Testing navigation...');
        await page.goto('data:text/html,<h1>Test Page</h1><p>Puppeteer is working!</p>');
        console.log('✅ Navigation works');
        
        console.log('4. Testing page content extraction...');
        const title = await page.evaluate(() => document.querySelector('h1').textContent);
        console.log(`✅ Content extraction works: "${title}"`);
        
        console.log('5. Testing viewport configuration...');
        await page.setViewport({ width: 1920, height: 1080 });
        console.log('✅ Viewport configuration works');
        
        console.log('6. Testing mobile simulation...');
        await page.setViewport({ width: 375, height: 667 });
        console.log('✅ Mobile simulation works');
        
        console.log('7. Closing browser...');
        await browser.close();
        console.log('✅ Browser closed successfully');
        
        console.log('\n🎉 PUPPETEER SETUP VERIFIED');
        console.log('All browser dependencies are working correctly!');
        console.log('Ready for frontend bug hunting automation.\n');
        
        return true;
        
    } catch (error) {
        console.error('❌ PUPPETEER SETUP FAILED');
        console.error('Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('• Check if Chrome/Chromium dependencies are installed');
        console.error('• Verify headless mode compatibility');
        console.error('• Ensure sufficient system resources\n');
        
        return false;
    }
}

// Run the test
if (require.main === module) {
    testPuppeteerSetup()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { testPuppeteerSetup };