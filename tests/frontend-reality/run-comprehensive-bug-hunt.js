/**
 * Comprehensive Frontend Bug Hunt Runner
 * 
 * Orchestrates all bug hunting tests to find real user experience issues
 */

const AuthenticationBugHunter = require('./specific-bug-tests/authentication-flow-bugs');
const FormDataBugHunter = require('./specific-bug-tests/form-data-bugs');
const ChatRealtimeBugHunter = require('./specific-bug-tests/chat-realtime-bugs');
const PerformanceBugHunter = require('./specific-bug-tests/performance-bugs');
const MobileInterfaceBugHunter = require('./specific-bug-tests/mobile-interface-bugs');
const config = require('./config');
const timeoutHandler = require('./utils/timeout-handler');
const signalHandler = require('./utils/signal-handler');
const fileLock = require('./utils/file-lock');

class ComprehensiveBugHunter {
    constructor() {
        this.startTime = Date.now();
        this.allBugs = [];
        this.testResults = {
            authentication: null,
            forms: null,
            realtime: null,
            mobile: null,
            performance: null
        };
    }

    async runAllTests() {
        console.log('🎯 COMPREHENSIVE FRONTEND BUG HUNT');
        console.log('================================');
        console.log(`Testing: ${config.frontendUrl}`);
        console.log(`Environment: ${config.getEnvironmentInfo().environment}`);
        console.log(`Mode: ${config.headless ? 'Headless' : 'Browser'}`);
        console.log('');

        // Set global timeout for entire test suite
        const globalTimeout = config.comprehensiveTestTimeout * 1000; // Convert to ms
        timeoutHandler.setGlobalTimeout(globalTimeout, async () => {
            console.error('\n🚨 Test suite timeout - generating emergency report...');
            await this.generateReport();
        });

        try {
            // Run authentication tests
            await this.runAuthenticationTests();
            
            // Run form data tests
            await this.runFormTests();
            
            // Run real-time communication tests
            await this.runRealtimeTests();
            
            // Run performance tests
            await this.runPerformanceTests();
            
            // Run mobile interface tests
            await this.runMobileTests();
            
            // Generate comprehensive report
            this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Bug hunt failed:', error.message);
            this.generateErrorReport(error);
        } finally {
            // Clear global timeout
            timeoutHandler.clearGlobalTimeout();
            
            // Ensure all browsers are cleaned up
            await timeoutHandler.emergencyCleanup();
        }
    }

    async runAuthenticationTests() {
        console.log('\n🔐 PHASE 1: Authentication Bug Hunt');
        console.log('===================================');
        
        const authHunter = new AuthenticationBugHunter();
        
        try {
            await timeoutHandler.executeWithTimeout(
                async () => {
                    await authHunter.initialize();
                    timeoutHandler.registerBrowser(authHunter.browser);
                },
                30000, // 30 second timeout for initialization
                async () => await authHunter.cleanup()
            );
            
            const report = await timeoutHandler.withTimeout(
                authHunter.runComprehensiveAuthTests(),
                300000, // 5 minute timeout for auth tests
                'Authentication Tests'
            );
            
            this.testResults.authentication = report;
            
            // Collect all bugs
            if (report.bugs && report.bugs.length > 0) {
                this.allBugs.push(...report.bugs);
            }
            
            console.log(`\n✅ Authentication tests completed: ${report.totalBugs} bugs found`);
            
        } catch (error) {
            console.error('❌ Authentication tests failed:', error.message);
            this.testResults.authentication = {
                error: error.message,
                totalBugs: 0,
                bugs: []
            };
        } finally {
            timeoutHandler.unregisterBrowser(authHunter.browser);
            await authHunter.cleanup();
        }
    }

    async runFormTests() {
        console.log('\n📝 PHASE 2: Form Data Bug Hunt');
        console.log('===============================');
        
        const formHunter = new FormDataBugHunter();
        
        try {
            await formHunter.initialize();
            const report = await formHunter.runComprehensiveFormTests();
            this.testResults.forms = report;
            
            // Collect all bugs
            if (report.bugs && report.bugs.length > 0) {
                this.allBugs.push(...report.bugs);
            }
            
            console.log(`\n✅ Form tests completed: ${report.totalBugs} bugs found`);
            
        } catch (error) {
            console.error('❌ Form tests failed:', error.message);
            this.testResults.forms = {
                error: error.message,
                totalBugs: 0,
                bugs: []
            };
        } finally {
            await formHunter.cleanup();
        }
    }

