#!/usr/bin/env node

/**
 * Check Lock Status Utility
 * 
 * Checks if any test instances are currently running
 * and provides options to clean up stale locks
 */

const fileLock = require('./file-lock');

async function checkLocks() {
    console.log('🔍 Checking test lock status...\n');
    
    const locks = fileLock.getActiveLocks();
    
    if (locks.length === 0) {
        console.log('✅ No locks found - tests can be run');
        return;
    }
    
    console.log(`Found ${locks.length} lock(s):\n`);
    
    locks.forEach((lock, index) => {
        console.log(`Lock #${index + 1}:`);
        console.log(`  File: ${lock.file}`);
        console.log(`  PID: ${lock.pid}`);
        console.log(`  Started: ${new Date(lock.startTime).toLocaleString()}`);
        console.log(`  Host: ${lock.hostname}`);
        console.log(`  Type: ${lock.testType}`);
        console.log(`  Status: ${lock.isActive ? '🟢 Active' : '🔴 Stale'}`);
        
        if (lock.isActive) {
            const runtime = Math.round((Date.now() - lock.startTime) / 1000);
            console.log(`  Runtime: ${runtime} seconds`);
        }
        
        console.log('');
    });
    
    const staleLocks = locks.filter(l => l.isStale);
    if (staleLocks.length > 0) {
        console.log(`⚠️  Found ${staleLocks.length} stale lock(s)`);
        
        // Ask user if they want to clean up
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question('Clean up stale locks? (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
                const cleaned = fileLock.cleanupStaleLocks();
                console.log(`✅ Cleaned up ${cleaned} stale lock(s)`);
            }
            readline.close();
        });
    }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--force-unlock') || args.includes('-f')) {
    console.log('⚠️  Force unlocking all locks...');
    fileLock.forceUnlock();
    console.log('✅ All locks removed');
} else if (args.includes('--clean') || args.includes('-c')) {
    const cleaned = fileLock.cleanupStaleLocks();
    console.log(`✅ Cleaned up ${cleaned} stale lock(s)`);
} else if (args.includes('--wait') || args.includes('-w')) {
    console.log('⏳ Waiting for all active tests to complete...');
    fileLock.waitForAllLocks().then(success => {
        if (success) {
            console.log('✅ All tests completed');
        } else {
            console.log('⏰ Timeout waiting for tests to complete');
        }
    });
} else {
    checkLocks();
}

// Export for use in other scripts
module.exports = { checkLocks };