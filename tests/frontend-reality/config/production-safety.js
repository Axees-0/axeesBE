/**
 * Production Safety Configuration
 * 
 * Ensures tests run safely in production environments
 * without causing disruption to real users
 */

class ProductionSafety {
    constructor(config) {
        this.config = config;
        this.isProduction = config.environment === 'production';
        this.safetyChecks = [];
    }

    /**
     * Validate it's safe to run tests in current environment
     */
    validateSafety() {
        if (!this.isProduction) {
            return { safe: true, warnings: [] };
        }

        const warnings = [];
        const errors = [];

        // Check for production test credentials
        if (!this.config.testEmail.includes('test') && 
            !this.config.testEmail.includes('qa')) {
            errors.push('Production test email must contain "test" or "qa" to prevent using real user accounts');
        }

        // Check for rate limiting
        if (!process.env.PRODUCTION_RATE_LIMIT) {
            warnings.push('No PRODUCTION_RATE_LIMIT set - tests may trigger rate limiting');
        }

        // Check for test isolation
        if (!process.env.PRODUCTION_TEST_NAMESPACE) {
            warnings.push('No PRODUCTION_TEST_NAMESPACE set - tests may interfere with real data');
        }

        // Check time restrictions
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) {
            warnings.push('Running tests during business hours (9AM-5PM) may impact performance');
        }

        return {
            safe: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get production-safe test configuration
     */
    getProductionConfig() {
        if (!this.isProduction) {
            return {};
        }

        return {
            // Slower operations to reduce load
            typeDelay: 100, // ms between keystrokes
            clickDelay: 500, // ms between clicks
            navigationTimeout: 60000, // 1 minute timeout
            
            // Limited parallelism
            maxConcurrentTests: 1,
            
            // Skip heavy tests
            skipPerformanceTests: true,
            skipLoadTests: true,
            
            // Use read-only operations where possible
            readOnlyMode: true,
            
            // Add test identifier to all operations
            testIdentifier: `test_${Date.now()}`,
            
            // Respect rate limits
            requestDelay: parseInt(process.env.PRODUCTION_RATE_LIMIT) || 1000
        };
    }

    /**
     * Wrap page actions with production safety
     */
    wrapPageActions(page) {
        if (!this.isProduction) {
            return page;
        }

        const config = this.getProductionConfig();
        const originalGoto = page.goto.bind(page);
        const originalClick = page.click.bind(page);
        const originalType = page.type.bind(page);

        // Add delays to navigation
        page.goto = async (url, options = {}) => {
            await this.delay(config.requestDelay);
            return originalGoto(url, {
                ...options,
                timeout: config.navigationTimeout
            });
        };

        // Add delays to clicks
        page.click = async (selector, options = {}) => {
            await this.delay(config.clickDelay);
            return originalClick(selector, options);
        };

        // Add delays to typing
        page.type = async (selector, text, options = {}) => {
            return originalType(selector, text, {
                ...options,
                delay: config.typeDelay
            });
        };

        return page;
    }

    /**
     * Check if specific test should run in production
     */
    shouldRunTest(testName) {
        if (!this.isProduction) {
            return true;
        }

        const config = this.getProductionConfig();
        
        // Skip certain test categories
        if (config.skipPerformanceTests && testName.includes('performance')) {
            console.log(`⏭️  Skipping ${testName} in production`);
            return false;
        }

        if (config.skipLoadTests && testName.includes('load')) {
            console.log(`⏭️  Skipping ${testName} in production`);
            return false;
        }

        // Skip write operations in read-only mode
        if (config.readOnlyMode && (
            testName.includes('create') ||
            testName.includes('update') ||
            testName.includes('delete') ||
            testName.includes('submit')
        )) {
            console.log(`⏭️  Skipping ${testName} in production (read-only mode)`);
            return false;
        }

        return true;
    }

    /**
     * Log production test activity
     */
    logActivity(action, details) {
        if (!this.isProduction) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            environment: 'production',
            action,
            details,
            testIdentifier: this.getProductionConfig().testIdentifier
        };

        // In production, you might want to send this to a logging service
        console.log(`🔐 PRODUCTION TEST: ${JSON.stringify(logEntry)}`);
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get production test report
     */
    getProductionReport(results) {
        if (!this.isProduction) {
            return results;
        }

        return {
            ...results,
            environment: 'PRODUCTION',
            safety: {
                readOnlyMode: this.getProductionConfig().readOnlyMode,
                testIdentifier: this.getProductionConfig().testIdentifier,
                timestamp: new Date().toISOString(),
                warnings: this.validateSafety().warnings
            }
        };
    }
}

module.exports = ProductionSafety;