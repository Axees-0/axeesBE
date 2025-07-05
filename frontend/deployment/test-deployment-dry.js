#!/usr/bin/env node

/**
 * Test Script: Verify DRY Deployment Refactoring
 * 
 * This script tests that the DRY refactoring hasn't broken any functionality
 */

const deployConfig = require('./deployment.config');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = deployConfig.logging.log;

// Test results
const results = [];

// Test 1: Configuration Loading
function testConfigLoading() {
  log.header('Test 1: Configuration Loading');
  
  try {
    // Check if config loads properly
    if (!deployConfig) throw new Error('Config not loaded');
    
    // Check required properties
    const requiredProps = [
      'netlify.sites.production',
      'build.commands.web',
      'getAuthToken',
      'getSiteId',
      'getBuildCommand'
    ];
    
    requiredProps.forEach(prop => {
      const value = prop.split('.').reduce((obj, key) => obj?.[key], deployConfig);
      if (!value && typeof value !== 'function') {
        throw new Error(`Missing property: ${prop}`);
      }
    });
    
    log.success('✓ Configuration loads correctly');
    results.push({ test: 'Config Loading', status: 'PASS' });
  } catch (error) {
    log.error(`✗ Configuration error: ${error.message}`);
    results.push({ test: 'Config Loading', status: 'FAIL', error: error.message });
  }
}

// Test 2: Token Retrieval
function testTokenRetrieval() {
  log.header('Test 2: Token Retrieval');
  
  try {
    const token = deployConfig.getAuthToken();
    if (token) {
      log.success(`✓ Token retrieved: ${token.substring(0, 10)}...`);
      results.push({ test: 'Token Retrieval', status: 'PASS' });
    } else {
      log.warning('⚠ No token found (may be expected in test environment)');
      results.push({ test: 'Token Retrieval', status: 'WARN', message: 'No token found' });
    }
  } catch (error) {
    log.error(`✗ Token retrieval error: ${error.message}`);
    results.push({ test: 'Token Retrieval', status: 'FAIL', error: error.message });
  }
}

// Test 3: Site ID Resolution
function testSiteIdResolution() {
  log.header('Test 3: Site ID Resolution');
  
  try {
    const prodSite = deployConfig.getSiteId('production');
    const stagingSite = deployConfig.getSiteId('staging');
    const devSite = deployConfig.getSiteId('development');
    
    log.info(`Production: ${prodSite || 'Not configured'}`);
    log.info(`Staging: ${stagingSite || 'Not configured'}`);
    log.info(`Development: ${devSite || 'Not configured'}`);
    
    if (prodSite) {
      log.success('✓ Site ID resolution works');
      results.push({ test: 'Site ID Resolution', status: 'PASS' });
    } else {
      throw new Error('No production site ID');
    }
  } catch (error) {
    log.error(`✗ Site ID error: ${error.message}`);
    results.push({ test: 'Site ID Resolution', status: 'FAIL', error: error.message });
  }
}

// Test 4: Build Command Resolution
function testBuildCommands() {
  log.header('Test 4: Build Command Resolution');
  
  try {
    const prodBuild = deployConfig.getBuildCommand('production');
    const stagingBuild = deployConfig.getBuildCommand('staging');
    
    log.info(`Production build: ${prodBuild}`);
    log.info(`Staging build: ${stagingBuild}`);
    
    if (prodBuild) {
      log.success('✓ Build command resolution works');
      results.push({ test: 'Build Commands', status: 'PASS' });
    } else {
      throw new Error('No build command found');
    }
  } catch (error) {
    log.error(`✗ Build command error: ${error.message}`);
    results.push({ test: 'Build Commands', status: 'FAIL', error: error.message });
  }
}

// Test 5: Deployment Script
function testDeploymentScript() {
  log.header('Test 5: Deployment Script');
  
  try {
    // Test dry run
    const result = execSync('node ./deployment/deploy.js production --dry-run', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    if (result.includes('Dry run')) {
      log.success('✓ Deployment script works');
      results.push({ test: 'Deployment Script', status: 'PASS' });
    } else {
      throw new Error('Unexpected output from deployment script');
    }
  } catch (error) {
    log.error(`✗ Deployment script error: ${error.message}`);
    results.push({ test: 'Deployment Script', status: 'FAIL', error: error.message });
  }
}

// Test 6: Check for Hardcoded Values
function testHardcodedValues() {
  log.header('Test 6: Check for Remaining Hardcoded Values');
  
  try {
    const searchResult = execSync(
      "grep -r require('./deployment.config').getSiteId('production') --include='*.js' --include='*.ts' --exclude-dir=node_modules --exclude-dir=.git --exclude=deployment.config.js . || true",
      { encoding: 'utf8', cwd: process.cwd() }
    );
    
    if (searchResult.trim()) {
      const files = searchResult.trim().split('\\n').map(line => line.split(':')[0]);
      log.warning(`⚠ Found hardcoded values in ${files.length} files`);
      results.push({ 
        test: 'Hardcoded Values', 
        status: 'WARN', 
        message: `${files.length} files still contain hardcoded values` 
      });
    } else {
      log.success('✓ No hardcoded values found');
      results.push({ test: 'Hardcoded Values', status: 'PASS' });
    }
  } catch (error) {
    log.error(`✗ Search error: ${error.message}`);
    results.push({ test: 'Hardcoded Values', status: 'FAIL', error: error.message });
  }
}

// Run all tests
log.header('🧪 Running DRY Deployment Tests');

testConfigLoading();
testTokenRetrieval();
testSiteIdResolution();
testBuildCommands();
testDeploymentScript();
testHardcodedValues();

// Summary
log.header('📊 Test Summary');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const warnings = results.filter(r => r.status === 'WARN').length;

results.forEach(result => {
  const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  log.info(`${emoji} ${result.test}: ${result.status}`);
  if (result.error) log.info(`   Error: ${result.error}`);
  if (result.message) log.info(`   Note: ${result.message}`);
});

log.info('');
log.info(`Total: ${results.length} tests`);
log.success(`Passed: ${passed}`);
if (failed > 0) log.error(`Failed: ${failed}`);
if (warnings > 0) log.warning(`Warnings: ${warnings}`);

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);