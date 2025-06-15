#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const os = require('os');

class UnifiedTestRunner {
  constructor(options = {}) {
    this.config = {
      testDir: options.testDir || './tests/integration',
      outputDir: options.outputDir || './test-reports',
      maxConcurrency: options.maxConcurrency || os.cpus().length,
      timeout: options.timeout || 300000, // 5 minutes
      retries: options.retries || 0,
      verbose: options.verbose || false,
      generateReport: options.generateReport !== false,
      ...options
    };
    
    this.testSuites = new Map();
    this.results = new Map();
    this.startTime = null;
    this.endTime = null;
    
    // Initialize test suites
    this.initializeTestSuites();
    
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  initializeTestSuites() {
    const testCategories = {
      'core': {
        priority: 1,
        files: [
          'user-registration.test.js',
          'user-authentication.test.js',
          'user-management.test.js',
          'marketer-offer-management.test.js',
          'database-integration.test.js'
        ],
        description: 'Core functionality tests'
      },
      'chat': {
        priority: 2,
        files: [
          'chat-messaging-v1.test.js',
          'chat-performance-tests.test.js',
          'concurrent-chat-simulation.test.js',
          'concurrent-sse-testing.test.js'
        ],
        description: 'Chat and messaging tests'
      },
      'performance': {
        priority: 3,
        files: [
          'performance-baseline.test.js',
          'latency-measurement-framework.test.js',
          'resource-usage-monitoring.test.js'
        ],
        description: 'Performance and monitoring tests'
      },
      'production': {
        priority: 4,
        files: [
          'production-config-validation.test.js',
          'aws-environment-compatibility.test.js',
          'production-database-connections.test.js',
          'deployment-readiness-checks.test.js',
          'environment-specific-scenarios.test.js'
        ],
        description: 'Production readiness tests'
      },
      'monitoring': {
        priority: 5,
        files: [
          'health-check-monitoring.test.js'
        ],
        description: 'System monitoring tests'
      },
      'ux': {
        priority: 6,
        files: [
          'ux-validation-suite.test.js',
          'log-based-validation.test.js'
        ],
        description: 'User experience and validation tests'
      },
      'integration': {
        priority: 7,
        files: [
          'demo-mode-tests.test.js'
        ],
        description: 'Integration completion tests'
      }
    };

    Object.entries(testCategories).forEach(([category, config]) => {
      this.testSuites.set(category, {
        ...config,
        files: config.files.filter(file => 
          fs.existsSync(path.join(this.config.testDir, file))
        )
      });
    });
  }

  async runAllTests(categories = null) {
    this.startTime = new Date();
    
    console.log('🚀 Starting Unified Test Runner');
    console.log('================================');
    console.log(`Start Time: ${this.startTime.toISOString()}`);
    console.log(`Output Directory: ${this.config.outputDir}`);
    console.log(`Max Concurrency: ${this.config.maxConcurrency}`);
    console.log('');

    const categoriesToRun = categories || Array.from(this.testSuites.keys());
    
    // Sort categories by priority
    const sortedCategories = categoriesToRun
      .filter(cat => this.testSuites.has(cat))
      .sort((a, b) => this.testSuites.get(a).priority - this.testSuites.get(b).priority);

    console.log(`📋 Test Categories (${sortedCategories.length}):`);
    sortedCategories.forEach(category => {
      const suite = this.testSuites.get(category);
      console.log(`   ${category}: ${suite.files.length} files - ${suite.description}`);
    });
    console.log('');

    // Run tests by category
    for (const category of sortedCategories) {
      await this.runTestCategory(category);
    }

    this.endTime = new Date();
    
    // Generate comprehensive report
    await this.generateReport();
    
    // Output summary
    this.outputSummary();
    
    return this.getTestResults();
  }

  async runTestCategory(category) {
    const suite = this.testSuites.get(category);
    
    console.log(`📦 Running ${category} tests...`);
    console.log(`   Files: ${suite.files.length}`);
    console.log(`   Description: ${suite.description}`);
    
    const categoryResults = {
      category,
      startTime: new Date(),
      endTime: null,
      files: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };

    // Run tests with controlled concurrency
    const batches = this.createBatches(suite.files, this.config.maxConcurrency);
    
    for (const batch of batches) {
      const batchPromises = batch.map(file => this.runSingleTest(category, file));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const file = batch[index];
        if (result.status === 'fulfilled') {
          categoryResults.files.push(result.value);
        } else {
          categoryResults.files.push({
            file,
            category,
            status: 'failed',
            error: result.reason.message,
            duration: 0,
            tests: { total: 0, passed: 0, failed: 1, skipped: 0 }
          });
        }
      });
    }

    categoryResults.endTime = new Date();
    categoryResults.summary = this.calculateCategorySummary(categoryResults.files);
    
    this.results.set(category, categoryResults);
    
