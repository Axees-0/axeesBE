/**
 * Network Connectivity Validator
 * 
 * Validates network connectivity and DNS resolution before running tests
 * Prevents false negatives caused by network issues
 */

const https = require('https');
const http = require('http');
const { promisify } = require('util');
const dns = require('dns');

const dnsLookup = promisify(dns.lookup);

class NetworkValidator {
    constructor() {
        this.connectivity = {
            localhost: false,
            internet: false,
            dns: false,
            specificHosts: []
        };
    }

    /**
     * Run comprehensive network validation
     */
    async validateNetworkConnectivity(options = {}) {
        const {
            timeout = 10000,
            checkHosts = ['google.com', 'github.com'],
            requireInternet = false
        } = options;

        console.log('🌐 Validating network connectivity...\n');

        const results = {
            valid: true,
            errors: [],
            warnings: [],
            connectivity: {},
            timestamp: new Date().toISOString()
        };

        try {
            // Test localhost connectivity
            results.connectivity.localhost = await this.testLocalhostConnectivity(timeout);
            
            // Test DNS resolution
            results.connectivity.dns = await this.testDnsResolution(checkHosts, timeout);
            
            // Test internet connectivity
            results.connectivity.internet = await this.testInternetConnectivity(checkHosts, timeout);
            
            // Test specific hosts if provided
            if (checkHosts.length > 0) {
                results.connectivity.specificHosts = await this.testSpecificHosts(checkHosts, timeout);
            }

            // Analyze results
            this.analyzeConnectivity(results, requireInternet);

        } catch (error) {
            results.valid = false;
            results.errors.push(`Network validation failed: ${error.message}`);
        }

        this.logConnectivityResults(results);
        return results;
    }

    /**
     * Test localhost connectivity
     */
    async testLocalhostConnectivity(timeout) {
        console.log('🏠 Testing localhost connectivity...');
        
        try {
            // Test IPv4 localhost
            const ipv4Result = await this.makeTestRequest('http://127.0.0.1:19006', timeout);
            console.log(`   ✅ IPv4 localhost (127.0.0.1): ${ipv4Result.status || 'accessible'}`);
            
            // Test IPv6 localhost if available
            try {
                const ipv6Result = await this.makeTestRequest('http://[::1]:19006', timeout / 2);
                console.log(`   ✅ IPv6 localhost ([::1]): ${ipv6Result.status || 'accessible'}`);
            } catch (ipv6Error) {
                console.log(`   ⚠️  IPv6 localhost: ${ipv6Error.message}`);
            }
            
            return {
                accessible: true,
                ipv4: true,
                ipv6: false, // Assume false unless proven otherwise
                responseTime: ipv4Result.responseTime
            };
            
        } catch (error) {
            console.log(`   ❌ Localhost connectivity failed: ${error.message}`);
            return {
                accessible: false,
                error: error.message
            };
        }
    }

    /**
     * Test DNS resolution
     */
    async testDnsResolution(hosts, timeout) {
        console.log('🔍 Testing DNS resolution...');
        
        const results = {
            working: true,
            resolvedHosts: [],
            failedHosts: []
        };

        for (const host of hosts.slice(0, 3)) { // Limit to 3 hosts for speed
            try {
                const startTime = Date.now();
                const address = await dnsLookup(host);
                const responseTime = Date.now() - startTime;
                
                console.log(`   ✅ ${host} → ${address.address} (${responseTime}ms)`);
                results.resolvedHosts.push({
                    host,
                    address: address.address,
                    family: address.family,
                    responseTime
                });
                
            } catch (error) {
                console.log(`   ❌ ${host}: ${error.message}`);
                results.failedHosts.push({
                    host,
                    error: error.message
                });
                results.working = false;
            }
        }

        return results;
    }

    /**
     * Test internet connectivity
     */
    async testInternetConnectivity(hosts, timeout) {
        console.log('🌍 Testing internet connectivity...');
        
        const results = {
            available: false,
            successfulHosts: [],
            failedHosts: []
        };

        // Try multiple hosts to ensure reliability
        const testHosts = [
            'https://www.google.com',
            'https://github.com',
            'https://httpbin.org/status/200'
        ];

        let successCount = 0;

        for (const url of testHosts) {
            try {
                const result = await this.makeTestRequest(url, timeout / testHosts.length);
                
                if (result.status >= 200 && result.status < 400) {
                    console.log(`   ✅ ${new URL(url).hostname}: ${result.status} (${result.responseTime}ms)`);
                    results.successfulHosts.push({
                        url,
                        status: result.status,
                        responseTime: result.responseTime
                    });
                    successCount++;
                } else {
                    console.log(`   ⚠️  ${new URL(url).hostname}: ${result.status}`);
                    results.failedHosts.push({
                        url,
                        status: result.status,
                        error: `HTTP ${result.status}`
                    });
                }
                
            } catch (error) {
                console.log(`   ❌ ${new URL(url).hostname}: ${error.message}`);
                results.failedHosts.push({
                    url,
                    error: error.message
                });
            }
        }

        results.available = successCount > 0;
        results.reliability = successCount / testHosts.length;

        return results;
    }

