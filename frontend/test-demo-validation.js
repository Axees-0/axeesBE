/**
 * Test Demo Validation Script
 * Validates the deployed investor demo profile
 */

const fs = require('fs');
const path = require('path');

// Validation configuration
const VALIDATION_CONFIG = {
  demoDir: 'app/test-demo',
  buildDir: 'dist-demo',
  requiredFiles: [
    'app/test-demo/index.tsx',
    'app/test-demo/investor-profile.tsx',
    'app/test-demo/_layout.tsx'
  ],
  requiredAssets: [
    'assets/3.png',
    'assets/share-08.png',
    'assets/search01.svg',
    'assets/zap.svg',
    'assets/contracts.svg',
    'assets/agreement02.svg',
    'assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-14.png',
    'assets/pngclipartyoutubeplaybuttoncomputericonsyoutubeyoutubelogoanglerectanglethumbnail-13.png',
    'assets/tiktok-icon.png',
    'assets/facebook-icon.png'
  ]
};

class DemoValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(type, message, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message, details };
    
    this.results.details.push(logEntry);
    
    const colors = {
      PASS: '\x1b[32m✅',
      FAIL: '\x1b[31m❌',
      WARN: '\x1b[33m⚠️ ',
      INFO: '\x1b[34mℹ️ '
    };
    
    console.log(`${colors[type] || ''} ${message}\x1b[0m`);
    if (details) {
      console.log(`   ${details}`);
    }
    
    if (type === 'PASS') this.results.passed++;
    else if (type === 'FAIL') this.results.failed++;
    else if (type === 'WARN') this.results.warnings++;
  }

  checkFileExists(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        this.log('PASS', `File exists: ${filePath}`);
        return true;
      } else {
        this.log('FAIL', `Missing file: ${filePath}`);
        return false;
      }
    } catch (error) {
      this.log('FAIL', `Error checking file: ${filePath}`, error.message);
      return false;
    }
  }

  validateFileContent(filePath, checks) {
    try {
      if (!fs.existsSync(filePath)) {
        this.log('FAIL', `Cannot validate content - file missing: ${filePath}`);
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let passed = true;

      checks.forEach(check => {
        if (check.type === 'contains') {
          if (content.includes(check.value)) {
            this.log('PASS', `Content check passed: ${check.description}`);
          } else {
            this.log('FAIL', `Content check failed: ${check.description}`);
            passed = false;
          }
        } else if (check.type === 'regex') {
          if (check.value.test(content)) {
            this.log('PASS', `Regex check passed: ${check.description}`);
          } else {
            this.log('FAIL', `Regex check failed: ${check.description}`);
            passed = false;
          }
        }
      });

      return passed;
    } catch (error) {
      this.log('FAIL', `Error validating file content: ${filePath}`, error.message);
      return false;
    }
  }

  validateDemoProfile() {
    this.log('INFO', 'Validating investor demo profile component...');
    
    const profileFile = 'app/test-demo/investor-profile.tsx';
    const checks = [
      {
        type: 'contains',
        value: 'Jimmy Donaldson',
        description: 'MrBeast profile name present'
      },
      {
        type: 'contains',
        value: '1100000000',
        description: 'Correct follower count (1.1B)'
      },
      {
        type: 'contains',
        value: 'AxeesMockup3',
        description: 'AxeesMockup3 reference in comments'
      },
      {
        type: 'contains',
        value: 'frameParent',
        description: 'AxeesMockup3 style classes preserved'
      },
      {
        type: 'contains',
        value: 'MakeOfferModal',
        description: 'Modal integration present'
      },
      {
        type: 'regex',
        value: /BREAKPOINTS\s*=\s*{[\s\S]*TABLET:\s*768/,
        description: 'Responsive breakpoints configured'
      }
    ];

    return this.validateFileContent(profileFile, checks);
  }

  validateRouting() {
    this.log('INFO', 'Validating demo routing configuration...');
    
    const layoutFile = 'app/test-demo/_layout.tsx';
    const indexFile = 'app/test-demo/index.tsx';
    
    const layoutChecks = [
      {
        type: 'contains',
        value: 'investor-profile',
        description: 'Profile route configured'
      },
      {
        type: 'contains',
        value: 'Stack.Screen',
        description: 'Stack navigation setup'
      }
    ];

    const indexChecks = [
      {
        type: 'contains',
        value: 'test-demo/investor-profile',
        description: 'Navigation to profile configured'
      },
      {
        type: 'contains',
        value: 'Investor Demo Test Environment',
        description: 'Demo index content present'
      }
    ];

    const layoutValid = this.validateFileContent(layoutFile, layoutChecks);
    const indexValid = this.validateFileContent(indexFile, indexChecks);
    
    return layoutValid && indexValid;
  }

  validateAssets() {
    this.log('INFO', 'Validating required assets...');
    
    let allAssetsValid = true;
    
    VALIDATION_CONFIG.requiredAssets.forEach(asset => {
      if (!this.checkFileExists(asset)) {
        allAssetsValid = false;
      }
    });
    
    return allAssetsValid;
  }

  validateGlobalStyles() {
    this.log('INFO', 'Validating GlobalStyles integration...');
    
    const globalStylesFile = 'GlobalStyles.ts';
    const checks = [
      {
        type: 'contains',
        value: 'FontFamily',
        description: 'FontFamily export present'
      },
      {
        type: 'contains',
        value: 'Color',
        description: 'Color export present'
      },
      {
        type: 'contains',
        value: 'Gap',
        description: 'Gap export present'
      },
      {
        type: 'contains',
        value: 'cSK430B92500',
        description: 'Brand purple color defined'
      }
    ];

    return this.validateFileContent(globalStylesFile, checks);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        success: this.results.failed === 0
      },
      details: this.results.details
    };

    // Write detailed report
    fs.writeFileSync(
      'test-demo-validation-report.json',
      JSON.stringify(report, null, 2)
    );

    // Write summary
    const summaryContent = `# Test Demo Validation Report

**Generated:** ${report.timestamp}
**Status:** ${report.summary.success ? '✅ PASSED' : '❌ FAILED'}

## Summary
- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}
- **Warnings:** ${report.summary.warnings}

## Validation Results

${report.details.map(detail => 
  `- ${detail.type === 'PASS' ? '✅' : detail.type === 'FAIL' ? '❌' : detail.type === 'WARN' ? '⚠️' : 'ℹ️'} ${detail.message}`
).join('\n')}

## Next Steps

${report.summary.success ? 
  '🎉 All validations passed! The demo is ready for deployment and investor presentations.' :
  '🔧 Please fix the failed validations before deploying to the test environment.'
}
`;

    fs.writeFileSync('test-demo-validation-summary.md', summaryContent);

    return report;
  }

  async runFullValidation() {
    console.log('🧪 Starting Test Demo Validation...\n');

    // File existence checks
    this.log('INFO', 'Checking required files...');
    VALIDATION_CONFIG.requiredFiles.forEach(file => {
      this.checkFileExists(file);
    });

    // Component validation
    this.validateDemoProfile();
    
    // Routing validation
    this.validateRouting();
    
    // Asset validation
    this.validateAssets();
    
    // Global styles validation
    this.validateGlobalStyles();

    // Generate report
    const report = this.generateReport();

    // Final output
    console.log('\n📊 Validation Complete!');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    
    if (report.summary.success) {
      console.log('\n🎉 All validations passed! Demo is ready for deployment.');
    } else {
      console.log('\n🔧 Some validations failed. Please review the report.');
    }

    console.log('\n📄 Reports generated:');
    console.log('  • test-demo-validation-report.json');
    console.log('  • test-demo-validation-summary.md');

    return report.summary.success;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DemoValidator();
  validator.runFullValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed with error:', error);
      process.exit(1);
    });
}

module.exports = DemoValidator;