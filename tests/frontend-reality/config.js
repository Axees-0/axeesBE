/**
 * Frontend Bug Hunter Configuration
 * 
 * Centralized configuration management for all testing environments
 * Supports local development, staging, and production environments
 */

const fs = require('fs');
const path = require('path');
const ProductionSafety = require('./config/production-safety');

class Config {
    constructor() {
        this.loadEnvironmentVariables();
        this.validateConfiguration();
        this.productionSafety = new ProductionSafety(this.config);
    }

    /**
     * Load environment variables from .env file and process.env
     */
    loadEnvironmentVariables() {
        const envPath = path.join(__dirname, '.env');
        
        // Load .env file if it exists
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value && !key.startsWith('#')) {
                    // Don't override existing environment variables
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = value.trim();
                    }
                }
            });
        }

        // Get current environment
        this.environment = process.env.ENVIRONMENT || 'development';
        
        // Set defaults for required variables
        this.config = {
            // Environment
            environment: this.environment,
            
            // Frontend URL Configuration
            frontendUrl: process.env.FRONTEND_URL || 'http://localhost:19006',
            
            // Test Timeouts (in seconds)
            quickTestTimeout: parseInt(process.env.QUICK_TEST_TIMEOUT) || 300,
            standardTestTimeout: parseInt(process.env.STANDARD_TEST_TIMEOUT) || 900,
            comprehensiveTestTimeout: parseInt(process.env.COMPREHENSIVE_TEST_TIMEOUT) || 1800,
            
            // Browser Configuration
            headless: process.env.HEADLESS === 'true',
            browserWidth: parseInt(process.env.BROWSER_WIDTH) || 1920,
            browserHeight: parseInt(process.env.BROWSER_HEIGHT) || 1080,
            
            // Mobile Configuration
            mobileWidth: parseInt(process.env.MOBILE_WIDTH) || 375,
            mobileHeight: parseInt(process.env.MOBILE_HEIGHT) || 667,
            
            // Performance Thresholds
            pageLoadTimeout: parseInt(process.env.PAGE_LOAD_TIMEOUT) || 5000,
            networkTimeout: parseInt(process.env.NETWORK_TIMEOUT) || 30000,
            
            // Debug Configuration
            debugMode: process.env.DEBUG_MODE === 'true',
            screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
            verboseLogging: process.env.VERBOSE_LOGGING === 'true',
            
            // CI/CD Configuration
            ciMode: process.env.CI_MODE === 'true' || process.env.CI === 'true',
            parallelTests: parseInt(process.env.PARALLEL_TESTS) || 2,
            
            // Authentication Configuration
            testEmail: process.env.TEST_EMAIL || 'REPLACE_WITH_REAL_TEST_USER_EMAIL',
            testPassword: process.env.TEST_PASSWORD || 'REPLACE_WITH_REAL_TEST_USER_PASSWORD',
            testPhone: process.env.TEST_PHONE || 'REPLACE_WITH_REAL_TEST_USER_PHONE',
            credentialsConfigured: process.env.CREDENTIALS_CONFIGURED === 'true',
            
            // Backend API Configuration (auto-select based on environment)
            backendApiUrl: this.getEnvironmentUrl('backend'),
            authLoginEndpoint: process.env.AUTH_LOGIN_ENDPOINT || '/api/auth/login',
            authHealthEndpoint: process.env.AUTH_HEALTH_ENDPOINT || '/api/health'
        };
        
        // Override with environment-specific credentials if available
        this.loadEnvironmentCredentials();
        
        // Update URLs based on environment after methods are available
        this.config.frontendUrl = this.getEnvironmentUrl('frontend');
        this.config.backendApiUrl = this.getEnvironmentUrl('backend');
        
        // Log environment info
        this.logEnvironmentInfo();
    }

    /**
     * Validate configuration and provide warnings
     */
    validateConfiguration() {
        const warnings = [];
        const errors = [];
        
        // CRITICAL: Validate authentication credentials
        this.validateAuthenticationCredentials(errors, warnings);
        
        // Check frontend URL
        if (!this.config.frontendUrl.startsWith('http')) {
            warnings.push(`Invalid frontend URL: ${this.config.frontendUrl}`);
        }
        
        // Check timeouts are reasonable
        if (this.config.pageLoadTimeout > 30000) {
            warnings.push('Page load timeout is very high (>30s)');
        }
        
        // Check test data in production
        if (this.config.frontendUrl.includes('axees.com') && 
            this.config.testEmail.includes('REPLACE_WITH')) {
            errors.push('Production URL detected but using placeholder credentials');
        }
        
        // Output errors (will stop execution)
        if (errors.length > 0) {
            console.error('🚨 CRITICAL CONFIGURATION ERRORS:');
            errors.forEach(error => console.error(`   ❌ ${error}`));
            console.error('');
            console.error('Framework execution BLOCKED to prevent false security.');
            console.error('Fix these errors in .env file before proceeding.');
            throw new Error('Critical configuration errors detected');
        }
        
        // Output warnings
        if (warnings.length > 0) {
            console.warn('⚠️  Configuration Warnings:');
            warnings.forEach(warning => console.warn(`   • ${warning}`));
            console.warn('');
        }
    }

    /**
     * Validate authentication credentials - CRITICAL SECURITY CHECK
     */
    validateAuthenticationCredentials(errors, warnings) {
        // Check if credentials are still placeholder values
        const hasPlaceholderEmail = this.config.testEmail.includes('REPLACE_WITH');
        const hasPlaceholderPassword = this.config.testPassword.includes('REPLACE_WITH');
        const hasPlaceholderPhone = this.config.testPhone.includes('REPLACE_WITH');
        const hasPlaceholderBackend = this.config.backendApiUrl.includes('REPLACE_WITH');
        
        if (hasPlaceholderEmail || hasPlaceholderPassword || hasPlaceholderPhone) {
            errors.push('Authentication credentials are still placeholder values');
            errors.push('Update TEST_EMAIL, TEST_PASSWORD, and TEST_PHONE in .env file');
        }
        
        if (hasPlaceholderBackend) {
            errors.push('Backend API URL is still placeholder value');
            errors.push('Update BACKEND_API_URL in .env file');
        }
        
        if (!this.config.credentialsConfigured) {
            errors.push('CREDENTIALS_CONFIGURED must be set to true in .env file');
            errors.push('Only set this to true AFTER configuring real credentials');
        }
        
        // Check for old insecure defaults (skip if using test backend)
        const isUsingTestBackend = this.config.backendApiUrl.includes('localhost:3001');
        if (!isUsingTestBackend && 
            (this.config.testEmail === 'test@axees.com' || 
             this.config.testPassword === 'test123')) {
            errors.push('Detected old insecure default credentials');
            errors.push('These will never authenticate successfully');
        }
        
        // Validate email format
        if (!hasPlaceholderEmail && !this.config.testEmail.includes('@')) {
            warnings.push('TEST_EMAIL does not appear to be a valid email address');
        }
        
        // Check password strength indication
        if (!hasPlaceholderPassword && this.config.testPassword.length < 6) {
            warnings.push('TEST_PASSWORD appears to be very short - may indicate test credentials');
        }
    }

    /**
     * Get appropriate URL based on current environment
     */
    getEnvironmentUrl(type) {
        switch (this.environment) {
            case 'staging':
                return type === 'frontend' 
                    ? (process.env.STAGING_FRONTEND_URL || 'https://staging.axees.com')
                    : (process.env.STAGING_BACKEND_API_URL || 'https://staging-api.axees.com');
            case 'production':
                return type === 'frontend' 
                    ? (process.env.PRODUCTION_FRONTEND_URL || 'https://axees.com')
                    : (process.env.PRODUCTION_BACKEND_API_URL || 'https://api.axees.com');
            default: // development
                return type === 'frontend'
                    ? (process.env.FRONTEND_URL || 'http://localhost:19006')
                    : (process.env.BACKEND_API_URL || 'REPLACE_WITH_ACTUAL_BACKEND_URL');
        }
    }
    
    /**
     * Load environment-specific credentials
     */
    loadEnvironmentCredentials() {
        const envPrefix = this.environment.toUpperCase();
        
        // Check for environment-specific credentials
        const envEmail = process.env[`${envPrefix}_TEST_EMAIL`];
        const envPassword = process.env[`${envPrefix}_TEST_PASSWORD`];
        const envPhone = process.env[`${envPrefix}_TEST_PHONE`];
        
        if (envEmail) this.config.testEmail = envEmail;
        if (envPassword) this.config.testPassword = envPassword;
        if (envPhone) this.config.testPhone = envPhone;
    }
    
    /**
     * Auto-detect environment based on various indicators
     */
    autoDetectEnvironment() {
        // If explicitly set, use that
        if (process.env.ENVIRONMENT) {
            return process.env.ENVIRONMENT;
        }
        
        // Check common CI/CD environment variables
        if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
            // Check if it's a staging or production deployment
            if (process.env.DEPLOY_ENV) {
                return process.env.DEPLOY_ENV;
            }
            // Default to staging for CI
            return 'staging';
        }
        
        // Check Kubernetes/Docker indicators
        if (process.env.KUBERNETES_SERVICE_HOST || process.env.DOCKER_CONTAINER) {
            return 'staging';
        }
        
        // Check hostname/URL indicators
        const hostname = require('os').hostname();
        if (hostname.includes('staging') || hostname.includes('stg')) {
            return 'staging';
        }
        if (hostname.includes('prod') || hostname.includes('production')) {
            return 'production';
        }
        
        // Default to development
        return 'development';
    }

    /**
     * Log environment information
     */
    logEnvironmentInfo() {
        console.log(`\n🌍 Environment Configuration:`);
        console.log(`   Environment: ${this.environment}`);
        console.log(`   Frontend URL: ${this.config.frontendUrl}`);
        console.log(`   Backend API: ${this.config.backendApiUrl}`);
        console.log(`   Auto-detected: ${this.autoDetectEnvironment()}`);
        
        if (this.environment !== this.autoDetectEnvironment()) {
            console.log(`   ⚠️  Note: Explicitly set to '${this.environment}', auto-detection would use '${this.autoDetectEnvironment()}'`);
        }
    }

    /**
     * Get browser launch options for Puppeteer
     */
    getBrowserOptions() {
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ];

        // Add CI-specific arguments
        if (this.config.ciMode) {
            args.push(
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            );
        }

        const options = {
            headless: this.config.headless,
            args,
            defaultViewport: {
                width: this.config.browserWidth,
                height: this.config.browserHeight
            }
        };

        // Specify Chrome executable path
        const chromePath = '/root/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome';
        const fs = require('fs');
        if (fs.existsSync(chromePath)) {
            options.executablePath = chromePath;
        }

        return options;
    }

    /**
     * Get mobile viewport configuration
     */
    getMobileViewport() {
        return {
            width: this.config.mobileWidth,
            height: this.config.mobileHeight,
            isMobile: true,
            hasTouch: true
        };
    }

    /**
     * Get environment-specific configuration
     */
    getEnvironmentInfo() {
        const url = new URL(this.config.frontendUrl);
        
        return {
            environment: this.detectEnvironment(),
            frontendUrl: this.config.frontendUrl,
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            isLocal: url.hostname === 'localhost' || url.hostname === '127.0.0.1',
            isSecure: url.protocol === 'https:'
        };
    }

    /**
     * Detect current environment
     */
    detectEnvironment() {
        const url = this.config.frontendUrl.toLowerCase();
        
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            return 'local';
        } else if (url.includes('staging')) {
            return 'staging';
        } else if (url.includes('dev')) {
            return 'development';
        } else {
            return 'production';
        }
    }

    /**
     * Print configuration summary
     */
    printSummary() {
        const env = this.getEnvironmentInfo();
        
        console.log('🔧 Frontend Bug Hunter Configuration');
        console.log('=====================================');
        console.log(`Environment: ${env.environment}`);
        console.log(`Frontend URL: ${this.config.frontendUrl}`);
        console.log(`Browser: ${this.config.headless ? 'Headless' : 'GUI'} (${this.config.browserWidth}x${this.config.browserHeight})`);
        console.log(`Mobile: ${this.config.mobileWidth}x${this.config.mobileHeight}`);
        console.log(`CI Mode: ${this.config.ciMode ? 'Enabled' : 'Disabled'}`);
        console.log(`Debug: ${this.config.debugMode ? 'Enabled' : 'Disabled'}`);
        console.log('');
    }

    // Getter methods for easy access
    get frontendUrl() { return this.config.frontendUrl; }
    get headless() { return this.config.headless; }
    get debugMode() { return this.config.debugMode; }
    get ciMode() { return this.config.ciMode; }
    get testCredentials() {
        return {
            email: this.config.testEmail,
            password: this.config.testPassword,
            phone: this.config.testPhone
        };
    }
    
    /**
     * Check if it's safe to run tests in current environment
     */
    isProductionSafe() {
        const safety = this.productionSafety.validateSafety();
        if (!safety.safe) {
            console.error('🚨 Production safety check failed:');
            safety.errors.forEach(err => console.error(`   ❌ ${err}`));
            return false;
        }
        if (safety.warnings.length > 0) {
            console.warn('⚠️  Production safety warnings:');
            safety.warnings.forEach(warn => console.warn(`   • ${warn}`));
        }
        return true;
    }
    
    /**
     * Get production-safe page wrapper
     */
    wrapPageForProduction(page) {
        return this.productionSafety.wrapPageActions(page);
    }
    
    /**
     * Check if test should run in production
     */
    shouldRunInProduction(testName) {
        return this.productionSafety.shouldRunTest(testName);
    }
    
    /**
     * Validate credentials before running tests
     */
    async validateCredentials() {
        const credentialValidator = require('./utils/credential-validator');
        return await credentialValidator.preFlightCheck();
    }
}

// Export singleton instance
module.exports = new Config();