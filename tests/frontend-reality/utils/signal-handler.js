/**
 * Signal Handler Utility
 * 
 * Ensures graceful shutdown when process receives termination signals
 * Critical for preventing orphaned browser processes
 */

const timeoutHandler = require('./timeout-handler');

class SignalHandler {
    constructor() {
        this.cleanupHandlers = new Set();
        this.isShuttingDown = false;
        this.setupSignalHandlers();
    }

    /**
     * Set up process signal handlers
     */
    setupSignalHandlers() {
        // Handle Ctrl+C
        process.on('SIGINT', () => this.handleShutdown('SIGINT'));
        
        // Handle kill signal
        process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
        
        // Handle process exit
        process.on('exit', (code) => {
            console.log(`\n📤 Process exiting with code ${code}`);
        });
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('\n💥 Uncaught Exception:', error);
            this.handleShutdown('UNCAUGHT_EXCEPTION');
        });
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('\n💥 Unhandled Rejection at:', promise, 'reason:', reason);
            // Don't exit on unhandled rejection, but log it
        });
    }

    /**
     * Register a cleanup handler
     */
    registerCleanupHandler(handler) {
        this.cleanupHandlers.add(handler);
    }

    /**
     * Unregister a cleanup handler
     */
    unregisterCleanupHandler(handler) {
        this.cleanupHandlers.delete(handler);
    }

    /**
     * Handle shutdown signal
     */
    async handleShutdown(signal) {
        if (this.isShuttingDown) {
            console.log('⚠️ Shutdown already in progress...');
            return;
        }

        this.isShuttingDown = true;
        console.log(`\n🛑 Received ${signal} - initiating graceful shutdown...`);

        try {
            // Run all registered cleanup handlers
            const cleanupPromises = [];
            
            for (const handler of this.cleanupHandlers) {
                cleanupPromises.push(
                    Promise.resolve(handler())
                        .catch(err => console.error('Cleanup handler error:', err))
                );
            }

            // Add timeout handler cleanup
            cleanupPromises.push(timeoutHandler.emergencyCleanup());

            // Wait for all cleanup with timeout
            await Promise.race([
                Promise.all(cleanupPromises),
                new Promise(resolve => setTimeout(resolve, 5000))
            ]);

            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }

    /**
     * Execute function with signal protection
     */
    async executeWithProtection(fn, cleanupFn) {
        if (cleanupFn) {
            this.registerCleanupHandler(cleanupFn);
        }

        try {
            return await fn();
        } finally {
            if (cleanupFn) {
                this.unregisterCleanupHandler(cleanupFn);
            }
        }
    }

    /**
     * Check if shutdown is in progress
     */
    isShuttingDownNow() {
        return this.isShuttingDown;
    }
}

// Export singleton instance
module.exports = new SignalHandler();