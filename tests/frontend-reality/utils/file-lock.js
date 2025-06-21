/**
 * File Lock Utility
 * 
 * Prevents multiple test instances from running simultaneously
 * Uses file-based locking for cross-process synchronization
 */

const fs = require('fs');
const path = require('path');

class FileLock {
    constructor() {
        this.lockDir = path.join(__dirname, '..', '.locks');
        this.lockFile = path.join(this.lockDir, 'test-runner.lock');
        this.pidFile = path.join(this.lockDir, 'test-runner.pid');
        
        // Ensure lock directory exists
        if (!fs.existsSync(this.lockDir)) {
            fs.mkdirSync(this.lockDir, { recursive: true });
        }
    }

    /**
     * Acquire lock for test execution
     */
    async acquireLock(maxWaitMs = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitMs) {
            try {
                // Check if lock exists
                if (fs.existsSync(this.lockFile)) {
                    // Check if the process that created the lock is still running
                    const lockInfo = await this.getLockInfo();
                    
                    if (lockInfo && this.isProcessRunning(lockInfo.pid)) {
                        console.log(`⏳ Another test instance is running (PID: ${lockInfo.pid})`);
                        console.log(`   Started: ${new Date(lockInfo.startTime).toLocaleString()}`);
                        console.log(`   Waiting for it to complete...`);
                        
                        // Wait and retry
                        await this.delay(2000);
                        continue;
                    } else {
                        // Stale lock - remove it
                        console.log('🧹 Removing stale lock file');
                        this.releaseLock();
                    }
                }
                
                // Create lock file
                const lockInfo = {
                    pid: process.pid,
                    startTime: Date.now(),
                    hostname: require('os').hostname(),
                    testType: process.env.TEST_TYPE || 'comprehensive'
                };
                
                fs.writeFileSync(this.lockFile, JSON.stringify(lockInfo, null, 2));
                fs.writeFileSync(this.pidFile, process.pid.toString());
                
                console.log(`🔒 Lock acquired (PID: ${process.pid})`);
                return true;
                
            } catch (error) {
                console.error('Lock acquisition error:', error.message);
                await this.delay(1000);
            }
        }
        
        throw new Error(`Failed to acquire lock within ${maxWaitMs}ms`);
    }

    /**
     * Release lock after test completion
     */
    releaseLock() {
        try {
            if (fs.existsSync(this.lockFile)) {
                fs.unlinkSync(this.lockFile);
            }
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
            console.log('🔓 Lock released');
        } catch (error) {
            console.error('Error releasing lock:', error.message);
        }
    }

    /**
     * Get information about current lock
     */
    async getLockInfo() {
        try {
            if (fs.existsSync(this.lockFile)) {
                const content = fs.readFileSync(this.lockFile, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('Error reading lock info:', error.message);
        }
        return null;
    }

    /**
     * Check if a process is still running
     */
    isProcessRunning(pid) {
        try {
            // Sending signal 0 doesn't actually send a signal,
            // but checks if the process exists
            process.kill(pid, 0);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Force unlock (use with caution)
     */
    forceUnlock() {
        console.warn('⚠️ Force unlocking - use only if you\'re sure no tests are running');
        this.releaseLock();
    }

    /**
     * Get all active locks
     */
    getActiveLocks() {
        const locks = [];
        
        try {
            const files = fs.readdirSync(this.lockDir);
            
            for (const file of files) {
                if (file.endsWith('.lock')) {
                    const lockPath = path.join(this.lockDir, file);
                    try {
                        const content = fs.readFileSync(lockPath, 'utf8');
                        const lockInfo = JSON.parse(content);
                        
                        // Check if process is still running
                        if (this.isProcessRunning(lockInfo.pid)) {
                            locks.push({
                                file,
                                ...lockInfo,
                                isActive: true
                            });
                        } else {
                            locks.push({
                                file,
                                ...lockInfo,
                                isActive: false,
                                isStale: true
                            });
                        }
                    } catch (e) {
                        // Invalid lock file
                    }
                }
            }
        } catch (error) {
            console.error('Error reading locks:', error.message);
        }
        
        return locks;
    }

    /**
     * Clean up stale locks
     */
    cleanupStaleLocks() {
        const locks = this.getActiveLocks();
        let cleaned = 0;
        
        for (const lock of locks) {
            if (lock.isStale) {
                try {
                    fs.unlinkSync(path.join(this.lockDir, lock.file));
                    cleaned++;
                } catch (e) {
                    // Ignore errors
                }
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} stale lock(s)`);
        }
        
        return cleaned;
    }

    /**
     * Wait for all locks to be released
     */
    async waitForAllLocks(maxWaitMs = 60000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitMs) {
            const activeLocks = this.getActiveLocks().filter(l => l.isActive);
            
            if (activeLocks.length === 0) {
                return true;
            }
            
            console.log(`⏳ Waiting for ${activeLocks.length} active test(s) to complete...`);
            await this.delay(5000);
        }
        
        return false;
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
module.exports = new FileLock();