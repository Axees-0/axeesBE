/**
 * Credential Validator Utility
 * 
 * Verifies test credentials work with actual backend authentication
 * Prevents running tests with invalid credentials
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const config = require('../config');

class CredentialValidator {
    constructor() {
        this.validationResults = {
            email: false,
            password: false,
            phone: false,
            backend: false,
            timestamp: null
        };
    }

    /**
     * Make HTTP request using built-in modules
     */
    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const requestModule = isHttps ? https : http;
            
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                timeout: options.timeout || 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'AxeesBugHunter/1.0',
                    ...options.headers
                }
            };
            
            const req = requestModule.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = data ? JSON.parse(data) : {};
                        resolve({
                            status: res.statusCode,
                            data: jsonData,
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: data,
                            headers: res.headers
                        });
                    }
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.on('error', reject);
            
            if (options.data) {
                req.write(JSON.stringify(options.data));
            }
            
            req.end();
        });
    }

    /**
     * Validate all credentials before test execution
     */
    async validateAllCredentials() {
        console.log('🔐 Validating test credentials...\n');
        
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check if credentials are configured
        if (!config.config.credentialsConfigured) {
            results.valid = false;
            results.errors.push('CREDENTIALS_CONFIGURED is not set to true in .env');
            return results;
        }

        // Validate email format
        const emailValid = await this.validateEmailFormat();
        if (!emailValid.valid) {
            results.valid = false;
            results.errors.push(emailValid.error);
        }

        // Validate password strength
        const passwordValid = this.validatePasswordStrength();
        if (!passwordValid.valid) {
            results.warnings.push(passwordValid.warning);
        }

        // Validate backend connectivity
        const backendValid = await this.validateBackendConnectivity();
        if (!backendValid.valid) {
            results.valid = false;
            results.errors.push(backendValid.error);
        } else {
            // Try actual authentication
            const authValid = await this.validateAuthentication();
            if (!authValid.valid) {
                results.valid = false;
                results.errors.push(authValid.error);
            } else {
                console.log('✅ Authentication successful with provided credentials');
            }
        }

        this.validationResults.timestamp = new Date().toISOString();
        return results;
    }

    /**
     * Validate email format
     */
    async validateEmailFormat() {
        const email = config.testCredentials.email;
        
        // Check for placeholder (allow test@axees.com for test backend)
        const isUsingTestBackend = config.config.backendApiUrl.includes('localhost:3001');
        if (email.includes('REPLACE_WITH') || (!isUsingTestBackend && email === 'test@axees.com')) {
            return {
                valid: false,
                error: `Email is still a placeholder: ${email}`
            };
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                valid: false,
                error: `Invalid email format: ${email}`
            };
        }

        this.validationResults.email = true;
        return { valid: true };
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength() {
        const password = config.testCredentials.password;
        
        // Check for placeholder (allow test123 for test backend)
        const isUsingTestBackend = config.config.backendApiUrl.includes('localhost:3001');
        if (password.includes('REPLACE_WITH') || (!isUsingTestBackend && password === 'test123')) {
            return {
                valid: false,
                warning: 'Password is still a placeholder'
            };
        }

        // Check minimum length
        if (password.length < 6) {
            return {
                valid: true,
                warning: 'Password is very short - may be a weak test password'
            };
        }

        this.validationResults.password = true;
        return { valid: true };
    }

    /**
     * Validate backend connectivity
     */
    async validateBackendConnectivity() {
        const backendUrl = config.config.backendApiUrl;
        
        // Check for placeholder
        if (backendUrl.includes('REPLACE_WITH')) {
            return {
                valid: false,
                error: 'Backend API URL is not configured'
            };
        }

        try {
            console.log(`🔍 Checking backend connectivity: ${backendUrl}`);
            
            // Try health endpoint first
            const healthUrl = `${backendUrl}${config.config.authHealthEndpoint}`;
            try {
                const healthResponse = await this.makeRequest(healthUrl);
                if (healthResponse.status === 200) {
                    console.log('✅ Backend health check passed');
                    this.validationResults.backend = true;
                    return { valid: true };
                }
            } catch (e) {
                // Health endpoint might not exist, try base URL
            }

            // Try base URL if health endpoint fails
            try {
                const baseResponse = await this.makeRequest(backendUrl);
                if (baseResponse.status < 500) {
                    console.log('⚠️ Backend reachable but health endpoint not found');
                    this.validationResults.backend = true;
                    return { valid: true };
                }
                
                return {
                    valid: false,
                    error: `Backend not responding properly: ${baseResponse.status}`
                };
            } catch (e) {
                return {
                    valid: false,
                    error: `Cannot connect to backend: ${e.message}`
                };
            }

        } catch (error) {
            return {
                valid: false,
                error: `Cannot connect to backend: ${error.message}`
            };
        }
    }

    /**
     * Validate authentication with actual backend
     */
    async validateAuthentication() {
        const loginUrl = `${config.config.backendApiUrl}${config.config.authLoginEndpoint}`;
        const credentials = config.testCredentials;

        try {
            console.log('🔑 Testing authentication with backend...');
            
            // Try phone-based login first (common pattern)
            const phoneAuth = await this.tryPhoneAuth(loginUrl, credentials);
            if (phoneAuth.valid) return phoneAuth;

            // Try email-based login
            const emailAuth = await this.tryEmailAuth(loginUrl, credentials);
            if (emailAuth.valid) return emailAuth;

            // Try username-based login
            const usernameAuth = await this.tryUsernameAuth(loginUrl, credentials);
            if (usernameAuth.valid) return usernameAuth;

            return {
                valid: false,
                error: 'Authentication failed with all credential types'
            };

        } catch (error) {
            return {
                valid: false,
                error: `Authentication error: ${error.message}`
            };
        }
    }

    /**
     * Try phone-based authentication
     */
    async tryPhoneAuth(loginUrl, credentials) {
        if (!credentials.phone || credentials.phone.includes('REPLACE_WITH')) {
            return { valid: false };
        }

        try {
            const response = await this.makeRequest(loginUrl, {
                method: 'POST',
                timeout: 10000,
                data: {
                    phone: credentials.phone,
                    password: credentials.password
                }
            });

            if (response.status === 200 && response.data.token) {
                console.log('✅ Phone authentication successful');
                this.validationResults.phone = true;
                return { valid: true, token: response.data.token };
            }

            return { valid: false };
        } catch (error) {
            return { valid: false };
        }
    }

    /**
     * Try email-based authentication
     */
    async tryEmailAuth(loginUrl, credentials) {
        try {
            const response = await this.makeRequest(loginUrl, {
                method: 'POST',
                timeout: 10000,
                data: {
                    email: credentials.email,
                    password: credentials.password
                }
            });

            if (response.status === 200 && response.data.token) {
                console.log('✅ Email authentication successful');
                return { valid: true, token: response.data.token };
            }

            if (response.status === 401) {
                return {
                    valid: false,
                    error: 'Invalid email or password'
                };
            }

            return { valid: false };
        } catch (error) {
            return { valid: false };
        }
    }

    /**
     * Try username-based authentication
     */
    async tryUsernameAuth(loginUrl, credentials) {
        try {
            // Extract username from email
            const username = credentials.email.split('@')[0];
            
            const response = await this.makeRequest(loginUrl, {
                method: 'POST',
                timeout: 10000,
                data: {
                    username: username,
                    password: credentials.password
                }
            });

            if (response.status === 200 && response.data.token) {
                console.log('✅ Username authentication successful');
                return { valid: true, token: response.data.token };
            }

            return { valid: false };
        } catch (error) {
            return { valid: false };
        }
    }

    /**
     * Get validation report
     */
    getValidationReport() {
        return {
            results: this.validationResults,
            summary: {
                allValid: Object.values(this.validationResults)
                    .filter(v => typeof v === 'boolean')
                    .every(v => v),
                timestamp: this.validationResults.timestamp
            }
        };
    }

    /**
     * Pre-flight check before running tests
     */
    async preFlightCheck() {
        console.log('\n🚀 Running pre-flight credential check...\n');
        
        const validation = await this.validateAllCredentials();
        
        if (!validation.valid) {
            console.error('\n❌ Pre-flight check failed!\n');
            validation.errors.forEach(error => console.error(`   • ${error}`));
            
            if (validation.warnings.length > 0) {
                console.warn('\n⚠️ Warnings:');
                validation.warnings.forEach(warning => console.warn(`   • ${warning}`));
            }
            
            console.error('\n🛑 Cannot proceed with invalid credentials');
            throw new Error('Credential validation failed');
        }

        if (validation.warnings.length > 0) {
            console.warn('\n⚠️ Warnings:');
            validation.warnings.forEach(warning => console.warn(`   • ${warning}`));
        }

        console.log('\n✅ Pre-flight check passed - credentials are valid\n');
        return true;
    }
}

// Export singleton instance
module.exports = new CredentialValidator();

// Allow running directly for testing
if (require.main === module) {
    const validator = new CredentialValidator();
    validator.validateAllCredentials()
        .then(results => {
            console.log('\n📋 Validation Results:');
            console.log(JSON.stringify(results, null, 2));
            process.exit(results.valid ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Validation failed:', error.message);
            process.exit(1);
        });
}