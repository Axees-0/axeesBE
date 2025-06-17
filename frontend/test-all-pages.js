#!/usr/bin/env node

/**
 * COMPREHENSIVE PAGE VALIDATION SYSTEM
 * 
 * Extends the successful closed feedback loop methodology to test all major
 * pages in the React Native app, identifying functional vs broken pages.
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

class ComprehensivePageValidator {
    constructor() {
        this.results = {
            summary: { totalPages: 0, functional: 0, broken: 0, percentage: 0 },
            pages: {},
            criticalIssues: [],
            recommendations: []
        };
        
        // Define the major pages to test based on app structure
        this.pagesToTest = [
            // Main tabs
            { url: 'http://localhost:8081/', name: 'Home/Search', category: 'Core', priority: 'Critical' },
            { url: 'http://localhost:8081/deals', name: 'Deals/Offers', category: 'Core', priority: 'Critical' },
            { url: 'http://localhost:8081/messages', name: 'Messages', category: 'Core', priority: 'High' },
            { url: 'http://localhost:8081/notifications', name: 'Notifications', category: 'Core', priority: 'High' },
            { url: 'http://localhost:8081/profile', name: 'Profile', category: 'Core', priority: 'High' },
            
            // Registration/Auth flow
            { url: 'http://localhost:8081/UAM001Login', name: 'Login', category: 'Auth', priority: 'Critical' },
            { url: 'http://localhost:8081/URM01CreateAccount', name: 'Create Account', category: 'Auth', priority: 'Critical' },
            { url: 'http://localhost:8081/URM01Phone', name: 'Phone Registration', category: 'Auth', priority: 'High' },
            { url: 'http://localhost:8081/ULM02ForgotPassword', name: 'Forgot Password', category: 'Auth', priority: 'Medium' },
            
            // User Management
            { url: 'http://localhost:8081/UAM03Settings', name: 'Settings', category: 'User', priority: 'High' },
            { url: 'http://localhost:8081/UAM02EditCreatorProfile', name: 'Edit Profile', category: 'User', priority: 'High' },
            { url: 'http://localhost:8081/UAM005CreatorProfile', name: 'Creator Profile View', category: 'User', priority: 'High' },
            
            // Offer Management
            { url: 'http://localhost:8081/UOM04MarketerCustomOffer', name: 'Custom Offer', category: 'Offers', priority: 'Critical' },
            { url: 'http://localhost:8081/UOM02MarketerOfferDetail', name: 'Offer Details', category: 'Offers', priority: 'High' },
            { url: 'http://localhost:8081/UOM10CreatorOfferDetails', name: 'Creator Offer View', category: 'Offers', priority: 'High' },
            
            // Deal Management  
            { url: 'http://localhost:8081/DealDashboardPage', name: 'Deal Dashboard', category: 'Deals', priority: 'Critical' },
            { url: 'http://localhost:8081/UOM12CreatorDealDetails', name: 'Creator Deal Details', category: 'Deals', priority: 'High' },
            { url: 'http://localhost:8081/UOM09MarketerDealDetail', name: 'Marketer Deal Details', category: 'Deals', priority: 'High' },
            
            // Payment/Financial
            { url: 'http://localhost:8081/UOEPM01PaymentHistoryCreator', name: 'Payment History', category: 'Payment', priority: 'High' },
            { url: 'http://localhost:8081/UOEPM02WithdrawMoneyCreator', name: 'Withdraw Money', category: 'Payment', priority: 'High' },
            
            // Support/Info
            { url: 'http://localhost:8081/privacy-policy', name: 'Privacy Policy', category: 'Support', priority: 'Low' },
            { url: 'http://localhost:8081/test-basic', name: 'Test Page', category: 'Dev', priority: 'Low' }
        ];
    }

    async validateAllPages() {
        console.log('🚀 COMPREHENSIVE PAGE VALIDATION STARTING...\n');
        console.log(`Testing ${this.pagesToTest.length} major pages across the application\n`);
        
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.results.summary.totalPages = this.pagesToTest.length;

            // Test each page
            for (const pageInfo of this.pagesToTest) {
                console.log(`🔍 Testing: ${pageInfo.name} (${pageInfo.category})`);
                await this.validateSinglePage(browser, pageInfo);
            }

            this.generateComprehensiveReport();
            this.generateActionPlan();
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in page validation:', error.message);
            this.results.criticalIssues.push(`Test execution failed: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }
        
        return this.results;
    }

    async validateSinglePage(browser, pageInfo) {
        const page = await browser.newPage();
        const result = {
            url: pageInfo.url,
            name: pageInfo.name,
            category: pageInfo.category,
            priority: pageInfo.priority,
            status: 'unknown',
            issues: [],
            metrics: {},
            functionality: {}
        };

        try {
            // Test 1: Page Loading
            const startTime = Date.now();
            await page.goto(pageInfo.url, { 
                waitUntil: 'networkidle0', 
                timeout: 15000 
            });
            const loadTime = Date.now() - startTime;

            // Test 2: Basic Content Analysis
            const pageAnalysis = await page.evaluate(() => {
                const title = document.title;
                const bodyText = document.body.innerText.trim();
                const hasContent = bodyText.length > 100; // Minimum meaningful content
                const totalElements = document.querySelectorAll('*').length;
                const visibleElements = Array.from(document.querySelectorAll('*'))
                    .filter(el => el.offsetParent !== null).length;
                
                // Check for common error indicators
                const hasErrors = bodyText.toLowerCase().includes('error') || 
                                bodyText.toLowerCase().includes('something went wrong') ||
                                bodyText.toLowerCase().includes('not found');
                
                // Check for loading states
                const isLoading = bodyText.toLowerCase().includes('loading') ||
                                bodyText.toLowerCase().includes('please wait') ||
                                bodyText.toLowerCase().includes('standby');
                
                // Look for interactive elements
                const buttons = document.querySelectorAll('button, [role="button"]').length;
                const inputs = document.querySelectorAll('input, textarea, select').length;
                const links = document.querySelectorAll('a[href]').length;
                
                // Look for form elements (important for auth/registration pages)
                const forms = document.querySelectorAll('form').length;
                
                // Check for images and media
                const images = document.querySelectorAll('img').length;
                
                return {
                    title,
                    bodyText: bodyText.substring(0, 300),
                    bodyTextLength: bodyText.length,
                    hasContent,
                    totalElements,
                    visibleElements,
                    hasErrors,
                    isLoading,
                    interactivity: { buttons, inputs, links, forms },
                    media: { images },
                    functionalScore: 0 // Will calculate based on above
                };
            });

            // Calculate functionality score
            let functionalScore = 0;
            if (pageAnalysis.hasContent) functionalScore += 2;
            if (pageAnalysis.visibleElements > 50) functionalScore += 2;
            if (!pageAnalysis.hasErrors) functionalScore += 2;
            if (!pageAnalysis.isLoading) functionalScore += 2;
            if (pageAnalysis.interactivity.buttons > 0) functionalScore += 1;
            if (pageAnalysis.interactivity.inputs > 0) functionalScore += 1;
            // Max score: 10

            result.metrics = {
                loadTime,
                functionalScore,
                maxScore: 10,
                percentage: Math.round((functionalScore / 10) * 100)
            };

            result.functionality = pageAnalysis;

            // Determine overall status
            if (functionalScore >= 8) {
                result.status = 'functional';
                this.results.summary.functional++;
            } else if (functionalScore >= 5) {
                result.status = 'partial';
                this.results.summary.functional += 0.5;
            } else {
                result.status = 'broken';
                this.results.summary.broken++;
            }

            // Identify specific issues
            if (pageAnalysis.hasErrors) {
                result.issues.push('Page contains error messages');
            }
            if (pageAnalysis.isLoading) {
                result.issues.push('Page stuck in loading state');
            }
            if (!pageAnalysis.hasContent) {
                result.issues.push('Page has insufficient content');
            }
            if (pageAnalysis.interactivity.buttons === 0 && pageInfo.category !== 'Support') {
                result.issues.push('No interactive buttons found');
            }
            if (loadTime > 5000) {
                result.issues.push('Slow loading time');
            }

            // Page-specific validation
            await this.validatePageSpecificFunctionality(page, pageInfo, result);

            console.log(`   ${this.getStatusIcon(result.status)} ${result.name}: ${result.metrics.percentage}% functional`);

        } catch (error) {
            result.status = 'error';
            result.issues.push(`Failed to load: ${error.message}`);
            this.results.summary.broken++;
            console.log(`   ❌ ${result.name}: Failed to load`);
        } finally {
            await page.close();
        }

        this.results.pages[pageInfo.name] = result;
    }

    async validatePageSpecificFunctionality(page, pageInfo, result) {
        try {
            // Category-specific validation
            switch (pageInfo.category) {
                case 'Core':
                    if (pageInfo.name === 'Home/Search') {
                        const hasSearchBox = await page.$('input[placeholder*="Search"], input[placeholder*="creator"]') !== null;
                        if (hasSearchBox) result.functionality.hasSearchBox = true;
                        else result.issues.push('Missing search functionality');
                    }
                    break;
                    
                case 'Auth':
                    const hasFormInputs = await page.$$('input[type="email"], input[type="password"], input[type="text"]');
                    if (hasFormInputs.length === 0) {
                        result.issues.push('Missing required form inputs for authentication');
                    }
                    break;
                    
                case 'Offers':
                case 'Deals':
                    const hasActionButtons = await page.$$('button');
                    if (hasActionButtons.length < 2) {
                        result.issues.push('Insufficient action buttons for offer/deal management');
                    }
                    break;
            }
        } catch (error) {
            // Don't fail the whole test for specific validation errors
            result.issues.push(`Specific validation failed: ${error.message}`);
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'functional': return '✅';
            case 'partial': return '⚠️';
            case 'broken': return '❌';
            case 'error': return '💥';
            default: return '❓';
        }
    }

    generateComprehensiveReport() {
        console.log('\n📊 COMPREHENSIVE PAGE VALIDATION REPORT');
        console.log('═'.repeat(70));

        // Calculate summary
        this.results.summary.percentage = Math.round(
            (this.results.summary.functional / this.results.summary.totalPages) * 100
        );

        console.log(`\n🎯 OVERALL APP HEALTH: ${this.results.summary.functional}/${this.results.summary.totalPages} pages functional (${this.results.summary.percentage}%)`);
        
        if (this.results.summary.percentage >= 80) {
            console.log('🎉 STATUS: EXCELLENT - Most pages are functional');
        } else if (this.results.summary.percentage >= 60) {
            console.log('⚠️ STATUS: GOOD - Most core functionality working');
        } else if (this.results.summary.percentage >= 40) {
            console.log('🔧 STATUS: NEEDS WORK - Several critical issues');
        } else {
            console.log('🚨 STATUS: CRITICAL - Major functionality broken');
        }

        // Group results by category
        const categories = {};
        Object.values(this.results.pages).forEach(page => {
            if (!categories[page.category]) {
                categories[page.category] = [];
            }
            categories[page.category].push(page);
        });

        console.log('\n📋 RESULTS BY CATEGORY:');
        Object.entries(categories).forEach(([category, pages]) => {
            const functionalCount = pages.filter(p => p.status === 'functional').length;
            const partialCount = pages.filter(p => p.status === 'partial').length;
            const percentage = Math.round(((functionalCount + partialCount * 0.5) / pages.length) * 100);
            
            console.log(`\n${category.toUpperCase()}: ${functionalCount}/${pages.length} functional (${percentage}%)`);
            pages.forEach(page => {
                const icon = this.getStatusIcon(page.status);
                console.log(`  ${icon} ${page.name}: ${page.metrics.percentage}% (${page.issues.length} issues)`);
                if (page.issues.length > 0) {
                    page.issues.forEach(issue => {
                        console.log(`     - ${issue}`);
                    });
                }
            });
        });

        // Highlight critical broken pages
        const criticalBroken = Object.values(this.results.pages)
            .filter(p => p.priority === 'Critical' && p.status !== 'functional');
        
        if (criticalBroken.length > 0) {
            console.log('\n🚨 CRITICAL PAGES NEEDING IMMEDIATE ATTENTION:');
            criticalBroken.forEach(page => {
                console.log(`   💥 ${page.name} (${page.category}): ${page.issues.join(', ')}`);
            });
        }
    }

    generateActionPlan() {
        console.log('\n🎯 PRIORITIZED ACTION PLAN:');
        console.log('─'.repeat(50));

        const actions = [];

        // Critical pages first
        const criticalBroken = Object.values(this.results.pages)
            .filter(p => p.priority === 'Critical' && p.status !== 'functional')
            .sort((a, b) => a.metrics.functionalScore - b.metrics.functionalScore);

        criticalBroken.forEach(page => {
            actions.push({
                priority: 1,
                action: `🔧 URGENT: Fix ${page.name} - ${page.issues[0]}`,
                category: page.category
            });
        });

        // High priority pages
        const highPriorityBroken = Object.values(this.results.pages)
            .filter(p => p.priority === 'High' && p.status !== 'functional')
            .sort((a, b) => a.metrics.functionalScore - b.metrics.functionalScore);

        highPriorityBroken.forEach(page => {
            actions.push({
                priority: 2,
                action: `🔧 HIGH: Fix ${page.name} - ${page.issues[0]}`,
                category: page.category
            });
        });

        // Improvements for partial pages
        const partialPages = Object.values(this.results.pages)
            .filter(p => p.status === 'partial')
            .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

        partialPages.forEach(page => {
            actions.push({
                priority: 3,
                action: `⚠️ IMPROVE: Enhance ${page.name} - ${page.issues[0] || 'increase functionality'}`,
                category: page.category
            });
        });

        // Display action plan
        if (actions.length === 0) {
            actions.push({ priority: 0, action: '🎉 SUCCESS: All critical pages functional!' });
        }

        actions.slice(0, 10).forEach((action, index) => {
            console.log(`${index + 1}. ${action.action}`);
        });

        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Address critical issues first');
        console.log('2. Re-run validation: node test-all-pages.js');
        console.log('3. Focus on core user flows');
        console.log('4. Iterate until 80%+ functionality achieved');

        console.log('═'.repeat(70));
    }

    getPriorityWeight(priority) {
        switch (priority) {
            case 'Critical': return 3;
            case 'High': return 2;
            case 'Medium': return 1;
            default: return 0;
        }
    }
}

// Run the comprehensive validation if this script is executed directly
if (require.main === module) {
    const validator = new ComprehensivePageValidator();
    validator.validateAllPages().then((results) => {
        const overallSuccess = results.summary.percentage >= 80;
        process.exit(overallSuccess ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ComprehensivePageValidator;