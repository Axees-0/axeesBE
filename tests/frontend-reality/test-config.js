/**
 * Test Environment Configuration
 * 
 * Verifies that environment variables and configuration loading works correctly
 */

const config = require('./config');

function testConfiguration() {
    console.log('🧪 Testing Environment Configuration...\n');
    
    try {
        // Print configuration summary
        config.printSummary();
        
        // Test basic configuration
        console.log('✅ Configuration loaded successfully');
        console.log(`   Frontend URL: ${config.frontendUrl}`);
        
        // Test environment detection
        const envInfo = config.getEnvironmentInfo();
        console.log(`✅ Environment detected: ${envInfo.environment}`);
        console.log(`   Is Local: ${envInfo.isLocal}`);
        console.log(`   Is Secure: ${envInfo.isSecure}`);
        
        // Test browser options
        const browserOptions = config.getBrowserOptions();
        console.log(`✅ Browser options configured`);
        console.log(`   Headless: ${browserOptions.headless}`);
        console.log(`   Viewport: ${browserOptions.defaultViewport.width}x${browserOptions.defaultViewport.height}`);
        
        // Test mobile viewport
        const mobileViewport = config.getMobileViewport();
        console.log(`✅ Mobile viewport configured`);
        console.log(`   Size: ${mobileViewport.width}x${mobileViewport.height}`);
        console.log(`   Touch: ${mobileViewport.hasTouch}`);
        
        // Test test credentials (without printing sensitive data)
        const creds = config.testCredentials;
        console.log(`✅ Test credentials configured`);
        console.log(`   Email domain: ${creds.email.split('@')[1]}`);
        
        console.log('\n🎉 CONFIGURATION TEST PASSED');
        console.log('Environment variables are properly configured for bug hunting!\n');
        
        return true;
        
    } catch (error) {
        console.error('❌ CONFIGURATION TEST FAILED');
        console.error('Error:', error.message);
        console.error('\nPlease check your .env file and configuration\n');
        
        return false;
    }
}

// Run the test
if (require.main === module) {
    testConfiguration()
        .then ? testConfiguration().then(success => process.exit(success ? 0 : 1))
        : process.exit(testConfiguration() ? 0 : 1);
}

module.exports = { testConfiguration };