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
    } catch (error) {
      log.error('Build failed');
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
      
      // Save deployment URL
      const output = result.toString();
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        fs.writeFileSync(deployConfig.paths.deploymentUrl, urlMatch[0]);
        log.info(`Deployment URL: ${urlMatch[0]}`);
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