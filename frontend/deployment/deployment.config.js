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

module.exports = {
  // Netlify configuration
  netlify: {
    sites: {
      production: process.env.NETLIFY_SITE_ID || envLocal.NETLIFY_SITE_ID || 'polite-ganache-3a4e1b',
      staging: process.env.NETLIFY_STAGING_SITE_ID || envLocal.NETLIFY_STAGING_SITE_ID || null,
      development: process.env.NETLIFY_DEV_SITE_ID || envLocal.NETLIFY_DEV_SITE_ID || null
    },
    siteIds: {
      'polite-ganache-3a4e1b': {
        name: 'production',
        apiId: '6e93cf51-17e5-4528-8e38-7ad22c2b6b78',
        url: 'https://polite-ganache-3a4e1b.netlify.app'
      }
    },
    apiEndpoint: 'https://api.netlify.com/api/v1',
    cliTimeout: 180000, // 3 minutes
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

  // Environment-specific settings
  environments: {
    production: {
      siteId: 'polite-ganache-3a4e1b',
      branch: 'main',
      buildCommand: 'npm run build:smart',
      isProd: true  // Only production deploys to prod URL
    },
    preview: {
      siteId: 'polite-ganache-3a4e1b',
      branch: 'preview',
      buildCommand: 'npm run build:smart',
      isProd: false  // Deploy to preview URL
    },
    staging: {
      siteId: null,
      branch: 'staging',
      buildCommand: 'npm run export:web',
      isProd: false
    },
    development: {
      siteId: null,
      branch: 'develop',
      buildCommand: 'npm run export:web',
      isProd: false
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

  // Verification settings
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
    ]
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

  // Helper functions
  getSiteId(environment = 'production') {
    return this.netlify.sites[environment] || this.netlify.sites.production;
  },

  getBuildCommand(environment = 'production') {
    return this.environments[environment]?.buildCommand || this.build.commands.smart;
  },

  getExpectedUrl(environment = 'preview', deploymentId = null) {
    const siteId = this.getSiteId(environment);
    const envConfig = this.environments[environment];
    
    if (envConfig && envConfig.isProd) {
      return `https://${siteId}.netlify.app`;
    } else if (deploymentId) {
      return `https://${deploymentId}--${siteId}.netlify.app`;
    } else {
      return `https://preview--${siteId}.netlify.app`;
    }
  },

  // Export loaded environment for reference
  loadedEnv: { ...envBase, ...envProd, ...envLocal }
};