    async runRealtimeTests() {
        console.log('\n⚡ PHASE 3: Real-time Communication Bug Hunt');
        console.log('=============================================');
        
        const realtimeHunter = new ChatRealtimeBugHunter();
        
        try {
            await realtimeHunter.initialize();
            const report = await realtimeHunter.runComprehensiveRealtimeTests();
            this.testResults.realtime = report;
            
            // Collect all bugs
            if (report.bugs && report.bugs.length > 0) {
                this.allBugs.push(...report.bugs);
            }
            
            console.log(`\n✅ Real-time tests completed: ${report.totalBugs} bugs found`);
            
        } catch (error) {
            console.error('❌ Real-time tests failed:', error.message);
            this.testResults.realtime = {
                error: error.message,
                totalBugs: 0,
                bugs: []
            };
        } finally {
            await realtimeHunter.cleanup();
        }
    }

    async runPerformanceTests() {
        console.log('\n🚀 PHASE 4: Performance Bug Hunt');
        console.log('=================================');
        
        const performanceHunter = new PerformanceBugHunter();
        
        try {
            await performanceHunter.initialize();
            const report = await performanceHunter.runComprehensivePerformanceTests();
            this.testResults.performance = report;
            
            // Collect all bugs
            if (report.bugs && report.bugs.length > 0) {
                this.allBugs.push(...report.bugs);
            }
            
            console.log(`\n✅ Performance tests completed: ${report.totalBugs} bugs found`);
            
        } catch (error) {
            console.error('❌ Performance tests failed:', error.message);
            this.testResults.performance = {
                error: error.message,
                totalBugs: 0,
                bugs: []
            };
        } finally {
            await performanceHunter.cleanup();
        }
    }

    async runMobileTests() {
        console.log('\n📱 PHASE 5: Mobile Interface Bug Hunt');
        console.log('====================================');
        
        const mobileHunter = new MobileInterfaceBugHunter();
        
        try {
            await mobileHunter.initialize();
            const report = await mobileHunter.runComprehensiveMobileTests();
            this.testResults.mobile = report;
            
            // Collect all bugs
            if (report.bugs && report.bugs.length > 0) {
                this.allBugs.push(...report.bugs);
            }
            
            console.log(`\n✅ Mobile tests completed: ${report.totalBugs} bugs found`);
            
        } catch (error) {
            console.error('❌ Mobile tests failed:', error.message);
            this.testResults.mobile = {
                error: error.message,
                totalBugs: 0,
                bugs: []
            };
        } finally {
            await mobileHunter.cleanup();
        }
    }

    generateFinalReport() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        console.log('\n\n' + '='.repeat(80));
        console.log('🏁 COMPREHENSIVE BUG HUNT COMPLETE');
        console.log('='.repeat(80));
        
        // Calculate totals
        const criticalBugs = this.allBugs.filter(b => b.severity === 'CRITICAL' || b.severity === 'HIGH');
        const mediumBugs = this.allBugs.filter(b => b.severity === 'MEDIUM');
        const lowBugs = this.allBugs.filter(b => b.severity === 'LOW');
        
        console.log('\n📊 SUMMARY');
        console.log('----------');
        console.log(`Total Bugs Found: ${this.allBugs.length}`);
        console.log(`Critical/High: ${criticalBugs.length}`);
        console.log(`Medium: ${mediumBugs.length}`);
        console.log(`Low: ${lowBugs.length}`);
        console.log(`Test Duration: ${duration}s`);
        
