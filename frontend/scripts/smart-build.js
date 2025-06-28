#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Smart Build System Starting...\n');

// Check system resources
function checkResources() {
  try {
    const memInfo = execSync('free -m | grep Mem', { encoding: 'utf8' });
    const available = parseInt(memInfo.split(/\s+/)[6]);
    
    if (available < 2000) {
      console.warn('⚠️  Low memory detected:', available, 'MB available');
      console.log('🧹 Attempting to free memory...');
      
      try {
        execSync('sudo pkill -f "jest-worker"', { stdio: 'ignore' });
        console.log('✅ Freed up some memory');
      } catch (e) {
        // Ignore if no processes to kill
      }
    } else {
      console.log('✅ Memory OK:', available, 'MB available');
    }
  } catch (e) {
    console.warn('Could not check memory:', e.message);
  }
}

// Check if clean build is needed
function needsCleanBuild() {
  const lastCleanBuild = '.last-clean-build';
  const packageJson = 'package.json';
  
  if (!fs.existsSync(lastCleanBuild)) {
    return true;
  }
  
  const lastClean = fs.statSync(lastCleanBuild).mtime;
  const packageMod = fs.statSync(packageJson).mtime;
  
  // Clean build if package.json was modified after last clean build
  return packageMod > lastClean;
}

// Execute build
function executeBuild() {
  const startTime = Date.now();
  let buildCommand = 'npm run export:web';
  
  if (needsCleanBuild()) {
    console.log('📦 Dependencies changed - running clean build...');
    buildCommand = 'npm run export:web:clean';
    
    // Update timestamp
    fs.writeFileSync('.last-clean-build', new Date().toISOString());
  } else {
    console.log('⚡ Running incremental build...');
  }
  
  try {
    execSync(buildCommand, { 
      stdio: 'inherit',
      timeout: 300000 // 5 minute timeout
    });
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Build completed in ${duration} seconds`);
    
    // Log build time for monitoring
    const logEntry = `${new Date().toISOString()}: ${duration}s (${buildCommand})\n`;
    fs.appendFileSync('build-times.log', logEntry);
    
  } catch (error) {
    console.error('\n❌ Build failed!');
    
    if (error.signal === 'SIGTERM') {
      console.error('Build timed out after 5 minutes');
      console.log('\nTry these solutions:');
      console.log('1. Close other applications to free memory');
      console.log('2. Run: npm run export:web (without clean flag)');
      console.log('3. Use existing dist folder if available');
    }
    
    process.exit(1);
  }
}

// Main execution
console.log('🔍 Checking system resources...');
checkResources();

console.log('\n🏗️  Starting build process...');
executeBuild();

console.log('\n📊 Recent build times:');
try {
  const logs = execSync('tail -5 build-times.log', { encoding: 'utf8' });
  console.log(logs);
} catch (e) {
  // Ignore if log doesn't exist
}