    /**
     * Test specific hosts provided by user
     */
    async testSpecificHosts(hosts, timeout) {
        console.log('🎯 Testing specific hosts...');
        
        const results = [];

        for (const host of hosts) {
            try {
                // Try HTTPS first, then HTTP
                let result;
                try {
                    result = await this.makeTestRequest(`https://${host}`, timeout / 2);
                } catch (httpsError) {
                    result = await this.makeTestRequest(`http://${host}`, timeout / 2);
                }
                
                console.log(`   ✅ ${host}: ${result.status} (${result.responseTime}ms)`);
                results.push({
                    host,
                    accessible: true,
                    status: result.status,
                    responseTime: result.responseTime,
                    protocol: result.protocol
                });
                
            } catch (error) {
                console.log(`   ❌ ${host}: ${error.message}`);
                results.push({
                    host,
                    accessible: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Make test HTTP request
     */
    makeTestRequest(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const requestModule = isHttps ? https : http;
            
            const startTime = Date.now();
            
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'HEAD', // Use HEAD for faster requests
                timeout: timeout,
                headers: {
                    'User-Agent': 'AxeesNetworkValidator/1.0'
                }
            };

            const req = requestModule.request(requestOptions, (res) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    status: res.statusCode,
                    responseTime,
                    protocol: parsedUrl.protocol
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Connection failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Analyze connectivity results
     */
    analyzeConnectivity(results, requireInternet) {
        // Check localhost
        if (!results.connectivity.localhost?.accessible) {
            results.errors.push('Localhost connectivity failed - frontend server may not be reachable');
        }

        // Check DNS
        if (!results.connectivity.dns?.working) {
            results.errors.push('DNS resolution is not working - may cause external requests to fail');
        }

        // Check internet if required
        if (requireInternet && !results.connectivity.internet?.available) {
            results.errors.push('Internet connectivity required but not available');
        } else if (!results.connectivity.internet?.available) {
            results.warnings.push('Internet connectivity not available - external tests may fail');
        }

        // Check reliability
        if (results.connectivity.internet?.reliability < 0.5) {
            results.warnings.push('Internet connectivity is unreliable');
        }

        // Overall validation
        results.valid = results.errors.length === 0;
    }

    /**
     * Log connectivity results
     */
    logConnectivityResults(results) {
        console.log('\\n📊 Network Connectivity Summary:');
        console.log('='.repeat(50));
        
        const localhost = results.connectivity.localhost;
        const dns = results.connectivity.dns;
        const internet = results.connectivity.internet;
        
        console.log(`   Localhost: ${localhost?.accessible ? '✅ ACCESSIBLE' : '❌ FAILED'}`);
        console.log(`   DNS Resolution: ${dns?.working ? '✅ WORKING' : '❌ FAILED'}`);
        console.log(`   Internet: ${internet?.available ? '✅ AVAILABLE' : '❌ UNAVAILABLE'}`);
        
        if (internet?.reliability !== undefined) {
            const reliabilityPercent = Math.round(internet.reliability * 100);
            console.log(`   Reliability: ${reliabilityPercent}%`);
        }

        if (results.errors.length > 0) {
            console.log('\\n🚨 Network Issues:');
            results.errors.forEach(error => console.log(`   ❌ ${error}`));
        }

        if (results.warnings.length > 0) {
            console.log('\\n⚠️  Network Warnings:');
            results.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
        }

        console.log(`\\nOverall Status: ${results.valid ? '✅ READY' : '❌ NOT READY'}`);
        console.log('');
    }

    /**
     * Quick connectivity check
     */
    async quickConnectivityCheck(timeout = 5000) {
        console.log('⚡ Quick network check...');
        
        try {
            // Test localhost only
            await this.makeTestRequest('http://127.0.0.1:19006', timeout);
            console.log('✅ Network ready');
            return true;
        } catch (error) {
            console.log(`❌ Network issue: ${error.message}`);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new NetworkValidator();

// Allow running directly
if (require.main === module) {
    const validator = new NetworkValidator();
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        validator.quickConnectivityCheck()
            .then(ready => process.exit(ready ? 0 : 1))
            .catch(() => process.exit(1));
    } else {
        const requireInternet = args.includes('--require-internet');
        const checkHosts = args.filter(arg => !arg.startsWith('--'));
        
        validator.validateNetworkConnectivity({
            requireInternet,
            checkHosts: checkHosts.length > 0 ? checkHosts : ['google.com', 'github.com']
        })
            .then(results => process.exit(results.valid ? 0 : 1))
            .catch(() => process.exit(1));
    }
}