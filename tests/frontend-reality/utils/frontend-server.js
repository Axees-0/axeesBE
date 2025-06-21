/**
 * Frontend Server Manager
 * 
 * Manages starting, stopping, and monitoring the frontend development server
 * Ensures frontend is available before running tests
 */

const { spawn } = require('child_process');
const path = require('path');
const credentialValidator = require('./credential-validator');

class FrontendServerManager {
    constructor() {
        this.serverProcess = null;
        this.isServerRunning = false;
        this.frontendPath = path.join(__dirname, '../../frontend');
        this.serverPort = 19006;
        this.serverUrl = `http://localhost:${this.serverPort}`;
        this.healthCheckInterval = null;
    }

    /**
     * Start the frontend development server
     */
    async startServer(options = {}) {
        const {
            port = this.serverPort,
            platform = 'web',
            timeout = 120000 // 2 minutes
        } = options;

        if (this.isServerRunning) {
            console.log('✅ Frontend server already running');
            return true;
        }

        console.log('🚀 Starting frontend development server...');
        console.log(`   Platform: ${platform}`);
        console.log(`   Port: ${port}`);
        console.log(`   Path: ${this.frontendPath}`);

        try {
            // Check if frontend directory exists
            const fs = require('fs');
            if (!fs.existsSync(this.frontendPath)) {
                throw new Error(`Frontend directory not found: ${this.frontendPath}`);
            }

            // Check if package.json exists
            const packageJsonPath = path.join(this.frontendPath, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error('Frontend package.json not found');
            }

            // Start the server
            const command = platform === 'web' ? 'npm' : 'expo';
            const args = platform === 'web' 
                ? ['run', 'web'] 
                : ['start', '--web'];

            this.serverProcess = spawn(command, args, {
                cwd: this.frontendPath,
                env: { 
                    ...process.env, 
                    PORT: port.toString(),
                    EXPO_DEVTOOLS: 'false',
                    CI: 'true'
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Setup process monitoring
            this.setupProcessMonitoring();

            // Wait for server to start
            const started = await this.waitForServerStart(timeout);
            
            if (started) {
                this.isServerRunning = true;
                console.log(`✅ Frontend server started at ${this.serverUrl}`);
                return true;
            } else {
                throw new Error('Server failed to start within timeout');
            }

        } catch (error) {
            console.error('❌ Failed to start frontend server:', error.message);
            this.cleanup();
            return false;
        }
    }

    /**
     * Setup process monitoring
     */
    setupProcessMonitoring() {
        if (!this.serverProcess) return;

        this.serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('webpack compiled') || 
                output.includes('Expo DevTools') ||
                output.includes('Metro waiting')) {
                console.log('📦 Frontend compilation completed');
            }
            if (output.includes('Error') || output.includes('ERROR')) {
                console.error('🚨 Frontend error:', output);
            }
        });

        this.serverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            if (!error.includes('Warning') && !error.includes('WARN')) {
                console.error('🚨 Frontend stderr:', error);
            }
        });

        this.serverProcess.on('close', (code) => {
            console.log(`📤 Frontend server exited with code ${code}`);
            this.isServerRunning = false;
            this.cleanup();
        });

        this.serverProcess.on('error', (error) => {
            console.error('❌ Frontend server process error:', error);
            this.isServerRunning = false;
            this.cleanup();
        });
    }

    /**
     * Wait for server to start and be responsive
     */
    async waitForServerStart(timeout) {
        const startTime = Date.now();
        const checkInterval = 2000; // Check every 2 seconds

        while (Date.now() - startTime < timeout) {
            try {
                const isHealthy = await this.checkHealth();
                if (isHealthy) {
                    return true;
                }
            } catch (error) {
                // Server not ready yet
            }

            await this.delay(checkInterval);
            console.log('⏳ Waiting for frontend server to respond...');
        }

        return false;
    }

    /**
     * Check if frontend server is healthy
     */
    async checkHealth() {
        try {
            console.log(`🔍 Checking frontend health: ${this.serverUrl}`);
            
            const response = await credentialValidator.makeRequest(this.serverUrl, {
                timeout: 5000
            });

            // Consider 200-399 as healthy
            const isHealthy = response.status >= 200 && response.status < 400;
            
            if (isHealthy) {
                console.log(`✅ Frontend health check passed (${response.status})`);
            } else {
                console.log(`⚠️ Frontend health check returned ${response.status}`);
            }

            return isHealthy;

        } catch (error) {
            console.log(`❌ Frontend health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Stop the frontend server
     */
    async stopServer() {
        if (!this.serverProcess || !this.isServerRunning) {
            console.log('ℹ️ Frontend server not running');
            return;
        }

        console.log('🛑 Stopping frontend server...');

        try {
            // Try graceful shutdown first
            this.serverProcess.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await this.delay(5000);
            
            // Force kill if still running
            if (this.isServerRunning) {
                this.serverProcess.kill('SIGKILL');
                await this.delay(2000);
            }

            console.log('✅ Frontend server stopped');
        } catch (error) {
            console.error('❌ Error stopping frontend server:', error.message);
        } finally {
            this.cleanup();
        }
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring(intervalMs = 30000) {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            if (this.isServerRunning) {
                const isHealthy = await this.checkHealth();
                if (!isHealthy) {
                    console.warn('⚠️ Frontend server health check failed');
                }
            }
        }, intervalMs);
    }

    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Get server status
     */
    getStatus() {
        return {
            isRunning: this.isServerRunning,
            processExists: !!this.serverProcess,
            serverUrl: this.serverUrl,
            frontendPath: this.frontendPath
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.isServerRunning = false;
        this.serverProcess = null;
        this.stopHealthMonitoring();
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Auto-start server with retry logic
     */
    async autoStart(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔄 Attempt ${attempt}/${maxRetries} to start frontend server`);
            
            const success = await this.startServer();
            if (success) {
                this.startHealthMonitoring();
                return true;
            }

            if (attempt < maxRetries) {
                console.log(`⏳ Waiting before retry attempt ${attempt + 1}...`);
                await this.delay(10000); // Wait 10 seconds between retries
            }
        }

        console.error('❌ Failed to start frontend server after all retries');
        return false;
    }
}

// Export singleton instance
module.exports = new FrontendServerManager();

// Allow running directly
if (require.main === module) {
    const serverManager = new FrontendServerManager();
    const args = process.argv.slice(2);

    if (args.includes('--stop') || args.includes('-s')) {
        serverManager.stopServer().then(() => process.exit(0));
    } else if (args.includes('--health') || args.includes('-h')) {
        serverManager.checkHealth().then(healthy => {
            console.log(`Server health: ${healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
            process.exit(healthy ? 0 : 1);
        });
    } else {
        serverManager.autoStart().then(success => {
            if (success) {
                console.log('✅ Frontend server is running');
                // Keep process alive for monitoring
                process.on('SIGINT', async () => {
                    await serverManager.stopServer();
                    process.exit(0);
                });
            } else {
                process.exit(1);
            }
        });
    }
}