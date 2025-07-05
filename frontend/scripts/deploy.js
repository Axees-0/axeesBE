#!/usr/bin/env node

/**
 * 🚀 Unified Deployment Interface for Axees Frontend
 * 
 * This is the SINGLE entry point for all deployments.
 * It uses deployment.config.js for all configuration.
 * 
 * Usage:
 *   npm run deploy           # Preview deployment with build (default)
 *   npm run deploy:quick     # Preview deployment without build
 *   npm run deploy:prod      # Production deployment
 *   npm run deploy:staging   # Staging deployment
 *   npm run deploy:dev       # Development deployment
 * 
 * Direct usage:
 *   node scripts/deploy.js [environment] [options]
 * 
 * Options:
 *   --no-build      Skip build step
 *   --clean         Clean build
 *   --dry-run       Show what would be deployed without deploying
 *   --production    Force deploy to production URL
 */

const deployConfig = require('../deployment.config');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'preview';  // Changed: default to preview
const options = {
  build: !args.includes('--no-build'),
  clean: args.includes('--clean'),
  dryRun: args.includes('--dry-run'),
  forceProduction: args.includes('--production') || environment === 'production'
};

// Use logging from config
const log = deployConfig.logging.log;

// Deployment verification function
async function verifyDeployment(url, isProduction) {
  log.header('🔍 Verifying Deployment');
  
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.info(`Verification attempt ${attempt}/${maxRetries}...`);
      
      // Check if URL is accessible
      const response = await makeHttpRequest(url);
      
      if (response.statusCode === 200) {
        log.success('✅ Site is live and accessible');
        
        // Verify critical content
        const contentChecks = await verifyContent(response.body, url);
        
        if (contentChecks.passed) {
          log.success('✅ Content verification passed');
          
          // Save deployment status
          const deploymentStatus = {
            url,
            isProduction,
            timestamp: new Date().toISOString(),
            verified: true,
            contentChecks: contentChecks.results
          };
          
          fs.writeFileSync(
            deployConfig.paths.deploymentStatus, 
            JSON.stringify(deploymentStatus, null, 2)
          );
          
          log.success('🎉 Deployment verification complete!');
          return true;
        } else {
          log.warning('⚠️ Content verification issues found:');
          contentChecks.results.forEach(check => {
            if (!check.passed) {
              log.warning(`  - ${check.name}: ${check.error}`);
            }
          });
        }
      } else {
        log.warning(`HTTP ${response.statusCode}: ${response.statusMessage}`);
      }
    } catch (error) {
      log.warning(`Attempt ${attempt} failed: ${error.message}`);
    }
    
    if (attempt < maxRetries) {
      log.info(`Waiting ${retryDelay/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  log.error('❌ Deployment verification failed after all retries');
  log.warning('The deployment may still be processing. Check manually:');
  log.info(`🔗 ${url}`);
  return false;
}

// Make HTTP request with timeout
function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 10000, // 10 seconds
      headers: {
        'User-Agent': 'Axees-Deploy-Verification/1.0'
      }
    };
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Verify critical content is present
async function verifyContent(html, url) {
  const checks = [
    {
      name: 'HTML Structure',
      test: () => html.includes('<html') && html.includes('</html>'),
      error: 'Invalid HTML structure'
    },
    {
      name: 'Title Tag',
      test: () => html.includes('<title>') && !html.includes('<title></title>'),
      error: 'Missing or empty title tag'
    },
    {
      name: 'Content Length',
      test: () => html.length > 1000,
      error: `Content too short (${html.length} chars)`
    },
    {
      name: 'No Error Pages',
      test: () => !html.toLowerCase().includes('page not found') && 
                  !html.toLowerCase().includes('404') &&
                  !html.toLowerCase().includes('error'),
      error: 'Appears to be an error page'
    },
    {
      name: 'React App Mount',
      test: () => html.includes('id="root"') || html.includes('id="__next"') || 
                  html.includes('_next/static') || html.includes('expo-web'),
      error: 'No React/Expo app mount point found'
    }
  ];
  
  // Add Axees-specific checks
  if (url.includes('polite-ganache-3a4e1b')) {
    checks.push({
      name: 'Axees Branding',
      test: () => html.toLowerCase().includes('axees') || 
                  html.toLowerCase().includes('discover') ||
                  html.toLowerCase().includes('creator'),
      error: 'Axees-related content not found'
    });
  }
  
  const results = checks.map(check => {
    try {
      const passed = check.test();
      return {
        name: check.name,
        passed,
        error: passed ? null : check.error
      };
    } catch (error) {
      return {
        name: check.name,
        passed: false,
        error: `Check failed: ${error.message}`
      };
    }
  });
  
  const passed = results.every(r => r.passed);
  
  return { passed, results };
}

// Verify build output before deployment
function verifyBuildOutput() {
  log.header('🔍 Verifying Build Output');
  
  const distDir = deployConfig.paths.distDir;
  
  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    log.error(`Build directory not found: ${distDir}`);
    return false;
  }
  
  // Check for index.html
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log.error('index.html not found in build output');
    return false;
  }
  
  // Check index.html content
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.length < 100) {
    log.error('index.html appears to be empty or too small');
    return false;
  }
  
  // Check for static assets
  const hasStaticAssets = fs.readdirSync(distDir).some(file => 
    file.endsWith('.js') || file.endsWith('.css') || 
    fs.existsSync(path.join(distDir, '_next')) ||
    fs.existsSync(path.join(distDir, 'static'))
  );
  
  if (!hasStaticAssets) {
    log.warning('No static assets (JS/CSS) found - this may be intentional');
  }
  
  log.success('✅ Build output verification passed');
  return true;
}

// Main deployment function
async function deploy() {
  log.header(`📦 Deploying to ${environment.toUpperCase()}`);
  
  // Get configuration for environment
  const siteId = deployConfig.getSiteId(environment);
  const buildCommand = deployConfig.getBuildCommand(environment);
  const authToken = deployConfig.getAuthToken();
  const envConfig = deployConfig.environments[environment];
  const isProductionDeploy = options.forceProduction || (envConfig && envConfig.isProd);
  
  if (!siteId) {
    log.error(`No site ID configured for environment: ${environment}`);
    process.exit(1);
  }
  
  if (!authToken) {
    log.error('No Netlify auth token found. Please set NETLIFY_AUTH_TOKEN');
    process.exit(1);
  }
  
  log.info(`Site ID: ${siteId}`);
  log.info(`Environment: ${environment}`);
  log.info(`Deploy Target: ${isProductionDeploy ? 'Production URL' : 'Preview URL'}`);
  log.info(`Build: ${options.build ? 'Yes' : 'No'}`);
  log.info(`Clean: ${options.clean ? 'Yes' : 'No'}`);
  log.info(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
  
  // Build if needed
  if (options.build && !options.dryRun) {
    log.header('🏗️  Building Project');
    
    const finalBuildCommand = options.clean 
      ? buildCommand.replace('export', 'export:clean')
      : buildCommand;
      
    try {
      execSync(finalBuildCommand, {
        stdio: 'inherit',
        timeout: deployConfig.build.timeout,
        env: { 
          ...process.env, 
          NODE_OPTIONS: `--max-old-space-size=${deployConfig.build.memoryLimit}` 
        }
      });
      log.success('Build completed successfully');
      
      // Verify build output
      if (!verifyBuildOutput()) {
        log.error('Build output verification failed');
        process.exit(1);
      }
    } catch (error) {
      log.error('Build failed');
      process.exit(1);
    }
  } else if (!options.dryRun) {
    // If not building, still verify existing build output
    if (!verifyBuildOutput()) {
      log.error('No valid build output found. Run with --build or build manually first.');
      process.exit(1);
    }
  }
  
  // Deploy
  if (!options.dryRun) {
    log.header('🚀 Deploying to Netlify');
    
    const deployCommand = `netlify deploy ${isProductionDeploy ? '--prod' : ''} --site ${siteId} --dir ${deployConfig.paths.distDir}`;
    
    try {
      const result = execSync(deployCommand, {
        stdio: 'pipe',
        timeout: deployConfig.netlify.cliTimeout,
        env: { ...process.env, NETLIFY_AUTH_TOKEN: authToken }
      });
      
      log.success('Deployment completed successfully');
      
      // Save deployment URL and verify deployment
      const output = result.toString();
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        const deploymentUrl = urlMatch[0];
        fs.writeFileSync(deployConfig.paths.deploymentUrl, deploymentUrl);
        log.info(`Deployment URL: ${deploymentUrl}`);
        
        // Verify the deployment is live
        await verifyDeployment(deploymentUrl, isProductionDeploy);
      } else {
        log.warning('Could not extract deployment URL from output');
      }
      
    } catch (error) {
      log.error('Deployment failed');
      console.error(error.message);
      process.exit(1);
    }
  } else {
    log.info('Dry run - no actual deployment performed');
  }
}

// Run deployment
deploy().catch(error => {
  log.error(`Deployment error: ${error.message}`);
  process.exit(1);
});