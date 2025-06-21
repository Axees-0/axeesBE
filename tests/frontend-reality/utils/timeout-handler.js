/**
 * Timeout Handler Utility
 * 
 * Prevents tests from hanging forever when frontend becomes unresponsive
 * Ensures clean browser shutdown and proper error reporting
 */

class TimeoutHandler {
    constructor() {
        this.activeTimeouts = new Map();
        this.globalTimeout = null;
        this.browsers = new Set();
    }

    /**
     * Register a browser instance for cleanup
     */
    registerBrowser(browser) {
        this.browsers.add(browser);
    }

    /**
     * Unregister a browser instance
     */
    unregisterBrowser(browser) {
        this.browsers.delete(browser);
    }

    /**
     * Set a global timeout for the entire test suite
     */
    setGlobalTimeout(timeoutMs, onTimeout) {
        if (this.globalTimeout) {
            clearTimeout(this.globalTimeout);
        }

        this.globalTimeout = setTimeout(async () => {
            console.error(`\n⏰ GLOBAL TIMEOUT: Test suite exceeded ${timeoutMs}ms limit`);
            
            if (onTimeout) {
                await onTimeout();
            }
            
            await this.emergencyCleanup();
            process.exit(1);
        }, timeoutMs);
    }

    /**
     * Clear global timeout (test completed successfully)
     */
    clearGlobalTimeout() {
        if (this.globalTimeout) {
            clearTimeout(this.globalTimeout);
            this.globalTimeout = null;
        }
    }

    /**
     * Wrap an async operation with timeout
     */
    async withTimeout(operation, timeoutMs, operationName = 'Operation') {
        const timeoutId = Symbol(operationName);
        
        return Promise.race([
            operation,
            new Promise((_, reject) => {
                const timeout = setTimeout(() => {
                    this.activeTimeouts.delete(timeoutId);
                    reject(new TimeoutError(`${operationName} timed out after ${timeoutMs}ms`));
                }, timeoutMs);
                
                this.activeTimeouts.set(timeoutId, timeout);
            })
        ]).finally(() => {
            // Clean up timeout if operation completed
            const timeout = this.activeTimeouts.get(timeoutId);
            if (timeout) {
                clearTimeout(timeout);
                this.activeTimeouts.delete(timeoutId);
            }
        });
    }

    /**
     * Wrap page navigation with timeout and retry
     */
    async navigateWithTimeout(page, url, options = {}) {
        const {
            timeout = 30000,
            retries = 2,
            waitUntil = 'networkidle2'
        } = options;

        let lastError;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🔄 Navigation attempt ${attempt}/${retries} to ${url}`);
                
                return await this.withTimeout(
                    page.goto(url, { timeout, waitUntil }),
                    timeout + 5000, // Add buffer to let Puppeteer timeout first
                    `Navigation to ${url}`
                );
            } catch (error) {
                lastError = error;
                
                if (error instanceof TimeoutError || error.message.includes('timeout')) {
                    console.warn(`⚠️ Navigation timeout on attempt ${attempt}`);
                    
                    // Try to recover the page
                    try {
                        await page.evaluate(() => window.stop());
                    } catch (e) {
                        // Page might be in bad state
                    }
                    
                    if (attempt < retries) {
                        await this.delay(2000 * attempt); // Exponential backoff
                        continue;
                    }
                }
                
                throw error;
            }
        }
        
        throw lastError;
    }

    /**
     * Wrap element waiting with timeout
     */
    async waitForElementWithTimeout(page, selector, options = {}) {
        const {
            timeout = 10000,
            visible = false
        } = options;

        try {
            return await this.withTimeout(
                page.waitForSelector(selector, { timeout, visible }),
                timeout + 1000,
                `Waiting for element ${selector}`
            );
        } catch (error) {
            if (error instanceof TimeoutError) {
                // Take screenshot for debugging
                try {
                    const screenshotPath = `./timeout-debug-${Date.now()}.png`;
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                    console.log(`📸 Debug screenshot saved: ${screenshotPath}`);
                } catch (e) {
                    // Screenshot might fail if page is broken
                }
            }
            throw error;
        }
    }

    /**
     * Execute function with timeout and cleanup
     */
    async executeWithTimeout(fn, timeoutMs, cleanupFn) {
        try {
            return await this.withTimeout(fn(), timeoutMs, fn.name || 'Function');
        } catch (error) {
            if (cleanupFn) {
                console.log('🧹 Running cleanup after timeout...');
                try {
                    await cleanupFn();
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError.message);
                }
            }
            throw error;
        }
    }

    /**
     * Emergency cleanup of all browsers
     */
    async emergencyCleanup() {
        console.log('🚨 Emergency cleanup initiated...');
        
        const cleanupPromises = [];
        
        for (const browser of this.browsers) {
            cleanupPromises.push(
                browser.close()
                    .catch(err => console.error('Browser cleanup error:', err.message))
            );
        }
        
        // Clear all active timeouts
        for (const [id, timeout] of this.activeTimeouts) {
            clearTimeout(timeout);
        }
        this.activeTimeouts.clear();
        
        await Promise.allSettled(cleanupPromises);
        console.log('✅ Emergency cleanup completed');
    }

    /**
     * Monitor page responsiveness
     */
    async monitorPageHealth(page, intervalMs = 5000) {
        const checkHealth = async () => {
            try {
                // Simple health check - can page execute JS?
                const healthy = await Promise.race([
                    page.evaluate(() => true),
                    new Promise(resolve => setTimeout(() => resolve(false), 2000))
                ]);
                
                if (!healthy) {
                    throw new Error('Page unresponsive');
                }
            } catch (error) {
                console.error('❌ Page health check failed:', error.message);
                return false;
            }
            return true;
        };

        const monitor = setInterval(async () => {
            const isHealthy = await checkHealth();
            if (!isHealthy) {
                clearInterval(monitor);
                console.error('🚨 Page became unresponsive!');
                // You might want to trigger recovery here
            }
        }, intervalMs);

        // Return function to stop monitoring
        return () => clearInterval(monitor);
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get timeout statistics
     */
    getStats() {
        return {
            activeTimeouts: this.activeTimeouts.size,
            registeredBrowsers: this.browsers.size,
            globalTimeoutActive: !!this.globalTimeout
        };
    }
}

/**
 * Custom timeout error class
 */
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}

// Export singleton instance
module.exports = new TimeoutHandler();
module.exports.TimeoutError = TimeoutError;