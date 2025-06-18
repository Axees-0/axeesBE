#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting project...');

// Clear caches
const cacheDirs = [
  '.expo',
  'node_modules/.cache',
  'ios/build',
  'android/build',
  'android/.gradle',
];

cacheDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removing ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('✅ Project reset complete!');
console.log('💡 Run "npm install" or "yarn install" to reinstall dependencies.');