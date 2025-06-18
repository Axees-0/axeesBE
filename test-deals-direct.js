#!/usr/bin/env node

/**
 * Test deals API directly
 */

const axios = require('axios');

async function testDealsAPI() {
    console.log('🔍 Testing deals API directly...\n');
    
    try {
        // Test backend API
        console.log('📡 Testing backend deals API...');
        const backendUrl = 'http://localhost:8080/api/deals';
        
        // Try with some test parameters
        const testUrls = [
            `${backendUrl}`,
            `${backendUrl}?role=creator`,
            `${backendUrl}?role=marketer`,
            `${backendUrl}?role=marketer&userId=anyId`
        ];
        
        for (const testUrl of testUrls) {
            const response = await axios.get(testUrl, { 
                timeout: 10000,
                validateStatus: () => true 
            });
            
            console.log(`📊 URL: ${testUrl}`);
            console.log(`📊 Status: ${response.status}`);
            console.log(`📊 Data:`, JSON.stringify(response.data, null, 2).substring(0, 200));
            console.log('---');
        }
        
    } catch (error) {
        console.log('❌ Backend API error:', error.message);
        
        // Try alternative endpoints
        console.log('\n🔍 Trying alternative endpoints...');
        
        const endpoints = [
            'http://localhost:8080/api/marketerDeals',
            'http://localhost:8080/api/deal',
            'http://localhost:8080/api/deals/all'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, { timeout: 5000, validateStatus: () => true });
                console.log(`${endpoint}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
            } catch (err) {
                console.log(`${endpoint}: Error - ${err.message}`);
            }
        }
    }
    
    // Test what routes are actually available on frontend
    console.log('\n🌐 Testing frontend routes...');
    const frontendRoutes = [
        'http://localhost:8082/',
        'http://localhost:8082/profile', 
        'http://localhost:8082/messages',
        'http://localhost:8082/notifications'
    ];
    
    for (const route of frontendRoutes) {
        try {
            const response = await axios.get(route, { timeout: 5000, validateStatus: () => true });
            const hasContent = response.data && response.data.length > 100;
            console.log(`${route}: ${response.status} ${hasContent ? '✅ Has content' : '❌ No content'}`);
        } catch (err) {
            console.log(`${route}: Error - ${err.message}`);
        }
    }
}

testDealsAPI().catch(console.error);