    console.log(`   ✅ Completed in ${categoryResults.summary.duration}ms`);
    console.log(`   📊 ${categoryResults.summary.passed}/${categoryResults.summary.total} tests passed`);
    console.log('');
  }

  async runSingleTest(category, file) {
    const filePath = path.join(this.config.testDir, file);
    const startTime = Date.now();
    
    if (this.config.verbose) {
      console.log(`      🧪 Running ${file}...`);
    }

    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test', '--', filePath, '--testTimeout=60000'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        testProcess.kill('SIGKILL');
        reject(new Error(`Test timeout: ${file} exceeded ${this.config.timeout}ms`));
      }, this.config.timeout);

      testProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          file,
          category,
          status: code === 0 ? 'passed' : 'failed',
          duration,
          stdout,
          stderr,
          exitCode: code,
          tests: this.parseTestOutput(stdout)
        };

        if (this.config.verbose) {
          const status = code === 0 ? '✅' : '❌';
          console.log(`      ${status} ${file} (${duration}ms)`);
        }

        resolve(result);
      });

      testProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  parseTestOutput(stdout) {
    const results = { total: 0, passed: 0, failed: 0, skipped: 0 };
    
    // Parse Jest output
    const testMatch = stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (testMatch) {
      results.failed = parseInt(testMatch[1]) || 0;
      results.passed = parseInt(testMatch[2]) || 0;
      results.total = parseInt(testMatch[3]) || 0;
      results.skipped = results.total - results.passed - results.failed;
    } else {
      // Alternative parsing for different output formats
      const passedMatch = stdout.match(/(\d+)\s+passed/);
      const failedMatch = stdout.match(/(\d+)\s+failed/);
      const totalMatch = stdout.match(/(\d+)\s+total/);
      
      if (passedMatch) results.passed = parseInt(passedMatch[1]);
      if (failedMatch) results.failed = parseInt(failedMatch[1]);
      if (totalMatch) results.total = parseInt(totalMatch[1]);
      
      if (results.total === 0 && (results.passed > 0 || results.failed > 0)) {
        results.total = results.passed + results.failed;
      }
    }
    
    return results;
  }

  calculateCategorySummary(files) {
    const summary = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
    
    files.forEach(file => {
      summary.total += file.tests.total;
      summary.passed += file.tests.passed;
      summary.failed += file.tests.failed;
      summary.skipped += file.tests.skipped;
      summary.duration += file.duration;
    });
    
    return summary;
  }

  createBatches(files, batchSize) {
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    return batches;
  }

  async generateReport() {
    if (!this.config.generateReport) return;
    
    console.log('📄 Generating test report...');
    
    const reportData = {
      runInfo: {
        startTime: this.startTime,
        endTime: this.endTime,
        duration: this.endTime - this.startTime,
        environment: {
          node: process.version,
          platform: os.platform(),
          arch: os.arch(),
          memory: os.totalmem(),
          cpus: os.cpus().length
        },
        config: this.config
      },
      summary: this.getOverallSummary(),
      categories: Array.from(this.results.values()),
      details: this.getDetailedResults()
    };

    // Generate JSON report
    const jsonReportPath = path.join(this.config.outputDir, 'test-results.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReportPath = path.join(this.config.outputDir, 'test-report.html');
    const htmlContent = this.generateHTMLReport(reportData);
    fs.writeFileSync(htmlReportPath, htmlContent);
    
    // Generate JUnit XML report for CI
    const junitReportPath = path.join(this.config.outputDir, 'junit.xml');
    const junitContent = this.generateJUnitReport(reportData);
    fs.writeFileSync(junitReportPath, junitContent);
    
    console.log(`   📄 JSON Report: ${jsonReportPath}`);
    console.log(`   🌐 HTML Report: ${htmlReportPath}`);
    console.log(`   🔧 JUnit Report: ${junitReportPath}`);
  }

  generateHTMLReport(data) {
    const { summary, categories } = data;
    const passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Axees Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #007bff; }
        .metric.passed { border-color: #28a745; }
        .metric.failed { border-color: #dc3545; }
        .metric.duration { border-color: #ffc107; }
        .category { margin-bottom: 25px; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; }
        .category-header { background: #e9ecef; padding: 15px; font-weight: bold; }
        .category-content { padding: 15px; }
        .file-result { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; }
        .file-result:last-child { border-bottom: none; }
        .status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
        .status.passed { background: #28a745; }
        .status.failed { background: #dc3545; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Axees Test Suite Report</h1>
            <p>Generated on ${data.runInfo.endTime.toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric passed">
                <h3>${summary.passed}</h3>
                <p>Passed Tests</p>
            </div>
            <div class="metric failed">
                <h3>${summary.failed}</h3>
                <p>Failed Tests</p>
            </div>
            <div class="metric">
                <h3>${summary.total}</h3>
                <p>Total Tests</p>
            </div>
            <div class="metric duration">
                <h3>${Math.round(summary.duration / 1000)}s</h3>
                <p>Total Duration</p>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${passRate}%"></div>
        </div>
        <p style="text-align: center; font-size: 18px; margin: 10px 0;">
            <strong>Overall Pass Rate: ${passRate}%</strong>
        </p>
        
        ${categories.map(category => `
            <div class="category">
                <div class="category-header">
                    📦 ${category.category.toUpperCase()} - ${category.summary.passed}/${category.summary.total} tests passed
                    (${Math.round(category.summary.duration / 1000)}s)
                </div>
                <div class="category-content">
                    ${category.files.map(file => `
                        <div class="file-result">
                            <span>${file.file}</span>
                            <div>
                                <span class="status ${file.status}">${file.status.toUpperCase()}</span>
                                <span style="margin-left: 10px; color: #666;">${file.tests.passed}/${file.tests.total}</span>
                                <span style="margin-left: 10px; color: #666;">${file.duration}ms</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
        
        <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
            <h4>Environment Info</h4>
            <p><strong>Node.js:</strong> ${data.runInfo.environment.node}</p>
            <p><strong>Platform:</strong> ${data.runInfo.environment.platform} (${data.runInfo.environment.arch})</p>
            <p><strong>CPUs:</strong> ${data.runInfo.environment.cpus}</p>
            <p><strong>Memory:</strong> ${Math.round(data.runInfo.environment.memory / 1024 / 1024 / 1024)}GB</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateJUnitReport(data) {
    const { categories } = data;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testsuites>\n';
    
    categories.forEach(category => {
      xml += `  <testsuite name="${category.category}" tests="${category.summary.total}" failures="${category.summary.failed}" time="${category.summary.duration / 1000}">\n`;
      
      category.files.forEach(file => {
        xml += `    <testcase name="${file.file}" classname="${category.category}" time="${file.duration / 1000}">\n`;
        
        if (file.status === 'failed') {
          xml += `      <failure message="Test failed">${this.escapeXML(file.stderr || 'Test failed')}</failure>\n`;
        }
        
        xml += '    </testcase>\n';
      });
      
      xml += '  </testsuite>\n';
    });
    
    xml += '</testsuites>';
    return xml;
  }

  escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getOverallSummary() {
    const summary = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
    
    this.results.forEach(categoryResult => {
      summary.total += categoryResult.summary.total;
      summary.passed += categoryResult.summary.passed;
      summary.failed += categoryResult.summary.failed;
      summary.skipped += categoryResult.summary.skipped;
      summary.duration += categoryResult.summary.duration;
    });
    
    return summary;
  }

  getDetailedResults() {
    const details = {};
    
    this.results.forEach((categoryResult, category) => {
      details[category] = {
        files: categoryResult.files.map(file => ({
          file: file.file,
          status: file.status,
          duration: file.duration,
          tests: file.tests,
          hasError: file.status === 'failed',
          errorMessage: file.error || null
        }))
      };
    });
    
    return details;
  }

  getTestResults() {
    return {
      summary: this.getOverallSummary(),
      categories: Array.from(this.results.keys()).map(category => ({
        name: category,
        ...this.results.get(category)
      })),
      duration: this.endTime - this.startTime,
      success: this.getOverallSummary().failed === 0
    };
  }

  outputSummary() {
    const summary = this.getOverallSummary();
    const duration = this.endTime - this.startTime;
    const passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    
    console.log('🎯 TEST RUN SUMMARY');
    console.log('==================');
    console.log(`Total Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Tests Run: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏭️  Skipped: ${summary.skipped}`);
    console.log(`📊 Pass Rate: ${passRate}%`);
    console.log('');
    
    if (summary.failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log('⚠️  Some tests failed. Check the report for details.');
    }
    
    console.log(`📄 Report generated in: ${this.config.outputDir}`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  const categories = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--timeout':
      case '-t':
        options.timeout = parseInt(args[++i]);
        break;
      case '--concurrency':
      case '-c':
        options.maxConcurrency = parseInt(args[++i]);
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--help':
      case '-h':
        console.log(`
Unified Test Runner for Axees

Usage: node test-runner.js [options] [categories...]

Options:
  -v, --verbose           Verbose output
  -o, --output <dir>      Output directory for reports (default: ./test-reports)
  -t, --timeout <ms>      Test timeout in milliseconds (default: 300000)
  -c, --concurrency <n>   Max concurrent tests (default: CPU count)
  --no-report            Skip report generation
  -h, --help             Show this help

Categories:
  core, chat, performance, production, monitoring, ux, integration

Examples:
  node test-runner.js                    # Run all tests
  node test-runner.js core chat          # Run only core and chat tests
  node test-runner.js --verbose          # Run with verbose output
  node test-runner.js -o ./reports core  # Custom output directory
        `);
        process.exit(0);
      default:
        if (!arg.startsWith('-')) {
          categories.push(arg);
        }
    }
  }
  
  const runner = new UnifiedTestRunner(options);
  
  runner.runAllTests(categories.length > 0 ? categories : null)
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = UnifiedTestRunner;