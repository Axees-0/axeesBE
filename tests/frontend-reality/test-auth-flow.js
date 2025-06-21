#!/usr/bin/env node

/**
 * Authentication Flow Test Script
 * 
 * Tests the complete authentication flow with real credentials
 * Verifies the integration between credential validation and test execution
 */

const config = require('./config');
const credentialValidator = require('./utils/credential-validator');
const AuthenticationBugHunter = require('./specific-bug-tests/authentication-flow-bugs');

async function testAuthenticationFlow() {
    console.log('🔐 Testing Complete Authentication Flow\n');
    
    try {
        // Step 1: Validate credentials
        console.log('Step 1: Validating credentials...');
        await credentialValidator.preFlightCheck();
        
        // Step 2: Test backend connectivity
        console.log('\nStep 2: Testing backend connectivity...');
        const validation = await credentialValidator.validateAllCredentials();
        
        if (!validation.valid) {
            console.error('❌ Backend connectivity failed');
            validation.errors.forEach(error => console.error(`   • ${error}`));
            return false;
        }
        
        console.log('✅ Backend connectivity verified');
        
        // Step 3: Test authentication with Puppeteer
        console.log('\nStep 3: Testing authentication with browser automation...');
        
        const authHunter = new AuthenticationBugHunter();
        try {
            await authHunter.initialize();
            
            // Run a simple login test
            await testBrowserLogin(authHunter);
            
            console.log('✅ Browser authentication test passed');
            
        } finally {
            await authHunter.cleanup();
        }
        
        console.log('\n🎉 Complete authentication flow test passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Authentication flow test failed:', error.message);
        return false;
    }
}

/**
 * Test login process with browser automation
 */
async function testBrowserLogin(authHunter) {
    const page = authHunter.page;
    const selector = authHunter.selector;
    const credentials = config.testCredentials;
    
    try {
        // Navigate to login page
        await page.goto(`${config.frontendUrl}/login`);
        
        // Wait for login form
        await page.waitForTimeout(2000);
        
        // Try to find login form elements
        const hasEmailField = await selector.elementExists(selector.selectors.emailInput, { timeout: 2000 });
        const hasPhoneField = await selector.elementExists(selector.selectors.phoneInput, { timeout: 2000 });
        const hasPasswordField = await selector.elementExists(selector.selectors.passwordInput, { timeout: 2000 });
        const hasSubmitButton = await selector.elementExists(selector.selectors.submitButton, { timeout: 2000 });
        
        console.log(`   📧 Email field found: ${hasEmailField}`);
        console.log(`   📱 Phone field found: ${hasPhoneField}`);
        console.log(`   🔒 Password field found: ${hasPasswordField}`);
        console.log(`   🔘 Submit button found: ${hasSubmitButton}`);
        
        if (!hasPasswordField || !hasSubmitButton) {
            throw new Error('Login form not complete - missing required fields');
        }
        
        // Try login based on available fields
        if (hasPhoneField && credentials.phone && !credentials.phone.includes('REPLACE_WITH')) {
            console.log('   🔄 Attempting phone-based login...');
            await selector.typeIntoInput(selector.selectors.phoneInput, credentials.phone);
        } else if (hasEmailField) {
            console.log('   🔄 Attempting email-based login...');
            await selector.typeIntoInput(selector.selectors.emailInput, credentials.email);
        } else {
            throw new Error('No suitable login field found');
        }
        
        // Enter password
        await selector.typeIntoInput(selector.selectors.passwordInput, credentials.password);
        
        // Submit form
        await selector.clickElement(selector.selectors.submitButton);
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for success indicators
        const currentUrl = page.url();
        const hasErrorMessage = await selector.elementExists(selector.selectors.errorMessage, { timeout: 1000 });
        
        if (hasErrorMessage) {
            const errorText = await selector.getElementText(selector.selectors.errorMessage);
            throw new Error(`Login failed with error: ${errorText}`);
        }
        
        if (currentUrl.includes('/login')) {
            throw new Error('Still on login page - authentication may have failed');
        }
        
        console.log(`   ✅ Login successful - redirected to: ${currentUrl}`);
        
    } catch (error) {
        // Take screenshot for debugging
        try {
            await page.screenshot({ path: `./auth-test-debug-${Date.now()}.png`, fullPage: true });
            console.log('📸 Debug screenshot saved');
        } catch (e) {
            // Ignore screenshot errors
        }
        
        throw error;
    }
}

/**
 * Test credential validation without browser
 */
async function testCredentialValidationOnly() {
    console.log('🔐 Testing Credential Validation Only\n');
    
    try {
        const validation = await credentialValidator.validateAllCredentials();
        
        console.log('📋 Validation Results:');
        console.log(`   Valid: ${validation.valid}`);
        
        if (validation.errors.length > 0) {
            console.log('   Errors:');
            validation.errors.forEach(error => console.log(`     • ${error}`));
        }
        
        if (validation.warnings.length > 0) {
            console.log('   Warnings:');
            validation.warnings.forEach(warning => console.log(`     • ${warning}`));
        }
        
        return validation.valid;
    } catch (error) {
        console.error('❌ Credential validation failed:', error.message);
        return false;
    }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--credentials-only') || args.includes('-c')) {
    testCredentialValidationOnly()
        .then(success => process.exit(success ? 0 : 1))
        .catch(() => process.exit(1));
} else {
    testAuthenticationFlow()
        .then(success => process.exit(success ? 0 : 1))
        .catch(() => process.exit(1));
}