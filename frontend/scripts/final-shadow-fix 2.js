const fs = require('fs');
const path = require('path');

// Comprehensive shadow properties fix
function findAndFixAllShadowProps() {
  console.log('🔧 Comprehensive shadow properties fix...\n');
  
  const findTsxFiles = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(findTsxFiles(fullPath));
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
    
    return files;
  };
  
  const tsxFiles = findTsxFiles('./');
  let totalFixed = 0;
  
  console.log(`Found ${tsxFiles.length} TypeScript files to check...`);
  
  tsxFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      // Pattern 1: Individual shadow properties on separate lines
      content = content.replace(/(\s*)shadowColor:\s*["'][^"']*["'],?\s*\n/g, '');
      content = content.replace(/(\s*)shadowOffset:\s*\{[^}]*\},?\s*\n/g, '');
      content = content.replace(/(\s*)shadowOpacity:\s*[\d.]+,?\s*\n/g, '');
      content = content.replace(/(\s*)shadowRadius:\s*\d+,?\s*\n/g, '');
      
      // Pattern 2: All shadow properties in a block (more complex regex)
      const shadowBlockPattern = /shadowColor:\s*["']([^"']*)["'],?\s*\n?\s*shadowOffset:\s*\{\s*width:\s*(-?\d+),?\s*height:\s*(-?\d+)\s*\},?\s*\n?\s*shadowOpacity:\s*([\d.]+),?\s*\n?\s*shadowRadius:\s*(\d+),?\s*/g;
      
      content = content.replace(shadowBlockPattern, (match, color, offsetX, offsetY, opacity, radius) => {
        const rgbaColor = color === '#000' || color === 'black' ? '0, 0, 0' : '0, 0, 0'; // Default to black
        return `boxShadow: "${offsetX}px ${offsetY}px ${radius}px rgba(${rgbaColor}, ${opacity})",`;
      });
      
      // Pattern 3: Alternative order shadow properties
      const altShadowPattern = /shadowOffset:\s*\{\s*width:\s*(-?\d+),?\s*height:\s*(-?\d+)\s*\},?\s*\n?\s*shadowColor:\s*["']([^"']*)["'],?\s*\n?\s*shadowOpacity:\s*([\d.]+),?\s*\n?\s*shadowRadius:\s*(\d+),?\s*/g;
      
      content = content.replace(altShadowPattern, (match, offsetX, offsetY, color, opacity, radius) => {
        const rgbaColor = color === '#000' || color === 'black' ? '0, 0, 0' : '0, 0, 0';
        return `boxShadow: "${offsetX}px ${offsetY}px ${radius}px rgba(${rgbaColor}, ${opacity})",`;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        totalFixed++;
        console.log(`✅ Fixed shadows in: ${filePath}`);
      }
      
    } catch (error) {
      console.log(`⚠️  Error processing ${filePath}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 Fixed shadow properties in ${totalFixed} files`);
  return totalFixed;
}

// Run the comprehensive fix
findAndFixAllShadowProps();