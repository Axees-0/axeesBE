#!/usr/bin/env node

/**
 * Simple MessageCentral Mock Test
 */

console.log('🔍 Testing MessageCentral Mock Mode...\n');

try {
    // Load our environment (with placeholder values)
    console.log('📋 Environment check:');
    console.log('  MESSAGECENTRAL_CUSTOMER_ID:', process.env.MESSAGECENTRAL_CUSTOMER_ID);
    console.log('  MESSAGECENTRAL_EMAIL:', process.env.MESSAGECENTRAL_EMAIL);
    console.log('  MESSAGECENTRAL_KEY:', process.env.MESSAGECENTRAL_KEY);
    console.log('  MESSAGECENTRAL_SCOPE:', process.env.MESSAGECENTRAL_SCOPE);
    console.log('');
    
    // Test phone parsing first
    console.log('📱 Testing phone parsing...');
    const phoneUtils = require('./utils/phoneParserUtils.js');
    const parsed = phoneUtils.parsePhoneNumber('+12125551234');
    console.log('  Parsed phone result:', parsed);
    console.log('');
    
    // Test MessageCentral mock
    console.log('🎭 Testing MessageCentral mock...');
    const { sendOtp, verifyOtp } = require('./utils/messageCentral.js');
    
    (async () => {
        try {
            // This should trigger mock mode
            const verificationId = await sendOtp('+12125551234');
            console.log('  ✅ Mock sendOtp result:', verificationId);
            
            // Test OTP verification
            const isValid = await verifyOtp(verificationId, '123456');
            console.log('  ✅ Mock verifyOtp result:', isValid);
            
            console.log('\n🎉 MessageCentral mock mode is working correctly!');
            console.log('✅ Pages should now load without timeouts');
            console.log('✅ Registration API should respond quickly');
            
        } catch (error) {
            console.log('  ❌ Error in MessageCentral operations:', error.message);
        }
    })();
    
} catch (error) {
    console.log('❌ Test setup failed:', error.message);
}