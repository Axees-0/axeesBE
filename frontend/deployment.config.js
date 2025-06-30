/**
 * Deployment Configuration for Axees Frontend
 * 
 * This file centralizes all deployment-related configuration
 * to eliminate hardcoded values across multiple scripts
 */

module.exports = {
  // Netlify configuration
  netlify: {
    sites: {
      production: 'polite-ganache-3a4e1b',
      staging: null, // To be configured
      development: null // To be configured
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
      buildCommand: 'npm run build:smart'
    },
    staging: {
      siteId: null,
      branch: 'staging',
      buildCommand: 'npm run export:web'
    },
    development: {
      siteId: null,
      branch: 'develop',
      buildCommand: 'npm run export:web'
    }
  },

  // Token sources (in priority order)
  tokenSources: [
    () => process.env.NETLIFY_AUTH_TOKEN,
    () => process.env.NETLIFY_TOKEN,
    () => {
      const fs = require('fs');
      const path = `${process.env.HOME}/.netlify-token`;
      return fs.existsSync(path) ? fs.readFileSync(path, 'utf8').trim() : null;
    },
    () => {
      const fs = require('fs');
      return fs.existsSync('.netlify-token') ? fs.readFileSync('.netlify-token', 'utf8').trim() : null;
    }
  ],

  // Deployment presets
  presets: {
    quick: {
      build: false,
      prod: true,
      timeout: 60000
    },
    full: {
      build: true,
      clean: true,
      prod: true,
      timeout: 480000
    },
    test: {
      build: true,
      prod: false,
      timeout: 120000
    }
  },

  // File paths
  paths: {
    buildLog: 'build-times.log',
    deploymentUrl: 'deployment-url.txt',
    deploymentStatus: 'deployment-status.json',
    lastCleanBuild: '.last-clean-build'
  }
};