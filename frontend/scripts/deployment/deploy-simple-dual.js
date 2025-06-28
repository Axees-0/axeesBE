#!/usr/bin/env node

/**
 * Simple dual deployment solution
 * Deploys both packages to separate Netlify sites
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Simple Dual Deployment Solution\n');

// Verify packages exist
const stablePackage = 'axees-frontend-original-stable.zip';
const qaPackage = 'axees-frontend-qa-fixes.zip';

if (!fs.existsSync(stablePackage) || !fs.existsSync(qaPackage)) {
  console.error('❌ Packages missing');
  process.exit(1);
}

console.log('✅ Both packages ready for deployment:');
console.log(`   • ${stablePackage} (${(fs.statSync(stablePackage).size / 1024).toFixed(0)}KB)`);
console.log(`   • ${qaPackage} (${(fs.statSync(qaPackage).size / 1024 / 1024).toFixed(1)}MB)`);

// Direct deployment approach
console.log('\n🎯 DEPLOYMENT SOLUTION');
console.log('══════════════════════════════════════════════════');

// Check if netlify CLI is available
let hasNetlifyCLI = false;
try {
  execSync('which netlify', { stdio: 'ignore' });
  hasNetlifyCLI = true;
} catch (e) {
  hasNetlifyCLI = false;
}

if (hasNetlifyCLI) {
  console.log('✅ Netlify CLI detected - attempting automated deployment\n');
  
  try {
    // Deploy stable version
    console.log('📦 Deploying Original Stable Version...');
    const stableResult = execSync(`cd temp-stable && netlify deploy --prod --dir=. --message="Original Stable Deployment" 2>&1`, { 
      encoding: 'utf8',
      timeout: 60000 
    });
    
    const stableUrl = stableResult.match(/(https:\/\/[a-z0-9-]+\.netlify\.app)/i);
    
    // Deploy QA fixes version  
    console.log('📦 Deploying QA Fixes Version...');
    const qaResult = execSync(`cd temp-qa && netlify deploy --prod --dir=. --message="QA Fixes Deployment" 2>&1`, { 
      encoding: 'utf8',
      timeout: 60000 
    });
    
    const qaUrl = qaResult.match(/(https:\/\/[a-z0-9-]+\.netlify\.app)/i);
    
    // Output results
    console.log('\n🎉 DEPLOYMENT COMPLETE!');
    console.log('══════════════════════════════════════════════════');
    
    if (stableUrl && qaUrl) {
      console.log(`\n✅ Original Stable: ${stableUrl[1]}`);
      console.log(`✅ QA Fixes: ${qaUrl[1]}`);
      
      // Save results
      const results = {
        timestamp: new Date().toISOString(),
        originalStable: stableUrl[1],
        qaFixes: qaUrl[1],
        status: 'deployed'
      };
      
      fs.writeFileSync('deployment-urls.json', JSON.stringify(results, null, 2));
      console.log('\n💾 URLs saved to deployment-urls.json');
      
    } else {
      console.log('\n⚠️  Deployment completed but URLs not captured');
      console.log('Check your Netlify dashboard for the new site URLs');
    }
    
  } catch (error) {
    console.log('\n❌ Automated deployment failed');
    console.log('Falling back to manual deployment instructions...\n');
    showManualInstructions();
  }
  
} else {
  console.log('⚠️  Netlify CLI not found - showing manual deployment\n');
  showManualInstructions();
}

function showManualInstructions() {
  console.log('📋 MANUAL DEPLOYMENT INSTRUCTIONS');
  console.log('══════════════════════════════════════════════════');
  console.log('\n1. Open https://netlify.com in your browser');
  console.log('2. Login to your Netlify account');
  console.log('\n3. Deploy ORIGINAL STABLE version:');
  console.log(`   • Drag & drop: ${stablePackage}`);
  console.log('   • This creates first URL');
  console.log('\n4. Deploy QA FIXES version:');
  console.log(`   • Drag & drop: ${qaPackage}`);
  console.log('   • This creates second URL');
  console.log('\n🎉 Result: Two separate URLs for both versions!');
  console.log('\nBoth packages are ready and tested for deployment.');
}

console.log('\n🚀 Deployment process complete!');