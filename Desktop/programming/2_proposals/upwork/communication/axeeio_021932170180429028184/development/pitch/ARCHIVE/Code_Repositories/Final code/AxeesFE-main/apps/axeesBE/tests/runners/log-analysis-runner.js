// tests/runners/log-analysis-runner.js

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { LogAnalyzer } = require('../helpers/logAnalysisHelpers');

/**
 * Log Analysis Test Runner
 * 
 * Specialized test runner for log analysis functionality with:
 * - Comprehensive log analysis testing
 * - Performance monitoring and metrics
 * - Real-time monitoring simulation
 * - Report generation and validation
 * - Integration with existing test infrastructure
 */
class LogAnalysisTestRunner {
  constructor(options = {}) {
    this.options = {
      testFile: options.testFile || 'tests/integration/log-analysis.test.js',
      reportsDir: options.reportsDir || path.join(process.cwd(), 'tests', 'reports'),
      verbose: options.verbose !== false,
      timeout: options.timeout || 60000,
      ...options
    };

    this.results = {
      startTime: null,
      endTime: null,
      duration: 0,
      tests: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      patterns: {
        errorDetection: { passed: 0, failed: 0 },
        securityDetection: { passed: 0, failed: 0 },
        performanceAnalysis: { passed: 0, failed: 0 },
        logAggregation: { passed: 0, failed: 0 },
        realtimeMonitoring: { passed: 0, failed: 0 },
        logParsing: { passed: 0, failed: 0 },
        reporting: { passed: 0, failed: 0 }
      },
      performance: {
        avgTestDuration: 0,
        totalLogAnalysisTime: 0,
        logsProcessedPerSecond: 0,
        memoryUsage: {
          initial: 0,
          peak: 0,
          final: 0
        }
      },
      logAnalysisMetrics: {
        totalLogsAnalyzed: 0,
        patternMatches: 0,
        securityEventsDetected: 0,
        performanceMetricsExtracted: 0,
        alertsGenerated: 0
      },
      reports: [],
      errors: []
    };

    this.logAnalyzer = new LogAnalyzer({
      reportsDir: this.options.reportsDir
    });
  }

