const fs = require('fs');
const path = require('path');

// Simple error monitor that checks for common React Native Web errors
console.log('🔍 Error Monitor - Checking for common issues...\n');

// Check if critical files exist
const criticalFiles = [
  'app/_layout.tsx',
  'app/index.tsx', 
  'GlobalStyles.ts',
  'contexts/AuthContext.tsx',
  'firebase-web.ts'
];

console.log('📁 Checking critical files:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check app structure
console.log('\n📱 App structure:');
try {
  const appFiles = fs.readdirSync(path.join(__dirname, 'app'));
  console.log('  App directory contents:', appFiles);
} catch (e) {
  console.log('  ❌ Cannot read app directory:', e.message);
}

// Check package.json dependencies
console.log('\n📦 Key dependencies:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const keyDeps = ['expo', 'expo-router', 'react-native-web', '@stripe/stripe-js'];
  keyDeps.forEach(dep => {
    const version = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
    console.log(`  ${version ? '✅' : '❌'} ${dep}: ${version || 'missing'}`);
  });
} catch (e) {
  console.log('  ❌ Cannot read package.json:', e.message);
}

console.log('\n🌐 Open http://localhost:3000 and check browser console for the actual error message.');
console.log('Common issues to look for:');
console.log('  - Module resolution errors');
console.log('  - Missing environment variables'); 
console.log('  - Firebase configuration errors');
console.log('  - Stripe key issues');