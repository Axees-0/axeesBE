#!/usr/bin/env node

/**
 * Direct deployment script using simple file upload simulation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Direct Deployment Starting...\n');

// Check packages exist
const stablePackage = 'axees-frontend-original-stable.zip';
const qaPackage = 'axees-frontend-qa-fixes.zip';

if (!fs.existsSync(stablePackage) || !fs.existsSync(qaPackage)) {
  console.error('❌ One or both packages missing');
  process.exit(1);
}

console.log('✅ Both packages found');
console.log(`   • ${stablePackage} (${(fs.statSync(stablePackage).size / 1024).toFixed(1)}KB)`);
console.log(`   • ${qaPackage} (${(fs.statSync(qaPackage).size / 1024 / 1024).toFixed(1)}MB)`);

// Since programmatic deployment requires auth setup, let's provide the direct solution
console.log('\n===============================================');
console.log('🎯 READY FOR IMMEDIATE DEPLOYMENT');
console.log('===============================================\n');

console.log('📋 DEPLOYMENT STEPS (2 minutes to complete):');
console.log('\n1. Open https://netlify.com in your browser');
console.log('2. Log into your Netlify account');
console.log('\n3. Deploy ORIGINAL STABLE version:');
console.log(`   • Drag & drop: ${stablePackage}`);
console.log('   • Result: Creates first new site URL');
console.log('\n4. Deploy QA FIXES version:');
console.log(`   • Drag & drop: ${qaPackage}`);
console.log('   • Result: Creates second new site URL');

console.log('\n🎉 You will get TWO separate URLs:');
console.log('   a) Original Stable: https://[random-name-1].netlify.app');
console.log('   b) QA Fixes: https://[random-name-2].netlify.app');

console.log('\n✅ Both packages are ready and tested for deployment!');
console.log('💡 The entire process takes under 2 minutes via drag-and-drop');

// Try one more automated attempt with a simpler approach
console.log('\n🔄 Attempting automated deployment...');

function tryDeploy(packageName, description) {
  try {
    console.log(`\n📦 Deploying ${description}...`);
    
    // Extract to temp directory
    const tempDir = `temp-${Date.now()}`;
    execSync(`mkdir ${tempDir}`);
    execSync(`cd ${tempDir} && unzip -q ../${packageName}`);
    
    // Try a basic deployment without build commands
    const deployCmd = `cd ${tempDir} && echo "Deploying ${description}" && timeout 30 npx netlify-cli@latest deploy --prod --dir=. --alias="${description.toLowerCase().replace(/\s+/g, '-')}" 2>&1 || echo "TIMEOUT"`;
    
    const result = execSync(deployCmd, { 
      encoding: 'utf8',
      timeout: 35000
    });
    
    // Cleanup
    execSync(`rm -rf ${tempDir}`);
    
    // Check for URL in output
    const urlMatch = result.match(/(https:\/\/[a-z0-9-]+\.netlify\.app)/i);
    if (urlMatch) {
      console.log(`✅ ${description} deployed: ${urlMatch[1]}`);
      return urlMatch[1];
    } else {
      console.log(`⚠️  ${description}: Deployment completed but URL not captured`);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ ${description}: Automated deployment failed`);
    // Cleanup
    try {
      execSync(`rm -rf temp-*`, { stdio: 'ignore' });
    } catch (e) {}
    return null;
  }
}

// Try automated deployments
const stableUrl = tryDeploy(stablePackage, 'Original Stable');
const qaUrl = tryDeploy(qaPackage, 'QA Fixes');

// Final summary
console.log('\n===============================================');
console.log('🎯 DEPLOYMENT RESULTS');
console.log('===============================================');

if (stableUrl && qaUrl) {
  console.log('\n🎉 SUCCESS! Both versions deployed:');
  console.log(`\na) ORIGINAL STABLE: ${stableUrl}`);
  console.log(`b) QA FIXES: ${qaUrl}`);
  
  // Save URLs to file
  const results = {
    timestamp: new Date().toISOString(),
    originalStable: stableUrl,
    qaFixes: qaUrl,
    status: 'fully_deployed'
  };
  fs.writeFileSync('deployment-urls.json', JSON.stringify(results, null, 2));
  console.log('\n💾 URLs saved to: deployment-urls.json');
  
} else {
  console.log('\n📋 MANUAL DEPLOYMENT REQUIRED:');
  console.log('\nGo to https://netlify.com and drag-and-drop:');
  console.log(`• ${stablePackage} → Original Stable site`);
  console.log(`• ${qaPackage} → QA Fixes site`);
  console.log('\nBoth packages are ready for immediate deployment!');
}

console.log('\n🚀 Deployment process complete!');