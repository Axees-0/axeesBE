#!/usr/bin/env node

/**
 * Alternative Deployment Script for Axees Frontend
 * 
 * This script deploys from alternative directories to bypass permission issues
 * with the corrupted dist directory
 * 
 * Usage:
 *   node deploy-from-temp.js [options]
 * 
 * Options:
 *   --dir <directory>   Directory to deploy from (default: temp_build)
 *   --prod              Deploy to production
 *   --dry-run           Show what would be deployed without deploying
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  defaultDir: 'temp_build',
  alternativeDirs: ['temp_build', 'dist_new2', 'dist_new', 'temp_dist'],
  prodSite: 'polite-ganache-3a4e1b',
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  }
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${CONFIG.colors.blue}[INFO]${CONFIG.colors.reset} ${msg}`),
  success: (msg) => console.log(`${CONFIG.colors.green}[SUCCESS]${CONFIG.colors.reset} ${msg}`),
  warning: (msg) => console.log(`${CONFIG.colors.yellow}[WARNING]${CONFIG.colors.reset} ${msg}`),
  error: (msg) => console.log(`${CONFIG.colors.red}[ERROR]${CONFIG.colors.reset} ${msg}`),
  header: (msg) => {
    console.log(`\n${CONFIG.colors.cyan}${'='.repeat(50)}${CONFIG.colors.reset}`);
    console.log(`${CONFIG.colors.cyan}${msg}${CONFIG.colors.reset}`);
    console.log(`${CONFIG.colors.cyan}${'='.repeat(50)}${CONFIG.colors.reset}\n`);
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dir: CONFIG.defaultDir,
    prod: false,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dir':
        options.dir = args[++i];
        break;
      case '--prod':
        options.prod = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
    }
  }

  return options;
}

// Show help message
function showHelp() {
  console.log(`
${CONFIG.colors.cyan}🚀 Alternative Deployment Script${CONFIG.colors.reset}

This script deploys from alternative directories to bypass permission issues.

Usage:
  node deploy-from-temp.js [options]

Options:
  --dir <directory>   Directory to deploy from (default: temp_build)
  --prod              Deploy to production
  --dry-run           Show what would be deployed without deploying
  --help              Show this help message

Available directories:
  ${CONFIG.alternativeDirs.join(', ')}

Examples:
  # Deploy temp_build to production
  node deploy-from-temp.js --prod

  # Deploy from specific directory
  node deploy-from-temp.js --dir dist_new2 --prod

  # Test deployment without actually deploying
  node deploy-from-temp.js --dry-run
`);
}

// Find best available directory
function findBestDirectory() {
  log.info('Searching for available build directories...');
  
  const availableDirs = [];
  
  for (const dir of CONFIG.alternativeDirs) {
    if (fs.existsSync(dir)) {
      const stats = fs.statSync(dir);
      const indexPath = path.join(dir, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        // Check if directory has write permissions
        try {
          fs.accessSync(dir, fs.constants.W_OK);
          const hasDiscoverContent = checkForDiscoverContent(dir);
          
          availableDirs.push({
            name: dir,
            modified: stats.mtime,
            size: getDirectorySize(dir),
            hasDiscoverContent,
            writable: true
          });
        } catch (err) {
          availableDirs.push({
            name: dir,
            modified: stats.mtime,
            size: getDirectorySize(dir),
            hasDiscoverContent: false,
            writable: false
          });
        }
      }
    }
  }
  
  // Sort by modification time (newest first) and whether it has Discover content
  availableDirs.sort((a, b) => {
    if (a.hasDiscoverContent && !b.hasDiscoverContent) return -1;
    if (!a.hasDiscoverContent && b.hasDiscoverContent) return 1;
    return b.modified - a.modified;
  });
  
  return availableDirs;
}

// Check if directory contains Discover tab content
function checkForDiscoverContent(dir) {
  try {
    const jsFiles = execSync(`find ${dir} -name "*.js" -type f`, { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    for (const file of jsFiles.slice(0, 5)) { // Check first 5 JS files
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('Discover') && content.includes('label:"Discover"')) {
        return true;
      }
    }
  } catch (err) {
    // Ignore errors
  }
  
  return false;
}

// Get directory size
function getDirectorySize(dir) {
  try {
    const output = execSync(`du -sh ${dir} | cut -f1`, { encoding: 'utf8' });
    return output.trim();
  } catch (err) {
    return 'Unknown';
  }
}

// Get Netlify token
function getNetlifyToken() {
  const sources = [
    process.env.NETLIFY_AUTH_TOKEN,
    process.env.NETLIFY_TOKEN,
    fs.existsSync(`${process.env.HOME}/.netlify-token`) && 
      fs.readFileSync(`${process.env.HOME}/.netlify-token`, 'utf8').trim(),
    fs.existsSync('.netlify-token') && 
      fs.readFileSync('.netlify-token', 'utf8').trim()
  ].filter(Boolean);

  return sources[0] || null;
}

// Deploy to Netlify
function deployToNetlify(dir, options) {
  log.header(`🚀 Deploying from ${dir}`);
  
  if (options.dryRun) {
    log.info('DRY RUN MODE - No actual deployment will occur');
  }
  
  const token = getNetlifyToken();
  
  // Build deploy command
  let deployCommand = 'netlify deploy';
  if (options.prod) deployCommand += ' --prod';
  deployCommand += ` --dir=${dir}`;
  deployCommand += ` --site=${CONFIG.prodSite}`;
  
  // Add token if available
  if (token) {
    deployCommand = `NETLIFY_AUTH_TOKEN="${token}" ${deployCommand}`;
    log.info('Using authentication token');
  }
  
  log.info(`Deploy command: ${deployCommand.replace(token || '', '[REDACTED]')}`);
  
  if (options.dryRun) {
    log.info('Deployment would be executed (dry run mode)');
    return true;
  }
  
  try {
    const output = execSync(deployCommand, {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024
    });
    
    console.log(output);
    
    // Parse deployment URL
    const urlMatch = output.match(/(?:Website URL|Live URL|URL):\s*(https:\/\/[^\s]+)/i);
    const deployUrl = urlMatch ? urlMatch[1] : null;
    
    if (deployUrl) {
      log.success('Deployment successful!');
      console.log(`\n${CONFIG.colors.bright}${CONFIG.colors.green}🌐 Live URL: ${deployUrl}${CONFIG.colors.reset}\n`);
      
      // Save URL to file
      fs.writeFileSync('deployment-url.txt', deployUrl);
      log.info('URL saved to deployment-url.txt');
    } else {
      log.warning('Deployment completed but URL not found');
    }
    
    return true;
  } catch (error) {
    log.error('Deployment failed');
    console.error(error.message);
    
    if (!token) {
      log.warning('No authentication token found');
      console.log('\nTo set up token authentication:');
      console.log('1. Get token from: https://app.netlify.com/user/applications#personal-access-tokens');
      console.log('2. Set environment variable: export NETLIFY_AUTH_TOKEN="your-token"');
    }
    
    return false;
  }
}

// Main function
async function main() {
  const options = parseArgs();
  
  log.header('🚀 Alternative Deployment Script');
  
  // Find available directories
  const availableDirs = findBestDirectory();
  
  if (availableDirs.length === 0) {
    log.error('No valid build directories found!');
    console.log('\nTry running: npm run export:web');
    process.exit(1);
  }
  
  // Display available directories
  console.log('\nAvailable directories:');
  availableDirs.forEach((dir, index) => {
    const status = [];
    if (dir.hasDiscoverContent) status.push('✓ Has Discover tab');
    if (!dir.writable) status.push('⚠️  Read-only');
    
    console.log(`${index + 1}. ${dir.name} (${dir.size}, modified: ${dir.modified.toLocaleString()}) ${status.join(', ')}`);
  });
  
  // Select directory
  let selectedDir = options.dir;
  
  // If specified directory doesn't exist, use the best available
  if (!fs.existsSync(selectedDir)) {
    log.warning(`Specified directory '${selectedDir}' not found`);
    selectedDir = availableDirs[0].name;
    log.info(`Using best available: ${selectedDir}`);
  }
  
  // Verify directory has Discover content
  const dirInfo = availableDirs.find(d => d.name === selectedDir);
  if (dirInfo && !dirInfo.hasDiscoverContent) {
    log.warning(`Directory '${selectedDir}' may not contain the latest Discover tab changes`);
    
    // Find directory with Discover content
    const withDiscoverContent = availableDirs.find(d => d.hasDiscoverContent);
    if (withDiscoverContent) {
      console.log(`\nRecommended: Use '${withDiscoverContent.name}' which contains the Discover tab`);
      console.log('Run with --dir ' + withDiscoverContent.name);
    }
  }
  
  // Deploy
  if (!deployToNetlify(selectedDir, options)) {
    log.error('Deployment failed');
    process.exit(1);
  }
  
  log.success('Deployment completed successfully!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});