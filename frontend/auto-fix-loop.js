#!/usr/bin/env node

/**
 * Automated Content Fix Loop
 * Continuously monitors and fixes content loading issues
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class AutoFixLoop {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
    this.checkInterval = 5000; // 5 seconds
    this.isRunning = true;
    this.fixCount = 0;
    this.lastError = null;
    
    // Track what we've already fixed to avoid loops
    this.fixedIssues = new Set();
  }

  async start() {
    console.log('🤖 Auto-Fix Loop Started');
    console.log('   Monitoring:', this.baseUrl);
    console.log('   Interval:', this.checkInterval / 1000, 'seconds');
    console.log('   Press Ctrl+C to stop\n');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down auto-fix loop...');
      this.isRunning = false;
      process.exit(0);
    });
    
    // Initial check
    await this.runCheck();
    
    // Start loop
    while (this.isRunning) {
      await this.sleep(this.checkInterval);
      await this.runCheck();
    }
  }

  async runCheck() {
    console.log(`\n[${new Date().toLocaleTimeString()}] Running check...`);
    
    try {
      const result = await this.checkContent();
      
      if (result.hasError) {
        console.log('❌ Issue detected:', result.error.substring(0, 100) + '...');
        
        // Check if we've already tried to fix this
        const errorKey = this.getErrorKey(result.error);
        if (this.fixedIssues.has(errorKey)) {
          console.log('⏭️  Already attempted to fix this issue, skipping...');
          return;
        }
        
        // Attempt fix
        const fixed = await this.attemptFix(result.error);
        if (fixed) {
          this.fixedIssues.add(errorKey);
          this.fixCount++;
          console.log(`✅ Fix applied! (Total fixes: ${this.fixCount})`);
          console.log('⏳ Waiting for recompilation...');
          await this.sleep(3000);
        }
      } else if (result.isHealthy) {
        console.log('✅ Content loading correctly');
        
        // Quick content check
        const contentCheck = await this.quickContentCheck();
        if (contentCheck.missing.length > 0) {
          console.log('⚠️  Missing expected content:', contentCheck.missing.join(', '));
        } else {
          console.log('✅ All expected content present');
        }
        
        // Clear fixed issues after successful load
        if (this.fixedIssues.size > 0) {
          this.fixedIssues.clear();
          console.log('🔄 Cleared fix history');
        }
      }
    } catch (error) {
      console.log('⚠️  Check failed:', error.message);
    }
  }

  async checkContent() {
    return new Promise((resolve) => {
      const req = http.get(this.baseUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const hasError = res.statusCode !== 200 || data.includes('expo-static-error');
          let error = null;
          
          if (hasError) {
            // Extract error message
            const errorMatch = data.match(/"message":\{"content":"([^"]+)"/);
            if (errorMatch) {
              error = errorMatch[1];
            } else if (res.statusCode !== 200) {
              error = `HTTP ${res.statusCode} error`;
            }
          }
          
          resolve({
            statusCode: res.statusCode,
            hasError,
            error,
            isHealthy: res.statusCode === 200 && !hasError,
            content: data
          });
        });
      });
      
      req.on('error', (err) => {
        resolve({
          hasError: true,
          error: err.message,
          isHealthy: false
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          hasError: true,
          error: 'Request timeout',
          isHealthy: false
        });
      });
    });
  }

  async quickContentCheck() {
    const result = await this.checkContent();
    if (!result.isHealthy || !result.content) {
      return { missing: ['Unable to check - server error'] };
    }
    
    const expectedPatterns = [
      { name: 'React root', pattern: 'id="root"' },
      { name: 'Bundle script', pattern: 'bundle' },
      { name: 'Expo router', pattern: 'expo-router' },
    ];
    
    const missing = [];
    expectedPatterns.forEach(({ name, pattern }) => {
      if (!result.content.includes(pattern)) {
        missing.push(name);
      }
    });
    
    return { missing };
  }

  getErrorKey(error) {
    // Extract key parts of error for deduplication
    const patterns = [
      /Cannot find module '([^']+)'/,
      /Unable to resolve module ([^ ]+)/,
      /SyntaxError.*?([^:]+):(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = error.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return error.substring(0, 50);
  }

  async attemptFix(error) {
    console.log('🔧 Attempting automatic fix...');
    
    // Module not found
    if (error.includes('Cannot find module') || error.includes('Unable to resolve module')) {
      const moduleMatch = error.match(/module ['"](.*?)['"]|module ([^ ]+)/);
      const fromMatch = error.match(/from ([^:]+):/);
      
      if (moduleMatch) {
        const moduleName = moduleMatch[1] || moduleMatch[2];
        const fromFile = fromMatch ? fromMatch[1] : null;
        
        return await this.fixMissingModule(moduleName, fromFile, error);
      }
    }
    
    // Syntax error
    if (error.includes('SyntaxError')) {
      const fileMatch = error.match(/([^:]+):(\d+):(\d+)/);
      if (fileMatch) {
        const [_, file, line, col] = fileMatch;
        console.log(`   Syntax error in ${file} at ${line}:${col}`);
        
        // For .ts files with JSX, rename to .tsx
        if (file.endsWith('.ts') && error.includes('JSX')) {
          return await this.renameTsToTsx(file);
        }
      }
    }
    
    // Component not exported
    if (error.includes('does not have a default export')) {
      const fileMatch = error.match(/module "([^"]+)"/);
      if (fileMatch) {
        return await this.addDefaultExport(fileMatch[1]);
      }
    }
    
    console.log('   No automatic fix available for this error type');
    return false;
  }

  async fixMissingModule(moduleName, fromFile, fullError) {
    console.log(`   Module: ${moduleName}`);
    console.log(`   From: ${fromFile || 'unknown'}`);
    
    // Handle relative imports
    if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
      const basePath = fromFile ? path.dirname(fromFile) : process.cwd();
      const possiblePaths = [
        path.resolve(basePath, moduleName + '.tsx'),
        path.resolve(basePath, moduleName + '.ts'),
        path.resolve(basePath, moduleName + '.js'),
        path.resolve(basePath, moduleName, 'index.tsx'),
        path.resolve(basePath, moduleName, 'index.ts'),
      ];
      
      // Check if any variant exists
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          console.log(`   ✅ Found at: ${testPath}`);
          return false; // File exists, might be different issue
        }
      }
      
      // Create stub file
      const stubPath = possiblePaths[0]; // Use .tsx by default
      return await this.createStubFile(stubPath, moduleName);
    }
    
    // Handle absolute/package imports
    if (moduleName.startsWith('@/')) {
      const relativePath = moduleName.replace('@/', '');
      const possiblePaths = [
        path.resolve(process.cwd(), relativePath + '.tsx'),
        path.resolve(process.cwd(), relativePath + '.ts'),
        path.resolve(process.cwd(), 'components', relativePath + '.tsx'),
        path.resolve(process.cwd(), 'utils', relativePath + '.tsx'),
      ];
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          console.log(`   ✅ Found at: ${testPath}`);
          return false;
        }
      }
      
      // Create in most likely location
      const stubPath = possiblePaths[0];
      return await this.createStubFile(stubPath, moduleName);
    }
    
    console.log('   Cannot auto-fix - appears to be npm package');
    return false;
  }

  async createStubFile(filePath, moduleName) {
    console.log(`   Creating stub: ${filePath}`);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Determine component name
    const baseName = path.basename(moduleName).replace(/\.(tsx?|jsx?)$/, '');
    const componentName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    const stubContent = `// Auto-generated stub for demo
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ${componentName}Props {
  [key: string]: any;
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>${componentName} (Demo Mode)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ${componentName};
`;
    
    try {
      fs.writeFileSync(filePath, stubContent);
      console.log(`   ✅ Created stub component`);
      return true;
    } catch (error) {
      console.log(`   ❌ Failed to create stub: ${error.message}`);
      return false;
    }
  }

  async renameTsToTsx(filePath) {
    const newPath = filePath.replace(/\.ts$/, '.tsx');
    console.log(`   Renaming ${filePath} → ${newPath}`);
    
    try {
      fs.renameSync(filePath, newPath);
      console.log(`   ✅ Renamed to .tsx`);
      return true;
    } catch (error) {
      console.log(`   ❌ Rename failed: ${error.message}`);
      return false;
    }
  }

  async addDefaultExport(filePath) {
    console.log(`   Adding default export to ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if already has default export
      if (content.includes('export default')) {
        console.log('   Already has default export');
        return false;
      }
      
      // Find the main component
      const componentMatch = content.match(/export\s+(?:const|function|class)\s+(\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        const newContent = content + `\n\nexport default ${componentName};\n`;
        fs.writeFileSync(filePath, newContent);
        console.log(`   ✅ Added default export for ${componentName}`);
        return true;
      }
      
      console.log('   Could not identify component to export');
      return false;
    } catch (error) {
      console.log(`   ❌ Failed to add export: ${error.message}`);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the auto-fix loop
console.log('🚀 Starting Axees Demo Auto-Fix Loop\n');
const loop = new AutoFixLoop();
loop.start().catch(console.error);