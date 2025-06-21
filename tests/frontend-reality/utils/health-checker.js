/**
 * Health Checker Utility
 * 
 * Comprehensive health checking for frontend and backend services
 * Ensures all required services are available before running tests
 */

const credentialValidator = require('./credential-validator');
const frontendServer = require('./frontend-server');

class HealthChecker {
    constructor() {
        this.healthChecks = new Map();
        this.lastCheckTime = null;
        this.healthStatus = {
            frontend: false,
            backend: false,
            credentials: false,
            overall: false
        };
    }

    /**
     * Run comprehensive health check
     */
    async runHealthCheck(options = {}) {
        const {
            includeCredentials = true,
            includeFrontend = true,
            includeBackend = true,
            timeout = 30000
        } = options;

        console.log('🏥 Running comprehensive health check...\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            checks: {},
            summary: {
                passed: 0,
                failed: 0,
                total: 0
            },
            overall: false
        };

        try {
            // Frontend health check
            if (includeFrontend) {
                results.checks.frontend = await this.checkFrontendHealth(timeout);
                this.healthStatus.frontend = results.checks.frontend.healthy;
            }

            // Backend health check
            if (includeBackend) {
                results.checks.backend = await this.checkBackendHealth(timeout);
                this.healthStatus.backend = results.checks.backend.healthy;
            }

            // Credentials validation
            if (includeCredentials) {
                results.checks.credentials = await this.checkCredentialsHealth();
                this.healthStatus.credentials = results.checks.credentials.healthy;
            }

            // Calculate summary
            Object.values(results.checks).forEach(check => {
                results.summary.total++;
                if (check.healthy) {
                    results.summary.passed++;
                } else {
                    results.summary.failed++;
                }
            });

            // Overall health
            results.overall = results.summary.failed === 0;
            this.healthStatus.overall = results.overall;
            this.lastCheckTime = Date.now();

            // Log summary
            this.logHealthSummary(results);

            return results;

        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            results.error = error.message;
            results.overall = false;
            this.healthStatus.overall = false;
            return results;
        }
    }

    /**
     * Check frontend health
     */
    async checkFrontendHealth(timeout = 15000) {
        const check = {
            name: 'Frontend Server',
            healthy: false,
            responseTime: null,
            status: null,
            error: null,
            details: {}
        };

        const startTime = Date.now();

        try {
            console.log('🌐 Checking frontend server health...');
            
            const config = require('../config');
            const frontendUrl = config.frontendUrl;
            
            // Try to reach frontend
            const response = await credentialValidator.makeRequest(frontendUrl, {
                timeout: timeout
            });

            check.responseTime = Date.now() - startTime;
            check.status = response.status;
            check.details.url = frontendUrl;

            // Consider 200-399 as healthy
            if (response.status >= 200 && response.status < 400) {
                check.healthy = true;
                check.details.message = 'Frontend server is responding';
                console.log(`✅ Frontend health: OK (${response.status}) - ${check.responseTime}ms`);
            } else {
                check.error = `Unexpected status code: ${response.status}`;
                check.details.message = 'Frontend server returned error status';
                console.log(`⚠️ Frontend health: WARNING (${response.status}) - ${check.responseTime}ms`);
            }

            // Check for specific frontend indicators
            if (response.data && typeof response.data === 'string') {
                const isReactApp = response.data.includes('react') || 
                                 response.data.includes('expo') ||
                                 response.data.includes('webpack');
                check.details.isReactApp = isReactApp;
                
                if (isReactApp) {
                    check.details.message += ' (React/Expo app detected)';
                }
            }

        } catch (error) {
            check.responseTime = Date.now() - startTime;
            check.error = error.message;
            check.details.message = 'Frontend server unreachable';
            console.log(`❌ Frontend health: FAILED - ${error.message}`);
        }

        return check;
    }

    /**
     * Check backend health
     */
    async checkBackendHealth(timeout = 15000) {
        const check = {
            name: 'Backend API',
            healthy: false,
            responseTime: null,
            status: null,
            error: null,
            details: {}
        };

        const startTime = Date.now();

        try {
            console.log('🔧 Checking backend API health...');
            
            const config = require('../config');
            const backendUrl = config.config.backendApiUrl;
            
            if (backendUrl.includes('REPLACE_WITH')) {
                check.error = 'Backend URL not configured';
                check.details.message = 'Backend URL contains placeholder value';
                console.log('⚠️ Backend health: SKIPPED - URL not configured');
                return check;
            }

            check.details.baseUrl = backendUrl;

            // Try health endpoint first
            const healthUrl = `${backendUrl}${config.config.authHealthEndpoint}`;
            let response;
            
            try {
                response = await credentialValidator.makeRequest(healthUrl, { timeout });
                check.details.healthEndpoint = 'available';
            } catch (healthError) {
                // Health endpoint not available, try base URL
                response = await credentialValidator.makeRequest(backendUrl, { timeout });
                check.details.healthEndpoint = 'not_available';
            }

            check.responseTime = Date.now() - startTime;
            check.status = response.status;

            // Consider 200-499 as reachable (500+ is server error)
            if (response.status < 500) {
                check.healthy = true;
                check.details.message = 'Backend API is reachable';
                console.log(`✅ Backend health: OK (${response.status}) - ${check.responseTime}ms`);
            } else {
                check.error = `Server error: ${response.status}`;
                check.details.message = 'Backend API has server errors';
                console.log(`⚠️ Backend health: WARNING (${response.status}) - ${check.responseTime}ms`);
            }

            // Check for API indicators
            if (response.data) {
                const isApi = response.status === 200 || 
                             response.headers['content-type']?.includes('application/json');
                check.details.isApi = isApi;
            }

        } catch (error) {
            check.responseTime = Date.now() - startTime;
            check.error = error.message;
            check.details.message = 'Backend API unreachable';
            console.log(`❌ Backend health: FAILED - ${error.message}`);
        }

        return check;
    }

