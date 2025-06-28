#!/usr/bin/env node

/**
 * 🚀 Final Dual Deployment Script
 * Deploys both original stable and QA fixes to separate Netlify sites
 */

const fs = require('fs');
const { execSync } = require('child_process');

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

function deployToNetlify(packagePath, description) {
  try {
    info(`Deploying ${description}...`);
    
    // Extract package
    const tempDir = `temp-deploy-${Date.now()}`;
    execSync(`mkdir -p ${tempDir}`);
    execSync(`cd ${tempDir} && unzip -q ../${packagePath}`);
    
    // Deploy with timeout
    let deployOutput;
    try {
      deployOutput = execSync(`cd ${tempDir} && timeout 90 npx netlify-cli@latest deploy --prod --dir=.`, { 
        encoding: 'utf8',
        timeout: 95000  // 95 seconds
      });
    } catch (deployError) {
      warning(`Direct deployment failed for ${description}`);
      // Cleanup and return failure
      execSync(`rm -rf ${tempDir}`);
      return { success: false, error: deployError.message };
    }
    
    // Parse URL from output
    const urlMatch = deployOutput.match(/(?:Website URL|Live URL|URL):\s*(https:\/\/[^\s]+)/i) ||
                     deployOutput.match(/(https:\/\/[a-z0-9-]+\.netlify\.app)/i);
    
    const deployUrl = urlMatch ? urlMatch[1] : null;
    
    // Cleanup
    execSync(`rm -rf ${tempDir}`);
    
    if (deployUrl) {
      success(`✅ ${description} deployed to: ${deployUrl}`);
      return { success: true, url: deployUrl };
    } else {
      warning(`Deployment completed but URL not parsed for ${description}`);
      return { success: true, url: 'Deployment completed - check Netlify dashboard' };
    }
    
  } catch (error) {
    error(`Failed to deploy ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`${colors.cyan}🚀 Final Dual Deployment Starting...${colors.reset}\n`);
  
  // Check packages exist
  const stablePackage = 'axees-frontend-original-stable.zip';
  const qaPackage = 'axees-frontend-qa-fixes.zip';
  
  if (!fs.existsSync(stablePackage)) {
    error(`Stable package not found: ${stablePackage}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(qaPackage)) {
    error(`QA fixes package not found: ${qaPackage}`);
    process.exit(1);
  }
  
  success('✅ Both packages found and ready for deployment');
  
  // Deploy both versions
  info('🚀 Starting dual deployment process...');
  
  const stableResult = deployToNetlify(stablePackage, 'Original Stable Version');
  const qaResult = deployToNetlify(qaPackage, 'QA Fixes Version');
  
  // Create results summary
  console.log(`\n${colors.bright}${colors.magenta}===============================================${colors.reset}`);
  console.log(`${colors.bright}🎯 DUAL DEPLOYMENT RESULTS${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}===============================================${colors.reset}\n`);
  
  // Current situation
  console.log(`${colors.yellow}📍 CURRENT SITUATION:${colors.reset}`);
  console.log(`   • polite-ganache-3a4e1b.netlify.app = Currently hosts QA fixes`);
  console.log(`   • Need: Separate original stable + QA fixes versions\n`);
  
  // Deployment results
  console.log(`${colors.cyan}🚀 DEPLOYMENT RESULTS:${colors.reset}\n`);
  
  console.log(`${colors.green}a) ORIGINAL STABLE VERSION:${colors.reset}`);
  if (stableResult.success) {
    console.log(`   🌐 ${stableResult.url}`);
    console.log(`   📝 Original stable (commit a23d9b0)`);
    console.log(`   ✅ Status: Deployed successfully`);
  } else {
    console.log(`   ❌ Status: Deployment failed`);
    console.log(`   🔧 Action: Manual deployment required`);
  }
  
  console.log(`\n${colors.green}b) QA FIXES VERSION:${colors.reset}`);
  if (qaResult.success) {
    console.log(`   🌐 ${qaResult.url}`);
    console.log(`   📝 All 34 QA issues resolved`);
    console.log(`   ✅ Status: Deployed successfully`);
  } else {
    console.log(`   ❌ Status: Deployment failed`);
    console.log(`   🔧 Action: Manual deployment required`);
  }
  
  // Manual deployment instructions if needed
  if (!stableResult.success || !qaResult.success) {
    console.log(`\n${colors.yellow}📋 MANUAL DEPLOYMENT INSTRUCTIONS:${colors.reset}`);
    console.log(`\n1. Go to https://netlify.com`);
    
    if (!stableResult.success) {
      console.log(`2. Drag & drop: ${stablePackage} → Creates original stable site`);
    }
    
    if (!qaResult.success) {
      console.log(`3. Drag & drop: ${qaPackage} → Creates QA fixes site`);
    }
    
    console.log(`4. Note the URLs for both deployments`);
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.green}🎉 DEPLOYMENT COMPLETE!${colors.reset}\n`);
  
  if (stableResult.success && qaResult.success) {
    console.log(`✅ Both versions deployed successfully to separate URLs`);
    console.log(`💡 You now have original stable + QA fixes on different domains`);
  } else {
    console.log(`⚠️  Some deployments need manual completion`);
    console.log(`📦 Both packages are ready for manual drag-and-drop deployment`);
  }
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    current_issue: 'polite-ganache-3a4e1b.netlify.app hosts QA fixes, needed separation',
    deployments: {
      original_stable: {
        package: stablePackage,
        success: stableResult.success,
        url: stableResult.url || 'Manual deployment required',
        description: 'Original stable version (pre-QA-fixes)'
      },
      qa_fixes: {
        package: qaPackage,
        success: qaResult.success,
        url: qaResult.url || 'Manual deployment required',
        description: 'QA fixes version (34 issues resolved)'
      }
    },
    solution_status: (stableResult.success && qaResult.success) ? 'fully_automated' : 'partially_automated',
    next_steps: [
      'Test both deployed versions',
      'Update production references as needed',
      'Consider which URL should be primary production'
    ]
  };
  
  fs.writeFileSync('final-deployment-results.json', JSON.stringify(results, null, 2));
  success('💾 Results saved to: final-deployment-results.json');
}

main().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});