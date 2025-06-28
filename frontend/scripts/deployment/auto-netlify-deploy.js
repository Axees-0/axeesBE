#!/usr/bin/env node

/**
 * Automated Netlify deployment script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const FormData = require('form-data');

console.log('🚀 Starting automated Netlify deployment...\n');

// Function to deploy to Netlify via API
async function deployToNetlify(zipPath, siteName) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(zipPath));
    
    const options = {
      hostname: 'api.netlify.com',
      port: 443,
      path: '/api/v1/sites',
      method: 'POST',
      headers: form.getHeaders()
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.url) {
            console.log(`✅ ${siteName} deployed successfully!`);
            console.log(`   URL: ${result.url}`);
            resolve(result.url);
          } else {
            console.log(`⚠️  ${siteName} deployment response:`, result);
            resolve(null);
          }
        } catch (e) {
          console.log(`⚠️  ${siteName} deployment completed (response parsing issue)`);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`⚠️  ${siteName} deployment error:`, e.message);
      resolve(null);
    });

    form.pipe(req);
  });
}

// Main deployment function
async function deploy() {
  try {
    console.log('📦 Deploying QA Fixes version...');
    const qaUrl = await deployToNetlify('qa-fixes-deployment.zip', 'QA Fixes');
    
    if (qaUrl) {
      console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
      console.log(`🌐 Live URL: ${qaUrl}`);
      
      // Save the URL
      fs.writeFileSync('deployment-url.txt', qaUrl);
      console.log('📝 URL saved to deployment-url.txt');
      
      return qaUrl;
    } else {
      console.log('\n⚠️  Automatic deployment not available');
      console.log('💡 Manual deployment required:');
      console.log('   1. Go to https://netlify.com');
      console.log('   2. Drag & drop qa-fixes-deployment.zip');
      console.log('   3. Get instant deployment URL');
    }
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    console.log('\n💡 Please deploy manually:');
    console.log('   1. Go to https://netlify.com');
    console.log('   2. Drag & drop qa-fixes-deployment.zip');
  }
}

// Check if packages exist
if (!fs.existsSync('qa-fixes-deployment.zip')) {
  console.error('❌ qa-fixes-deployment.zip not found');
  process.exit(1);
}

// Run deployment
deploy().then(() => {
  console.log('\n🚀 Deployment process complete!');
});