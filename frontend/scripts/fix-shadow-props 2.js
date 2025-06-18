const fs = require('fs');
const path = require('path');

// Fix deprecated shadow properties in React Native Web
function fixShadowProperties() {
  console.log('🔧 Fixing deprecated shadow properties...\n');
  
  const filesToFix = [
    // Key files that might have shadow properties
    './app/(tabs)/messages.web.tsx',
    './components/PaymentAlert.tsx',
    './components/NotificationPermissionModal.tsx',
    './components/TermsModal.tsx'
  ];
  
  let fixedFiles = 0;
  let totalReplacements = 0;
  
  filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let fileChanged = false;
        let replacements = 0;
        
        // Pattern to match shadow property blocks
        const shadowPattern = /shadowColor:\s*["']([^"']+)["'],?\s*shadowOffset:\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*\},?\s*shadowOpacity:\s*([\d.]+),?\s*shadowRadius:\s*(\d+),?/g;
        
        // Replace with boxShadow
        content = content.replace(shadowPattern, (match, color, offsetX, offsetY, opacity, radius) => {
          const shadowValue = `${offsetX}px ${offsetY}px ${radius}px rgba(${color === '#000' || color === 'black' ? '0, 0, 0' : color}, ${opacity})`;
          replacements++;
          fileChanged = true;
          return `boxShadow: "${shadowValue}",`;
        });
        
        // Also handle individual shadow properties that might be on separate lines
        const patterns = [
          { old: /shadowColor:\s*["'][^"']*["'],?\s*\n/g, new: '' },
          { old: /shadowOffset:\s*\{[^}]*\},?\s*\n/g, new: '' },
          { old: /shadowOpacity:\s*[\d.]+,?\s*\n/g, new: '' },
          { old: /shadowRadius:\s*\d+,?\s*\n/g, new: '' }
        ];
        
        // Apply additional cleanup patterns
        patterns.forEach(pattern => {
          if (pattern.old.test(content)) {
            content = content.replace(pattern.old, pattern.new);
            fileChanged = true;
          }
        });
        
        if (fileChanged) {
          fs.writeFileSync(filePath, content, 'utf8');
          fixedFiles++;
          totalReplacements += replacements;
          console.log(`✅ Fixed ${filePath} (${replacements} shadow blocks replaced)`);
        } else {
          console.log(`ℹ️  ${filePath} - no shadow properties found`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`⚠️  ${filePath} - file not found`);
    }
  });
  
  console.log(`\n📊 Shadow Properties Fix Summary:`);
  console.log(`   Files processed: ${filesToFix.length}`);
  console.log(`   Files modified: ${fixedFiles}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  
  if (fixedFiles > 0) {
    console.log('\n✅ Shadow properties have been updated for React Native Web compatibility');
  } else {
    console.log('\n✅ No deprecated shadow properties found');
  }
  
  return { fixedFiles, totalReplacements };
}

// Run the fix
fixShadowProperties();