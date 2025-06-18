#!/usr/bin/env node

/**
 * MESSAGECENTRAL FIX VALIDATION SCRIPT
 * 
 * Tests that MessageCentral mock mode is working correctly
 */

const axios = require('axios');

class MessageCentralTester {
    constructor() {
        this.results = {
            backendHealthy: false,
            frontendHealthy: false,
            mockModeWorking: false,
            registrationWorking: false,
            errors: []
        };
    }

    async test() {
        console.log('🔍 MESSAGECENTRAL FIX VALIDATION STARTING...\n');
        
        try {
            // Test 1: Check backend health
            await this.testBackendHealth();
            
            // Test 2: Check frontend health
            await this.testFrontendHealth();
            
            // Test 3: Test mock MessageCentral token generation
            await this.testMockTokenGeneration();
            
            // Test 4: Test registration API with mock mode
            await this.testRegistrationWithMockMode();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Testing failed:', error.message);
            this.results.errors.push(error.message);
        }
        
        return this.results;
    }

    async testBackendHealth() {
        console.log('📡 Testing backend health...');
        
        try {
            const response = await axios.get('http://localhost:8080/api/auth/test', { 
                timeout: 5000,
                validateStatus: () => true 
            });
            
            if (response.status === 200) {
                this.results.backendHealthy = true;
                console.log('✅ Backend server is healthy\n');
            } else {
                console.log(`⚠️ Backend server returned status ${response.status}\n`);
            }
        } catch (error) {
            console.log('❌ Backend server not responding\n');
            this.results.errors.push('Backend server not running');
        }
    }

    async testFrontendHealth() {
        console.log('📱 Testing frontend health...');
        
        try {
            const response = await axios.get('http://localhost:8082', { 
                timeout: 5000,
                validateStatus: () => true 
            });
            
            if (response.status === 200) {
                this.results.frontendHealthy = true;
                console.log('✅ Frontend server is healthy\n');
            } else {
                console.log(`⚠️ Frontend server returned status ${response.status}\n`);
            }
        } catch (error) {
            console.log('❌ Frontend server not responding\n');
            this.results.errors.push('Frontend server not running');
        }
    }

    async testMockTokenGeneration() {
        console.log('🎭 Testing MessageCentral mock token generation...');
        
        try {
            // Direct require to test the utility
            const { sendOtp, verifyOtp } = require('./utils/messageCentral.js');
            
            // Test by calling the MessageCentral utility directly
            process.env.MESSAGECENTRAL_CUSTOMER_ID = 'your_customer_id_here';
            const { getMessageCentralToken } = require('./utils/messageCentral.js');
            
            // This should trigger mock mode and return mock verification ID
            const mockVerificationId = await sendOtp('+1234567890');
            
            if (mockVerificationId && mockVerificationId.includes('mock-verification')) {
                this.results.mockModeWorking = true;
                console.log('✅ Mock OTP sent successfully: ' + mockVerificationId + '\n');
            } else {
                console.log('❌ Expected mock verification ID, got: ' + mockVerificationId + '\n');
                this.results.errors.push('Mock mode not working correctly');
            }
        } catch (error) {
            console.log('❌ Mock token generation failed: ' + error.message + '\n');
            this.results.errors.push('Mock token generation failed: ' + error.message);
        }
    }

    async testRegistrationWithMockMode() {
        console.log('📝 Testing registration API with mock mode...');
        
        if (!this.results.backendHealthy) {
            console.log('⚠️ Skipping registration test - backend not healthy\n');
            return;
        }
        
        try {
            const testData = {
                phone: '+1234567890',
                userType: 'creator'
            };
            
            const response = await axios.post('http://localhost:8080/api/auth/register', testData, {
                timeout: 10000,
                validateStatus: () => true 
            });
            
            console.log('📊 Registration Response Status:', response.status);
            console.log('📊 Registration Response Data:', JSON.stringify(response.data, null, 2));
            
            // Check if it's a mock response or doesn't timeout
            if (response.status === 200 || response.status === 201 || 
                (response.data && response.data.message && response.data.message.includes('mock'))) {
                this.results.registrationWorking = true;
                console.log('✅ Registration completed without timeout\n');
            } else if (response.status === 400 && response.data.message === 'User already exists') {
                this.results.registrationWorking = true;
                console.log('✅ Registration responded quickly (user exists)\n');
            } else {
                console.log('⚠️ Registration returned unexpected response\n');
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                console.log('❌ Registration timed out - MessageCentral fix not working\n');
                this.results.errors.push('Registration API still timing out');
            } else {
                console.log('❌ Registration failed: ' + error.message + '\n');
            }
        }
    }

    generateReport() {
        console.log('📊 MESSAGECENTRAL FIX VALIDATION REPORT');
        console.log('═'.repeat(60));
        
        // Overall status
        const allSystemsWorking = this.results.backendHealthy && 
                                 this.results.frontendHealthy && 
                                 this.results.mockModeWorking;
        
        console.log('\n🎯 OVERALL STATUS:');
        if (allSystemsWorking) {
            console.log('🎉 MESSAGECENTRAL FIX IS WORKING!');
        } else {
            console.log('❌ MESSAGECENTRAL FIX NEEDS ATTENTION');
        }
        
        // Detailed results
        console.log('\n📋 DETAILED RESULTS:');
        console.log(`🔧 Backend Health: ${this.results.backendHealthy ? '✅' : '❌'}`);
        console.log(`📱 Frontend Health: ${this.results.frontendHealthy ? '✅' : '❌'}`);
        console.log(`🎭 Mock Mode Working: ${this.results.mockModeWorking ? '✅' : '❌'}`);
        console.log(`📝 Registration Working: ${this.results.registrationWorking ? '✅' : '❌'}`);
        console.log(`🐛 Errors Found: ${this.results.errors.length}`);
        
        // Errors
        if (this.results.errors.length > 0) {
            console.log('\n🐛 ERRORS FOUND:');
            this.results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        // Next steps
        console.log('\n🔄 NEXT STEPS:');
        if (allSystemsWorking) {
            console.log('✅ MessageCentral fix is working correctly!');
            console.log('✅ Pages should now load without timeouts');
            console.log('✅ Registration API should respond quickly');
            console.log('🎯 Ready to test page navigation');
        } else {
            if (!this.results.backendHealthy) {
                console.log('1. Start backend server: node app.js');
            }
            if (!this.results.frontendHealthy) {
                console.log('2. Start frontend server: cd frontend && npm start');
            }
            if (!this.results.mockModeWorking) {
                console.log('3. Check MessageCentral utility configuration');
            }
        }
        
        console.log('═'.repeat(60));
    }
}

// Run validation
if (require.main === module) {
    const tester = new MessageCentralTester();
    tester.test().then(results => {
        const success = results.backendHealthy && results.frontendHealthy && results.mockModeWorking;
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = MessageCentralTester;