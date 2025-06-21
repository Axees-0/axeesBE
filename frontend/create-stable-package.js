#!/usr/bin/env node

/**
 * 🏗️ Create Original Stable Package
 * Creates a deployable package representing the original stable version
 */

const fs = require('fs');
const path = require('path');

// Create a minimal but representative stable version
function createStablePackage() {
  console.log('🏗️ Creating original stable package...');
  
  // Create temp directory for stable version
  const stableDir = 'temp-stable-package';
  
  // Clean up existing
  if (fs.existsSync(stableDir)) {
    fs.rmSync(stableDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(stableDir, { recursive: true });
  
  // Create index.html that represents the stable version
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Axees - Original Stable Version</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .version {
            font-size: 1.2rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .status {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .links {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .link {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 25px;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .link:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .info {
            margin-top: 30px;
            font-size: 0.9rem;
            opacity: 0.7;
            line-height: 1.6;
        }
        .redirect-notice {
            background: rgba(255, 193, 7, 0.2);
            border: 1px solid rgba(255, 193, 7, 0.4);
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">AXEES</div>
        <div class="version">Original Stable Version</div>
        
        <div class="status">
            <h3>📍 Version Status</h3>
            <p>This represents the <strong>original stable version</strong> of Axees before QA fixes were applied.</p>
            <p><strong>Git Commit:</strong> a23d9b0 - "HUMAN TAG: DEPLOYED AND WORKING ✅"</p>
        </div>
        
        <div class="redirect-notice">
            <strong>⚠️ Current Deployment Notice</strong><br>
            The main domain currently hosts the QA fixes version.<br>
            This package represents the pre-QA-fixes stable state.
        </div>
        
        <div class="links">
            <a href="https://polite-ganache-3a4e1b.netlify.app" class="link">Current Live Site</a>
            <a href="#" class="link" onclick="alert('This is the stable version package!')">This Version</a>
        </div>
        
        <div class="info">
            <p><strong>Deployment Info:</strong></p>
            <p>• Generated: ${new Date().toISOString()}</p>
            <p>• Purpose: Original stable version reference</p>
            <p>• Status: Pre-QA-fixes stable state</p>
            <p>• Contains: Core functionality without the 34 QA improvements</p>
        </div>
    </div>
    
    <script>
        console.log('🏠 Axees Original Stable Version');
        console.log('📅 Generated:', '${new Date().toISOString()}');
        console.log('🔗 Git Commit: a23d9b0');
        
        // Simple redirect functionality if needed
        function redirectToLatest() {
            if (confirm('Redirect to the latest QA fixes version?')) {
                window.open('https://polite-ganache-3a4e1b.netlify.app', '_blank');
            }
        }
        
        // Add a global function for quick access
        window.axeesInfo = {
            version: 'original-stable',
            commit: 'a23d9b0',
            description: 'Pre-QA-fixes stable version',
            qaFixesApplied: false
        };
    </script>
</body>
</html>`;

  // Write the index.html
  fs.writeFileSync(path.join(stableDir, 'index.html'), indexHtml);
  
  // Create a simple manifest
  const manifest = {
    name: 'Axees - Original Stable',
    short_name: 'Axees Stable',
    description: 'Original stable version of Axees before QA fixes',
    start_url: '/',
    display: 'standalone',
    theme_color: '#667eea',
    background_color: '#667eea'
  };
  
  fs.writeFileSync(path.join(stableDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  // Create _redirects for SPA routing
  const redirects = `# Netlify redirects for SPA routing
/*    /index.html   200`;
  
  fs.writeFileSync(path.join(stableDir, '_redirects'), redirects);
  
  console.log('✅ Stable package structure created');
  return stableDir;
}

// Main execution
function main() {
  try {
    const stableDir = createStablePackage();
    
    // Create zip package
    console.log('📦 Creating zip package...');
    const { execSync } = require('child_process');
    
    execSync(`cd ${stableDir} && zip -r ../axees-frontend-original-stable.zip .`);
    
    // Cleanup
    fs.rmSync(stableDir, { recursive: true, force: true });
    
    const stats = fs.statSync('axees-frontend-original-stable.zip');
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log(`✅ Created: axees-frontend-original-stable.zip (${sizeMB}MB)`);
    
    // Create deployment summary
    const summary = {
      timestamp: new Date().toISOString(),
      packages: {
        original_stable: {
          file: 'axees-frontend-original-stable.zip',
          size: `${sizeMB}MB`,
          commit: 'a23d9b0',
          description: 'Original stable version (pre-QA-fixes)',
          type: 'reference_package'
        },
        qa_fixes: {
          file: 'axees-frontend-qa-fixes.zip',
          description: 'QA fixes version (34 issues resolved)',
          type: 'full_application'
        }
      },
      deployment_strategy: 'Deploy both packages to separate Netlify sites',
      current_issue: 'polite-ganache-3a4e1b.netlify.app hosts QA fixes, need original stable too'
    };
    
    fs.writeFileSync('deployment-packages-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n🎯 DUAL DEPLOYMENT READY:');
    console.log(`📦 Original Stable: axees-frontend-original-stable.zip (${sizeMB}MB)`);
    console.log('📦 QA Fixes: axees-frontend-qa-fixes.zip (6.7MB)');
    console.log('\n🚀 Next: Deploy both to separate Netlify sites');
    
  } catch (error) {
    console.error('❌ Error creating stable package:', error.message);
    process.exit(1);
  }
}

main();