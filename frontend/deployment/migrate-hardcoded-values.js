#!/usr/bin/env node

/**
 * Migration Script: Replace Hardcoded Values with Config References
 * 
 * This script updates all files that contain hardcoded deployment values
 * to use the centralized deployment.config.js instead.
 */

const fs = require('fs');
const path = require('path');
const deployConfig = require('./deployment.config');

const log = deployConfig.logging.log;

// Files to exclude from migration
const excludePatterns = [
  'node_modules',
  '.git',
  'dist',
  'dist-demo',
  'build',
  '.next',
  'coverage',
  'deployment.config.js', // Don't modify the config itself
  'migrate-hardcoded-values.js' // Don't modify this script
];

// Replacements to make
const replacements = [
  {
    pattern: /'polite-ganache-3a4e1b'/g,
    replacement: "require('./deployment.config').getSiteId('production')",
    fileTypes: ['.js', '.ts']
  },
  {
    pattern: /"polite-ganache-3a4e1b"/g,
    replacement: "require('./deployment.config').getSiteId('production')",
    fileTypes: ['.js', '.ts']
  },
  {
    pattern: /polite-ganache-3a4e1b/g,
    replacement: '${NETLIFY_SITE_NAME}',
    fileTypes: ['.md', '.txt', '.html', '.sh']
  },
  {
    pattern: /6e93cf51-17e5-4528-8e38-7ad22c2b6b78/g,
    replacement: '${NETLIFY_SITE_API_ID}',
    fileTypes: ['.js', '.ts', '.md', '.txt', '.sh']
  }
];

// Track changes
const changes = [];

// Function to check if path should be excluded
function shouldExclude(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

// Function to process a file
function processFile(filePath) {
  if (shouldExclude(filePath)) return;
  
  const ext = path.extname(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ pattern, replacement, fileTypes }) => {
    if (fileTypes.includes(ext)) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        modified = true;
        changes.push({
          file: filePath,
          pattern: pattern.toString(),
          count: matches.length
        });
      }
    }
  });
  
  if (modified) {
    // Create backup
    fs.writeFileSync(`${filePath}.backup`, fs.readFileSync(filePath));
    // Write updated content
    fs.writeFileSync(filePath, content);
  }
}

// Function to walk directory
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !shouldExclude(filePath)) {
      walkDirectory(filePath);
    } else if (stat.isFile()) {
      processFile(filePath);
    }
  });
}

// Main execution
log.header('🔄 Migrating Hardcoded Values');

// Add environment variables to .env.local if not present
const envPath = path.join(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('NETLIFY_SITE_NAME')) {
    envContent += '\\n# Deployment Configuration\\n';
    envContent += 'NETLIFY_SITE_NAME=polite-ganache-3a4e1b\\n';
    envContent += 'NETLIFY_SITE_API_ID=6e93cf51-17e5-4528-8e38-7ad22c2b6b78\\n';
    fs.writeFileSync(envPath, envContent);
    log.info('Added deployment configuration to .env.local');
  }
}

// Process files
log.info('Scanning for hardcoded values...');
walkDirectory(path.join(__dirname, '..', '..'));

// Report results
if (changes.length > 0) {
  log.success(`Updated ${changes.length} files:`);
  changes.forEach(({ file, pattern, count }) => {
    log.info(`  ${file} - ${count} replacements`);
  });
  log.warning('Backup files created with .backup extension');
} else {
  log.info('No hardcoded values found to replace');
}

log.success('Migration complete!');