        // Show critical bugs
        if (criticalBugs.length > 0) {
            console.log('\n🚨 CRITICAL/HIGH SEVERITY BUGS');
            console.log('-----------------------------');
            criticalBugs.forEach((bug, i) => {
                console.log(`\n${i + 1}. ${bug.category}`);
                console.log(`   ${bug.description}`);
                console.log(`   URL: ${bug.url}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        console.log('------------------');
        
        if (criticalBugs.length > 0) {
            console.log('🚨 DO NOT DEPLOY - Critical bugs found that will break user experience');
            console.log('\nPriority fixes:');
            
            // Group recommendations by category
            const categories = [...new Set(criticalBugs.map(b => b.category))];
            categories.forEach(category => {
                const categoryBugs = criticalBugs.filter(b => b.category === category);
                console.log(`\n• ${category} (${categoryBugs.length} issues)`);
                categoryBugs.forEach(bug => {
                    console.log(`  - ${bug.description}`);
                });
            });
        } else if (mediumBugs.length > 5) {
            console.log('⚠️  DEPLOY WITH CAUTION - Multiple medium severity bugs detected');
            console.log('Consider fixing these before production release');
        } else {
            console.log('✅ FRONTEND READY FOR DEPLOYMENT');
            console.log('No critical bugs detected in user journeys');
        }
        
        // Save detailed report
        this.saveDetailedReport();
    }

    generateErrorReport(error) {
        console.log('\n❌ BUG HUNT FAILED');
        console.log('------------------');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
        console.log('\nPlease check:');
        console.log('• Frontend is running at', config.frontendUrl);
        console.log('• Network connectivity');
        console.log('• Browser dependencies');
    }

    saveDetailedReport() {
        const fs = require('fs');
        const path = require('path');
        
        const report = {
            timestamp: new Date().toISOString(),
            environment: config.getEnvironmentInfo(),
            duration: ((Date.now() - this.startTime) / 1000).toFixed(2),
            summary: {
                totalBugs: this.allBugs.length,
                critical: this.allBugs.filter(b => b.severity === 'CRITICAL' || b.severity === 'HIGH').length,
                medium: this.allBugs.filter(b => b.severity === 'MEDIUM').length,
                low: this.allBugs.filter(b => b.severity === 'LOW').length
            },
            testResults: this.testResults,
            allBugs: this.allBugs,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(__dirname, `bug-hunt-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved: ${reportPath}`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check for common patterns
        const formDataLoss = this.allBugs.some(b => b.category === 'Form Data Loss');
        const tokenExpiry = this.allBugs.some(b => b.category === 'Token Expiry Handling');
        const passwordSecurity = this.allBugs.some(b => b.category === 'Password Field Security');
        
        if (formDataLoss) {
            recommendations.push({
                priority: 'HIGH',
                area: 'Form Management',
                action: 'Implement auto-save with localStorage to prevent data loss',
                impact: 'Users losing work is #1 cause of abandonment'
            });
        }
        
        if (tokenExpiry) {
            recommendations.push({
                priority: 'HIGH',
                area: 'Session Management',
                action: 'Add token refresh and session expiry warnings',
                impact: 'Silent session expiry frustrates users during long tasks'
            });
        }
        
        if (passwordSecurity) {
            recommendations.push({
                priority: 'CRITICAL',
                area: 'Security',
                action: 'Fix password field type and autocomplete attributes',
                impact: 'Security vulnerability and compliance issue'
            });
        }
        
        return recommendations;
    }
}

// Run if called directly
if (require.main === module) {
    console.log('🚀 Starting Comprehensive Frontend Bug Hunt...\n');
    
    // Clean up any stale locks first
    fileLock.cleanupStaleLocks();
    
    // Try to acquire lock
    fileLock.acquireLock()
        .then(() => {
            const hunter = new ComprehensiveBugHunter();
            
            // Register cleanup handler
            signalHandler.registerCleanupHandler(async () => {
                console.log('🧹 Cleaning up test resources...');
                await timeoutHandler.emergencyCleanup();
                fileLock.releaseLock();
            });
            
            // Run tests with signal protection
            return signalHandler.executeWithProtection(
                () => hunter.runAllTests(),
                async () => {
                    console.log('🛑 Test interrupted - generating partial report...');
                    hunter.generateFinalReport();
                }
            );
        })
        .then(() => {
            console.log('\n✅ Bug hunt completed successfully');
            fileLock.releaseLock();
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Bug hunt failed:', error);
            fileLock.releaseLock();
            process.exit(1);
        });
}

module.exports = ComprehensiveBugHunter;