#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Netlify API Token Deployment\n');

// Instructions for getting and saving API token
console.log('📋 To set up automated deployment:\n');
console.log('1. Get your Netlify Personal Access Token:');
console.log('   - Go to: https://app.netlify.com/user/applications#personal-access-tokens');
console.log('   - Click "New access token"');
console.log('   - Give it a name like "CLI Deployment"');
console.log('   - Copy the token (you will not see it again!)\\n');

console.log('2. Save the token for future use:');
console.log('   Option A - Environment variable (temporary):');
console.log('   export NETLIFY_AUTH_TOKEN="your-token-here"\n');

console.log('   Option B - Save to file (permanent):');
console.log('   echo "your-token-here" > ~/.netlify-token');
console.log('   chmod 600 ~/.netlify-token\n');

console.log('3. Deploy with the token:');
console.log('   NETLIFY_AUTH_TOKEN="your-token" netlify deploy --prod --dir=dist --site=polite-ganache-3a4e1b\n');

// Check if token exists in common locations
const tokenLocations = [
  process.env.NETLIFY_AUTH_TOKEN,
  process.env.NETLIFY_TOKEN,
  fs.existsSync(`${process.env.HOME}/.netlify-token`) && fs.readFileSync(`${process.env.HOME}/.netlify-token`, 'utf8').trim(),
  fs.existsSync('.netlify-token') && fs.readFileSync('.netlify-token', 'utf8').trim()
].filter(Boolean);

if (tokenLocations.length > 0) {
  console.log('✅ Found saved token! Attempting deployment...\n');
  
  try {
    const token = tokenLocations[0];
    const result = execSync(
      `NETLIFY_AUTH_TOKEN="${token}" netlify deploy --prod --dir=dist --site=polite-ganache-3a4e1b`,
      { encoding: 'utf8', stdio: 'inherit' }
    );
    
    console.log('\n🎉 Deployment successful!');
    console.log('🌐 Site: https://polite-ganache-3a4e1b.netlify.app/');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n💡 Try refreshing your token or check the site ID');
  }
} else {
  console.log('⚠️  No token found. Follow the steps above to set up automated deployment.');
  console.log('\n📦 Manual deployment still available:');
  console.log('   - Package: qa-fixes-deployment.zip (7.1MB)');
  console.log('   - Drag to: https://app.netlify.com/sites/polite-ganache-3a4e1b/deploys');
}

// Additional deployment options
console.log('\n📚 Other deployment methods:\n');

console.log('1. Using netlify.toml (recommended for CI/CD):');
console.log('   Create netlify.toml with:');
console.log('   [build]');
console.log('     publish = "dist"');
console.log('   Then: netlify deploy --prod\n');

console.log('2. Direct API deployment:');
console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('        -F "file=@qa-fixes-deployment.zip" \\');
console.log('        https://api.netlify.com/api/v1/sites/polite-ganache-3a4e1b/deploys\n');

console.log('3. Using GitHub Actions (automated):');
console.log('   - Set NETLIFY_AUTH_TOKEN as a GitHub secret');
console.log('   - Add deployment step to your workflow');

console.log('\n💡 Save your token securely and never commit it to git!');