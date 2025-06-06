#!/usr/bin/env node

/**
 * Critical Timeout Fix Script
 * 
 * Fixes the hardcoded 5-second timeout in segmented-workflow-engine.ts
 * that's causing 6/16 job failures with complex selectors.
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(__dirname, 'src/segmentation/segmented-workflow-engine.ts');

async function fixTimeoutIssue() {
  console.log('🔧 Starting critical timeout fix...');
  
  try {
    // Read the current file
    const content = fs.readFileSync(TARGET_FILE, 'utf8');
    console.log('✅ Read segmented-workflow-engine.ts');
    
    // Find and replace the hardcoded timeout
    const oldPattern = /timeout: 5000(\s*\/\/.*)?/;
    const newReplacement = 'timeout: step.timeout || 30000 // Use step timeout or 30s default';
    
    if (!oldPattern.test(content)) {
      console.log('⚠️ Hardcoded timeout pattern not found - may already be fixed');
      
      // Check if it's already using step.timeout
      if (content.includes('step.timeout || 30000')) {
        console.log('✅ Timeout fix already applied!');
        return;
      }
      
      // Look for any 5000 timeout patterns
      const fiveSecondMatches = content.match(/timeout:\s*5000/g);
      if (fiveSecondMatches) {
        console.log(`⚠️ Found ${fiveSecondMatches.length} instances of 5-second timeouts:`);
        fiveSecondMatches.forEach(match => console.log(`   - ${match}`));
      }
      return;
    }
    
    // Apply the fix
    const fixedContent = content.replace(oldPattern, newReplacement);
    
    // Verify the change was made
    if (fixedContent === content) {
      console.log('❌ No changes were made - pattern may not match exactly');
      return;
    }
    
    // Create backup
    const backupFile = TARGET_FILE + '.backup-' + Date.now();
    fs.writeFileSync(backupFile, content);
    console.log(`💾 Created backup: ${path.basename(backupFile)}`);
    
    // Write the fixed content
    fs.writeFileSync(TARGET_FILE, fixedContent);
    console.log('✅ Applied timeout fix to segmented-workflow-engine.ts');
    
    // Verify the fix
    const verifyContent = fs.readFileSync(TARGET_FILE, 'utf8');
    if (verifyContent.includes('step.timeout || 30000')) {
      console.log('🎉 Fix verified successfully!');
      console.log('');
      console.log('📋 What was fixed:');
      console.log('   BEFORE: timeout: 5000 (hardcoded 5 seconds)');
      console.log('   AFTER:  timeout: step.timeout || 30000 (respects step config or 30s default)');
      console.log('');
      console.log('🚀 This should resolve the 6/16 job failures with complex selectors');
    } else {
      console.log('⚠️ Fix verification failed - manual check required');
    }
    
  } catch (error) {
    console.error('❌ Error applying timeout fix:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('');
      console.log('📁 File not found. Expected location:');
      console.log(`   ${TARGET_FILE}`);
      console.log('');
      console.log('🔍 Please verify the file exists and run this script from the project root');
    }
  }
}

// Run the fix
fixTimeoutIssue().then(() => {
  console.log('🏁 Critical timeout fix script completed');
}).catch(error => {
  console.error('💥 Script failed:', error.message);
  process.exit(1);
});