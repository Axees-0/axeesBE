#!/usr/bin/env node

/**
 * 🚀 Unified Deployment Script for Axees Frontend
 * 
 * This script consolidates all deployment functionality:
 * - Netlify deployment (with/without API token)
 * - Build management
 * - Multiple deployment targets
 * - Zip file deployment
 * 
 * Usage:
 *   node unified-deploy.js [options]
 * 
 * Options:
 *   --prod              Deploy to production
 *   --site <site-id>    Deploy to specific Netlify site
 *   --dir <directory>   Deploy from specific directory (default: dist)
 *   --zip <file>        Deploy from zip file
 *   --token <token>     Use specific Netlify token
 *   --build             Run build before deploy
 *   --clean             Clean build before deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load centralized deployment configuration
const deployConfig = require('../../deployment.config');

// Use configuration from deployment.config.js
const CONFIG = {
  defaultDir: deployConfig.paths.distDir,
  defaultSite: deployConfig.getSiteId('production'),
  buildTimeout: deployConfig.build.timeout,
  deployTimeout: deployConfig.netlify.cliTimeout,
  colors: deployConfig.logging.colors
};

// Use logging utilities from config
const log = deployConfig.logging.log;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    prod: false,
    site: deployConfig.getSiteId('production'),
    dir: deployConfig.paths.distDir,
    zip: null,
    token: deployConfig.getAuthToken(),
    build: false,
    clean: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prod':
        options.prod = true;
        break;
      case '--site':
        options.site = args[++i];
        break;
      case '--dir':
        options.dir = args[++i];
        break;
      case '--zip':
        options.zip = args[++i];
        break;
      case '--token':
        options.token = args[++i];
        break;
      case '--build':
        options.build = true;
        break;
      case '--clean':
        options.clean = true;
        options.build = true; // Clean implies build
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
${CONFIG.colors.cyan}🚀 Unified Deployment Script${CONFIG.colors.reset}

Usage:
  node unified-deploy.js [options]

Options:
  --prod              Deploy to production
  --site <site-id>    Deploy to specific Netlify site
  --dir <directory>   Deploy from specific directory (default: dist)
  --zip <file>        Deploy from zip file
  --token <token>     Use specific Netlify token
  --build             Run build before deploy
  --clean             Clean build before deploy
  --help              Show this help message

Examples:
  # Deploy dist folder to production
  node unified-deploy.js --prod

  # Build and deploy to specific site
  node unified-deploy.js --build --site my-site-id

  # Deploy zip file with token
  node unified-deploy.js --zip package.zip --token MY_TOKEN
`);
}

// Get Netlify token using centralized config
function getNetlifyToken(providedToken) {
  return providedToken || deployConfig.getAuthToken();
}

// Check system resources
function checkResources() {
  try {
    const memInfo = execSync('free -m | grep Mem', { encoding: 'utf8' });
    const available = parseInt(memInfo.split(/\s+/)[6]);
    
    if (available < 2000) {
      log.warning(`Low memory detected: ${available}MB available`);
      return false;
    }
    log.info(`Memory OK: ${available}MB available`);
    return true;
  } catch (e) {
    log.warning('Could not check memory');
    return true;
  }
}

// Build the project
function buildProject(clean = false) {
  log.header('🏗️  Building Project');
  
  if (!checkResources()) {
    log.warning('Low memory - build may be slow');
  }

  const buildCommand = clean ? deployConfig.build.commands.webClean : deployConfig.build.commands.web;
  log.info(`Running: ${buildCommand}`);

  try {
    execSync(buildCommand, {
      stdio: 'inherit',
      timeout: CONFIG.buildTimeout,
      env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${deployConfig.build.memoryLimit}` }
    });
    log.success('Build completed successfully');
    return true;
  } catch (error) {
    log.error('Build failed');
    if (error.signal === 'SIGTERM') {
      log.error('Build timed out after 5 minutes');
    }
    return false;
  }
}

// Extract zip file if needed
function extractZip(zipPath) {
  const tempDir = `temp-deploy-${Date.now()}`;
  
  try {
    log.info(`Extracting ${zipPath}...`);
    execSync(`mkdir -p ${tempDir}`);
    execSync(`cd ${tempDir} && unzip -q ../${zipPath}`);
    log.success('Extraction completed');
    return tempDir;
  } catch (error) {
    log.error(`Failed to extract zip: ${error.message}`);
    return null;
  }
}

// Deploy to Netlify
function deployToNetlify(options) {
  log.header('🚀 Deploying to Netlify');

  const token = getNetlifyToken(options.token);
  let deployDir = options.dir;
  let tempDir = null;

  // Handle zip deployment
  if (options.zip) {
    if (!fs.existsSync(options.zip)) {
      log.error(`Zip file not found: ${options.zip}`);
      return false;
    }
    tempDir = extractZip(options.zip);
    if (!tempDir) return false;
    deployDir = tempDir;
  }

  // Check if deploy directory exists
  if (!fs.existsSync(deployDir)) {
    log.error(`Deploy directory not found: ${deployDir}`);
    if (tempDir) execSync(`rm -rf ${tempDir}`, { stdio: 'ignore' });
    return false;
  }

  // Build deploy command
  let deployCommand = 'netlify deploy';
  if (options.prod) deployCommand += ' --prod';
  deployCommand += ` --dir=${deployDir}`;
  
  // Only specify site if explicitly provided and not the default
  // Let netlify.toml handle site detection when using auth token
  if (options.site && options.site !== 'auto' && options.site !== CONFIG.defaultSite) {
    deployCommand += ` --site=${options.site}`;
  }

  // Add token if available
  if (token) {
    deployCommand = `NETLIFY_AUTH_TOKEN="${token}" ${deployCommand}`;
    log.info('Using authentication token');
  }

  log.info(`Deploying from: ${path.resolve(deployDir)}`);
  
  try {
    const output = execSync(deployCommand, {
      encoding: 'utf8',
      timeout: CONFIG.deployTimeout,
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });

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
      console.log('\nDeployment output:', output);
    }

    // Cleanup temp directory
    if (tempDir) {
      execSync(`rm -rf ${tempDir}`, { stdio: 'ignore' });
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
      console.log('3. Or pass directly: --token YOUR_TOKEN');
    }

    // Cleanup temp directory
    if (tempDir) {
      execSync(`rm -rf ${tempDir}`, { stdio: 'ignore' });
    }

    return false;
  }
}

// Main function
async function main() {
  const options = parseArgs();
  
  log.header('🚀 Axees Unified Deployment');
  
  // Build if requested
  if (options.build) {
    if (!buildProject(options.clean)) {
      log.error('Build failed, aborting deployment');
      process.exit(1);
    }
  }

  // Deploy
  if (!deployToNetlify(options)) {
    log.error('Deployment failed');
    process.exit(1);
  }

  log.success('All operations completed successfully!');
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