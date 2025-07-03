#!/usr/bin/env node

/**
 * Cleanup Legacy Deployment Artifacts
 * 
 * This script helps identify and clean up old deployment-related files
 * that are no longer needed after migration to the unified system.
 */

const fs = require('fs');
const path = require('path');

// Files and patterns to check
const legacyArtifacts = {
  // Deprecated scripts
  scripts: [
    'scripts/deployment/auto-deploy.js',
    'scripts/deployment/auto-netlify-deploy.js',
    'scripts/deployment/deploy.sh',
    'scripts/deployment/deploy-axees.sh',
    'scripts/deployment/deploy-both-versions.sh',
    'scripts/deployment/deploy-dual-correct.sh',
    'scripts/deployment/deploy-final-dual.js',
    'scripts/deployment/deploy-simple-dual.js',
    'scripts/deployment/deploy-simple.sh',
    'scripts/deployment/deploy-to-specific-site.js',
    'scripts/deployment/deploy-via-api.sh',
    'scripts/deployment/deploy-with-token.js',
    'scripts/deployment/direct-deploy.js',
    'scripts/deployment/direct-netlify-upload.js',
    'scripts/deployment/force-netlify-deploy.js',
    'scripts/deployment/simple-deploy.js'
  ],
  
  // Old documentation files
  docs: [
    'DEPLOYMENT_GUIDE.md',
    'DEPLOYMENT_COMPLETE.md',
    'deploy-to-netlify.md',
    'DEPLOYMENT_INSTRUCTIONS.md',
    'DEPLOYMENT_READY_SUMMARY.md',
    'FINAL_DUAL_DEPLOYMENT_SOLUTION.md',
    'deployment-checklist.md',
    'DUAL_DEPLOYMENT_FINAL.md'
  ],
  
  // Temporary files
  temp: [
    'deployment-results.json',
    'deployment-url.txt',
    'dual-deployment-status.json',
    'qa-fixes-deployment.zip',
    'axees-frontend-qa-fixes.zip',
    'axees-frontend-original-stable.zip'
  ],
  
  // Old config backups
  backups: [
    'netlify.toml.backup2',
    '.netlify-token.backup',
    'package.json.backup'
  ]
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

console.log(`${colors.blue}🧹 Legacy Deployment Cleanup Tool${colors.reset}\n`);

// Check what exists
let foundItems = [];
let totalSize = 0;

console.log('Scanning for legacy artifacts...\n');

Object.entries(legacyArtifacts).forEach(([category, files]) => {
  console.log(`${colors.yellow}Checking ${category}:${colors.reset}`);
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const size = stats.size;
      totalSize += size;
      
      foundItems.push({ file, category, size });
      console.log(`  ${colors.red}✗${colors.reset} ${file} (${(size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`  ${colors.green}✓${colors.reset} ${colors.gray}${file} (not found)${colors.reset}`);
    }
  });
  
  console.log('');
});

if (foundItems.length === 0) {
  console.log(`${colors.green}✨ No legacy artifacts found! Your deployment setup is clean.${colors.reset}`);
  process.exit(0);
}

// Summary
console.log(`${colors.yellow}Summary:${colors.reset}`);
console.log(`Found ${foundItems.length} legacy items (${(totalSize / 1024 / 1024).toFixed(2)}MB total)\n`);

// Interactive cleanup
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function cleanup() {
  const answer = await askQuestion('Do you want to:\n1) Delete all legacy files\n2) Create backup then delete\n3) View details\n4) Cancel\n\nChoice (1-4): ');
  
  switch(answer.trim()) {
    case '1':
      console.log('\n🗑️  Deleting legacy files...');
      foundItems.forEach(({ file }) => {
        try {
          fs.unlinkSync(file);
          console.log(`  ${colors.green}✓${colors.reset} Deleted: ${file}`);
        } catch (err) {
          console.log(`  ${colors.red}✗${colors.reset} Failed to delete: ${file} (${err.message})`);
        }
      });
      console.log(`\n${colors.green}✅ Cleanup complete!${colors.reset}`);
      break;
      
    case '2':
      const backupDir = `deployment-legacy-backup-${Date.now()}`;
      console.log(`\n📦 Creating backup in ${backupDir}...`);
      
      fs.mkdirSync(backupDir, { recursive: true });
      
      foundItems.forEach(({ file, category }) => {
        try {
          const destDir = path.join(backupDir, category);
          fs.mkdirSync(destDir, { recursive: true });
          
          const destFile = path.join(destDir, path.basename(file));
          fs.copyFileSync(file, destFile);
          fs.unlinkSync(file);
          
          console.log(`  ${colors.green}✓${colors.reset} Backed up and deleted: ${file}`);
        } catch (err) {
          console.log(`  ${colors.red}✗${colors.reset} Failed: ${file} (${err.message})`);
        }
      });
      
      console.log(`\n${colors.green}✅ Backup created in ${backupDir}${colors.reset}`);
      break;
      
    case '3':
      console.log('\n📋 Detailed file listing:\n');
      foundItems.forEach(({ file, category, size }) => {
        console.log(`Category: ${category}`);
        console.log(`File: ${file}`);
        console.log(`Size: ${(size / 1024).toFixed(1)}KB`);
        console.log(`Modified: ${fs.statSync(file).mtime.toLocaleString()}`);
        console.log('---');
      });
      
      // Ask again
      await cleanup();
      return;
      
    case '4':
      console.log('\nCancelled. No changes made.');
      break;
      
    default:
      console.log('\nInvalid choice. No changes made.');
  }
  
  rl.close();
}

// Add migration tips
console.log(`${colors.blue}💡 Migration Tips:${colors.reset}`);
console.log('• Use "npm run deploy" for standard deployments');
console.log('• Check DEPLOYMENT.md for complete documentation');
console.log('• All settings are now in deployment.config.js\n');

// Run cleanup
cleanup().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});