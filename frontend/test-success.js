#!/usr/bin/env node

/**
 * AXEES CLOSED FEEDBACK LOOP TESTING SYSTEM
 * 
 * This script implements a comprehensive testing framework that validates
 * the entire user journey from search to real influencer results.
 * 
 * SUCCESS CRITERIA:
 * - Users can see actual influencer profiles (not "Please standby")
 * - Search results contain real, interactive influencer cards
 * - Complete end-to-end functionality working
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

class AxeesSuccessValidator {
    constructor() {
        this.testResults = {
            infrastructure: {},
            api: {},
            frontend: {},
            userExperience: {},
            overall: { passed: false, score: 0, maxScore: 0 }
        };
        
        this.criticalFailures = [];
        this.nextActions = [];
        this.progressIndicators = [];
    }

    async runCompleteValidation() {
        console.log('🚀 AXEES SUCCESS VALIDATION STARTING...\n');
        console.log('Target: Real influencer search results with interactive profiles\n');
        
        try {
            await this.testInfrastructure();
            await this.testAPILayer();
            await this.testFrontendIntegration();
            await this.testUserExperience();
            
            this.generateReport();
            this.generateNextActions();
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in test execution:', error.message);
            this.criticalFailures.push(`Test execution failed: ${error.message}`);
        }
        
        return this.testResults;
    }

    async testInfrastructure() {
        console.log('📋 LAYER 1: INFRASTRUCTURE VALIDATION');
        console.log('─'.repeat(50));
        
        // Test 1.1: Frontend Server
        try {
            const frontendResponse = await axios.get('http://localhost:8081', { timeout: 5000 });
            this.testResults.infrastructure.frontendServer = {
                passed: frontendResponse.status === 200,
                details: `Frontend server responded with status ${frontendResponse.status}`
            };
            console.log('✅ Frontend server (port 8081): RUNNING');
        } catch (error) {
            this.testResults.infrastructure.frontendServer = {
                passed: false,
                details: `Frontend server not accessible: ${error.message}`
            };
            console.log('❌ Frontend server (port 8081): NOT ACCESSIBLE');
            this.criticalFailures.push('Frontend server not running on port 8081');
        }

        // Test 1.2: Backend Server
        try {
            const backendResponse = await axios.get('http://localhost:8082/health', { timeout: 5000 });
            this.testResults.infrastructure.backendServer = {
                passed: backendResponse.status === 200,
                details: `Backend server health check: ${JSON.stringify(backendResponse.data)}`
            };
            console.log('✅ Backend server (port 8082): RUNNING');
        } catch (error) {
            this.testResults.infrastructure.backendServer = {
                passed: false,
                details: `Backend server not accessible: ${error.message}`
            };
            console.log('❌ Backend server (port 8082): NOT ACCESSIBLE');
            this.criticalFailures.push('Backend server not running on port 8082');
        }

        // Test 1.3: Database Connection (via backend health)
        try {
            const backendResponse = await axios.get('http://localhost:8082/health', { timeout: 5000 });
            const hasDbConnection = backendResponse.data && !backendResponse.data.error;
            this.testResults.infrastructure.database = {
                passed: hasDbConnection,
                details: `Database connection via backend health check`
            };
            console.log('✅ Database connection: ESTABLISHED');
        } catch (error) {
            this.testResults.infrastructure.database = {
                passed: false,
                details: `Cannot verify database connection: ${error.message}`
            };
            console.log('❌ Database connection: UNKNOWN');
        }

        console.log('');
    }

    async testAPILayer() {
        console.log('📡 LAYER 2: API FUNCTIONALITY VALIDATION');
        console.log('─'.repeat(50));

        // Test 2.1: Search API Structure
        try {
            const searchResponse = await axios.get('http://localhost:8082/api/find', { timeout: 10000 });
            const hasValidStructure = searchResponse.data && 
                                    typeof searchResponse.data.items === 'object' &&
                                    Array.isArray(searchResponse.data.items);
            
            this.testResults.api.structure = {
                passed: hasValidStructure,
                details: `API returns valid structure: ${hasValidStructure}`,
                response: searchResponse.data
            };
            
            if (hasValidStructure) {
                console.log('✅ Search API structure: VALID');
            } else {
                console.log('❌ Search API structure: INVALID');
                this.criticalFailures.push('Search API does not return valid structure');
            }
        } catch (error) {
            this.testResults.api.structure = {
                passed: false,
                details: `Search API request failed: ${error.message}`
            };
            console.log('❌ Search API structure: REQUEST FAILED');
            this.criticalFailures.push('Search API request failed');
        }

        // Test 2.2: Search API Data Content
        try {
            const searchResponse = await axios.get('http://localhost:8082/api/find', { timeout: 10000 });
            const hasActualData = searchResponse.data && 
                                searchResponse.data.items && 
                                searchResponse.data.items.length > 0;
            
            this.testResults.api.dataContent = {
                passed: hasActualData,
                details: `API returns ${searchResponse.data?.items?.length || 0} influencer items`,
                itemCount: searchResponse.data?.items?.length || 0,
                sampleData: searchResponse.data?.items?.[0] || null
            };
            
            if (hasActualData) {
                console.log(`✅ Search API data: ${searchResponse.data.items.length} INFLUENCERS FOUND`);
            } else {
                console.log('❌ Search API data: NO INFLUENCERS (empty results)');
                this.criticalFailures.push('Search API returns empty results - no influencer data available');
            }
        } catch (error) {
            this.testResults.api.dataContent = {
                passed: false,
                details: `Cannot verify API data content: ${error.message}`
            };
            console.log('❌ Search API data: VERIFICATION FAILED');
        }

        // Test 2.3: Influencer Data Quality
        if (this.testResults.api.dataContent?.passed) {
            const sampleInfluencer = this.testResults.api.dataContent.sampleData;
            const hasRequiredFields = sampleInfluencer && 
                                    sampleInfluencer.name && 
                                    sampleInfluencer.id;
            
            this.testResults.api.dataQuality = {
                passed: hasRequiredFields,
                details: `Sample influencer has required fields: ${hasRequiredFields}`,
                sampleFields: sampleInfluencer ? Object.keys(sampleInfluencer) : []
            };
            
            if (hasRequiredFields) {
                console.log('✅ Influencer data quality: VALID FIELDS');
            } else {
                console.log('❌ Influencer data quality: MISSING REQUIRED FIELDS');
                this.criticalFailures.push('Influencer data missing required fields (name, id)');
            }
        }

        console.log('');
    }

    async testFrontendIntegration() {
        console.log('🌐 LAYER 3: FRONTEND INTEGRATION VALIDATION');
        console.log('─'.repeat(50));

        let browser, page;
        try {
            browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            page = await browser.newPage();
            
            // Test 3.1: Page Loading
            await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });
            
            const pageTitle = await page.title();
            this.testResults.frontend.pageLoading = {
                passed: pageTitle === 'Axees',
                details: `Page title: "${pageTitle}"`
            };
            
            if (pageTitle === 'Axees') {
                console.log('✅ Page loading: SUCCESS');
            } else {
                console.log(`❌ Page loading: UNEXPECTED TITLE "${pageTitle}"`);
            }

            // Test 3.2: Critical UI Elements Present
            const searchBox = await page.$('input[placeholder*="Search"], input[placeholder*="creator"]');
            const categoryButtons = await page.$$('button');
            
            this.testResults.frontend.uiElements = {
                passed: searchBox !== null && categoryButtons.length > 0,
                details: `Search box found: ${searchBox !== null}, Buttons found: ${categoryButtons.length}`
            };
            
            if (searchBox && categoryButtons.length > 0) {
                console.log('✅ UI elements: SEARCH BOX AND BUTTONS PRESENT');
            } else {
                console.log('❌ UI elements: MISSING CRITICAL ELEMENTS');
                this.criticalFailures.push('Missing critical UI elements (search box or buttons)');
            }

            // Test 3.3: Loading State vs Real Content
            const bodyText = await page.evaluate(() => document.body.innerText);
            const hasStandbyMessage = bodyText.includes('Please standby') || bodyText.includes('Loading');
            const hasInfluencerContent = bodyText.includes('Influencer') || bodyText.includes('Creator') || 
                                       bodyText.includes('@') || bodyText.includes('followers');
            
            this.testResults.frontend.contentState = {
                passed: !hasStandbyMessage && hasInfluencerContent,
                details: `Standby message: ${hasStandbyMessage}, Influencer content: ${hasInfluencerContent}`,
                bodyText: bodyText.substring(0, 500)
            };
            
            if (!hasStandbyMessage && hasInfluencerContent) {
                console.log('✅ Content state: REAL INFLUENCER CONTENT DISPLAYED');
            } else if (hasStandbyMessage) {
                console.log('❌ Content state: STILL SHOWING "PLEASE STANDBY" MESSAGE');
                this.criticalFailures.push('Frontend still showing loading/standby message instead of real content');
            } else {
                console.log('❌ Content state: NO INFLUENCER CONTENT DETECTED');
                this.criticalFailures.push('Frontend not displaying influencer content');
            }

        } catch (error) {
            console.log(`❌ Frontend integration test failed: ${error.message}`);
            this.criticalFailures.push(`Frontend integration test failed: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }

        console.log('');
    }

    async testUserExperience() {
        console.log('👤 LAYER 4: USER EXPERIENCE VALIDATION');
        console.log('─'.repeat(50));

        let browser, page;
        try {
            browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            page = await browser.newPage();
            await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });

            // Test 4.1: Clickable Influencer Cards
            const clickableCards = await page.$$('div[role="button"], a[href*="profile"], button[data-testid*="influencer"]');
            const influencerNames = await page.$$eval('*', elements => 
                elements.filter(el => 
                    el.textContent && 
                    el.textContent.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) && 
                    el.offsetParent !== null
                ).length
            );

            this.testResults.userExperience.interactiveElements = {
                passed: clickableCards.length > 0 || influencerNames > 0,
                details: `Clickable cards: ${clickableCards.length}, Potential influencer names: ${influencerNames}`
            };

            if (clickableCards.length > 0 || influencerNames > 0) {
                console.log('✅ Interactive elements: INFLUENCER CARDS CLICKABLE');
            } else {
                console.log('❌ Interactive elements: NO CLICKABLE INFLUENCER CARDS');
                this.criticalFailures.push('No clickable influencer cards or profiles found');
            }

            // Test 4.2: Complete User Journey Possible
            const canSearch = await page.$('input[placeholder*="Search"], input[placeholder*="creator"]') !== null;
            const hasResults = !await page.evaluate(() => document.body.innerText.includes('Please standby'));
            const hasNavigation = await page.$$('nav, [role="navigation"]').then(nav => nav.length > 0);

            this.testResults.userExperience.completeJourney = {
                passed: canSearch && hasResults && hasNavigation,
                details: `Can search: ${canSearch}, Has results: ${hasResults}, Has navigation: ${hasNavigation}`
            };

            if (canSearch && hasResults && hasNavigation) {
                console.log('✅ Complete user journey: FULLY FUNCTIONAL');
            } else {
                console.log('❌ Complete user journey: INCOMPLETE FUNCTIONALITY');
                this.criticalFailures.push('Incomplete user journey - missing search, results, or navigation');
            }

        } catch (error) {
            console.log(`❌ User experience test failed: ${error.message}`);
            this.criticalFailures.push(`User experience test failed: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }

        console.log('');
    }

    generateReport() {
        console.log('📊 COMPREHENSIVE VALIDATION REPORT');
        console.log('═'.repeat(60));

        // Calculate overall score
        let totalTests = 0;
        let passedTests = 0;

        Object.values(this.testResults).forEach(layer => {
            if (typeof layer === 'object' && layer !== this.testResults.overall) {
                Object.values(layer).forEach(test => {
                    if (test && typeof test.passed === 'boolean') {
                        totalTests++;
                        if (test.passed) passedTests++;
                    }
                });
            }
        });

        this.testResults.overall.score = passedTests;
        this.testResults.overall.maxScore = totalTests;
        this.testResults.overall.passed = this.criticalFailures.length === 0 && passedTests === totalTests;

        console.log(`\n🎯 OVERALL SUCCESS SCORE: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
        
        if (this.testResults.overall.passed) {
            console.log('🎉 STATUS: SUCCESS - REAL INFLUENCER SEARCH RESULTS WORKING!');
        } else {
            console.log('❌ STATUS: FAILED - NOT YET SHOWING REAL INFLUENCER RESULTS');
        }

        // Critical Failures
        if (this.criticalFailures.length > 0) {
            console.log('\n🚨 CRITICAL FAILURES TO ADDRESS:');
            this.criticalFailures.forEach((failure, index) => {
                console.log(`   ${index + 1}. ${failure}`);
            });
        }

        console.log('\n📋 DETAILED LAYER RESULTS:');
        Object.entries(this.testResults).forEach(([layer, tests]) => {
            if (layer !== 'overall') {
                console.log(`\n${layer.toUpperCase()}:`);
                Object.entries(tests).forEach(([test, result]) => {
                    const status = result.passed ? '✅' : '❌';
                    console.log(`  ${status} ${test}: ${result.details}`);
                });
            }
        });
    }

    generateNextActions() {
        console.log('\n🎯 PRIORITIZED NEXT ACTIONS:');
        console.log('─'.repeat(40));

        // Generate specific next actions based on test results
        if (!this.testResults.infrastructure?.frontendServer?.passed) {
            this.nextActions.push('🔧 URGENT: Start frontend server (npm run web)');
        }
        
        if (!this.testResults.infrastructure?.backendServer?.passed) {
            this.nextActions.push('🔧 URGENT: Start backend server (node main-simple.js)');
        }

        if (!this.testResults.api?.dataContent?.passed) {
            this.nextActions.push('📊 HIGH: Fix empty search results - seed database or enable AI generation');
        }

        if (this.testResults.frontend?.contentState?.passed === false && 
            this.testResults.frontend?.contentState?.details?.includes('Standby message: true')) {
            this.nextActions.push('🌐 HIGH: Fix frontend to display actual search results instead of "Please standby"');
        }

        if (!this.testResults.userExperience?.interactiveElements?.passed) {
            this.nextActions.push('👤 MEDIUM: Add clickable influencer cards/profiles to UI');
        }

        if (this.nextActions.length === 0) {
            this.nextActions.push('🎉 SUCCESS: All validation tests passed!');
        }

        this.nextActions.forEach((action, index) => {
            console.log(`${index + 1}. ${action}`);
        });

        console.log('\n🔄 NEXT ITERATION: Fix highest priority issue, then run test-success.js again');
        console.log('═'.repeat(60));
    }
}

// Run the validation if this script is executed directly
if (require.main === module) {
    const validator = new AxeesSuccessValidator();
    validator.runCompleteValidation().then(() => {
        const overallPassed = validator.testResults.overall.passed;
        process.exit(overallPassed ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = AxeesSuccessValidator;