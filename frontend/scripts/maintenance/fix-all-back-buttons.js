#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Fixing all back buttons in the Axees app...\n');

// Pages that need UniversalBackButton updates
const pagesToUpdate = [
  // Payment pages
  'app/payment/instant.tsx',
  'app/payment/success.tsx',
  
  // Registration flow
  'app/register.tsx',
  'app/register-otp.tsx',
  'app/register-details.tsx',
  'app/register-interests.tsx',
  
  // Offer flow
  'app/offers/review.tsx',
  'app/offers/premade.tsx',
  'app/offers/preview.tsx',
  'app/offers/counter.tsx',
  'app/offers/submit.tsx',
  'app/offers/select.tsx',
  
  // Auth pages
  'app/forgot-password.tsx',
  'app/reset-password.tsx',
  
  // Earnings pages
  'app/earnings/index.tsx',
  'app/earnings/withdraw.tsx',
  
  // Deal pages
  'app/deals/submit.tsx',
  'app/deals/proof.tsx',
  
  // Other pages
  'app/invite.tsx',
  'app/more.tsx',
  'app/profile.tsx',
  'app/chat/[id].tsx',
  'app/settings/index.tsx',
  'app/settings/marketer.tsx',
  'app/settings/creator.tsx',
  'app/edit-profile/creator.tsx',
  'app/edit-profile/marketer.tsx',
  'app/kyc/index.tsx',
  'app/help.tsx',
  'app/about.tsx',
  'app/privacy.tsx',
  'app/terms.tsx',
  'app/kyc/creator.tsx',
  'app/support.tsx'
];

let updatedCount = 0;
let failedCount = 0;

pagesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      failedCount++;
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if already has UniversalBackButton
    if (content.includes('UniversalBackButton')) {
      console.log(`✅ Already updated: ${filePath}`);
      return;
    }
    
    // Check if has router.back()
    if (!content.includes('router.back()')) {
      console.log(`⏭️  No back button found: ${filePath}`);
      return;
    }
    
    // Add import if not present
    if (!content.includes("import { UniversalBackButton }")) {
      // Find where to insert the import
      const lastImportMatch = content.match(/import[^;]+from[^;]+;(?=\s*(?:const|function|export|interface|type|\/\/|\/\*|\n\n))/gs);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const insertPosition = content.indexOf(lastImport) + lastImport.length;
        content = content.slice(0, insertPosition) + 
          "\nimport { UniversalBackButton } from '@/components/UniversalBackButton';" + 
          content.slice(insertPosition);
      }
    }
    
    // Replace router.back() pattern
    const patterns = [
      // Pattern 1: TouchableOpacity with arrow-back icon
      {
        pattern: /<TouchableOpacity[^>]*onPress=\{[^}]*router\.back\(\)[^}]*\}[^>]*>[\s\S]*?<Ionicons[^>]*name="arrow-back"[^>]*\/>\s*<\/TouchableOpacity>/g,
        replacement: '<UniversalBackButton fallbackRoute="/" />'
      },
      // Pattern 2: Pressable with arrow-back
      {
        pattern: /<Pressable[^>]*onPress=\{[^}]*router\.back\(\)[^}]*\}[^>]*>[\s\S]*?<Ionicons[^>]*name="arrow-back"[^>]*\/>\s*<\/Pressable>/g,
        replacement: '<UniversalBackButton fallbackRoute="/" />'
      },
      // Pattern 3: TouchableOpacity with Feather chevron-left
      {
        pattern: /<TouchableOpacity[^>]*onPress=\{[^}]*router\.back\(\)[^}]*\}[^>]*>[\s\S]*?<Feather[^>]*name="chevron-left"[^>]*\/>\s*<\/TouchableOpacity>/g,
        replacement: '<UniversalBackButton fallbackRoute="/" />'
      }
    ];
    
    let updated = false;
    patterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(fullPath, content);
      console.log(`🔧 Updated: ${filePath}`);
      updatedCount++;
    } else {
      console.log(`❓ Could not auto-update: ${filePath} (manual update needed)`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    failedCount++;
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Successfully updated: ${updatedCount} files`);
console.log(`⚠️  Failed or not found: ${failedCount} files`);
console.log(`📝 Total files processed: ${pagesToUpdate.length}`);

console.log('\n💡 Note: Some files may need manual updates if they have custom back button implementations.');
console.log('Run "npm run export:web" to rebuild with the updated back buttons.');