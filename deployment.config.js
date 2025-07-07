/**
 * Deployment Configuration for Axees Frontend
 * 
 * This file centralizes all deployment-related configuration
 * to eliminate hardcoded values across multiple scripts
 * 
 * @updated 2025-07-05 - Applied DRY principles to consolidate all deployment settings
 */

const fs = require('fs');
const path = require('path');

// Helper to load environment variables
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    return env;
  }
  return {};
}

// Load environment variables in priority order (look in parent directory)
const envLocal = loadEnvFile(path.join(__dirname, '..', '.env.local'));
const envProd = loadEnvFile(path.join(__dirname, '..', '.env.production'));
const envBase = loadEnvFile(path.join(__dirname, '..', '.env'));

// Single source of truth for production site (DRY principle)
const PRODUCTION_SITE = {
  name: envLocal.NETLIFY_SITE_NAME || 'polite-ganache-3a4e1b',
  apiId: envLocal.NETLIFY_SITE_API_ID || 'e4389bf8-fc47-4c5e-9426-f11b25e5bcf3',
  url: function() { return `https://${this.name}.netlify.app`; },
  previewUrl: function() { return `https://preview--${this.name}.netlify.app`; }
};

module.exports = {
  // Netlify configuration (DRY: using single source of truth)
  netlify: {
    sites: {
      production: PRODUCTION_SITE.name,
      staging: envLocal.NETLIFY_STAGING_SITE_ID || null,
      development: envLocal.NETLIFY_DEV_SITE_ID || null,
      demo: PRODUCTION_SITE.name // Demo uses production site
    },
    // DRY: Dynamic site ID mapping instead of hardcoded duplication
    siteIds: {
      [PRODUCTION_SITE.name]: {
        name: 'production',
        apiId: PRODUCTION_SITE.apiId,
        url: PRODUCTION_SITE.url(),
        previewUrl: PRODUCTION_SITE.previewUrl()
      }
    },
    apiEndpoint: 'https://api.netlify.com/api/v1',
    cliTimeout: 180000, // 3 minutes
    // Deployment messages (consolidated from shell scripts)
    deployMessages: {
      production: 'Production deployment via unified system',
      preview: 'Preview deployment via unified system', 
      demo: 'Demo deployment via unified system',
      quick: 'Quick deployment without build',
      clean: 'Clean build deployment'
    }
  },

  // Build configuration
  build: {
    outputDir: 'dist',
    timeout: 300000, // 5 minutes
    memoryLimit: 4096, // MB
    commands: {
      web: 'expo export --platform web',
      webClean: 'expo export --platform web -c',
      smart: 'node ./scripts/smart-build.js'
    }
  },

  // Environment-specific settings (DRY: using single source of truth)
  environments: {
    production: {
      siteId: PRODUCTION_SITE.name,
      branch: 'main',
      buildCommand: 'npm run build:smart',
      isProd: true,  // Only production deploys to prod URL
      deployMessage: 'Production deployment via unified system'
    },
    preview: {
      siteId: PRODUCTION_SITE.name,
      branch: 'preview', 
      buildCommand: 'npm run build:smart',
      isProd: false,  // Deploy to preview URL
      deployMessage: 'Preview deployment via unified system'
    },
    staging: {
      siteId: null,
      branch: 'staging',
      buildCommand: 'npm run export:web',
      isProd: false,
      deployMessage: 'Staging deployment via unified system'
    },
    development: {
      siteId: null,
      branch: 'develop',
      buildCommand: 'npm run export:web', 
      isProd: false,
      deployMessage: 'Development deployment via unified system'
    },
    // Demo environment (DRY: using single source of truth)
    demo: {
      siteId: PRODUCTION_SITE.name,
      branch: 'demo',
      buildCommand: 'npx expo export --platform web --output-dir dist-demo --clear',
      isProd: false,
      buildDir: 'dist-demo',
      envVars: {
        NODE_ENV: 'development',
        EXPO_PUBLIC_DEMO_MODE: 'true'
      },
      deployMessage: 'Demo deployment (test environment)',
      additionalFiles: ['test-validation.html', 'TEST_DEMO_DEPLOYMENT_SUMMARY.md']
    }
  },

  // Token management
  getAuthToken() {
    // Priority order for token sources
    return process.env.NETLIFY_AUTH_TOKEN ||
           envLocal.NETLIFY_AUTH_TOKEN ||
           process.env.NETLIFY_TOKEN ||
           envLocal.NETLIFY_TOKEN ||
           (fs.existsSync(`${process.env.HOME}/.netlify-token`) ? 
            fs.readFileSync(`${process.env.HOME}/.netlify-token`, 'utf8').trim() : null) ||
           (fs.existsSync('.netlify-token') ? 
            fs.readFileSync('.netlify-token', 'utf8').trim() : null);
  },

  // Deployment presets
  presets: {
    quick: {
      build: false,
      prod: false,  // Changed: default to preview
      timeout: 60000
    },
    full: {
      build: true,
      clean: true,
      prod: false,  // Changed: default to preview
      timeout: 480000
    },
    preview: {
      build: true,
      prod: false,
      timeout: 120000
    },
    production: {
      build: true,
      prod: true,
      timeout: 480000
    }
  },

  // File paths
  paths: {
    buildLog: 'build-times.log',
    deploymentUrl: 'deployment-url.txt',
    deploymentStatus: 'deployment-status.json',
    lastCleanBuild: '.last-clean-build',
    distDir: 'dist',
    distDemo: 'dist-demo',
    alternativeDirs: ['temp_build', 'dist_new2', 'dist_new', 'temp_dist']
  },

  // Verification settings (consolidated from curl-test-deploy.sh and other scripts)
  verification: {
    enabled: true,
    maxRetries: 5,
    retryDelay: 3000, // 3 seconds
    timeout: 10000,   // 10 seconds per request
    requiredChecks: [
      'HTML Structure',
      'Title Tag', 
      'Content Length',
      'No Error Pages'
    ],
    optionalChecks: [
      'React App Mount',
      'Axees Branding'
    ],
    // Advanced checks (consolidated from curl-test-deploy.sh)
    advancedChecks: {
      jsBundle: true,        // Check for JavaScript bundle accessibility
      manifest: true,        // Check manifest.json accessibility  
      rootElement: true,     // Check for root element in HTML
      debugFeatures: false,  // Check for debug panel markers (optional)
      inlineProvider: false, // Check for INLINE PROVIDER code
      inlineHook: false      // Check for INLINE HOOK code
    },
    // Status codes to consider successful
    successCodes: [200, 201, 202],
    // Headers to check for proper deployment
    requiredHeaders: ['content-type'],
    // Demo-specific validation (from test-demo-deploy.sh)
    demo: {
      requiredRoutes: ['/test-demo', '/test-demo/investor-profile'],
      requiredAssets: [
        'assets/3.png',
        'assets/share-08.png', 
        'assets/search01.svg',
        'assets/zap.svg',
        'assets/contracts.svg',
        'assets/agreement02.svg'
      ]
    }
  },

  // Logging configuration
  logging: {
    colors: {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    },
    log: {
      info: (msg) => console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`),
      success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
      warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
      error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
      header: (msg) => {
        console.log(`\n\x1b[36m${'='.repeat(50)}\x1b[0m`);
        console.log(`\x1b[36m${msg}\x1b[0m`);
        console.log(`\x1b[36m${'='.repeat(50)}\x1b[0m\n`);
      }
    }
  },

  // Helper functions (DRY: using single source of truth)
  getSiteId(environment = 'production') {
    const siteName = this.netlify.sites[environment] || this.netlify.sites.production;
    // DRY: Use the centralized site configuration
    if (siteName === PRODUCTION_SITE.name) {
      return PRODUCTION_SITE.apiId;
    }
    return siteName;
  },

  getBuildCommand(environment = 'production') {
    return this.environments[environment]?.buildCommand || this.build.commands.smart;
  },

  getExpectedUrl(environment = 'preview', deploymentId = null) {
    const envConfig = this.environments[environment];
    // DRY: Use the site name from config, not the API ID
    const siteName = envConfig?.siteId || PRODUCTION_SITE.name;
    
    if (envConfig && envConfig.isProd) {
      return PRODUCTION_SITE.url();
    } else if (deploymentId) {
      return `https://${deploymentId}--${siteName}.netlify.app`;
    } else {
      return PRODUCTION_SITE.previewUrl();
    }
  },

  // Export loaded environment for reference
  loadedEnv: { ...envBase, ...envProd, ...envLocal },
  
  // Export production site config (DRY: single source of truth)
  PRODUCTION_SITE
};