    /**
     * Check credentials health
     */
    async checkCredentialsHealth() {
        const check = {
            name: 'Test Credentials',
            healthy: false,
            responseTime: null,
            status: null,
            error: null,
            details: {}
        };

        const startTime = Date.now();

        try {
            console.log('🔐 Checking credentials health...');
            
            const validation = await credentialValidator.validateAllCredentials();
            
            check.responseTime = Date.now() - startTime;
            check.healthy = validation.valid;
            check.details.validation = validation;

            if (validation.valid) {
                check.details.message = 'Credentials are valid and backend authentication works';
                console.log('✅ Credentials health: OK - Authentication successful');
            } else {
                check.error = validation.errors.join('; ');
                check.details.message = 'Credential validation failed';
                console.log(`❌ Credentials health: FAILED - ${check.error}`);
            }

            if (validation.warnings.length > 0) {
                check.details.warnings = validation.warnings;
                console.log(`⚠️ Credentials warnings: ${validation.warnings.join('; ')}`);
            }

        } catch (error) {
            check.responseTime = Date.now() - startTime;
            check.error = error.message;
            check.details.message = 'Credential validation error';
            console.log(`❌ Credentials health: ERROR - ${error.message}`);
        }

        return check;
    }

    /**
     * Log health summary
     */
    logHealthSummary(results) {
        console.log('\n📊 Health Check Summary:');
        console.log('='.repeat(50));
        
        Object.entries(results.checks).forEach(([name, check]) => {
            const status = check.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY';
            const time = check.responseTime ? `(${check.responseTime}ms)` : '';
            console.log(`   ${check.name}: ${status} ${time}`);
            
            if (check.error) {
                console.log(`      Error: ${check.error}`);
            }
        });

        console.log('='.repeat(50));
        console.log(`Overall Status: ${results.overall ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        console.log(`Passed: ${results.summary.passed}/${results.summary.total}`);
        
        if (results.summary.failed > 0) {
            console.log(`⚠️  ${results.summary.failed} health check(s) failed`);
        }
        console.log('');
    }

    /**
     * Wait for services to become healthy
     */
    async waitForHealthy(options = {}) {
        const {
            maxWaitTime = 120000, // 2 minutes
            checkInterval = 10000, // 10 seconds
            requiredChecks = ['frontend', 'backend'],
            startFrontend = true
        } = options;

        console.log('⏳ Waiting for services to become healthy...');
        
        if (startFrontend) {
            console.log('🚀 Starting frontend server...');
            await frontendServer.autoStart();
        }

        const startTime = Date.now();
        let attempts = 0;

        while (Date.now() - startTime < maxWaitTime) {
            attempts++;
            console.log(`\n🔄 Health check attempt ${attempts}:`);
            
            const results = await this.runHealthCheck({
                includeCredentials: requiredChecks.includes('credentials'),
                includeFrontend: requiredChecks.includes('frontend'),
                includeBackend: requiredChecks.includes('backend')
            });

            // Check if required services are healthy
            const requiredHealthy = requiredChecks.every(checkName => {
                const check = results.checks[checkName];
                return check && check.healthy;
            });

            if (requiredHealthy) {
                console.log('🎉 All required services are healthy!');
                return true;
            }

            const remainingTime = Math.round((maxWaitTime - (Date.now() - startTime)) / 1000);
            console.log(`⏱️  Waiting ${checkInterval/1000}s before next check (${remainingTime}s remaining)...`);
            
            await this.delay(checkInterval);
        }

        console.error('⏰ Timeout waiting for services to become healthy');
        return false;
    }

    /**
     * Get current health status
     */
    getHealthStatus() {
        return {
            ...this.healthStatus,
            lastCheck: this.lastCheckTime ? new Date(this.lastCheckTime).toISOString() : null,
            age: this.lastCheckTime ? Date.now() - this.lastCheckTime : null
        };
    }

    /**
     * Quick health check (cached if recent)
     */
    async quickHealthCheck(maxAge = 30000) {
        const status = this.getHealthStatus();
        
        if (status.lastCheck && status.age < maxAge) {
            console.log('📋 Using cached health status');
            return status;
        }

        const results = await this.runHealthCheck();
        return results.overall;
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
module.exports = new HealthChecker();

// Allow running directly
if (require.main === module) {
    const healthChecker = new HealthChecker();
    const args = process.argv.slice(2);

    if (args.includes('--wait') || args.includes('-w')) {
        healthChecker.waitForHealthy()
            .then(healthy => process.exit(healthy ? 0 : 1))
            .catch(() => process.exit(1));
    } else if (args.includes('--frontend-only') || args.includes('-f')) {
        healthChecker.runHealthCheck({ includeBackend: false, includeCredentials: false })
            .then(results => process.exit(results.overall ? 0 : 1))
            .catch(() => process.exit(1));
    } else {
        healthChecker.runHealthCheck()
            .then(results => process.exit(results.overall ? 0 : 1))
            .catch(() => process.exit(1));
    }
}