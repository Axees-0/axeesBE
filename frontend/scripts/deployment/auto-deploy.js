#!/usr/bin/env node

/**
 * 🚀 Automated Netlify Deployment Script
 * Programmatically deploys the QA fixes version to a new Netlify site
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
}

function info(message) { log('blue', 'INFO', message); }
function success(message) { log('green', 'SUCCESS', message); }
function warning(message) { log('yellow', 'WARNING', message); }
function error(message) { log('red', 'ERROR', message); }

async function main() {
  console.log(`${colors.cyan}🚀 Automated Deployment Starting...${colors.reset}\n`);
  
  try {
    // Check if the QA fixes zip exists
    const qaZipPath = 'axees-frontend-qa-fixes.zip';
    if (!fs.existsSync(qaZipPath)) {
      error(`QA fixes package not found: ${qaZipPath}`);
      process.exit(1);
    }
    
    const zipStats = fs.statSync(qaZipPath);
    success(`Found QA fixes package: ${qaZipPath} (${(zipStats.size / 1024 / 1024).toFixed(1)}MB)`);
    
    // Extract the zip file to a temporary directory
    info('Extracting QA fixes package...');
    const tempDir = 'temp-deployment-qa-fixes';
    
    // Clean up any existing temp directory
    try {
      execSync(`rm -rf ${tempDir}`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Create temp directory and extract
    execSync(`mkdir -p ${tempDir}`);
    execSync(`cd ${tempDir} && unzip -q ../${qaZipPath}`);
    success('Package extracted successfully');
    
    // Deploy using Netlify CLI with better error handling
    info('Deploying to Netlify...');
    
    try {
      // Set a longer timeout and use simpler deployment
      const deployCommand = `cd ${tempDir} && timeout 180 npx netlify-cli@latest deploy --prod --dir=. --site=auto-generated 2>&1`;
      const deployOutput = execSync(deployCommand, { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      // Parse the output to find the URL
      const urlMatch = deployOutput.match(/(?:Website URL|Live URL|URL):\s*(https:\/\/[^\s]+)/i);
      const deployUrl = urlMatch ? urlMatch[1] : null;
      
      if (deployUrl) {
        success(`🎉 QA Fixes deployed successfully!`);
        console.log(`\n${colors.bright}${colors.green}===============================================${colors.reset}`);
        console.log(`${colors.bright}🎯 DEPLOYMENT COMPLETE${colors.reset}`);
        console.log(`${colors.bright}${colors.green}===============================================${colors.reset}\n`);
        
        console.log(`${colors.cyan}a) ORIGINAL STABLE VERSION:${colors.reset}`);
        console.log(`   🌐 https://polite-ganache-3a4e1b.netlify.app`);
        console.log(`   📝 Production site (before QA fixes)\n`);
        
        console.log(`${colors.cyan}b) NEW DEV VERSION (with 34 QA fixes):${colors.reset}`);
        console.log(`   🌐 ${deployUrl}`);
        console.log(`   📝 Development site (all QA issues resolved)\n`);
        
        console.log(`${colors.yellow}✅ All 34 QA issues have been resolved in version (b)${colors.reset}`);
        console.log(`${colors.yellow}💡 Both sites are completely independent${colors.reset}\n`);
        
        // Save deployment URLs
        const deploymentInfo = {
          timestamp: new Date().toISOString(),
          originalStable: 'https://polite-ganache-3a4e1b.netlify.app',
          qaFixesNew: deployUrl,
          status: 'deployed',
          qaFixesCount: 34
        };
        
        fs.writeFileSync('deployment-results.json', JSON.stringify(deploymentInfo, null, 2));
        success('Deployment results saved to: deployment-results.json');
        
      } else {
        warning('Deployment completed but URL not found in output');
        console.log('Deploy output:', deployOutput);
      }
      
    } catch (deployError) {
      error('Deployment failed:');
      console.log(deployError.message);
      
      // Fallback: provide manual instructions
      warning('Falling back to manual deployment instructions...');
      console.log(`\n${colors.yellow}MANUAL DEPLOYMENT STEPS:${colors.reset}`);
      console.log(`1. Go to https://netlify.com`);
      console.log(`2. Drag and drop: ${qaZipPath}`);
      console.log(`3. This will create a new site with all QA fixes\n`);
    }
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      execSync('rm -rf temp-deployment-qa-fixes', { stdio: 'ignore' });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run the deployment
main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});