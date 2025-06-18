#!/usr/bin/env node

/**
 * FOCUSED KEY PAGES VALIDATION
 * 
 * Quick assessment of the most critical pages to identify common issues
 * and provide fast feedback on core app functionality.
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

class KeyPagesValidator {
    constructor() {
        this.results = {
            summary: { totalPages: 0, functional: 0, broken: 0, percentage: 0 },
            pages: {},
            commonIssues: [],
            recommendations: []
        };
        
        // Focus on the most critical pages first
        this.keyPages = [
            { url: 'http://localhost:8081/', name: 'Home/Search', priority: 'Critical' },
            { url: 'http://localhost:8081/deals', name: 'Deals', priority: 'Critical' },
            { url: 'http://localhost:8081/profile', name: 'Profile', priority: 'Critical' },
            { url: 'http://localhost:8081/UAM001Login', name: 'Login', priority: 'Critical' },
            { url: 'http://localhost:8081/test-basic', name: 'Test Page', priority: 'Debug' }
        ];
    }

    async validateKeyPages() {
        console.log('🚀 KEY PAGES VALIDATION STARTING...\n');
        console.log(`Testing ${this.keyPages.length} critical pages for quick assessment\n`);
        
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.results.summary.totalPages = this.keyPages.length;

            // Test each key page with shorter timeout
            for (const pageInfo of this.keyPages) {
                console.log(`🔍 Testing: ${pageInfo.name}`);
                await this.validateSinglePage(browser, pageInfo);
            }

            this.analyzeCommonIssues();
            this.generateQuickReport();
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in key pages validation:', error.message);
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
            priority: pageInfo.priority,
            status: 'unknown',
            issues: [],
            metrics: {},
            content: ''
        };

        try {
            // Quick loading test with shorter timeout
            const startTime = Date.now();
            await page.goto(pageInfo.url, { 
                waitUntil: 'domcontentloaded', 
                timeout: 8000 
            });
            const loadTime = Date.now() - startTime;

            // Quick content analysis
            const pageData = await page.evaluate(() => {
                const title = document.title;
                const bodyText = document.body.innerText.trim();
                const hasContent = bodyText.length > 50;
                const visibleElements = Array.from(document.querySelectorAll('*'))
                    .filter(el => el.offsetParent !== null).length;
                
                // Quick checks for common issues
                const hasErrors = bodyText.includes('Error') || bodyText.includes('404') || 
                                bodyText.includes('Not Found') || bodyText.includes('something went wrong');
                const isLoading = bodyText.includes('Loading') || bodyText.includes('Please wait') ||
                                bodyText.includes('standby');
                const isEmpty = bodyText.length < 100;
                
                // Check for interactive elements
                const buttons = document.querySelectorAll('button, [role="button"]').length;
                const inputs = document.querySelectorAll('input').length;
                
                return {
                    title,
                    bodyText: bodyText.substring(0, 200),
                    hasContent,
                    visibleElements,
                    hasErrors,
                    isLoading,
                    isEmpty,
                    buttons,
                    inputs
                };
            });

            // Calculate simple functionality score
            let score = 0;
            if (pageData.hasContent) score += 3;
            if (pageData.visibleElements > 20) score += 2;
            if (!pageData.hasErrors) score += 2;
            if (!pageData.isLoading) score += 2;
            if (pageData.buttons > 0) score += 1;
            // Max score: 10

            result.metrics = {
                loadTime,
                score,
                percentage: Math.round((score / 10) * 100)
            };

            result.content = pageData.bodyText;

            // Determine status
            if (score >= 8) {
                result.status = 'functional';
                this.results.summary.functional++;
            } else if (score >= 5) {
                result.status = 'partial';
                this.results.summary.functional += 0.5;
            } else {
                result.status = 'broken';
                this.results.summary.broken++;
            }

            // Identify issues
            if (pageData.hasErrors) result.issues.push('Contains error messages');
            if (pageData.isLoading) result.issues.push('Stuck in loading state');
            if (pageData.isEmpty) result.issues.push('Insufficient content');
            if (pageData.buttons === 0 && pageInfo.name !== 'Test Page') result.issues.push('No interactive elements');
            if (loadTime > 3000) result.issues.push('Slow loading');

            const statusIcon = result.status === 'functional' ? '✅' : 
                             result.status === 'partial' ? '⚠️' : '❌';
            console.log(`   ${statusIcon} ${result.name}: ${result.metrics.percentage}% (${result.issues.length} issues)`);

        } catch (error) {
            result.status = 'error';
            result.issues.push(`Failed to load: ${error.message}`);
            this.results.summary.broken++;
            console.log(`   💥 ${result.name}: Failed to load - ${error.message.substring(0, 50)}`);
        } finally {
            await page.close();
        }

        this.results.pages[pageInfo.name] = result;
    }

    analyzeCommonIssues() {
        const allIssues = Object.values(this.results.pages)
            .flatMap(page => page.issues);
        
        const issueCount = {};
        allIssues.forEach(issue => {
            issueCount[issue] = (issueCount[issue] || 0) + 1;
        });

        // Identify common patterns
        Object.entries(issueCount).forEach(([issue, count]) => {
            if (count >= 3) { // If 3+ pages have same issue
                this.results.commonIssues.push({
                    issue,
                    affectedPages: count,
                    severity: count >= 4 ? 'Critical' : 'High'
                });
            }
        });

        // Check for routing issues
        const allBroken = Object.values(this.results.pages).every(p => p.status === 'broken');
        if (allBroken) {
            this.results.commonIssues.push({
                issue: 'All pages broken - likely routing or server issue',
                affectedPages: this.keyPages.length,
                severity: 'Critical'
            });
        }

        // Check for content loading issues
        const mostEmpty = Object.values(this.results.pages)
            .filter(p => p.content.length < 100).length;
        if (mostEmpty >= 3) {
            this.results.commonIssues.push({
                issue: 'Multiple pages have insufficient content - possible data loading issue',
                affectedPages: mostEmpty,
                severity: 'High'
            });
        }
    }

    generateQuickReport() {
        console.log('\n📊 KEY PAGES ASSESSMENT REPORT');
        console.log('═'.repeat(50));

        this.results.summary.percentage = Math.round(
            (this.results.summary.functional / this.results.summary.totalPages) * 100
        );

        console.log(`\n🎯 CORE FUNCTIONALITY: ${this.results.summary.functional}/${this.results.summary.totalPages} pages working (${this.results.summary.percentage}%)`);
        
        if (this.results.summary.percentage >= 80) {
            console.log('🎉 STATUS: EXCELLENT - Core pages functional');
        } else if (this.results.summary.percentage >= 60) {
            console.log('⚠️ STATUS: GOOD - Most core functionality working');
        } else if (this.results.summary.percentage >= 40) {
            console.log('🔧 STATUS: NEEDS WORK - Several issues identified');
        } else {
            console.log('🚨 STATUS: CRITICAL - Major functionality broken');
        }

        // Show individual page results
        console.log('\n📋 INDIVIDUAL PAGE RESULTS:');
        Object.values(this.results.pages).forEach(page => {
            const statusIcon = page.status === 'functional' ? '✅' : 
                             page.status === 'partial' ? '⚠️' : '❌';
            console.log(`${statusIcon} ${page.name}: ${page.metrics.percentage}%`);
            if (page.issues.length > 0) {
                console.log(`   Issues: ${page.issues.join(', ')}`);
            }
            if (page.content) {
                console.log(`   Content: "${page.content.substring(0, 80)}..."`);
            }
        });

        // Show common issues
        if (this.results.commonIssues.length > 0) {
            console.log('\n🚨 COMMON ISSUES AFFECTING MULTIPLE PAGES:');
            this.results.commonIssues.forEach(issue => {
                const severityIcon = issue.severity === 'Critical' ? '💥' : '⚠️';
                console.log(`${severityIcon} ${issue.issue} (${issue.affectedPages} pages)`);
            });
        }

        // Generate recommendations
        console.log('\n🎯 IMMEDIATE ACTIONS NEEDED:');
        
        if (this.results.commonIssues.length === 0) {
            console.log('1. 🎉 No critical issues detected - proceed with comprehensive testing');
        } else {
            this.results.commonIssues
                .sort((a, b) => b.affectedPages - a.affectedPages)
                .forEach((issue, index) => {
                    console.log(`${index + 1}. Fix: ${issue.issue}`);
                });
        }

        // Next steps
        console.log('\n🔄 NEXT STEPS:');
        if (this.results.summary.percentage < 60) {
            console.log('1. Address common issues affecting multiple pages');
            console.log('2. Test routing and authentication systems');
            console.log('3. Verify data loading and API connections');
        } else {
            console.log('1. Run comprehensive test: node test-all-pages.js');
            console.log('2. Focus on individual page improvements');
        }
        
        console.log('4. Re-run key pages test to measure progress');
        console.log('═'.repeat(50));
    }
}

// Run if executed directly
if (require.main === module) {
    const validator = new KeyPagesValidator();
    validator.validateKeyPages().then((results) => {
        const success = results.summary.percentage >= 60;
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = KeyPagesValidator;