  /**
   * Run log analysis tests
   */
  async runTests() {
    console.log('🔍 Starting Log Analysis Test Suite');
    console.log('=====================================');

    this.results.startTime = Date.now();
    this.results.performance.memoryUsage.initial = this.getMemoryUsage();

    try {
      await this.ensureReportsDirectory();
      await this.runJestTests();
      await this.runAdditionalAnalysis();
      await this.generateSummaryReport();
      
      this.results.endTime = Date.now();
      this.results.duration = this.results.endTime - this.results.startTime;
      this.results.performance.memoryUsage.final = this.getMemoryUsage();

      return this.results;

    } catch (error) {
      this.results.errors.push({
        type: 'runner_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      console.error('❌ Test runner error:', error.message);
      throw error;
    }
  }

  /**
   * Ensure reports directory exists
   */
  async ensureReportsDirectory() {
    if (!fs.existsSync(this.options.reportsDir)) {
      fs.mkdirSync(this.options.reportsDir, { recursive: true });
    }
  }

  /**
   * Run Jest tests
   */
  async runJestTests() {
    return new Promise((resolve, reject) => {
      console.log('🧪 Running Jest log analysis tests...\n');

      const jestArgs = [
        '--testPathPattern=log-analysis.test.js',
        '--verbose',
        '--detectOpenHandles',
        '--forceExit'
      ];

      const jestProcess = spawn('npx', ['jest', ...jestArgs], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';

      jestProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (this.options.verbose) {
          process.stdout.write(output);
        }
      });

      jestProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (this.options.verbose) {
          process.stderr.write(output);
        }
      });

      jestProcess.on('close', (code) => {
        this.parseJestOutput(stdout, stderr);
        
        if (code === 0) {
          console.log('\n✅ Jest tests completed successfully');
          resolve();
        } else {
          console.log(`\n⚠️ Jest tests completed with exit code: ${code}`);
          // Don't reject, continue with analysis
          resolve();
        }
      });

      jestProcess.on('error', (error) => {
        console.error('❌ Failed to start Jest:', error.message);
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        jestProcess.kill('SIGTERM');
        reject(new Error('Jest tests timed out'));
      }, this.options.timeout);
    });
  }

  /**
   * Parse Jest output
   */
  parseJestOutput(stdout, stderr) {
    try {
      // Parse test results from Jest output
      const testSuites = stdout.match(/Test Suites: (\d+) passed(?:, (\d+) failed)?/);
      const tests = stdout.match(/Tests:\s+(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);

      if (tests) {
        this.results.tests.passed = parseInt(tests[1]) || 0;
        this.results.tests.failed = parseInt(tests[2]) || 0;
        this.results.tests.skipped = parseInt(tests[3]) || 0;
        this.results.tests.total = this.results.tests.passed + this.results.tests.failed + this.results.tests.skipped;
      }

      // Parse pattern-specific results
      this.parsePatternResults(stdout);

      // Parse performance metrics
      this.parsePerformanceMetrics(stdout);

    } catch (error) {
      console.warn('Warning: Failed to parse Jest output:', error.message);
    }
  }

  /**
   * Parse pattern-specific test results
   */
  parsePatternResults(output) {
    const patterns = {
      'Error Pattern Detection': 'errorDetection',
      'Security Pattern Detection': 'securityDetection',
      'Performance Metrics Extraction': 'performanceAnalysis',
      'Log Aggregation': 'logAggregation',
      'Real-time Log Monitoring': 'realtimeMonitoring',
      'Log Parsing': 'logParsing',
      'Log Analysis Reporting': 'reporting'
    };

    Object.entries(patterns).forEach(([testName, key]) => {
      const passedMatch = output.match(new RegExp(`✓.*${testName}`, 'g'));
      const failedMatch = output.match(new RegExp(`✕.*${testName}`, 'g'));
      
      if (passedMatch) {
        this.results.patterns[key].passed = passedMatch.length;
      }
      if (failedMatch) {
        this.results.patterns[key].failed = failedMatch.length;
      }
    });
  }

  /**
   * Parse performance metrics from test output
   */
  parsePerformanceMetrics(output) {
    // Extract timing information
    const timingMatches = output.match(/(\d+\.?\d*)\s*ms/g);
    if (timingMatches) {
      const times = timingMatches.map(match => parseFloat(match));
      this.results.performance.avgTestDuration = times.reduce((a, b) => a + b, 0) / times.length;
    }

    // Extract log processing metrics
    const logsProcessedMatch = output.match(/Logs processed: (\d+)/);
    if (logsProcessedMatch) {
      this.results.logAnalysisMetrics.totalLogsAnalyzed += parseInt(logsProcessedMatch[1]);
    }

    const processingTimeMatch = output.match(/Processing time: (\d+)ms/);
    if (processingTimeMatch) {
      this.results.performance.totalLogAnalysisTime += parseInt(processingTimeMatch[1]);
    }

    const logsPerSecondMatch = output.match(/Logs per second: (\d+)/);
    if (logsPerSecondMatch) {
      this.results.performance.logsProcessedPerSecond = Math.max(
        this.results.performance.logsProcessedPerSecond,
        parseInt(logsPerSecondMatch[1])
      );
    }
  }

  /**
   * Run additional log analysis beyond Jest tests
   */
  async runAdditionalAnalysis() {
    console.log('\n🔬 Running Additional Log Analysis...');

    try {
      // Simulate comprehensive log analysis
      await this.runLogAnalysisSimulation();
      
      // Test log parsing with various formats
      await this.testLogFormatParsing();
      
      // Performance stress testing
      await this.runPerformanceStressTest();
      
      // Real-time monitoring simulation
      await this.runRealtimeMonitoringTest();

    } catch (error) {
      this.results.errors.push({
        type: 'additional_analysis_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.warn('⚠️ Additional analysis error:', error.message);
    }
  }

  /**
   * Run log analysis simulation
   */
  async runLogAnalysisSimulation() {
    console.log('  📊 Running log analysis simulation...');

    const simulationLogs = [
      { level: 'INFO', message: 'Application started', source: 'system' },
      { level: 'ERROR', message: 'Database connection failed', source: 'database' },
      { level: 'WARN', message: 'High memory usage: 80MB', source: 'system' },
      { level: 'INFO', message: 'User authentication successful', source: 'auth' },
      { level: 'ERROR', message: 'Invalid token provided', source: 'auth' },
      { level: 'INFO', message: 'Chat message sent', source: 'chat' },
      { level: 'WARN', message: 'Slow query detected: 1200ms', source: 'database' },
      { level: 'ERROR', message: 'Rate limit exceeded', source: 'api' }
    ];

    simulationLogs.forEach(entry => this.logAnalyzer.addLogEntry(entry));

    const analysis = this.logAnalyzer.analyzeLogs(this.logAnalyzer.logBuffer);
    this.results.logAnalysisMetrics.patternMatches += analysis.patterns.error + analysis.patterns.warning;
    this.results.logAnalysisMetrics.securityEventsDetected += analysis.patterns.security;

    console.log(`    ✓ Analyzed ${simulationLogs.length} log entries`);
    console.log(`    ✓ Detected ${analysis.patterns.error} error patterns`);
    console.log(`    ✓ Detected ${analysis.patterns.security} security patterns`);
  }

  /**
   * Test log format parsing
   */
  async testLogFormatParsing() {
    console.log('  📝 Testing log format parsing...');

    const testLogs = [
      '{"timestamp":"2025-06-13T20:00:00Z","level":"INFO","message":"JSON format test"}',
      '2025-06-13 20:00:00 INFO [system] Standard format test',
      '<134>2025-06-13T20:00:00Z server app[123]: Syslog format test',
      'Invalid log format test'
    ];

    const logData = testLogs.join('\n');
    const parseResults = this.logAnalyzer.testLogParsing(logData);

    console.log(`    ✓ Parsed ${parseResults.successfullyParsed}/${parseResults.totalLines} log entries`);
    console.log(`    ✓ Detected formats: ${parseResults.formats.join(', ')}`);
    console.log(`    ✓ Parse success rate: ${(parseResults.parseSuccessRate * 100).toFixed(1)}%`);
  }

  /**
   * Run performance stress test
   */
  async runPerformanceStressTest() {
    console.log('  🏋️ Running performance stress test...');

    const startTime = Date.now();
    const logCount = 1000;

    // Generate many logs
    for (let i = 0; i < logCount; i++) {
      this.logAnalyzer.addLogEntry({
        level: i % 10 === 0 ? 'ERROR' : 'INFO',
        message: `Stress test log ${i}`,
        source: `service-${i % 5}`,
        metadata: { iteration: i }
      });
    }

    const processingTime = Date.now() - startTime;
    const logsPerSecond = Math.floor(logCount / (processingTime / 1000));

    this.results.performance.logsProcessedPerSecond = Math.max(
      this.results.performance.logsProcessedPerSecond,
      logsPerSecond
    );

    this.results.performance.memoryUsage.peak = Math.max(
      this.results.performance.memoryUsage.peak,
      this.getMemoryUsage()
    );

    console.log(`    ✓ Processed ${logCount} logs in ${processingTime}ms`);
    console.log(`    ✓ Performance: ${logsPerSecond} logs/second`);
    console.log(`    ✓ Memory usage: ${this.getMemoryUsage().toFixed(1)}MB`);
  }

  /**
   * Run real-time monitoring test
   */
  async runRealtimeMonitoringTest() {
    console.log('  🔄 Running real-time monitoring test...');

    const monitoringResults = await this.logAnalyzer.simulateLogMonitoring(3000, 100);
    
    this.results.logAnalysisMetrics.totalLogsAnalyzed += monitoringResults.logs.length;
    this.results.logAnalysisMetrics.alertsGenerated += monitoringResults.alerts.length;

    console.log(`    ✓ Monitored for ${monitoringResults.endTime - monitoringResults.startTime}ms`);
    console.log(`    ✓ Generated ${monitoringResults.logs.length} log entries`);
    console.log(`    ✓ Triggered ${monitoringResults.alerts.length} alerts`);
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport() {
    console.log('\n📊 Generating Log Analysis Summary Report...');

    const report = await this.logAnalyzer.generateReport();
    this.results.reports.push({
      type: 'log_analysis_summary',
      path: report.reportPath,
      timestamp: new Date().toISOString(),
      metrics: report.metrics
    });

    // Generate HTML report
    const htmlReport = await this.generateHTMLReport();
    this.results.reports.push({
      type: 'html_summary',
      path: htmlReport,
      timestamp: new Date().toISOString()
    });

    console.log(`  ✓ JSON report: ${report.reportPath}`);
    console.log(`  ✓ HTML report: ${htmlReport}`);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.options.reportsDir, `log-analysis-${timestamp}.html`);

    const successRate = this.results.tests.total > 0 
      ? (this.results.tests.passed / this.results.tests.total * 100).toFixed(1)
      : 0;

    const grade = successRate >= 95 ? 'A+' : successRate >= 90 ? 'A' : successRate >= 85 ? 'B' : successRate >= 80 ? 'C' : 'D';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log Analysis Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 50px; text-align: center; }
        .title { font-size: 36px; margin: 0; font-weight: 300; }
        .subtitle { opacity: 0.9; margin: 15px 0 0; font-size: 18px; }
        .content { padding: 50px; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; margin-bottom: 50px; }
        .metric-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .metric-value { font-size: 42px; font-weight: bold; color: #1e293b; margin-bottom: 12px; }
        .metric-label { color: #64748b; font-size: 16px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-description { color: #475569; font-size: 14px; margin-top: 8px; }
        
        .section-title { font-size: 28px; color: #1e293b; margin: 50px 0 25px; font-weight: 600; }
        .pattern-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .pattern-card { background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
        .pattern-name { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .pattern-score { font-size: 24px; font-weight: bold; margin-top: 10px; }
        .score-excellent { color: #10b981; }
        .score-good { color: #f59e0b; }
        .score-fair { color: #ef4444; }
        
        .performance-section { background: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; }
        .performance-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; }
        .performance-metric { text-align: center; }
        .performance-number { font-size: 28px; font-weight: bold; color: #4f46e5; }
        .performance-label { color: #64748b; font-size: 14px; margin-top: 5px; }
        
        .grade-badge { display: inline-block; padding: 12px 24px; border-radius: 30px; font-weight: bold; font-size: 18px; margin-left: 15px; }
        .grade-a { background: #dcfce7; color: #166534; }
        .grade-b { background: #fef3c7; color: #92400e; }
        .grade-c { background: #fed7aa; color: #9a3412; }
        .grade-d { background: #fecaca; color: #991b1b; }
        
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🔍 Log Analysis Test Report</h1>
            <p class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${this.results.tests.passed}</div>
                    <div class="metric-label">Tests Passed</div>
                    <div class="metric-description">Out of ${this.results.tests.total} total tests</div>
                    <span class="grade-badge grade-${grade.toLowerCase().replace('+', '')}">${grade} Grade</span>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${this.results.logAnalysisMetrics.totalLogsAnalyzed}</div>
                    <div class="metric-label">Logs Analyzed</div>
                    <div class="metric-description">Total log entries processed</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${this.results.logAnalysisMetrics.patternMatches}</div>
                    <div class="metric-label">Pattern Matches</div>
                    <div class="metric-description">Error and warning patterns detected</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${(this.results.duration / 1000).toFixed(1)}s</div>
                    <div class="metric-label">Test Duration</div>
                    <div class="metric-description">Total execution time</div>
                </div>
            </div>

            <h2 class="section-title">Pattern Detection Results</h2>
            <div class="pattern-grid">
                ${Object.entries(this.results.patterns).map(([key, pattern]) => {
                  const total = pattern.passed + pattern.failed;
                  const successRate = total > 0 ? (pattern.passed / total * 100) : 0;
                  const scoreClass = successRate >= 90 ? 'score-excellent' : successRate >= 70 ? 'score-good' : 'score-fair';
                  
                  return `
                    <div class="pattern-card">
                        <div class="pattern-name">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                        <div class="pattern-score ${scoreClass}">${successRate.toFixed(0)}%</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 5px;">${pattern.passed}/${total} tests</div>
                    </div>
                  `;
                }).join('')}
            </div>

            <h2 class="section-title">Performance Metrics</h2>
            <div class="performance-section">
                <div class="performance-metrics">
                    <div class="performance-metric">
                        <div class="performance-number">${this.results.performance.logsProcessedPerSecond}</div>
                        <div class="performance-label">Logs/Second</div>
                    </div>
                    <div class="performance-metric">
                        <div class="performance-number">${this.results.performance.avgTestDuration.toFixed(0)}ms</div>
                        <div class="performance-label">Avg Test Duration</div>
                    </div>
                    <div class="performance-metric">
                        <div class="performance-number">${this.results.performance.memoryUsage.peak.toFixed(1)}MB</div>
                        <div class="performance-label">Peak Memory</div>
                    </div>
                    <div class="performance-metric">
                        <div class="performance-number">${this.results.logAnalysisMetrics.alertsGenerated}</div>
                        <div class="performance-label">Alerts Generated</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 50px; padding: 30px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; margin-bottom: 20px;">Test Execution Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #059669;">${this.results.tests.passed}</div>
                        <div style="color: #64748b; font-size: 14px;">Passed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${this.results.tests.failed}</div>
                        <div style="color: #64748b; font-size: 14px;">Failed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${this.results.tests.total}</div>
                        <div style="color: #64748b; font-size: 14px;">Total</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #0891b2;">${successRate}%</div>
                        <div style="color: #64748b; font-size: 14px;">Success Rate</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Log Analysis Testing Framework • Axees Platform • Generated at ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    return reportPath;
  }

  /**
   * Get memory usage in MB
   */
  getMemoryUsage() {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    console.log('\n📊 Log Analysis Test Summary');
    console.log('============================');
    console.log(`Duration: ${(this.results.duration / 1000).toFixed(1)}s`);
    console.log(`Tests: ${this.results.tests.passed}/${this.results.tests.total} passed`);
    console.log(`Success Rate: ${this.results.tests.total > 0 ? (this.results.tests.passed / this.results.tests.total * 100).toFixed(1) : 0}%`);
    console.log(`Logs Analyzed: ${this.results.logAnalysisMetrics.totalLogsAnalyzed}`);
    console.log(`Pattern Matches: ${this.results.logAnalysisMetrics.patternMatches}`);
    console.log(`Security Events: ${this.results.logAnalysisMetrics.securityEventsDetected}`);
    console.log(`Alerts Generated: ${this.results.logAnalysisMetrics.alertsGenerated}`);
    console.log(`Performance: ${this.results.performance.logsProcessedPerSecond} logs/second`);
    console.log(`Memory Usage: ${this.results.performance.memoryUsage.initial.toFixed(1)}MB → ${this.results.performance.memoryUsage.peak.toFixed(1)}MB`);
    
    if (this.results.reports.length > 0) {
      console.log('\nGenerated Reports:');
      this.results.reports.forEach(report => {
        console.log(`  ${report.type}: ${report.path}`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log(`\n⚠️ Errors: ${this.results.errors.length}`);
      this.results.errors.forEach(error => {
        console.log(`  ${error.type}: ${error.message}`);
      });
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new LogAnalysisTestRunner({
    verbose: process.env.VERBOSE !== 'false'
  });

  runner.runTests()
    .then(() => {
      runner.printSummary();
      process.exit(runner.results.tests.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Log Analysis Test Runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = LogAnalysisTestRunner;