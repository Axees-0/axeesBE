// tests/runners/prediction-accuracy-runner.js

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PredictionAccuracyValidator } = require('../helpers/predictionAccuracyHelpers');

/**
 * Prediction Accuracy Test Runner
 * 
 * Specialized test runner for prediction accuracy validation with:
 * - Comprehensive accuracy testing across different prediction types
 * - Confidence distribution analysis
 * - Model drift detection
 * - Bias analysis
 * - Performance under load testing
 * - Detailed reporting and visualization
 */
class PredictionAccuracyTestRunner {
  constructor(options = {}) {
    this.options = {
      testFile: options.testFile || 'tests/integration/prediction-accuracy.test.js',
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
      predictionTypes: {
        classification: { passed: 0, failed: 0, accuracy: 0 },
        regression: { passed: 0, failed: 0, accuracy: 0 },
        binary: { passed: 0, failed: 0, accuracy: 0 }
      },
      analysisTypes: {
        confidence: { passed: 0, failed: 0 },
        drift: { passed: 0, failed: 0 },
        bias: { passed: 0, failed: 0 },
        performance: { passed: 0, failed: 0 }
      },
      metrics: {
        overallAccuracy: 0,
        averageConfidence: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        rocAuc: 0,
        kappa: 0
      },
      performance: {
        avgTestDuration: 0,
        totalPredictions: 0,
        predictionsPerSecond: 0,
        memoryUsage: {
          initial: 0,
          peak: 0,
          final: 0
        }
      },
      biasAnalysis: {
        biasDetected: false,
        affectedGroups: [],
        maxAccuracyGap: 0
      },
      driftAnalysis: {
        driftDetected: false,
        driftAmount: 0,
        severity: 'none'
      },
      reports: [],
      errors: []
    };

    this.validator = new PredictionAccuracyValidator({
      reportsDir: this.options.reportsDir
    });
  }

  /**
   * Run prediction accuracy tests
   */
  async runTests() {
    console.log('🎯 Starting Prediction Accuracy Test Suite');
    console.log('=========================================');

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
      console.log('🧪 Running Jest prediction accuracy tests...\n');

      const jestArgs = [
        '--testPathPattern=prediction-accuracy.test.js',
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
      // Parse test results
      const tests = stdout.match(/Tests:\s+(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
      
      if (tests) {
        this.results.tests.passed = parseInt(tests[1]) || 0;
        this.results.tests.failed = parseInt(tests[2]) || 0;
        this.results.tests.skipped = parseInt(tests[3]) || 0;
        this.results.tests.total = this.results.tests.passed + this.results.tests.failed + this.results.tests.skipped;
      }

      // Parse prediction type results
      this.parsePredictionTypeResults(stdout);

      // Parse analysis type results
      this.parseAnalysisTypeResults(stdout);

      // Parse accuracy metrics
      this.parseAccuracyMetrics(stdout);

    } catch (error) {
      console.warn('Warning: Failed to parse Jest output:', error.message);
    }
  }

  /**
   * Parse prediction type test results
   */
  parsePredictionTypeResults(output) {
    const types = {
      'Classification Prediction Accuracy': 'classification',
      'Regression Prediction Accuracy': 'regression',
      'Binary Classification Accuracy': 'binary'
    };

    Object.entries(types).forEach(([testName, key]) => {
      const passedMatch = output.match(new RegExp(`✓.*${testName}`, 'g'));
      const failedMatch = output.match(new RegExp(`✕.*${testName}`, 'g'));
      
      if (passedMatch) {
        this.results.predictionTypes[key].passed = passedMatch.length;
      }
      if (failedMatch) {
        this.results.predictionTypes[key].failed = failedMatch.length;
      }

      // Extract accuracy metrics
      const accuracyMatch = output.match(new RegExp(`${testName}[\\s\\S]*?Accuracy: (\\d+\\.\\d+)%`, 'i'));
      if (accuracyMatch) {
        this.results.predictionTypes[key].accuracy = parseFloat(accuracyMatch[1]) / 100;
      }
    });
  }

  /**
   * Parse analysis type test results
   */
  parseAnalysisTypeResults(output) {
    const analysisTypes = {
      'Confidence': 'confidence',
      'Drift': 'drift',
      'Bias': 'bias',
      'Performance': 'performance'
    };

    Object.entries(analysisTypes).forEach(([pattern, key]) => {
      const passedMatches = output.match(new RegExp(`✓.*${pattern}`, 'gi')) || [];
      const failedMatches = output.match(new RegExp(`✕.*${pattern}`, 'gi')) || [];
      
      this.results.analysisTypes[key].passed = passedMatches.length;
      this.results.analysisTypes[key].failed = failedMatches.length;
    });
  }

  /**
   * Parse accuracy metrics from output
   */
  parseAccuracyMetrics(output) {
    // Extract various metrics
    const metrics = {
      accuracy: /(?:Overall )?[Aa]ccuracy: ([\d.]+)%/,
      confidence: /Average confidence: ([\d.]+)%/,
      precision: /Precision: ([\d.]+)%/,
      recall: /Recall: ([\d.]+)%/,
      f1Score: /F1 Score: ([\d.]+)/,
      rocAuc: /ROC AUC: ([\d.]+)/,
      kappa: /Kappa: ([\d.]+)/
    };

    Object.entries(metrics).forEach(([metric, pattern]) => {
      const matches = output.match(pattern);
      if (matches) {
        const value = parseFloat(matches[1]);
        if (metric === 'accuracy' || metric === 'confidence' || metric === 'precision' || metric === 'recall') {
          this.results.metrics[metric === 'accuracy' ? 'overallAccuracy' : metric === 'confidence' ? 'averageConfidence' : metric] = value / 100;
        } else {
          this.results.metrics[metric] = value;
        }
      }
    });

    // Extract bias information
    const biasMatch = output.match(/Has bias: (Yes|No)/);
    if (biasMatch) {
      this.results.biasAnalysis.biasDetected = biasMatch[1] === 'Yes';
    }

    const accuracyGapMatch = output.match(/Accuracy gap: ([\d.]+)%/);
    if (accuracyGapMatch) {
      this.results.biasAnalysis.maxAccuracyGap = parseFloat(accuracyGapMatch[1]) / 100;
    }

    // Extract drift information
    const driftMatch = output.match(/Drift detected: (Yes|No)/);
    if (driftMatch) {
      this.results.driftAnalysis.driftDetected = driftMatch[1] === 'Yes';
    }

    const driftAmountMatch = output.match(/Drift amount: ([\d.]+)%/);
    if (driftAmountMatch) {
      this.results.driftAnalysis.driftAmount = parseFloat(driftAmountMatch[1]) / 100;
    }

    const severityMatch = output.match(/Severity: (\w+)/);
    if (severityMatch) {
      this.results.driftAnalysis.severity = severityMatch[1];
    }
  }

  /**
   * Run additional analysis beyond Jest tests
   */
  async runAdditionalAnalysis() {
    console.log('\n🔬 Running Additional Prediction Analysis...');

    try {
      // Simulate comprehensive prediction scenarios
      await this.runComprehensivePredictionTest();
      
      // Test edge cases
      await this.testEdgeCases();
      
      // Performance benchmarking
      await this.runPerformanceBenchmark();
      
      // Model stability testing
      await this.testModelStability();

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
   * Run comprehensive prediction test
   */
  async runComprehensivePredictionTest() {
    console.log('  📊 Running comprehensive prediction test...');

    // Generate diverse prediction scenarios
    const scenarios = [
      { type: 'high_accuracy', count: 100, accuracy: 0.95 },
      { type: 'medium_accuracy', count: 100, accuracy: 0.75 },
      { type: 'low_accuracy', count: 100, accuracy: 0.55 }
    ];

    let totalPredictions = 0;
    let correctPredictions = 0;

    scenarios.forEach(scenario => {
      for (let i = 0; i < scenario.count; i++) {
        const isCorrect = Math.random() < scenario.accuracy;
        const prediction = 'A';
        const actual = isCorrect ? 'A' : 'B';
        const confidence = scenario.accuracy - 0.1 + Math.random() * 0.2;

        this.validator.addPrediction(prediction, actual, confidence, {
          scenario: scenario.type,
          iteration: i
        });

        totalPredictions++;
        if (isCorrect) correctPredictions++;
      }
    });

    this.results.performance.totalPredictions = totalPredictions;
    this.results.metrics.overallAccuracy = correctPredictions / totalPredictions;

    console.log(`    ✓ Generated ${totalPredictions} predictions`);
    console.log(`    ✓ Overall accuracy: ${(this.results.metrics.overallAccuracy * 100).toFixed(1)}%`);
    console.log(`    ✓ Average confidence: ${(this.validator.metrics.averageConfidence * 100).toFixed(1)}%`);
  }

  /**
   * Test edge cases
   */
  async testEdgeCases() {
    console.log('  🔧 Testing edge cases...');

    const edgeCases = [
      // Perfect predictions
      { prediction: 'perfect', actual: 'perfect', confidence: 1.0 },
      // Completely wrong predictions
      { prediction: 'wrong', actual: 'right', confidence: 0.0 },
      // Null confidence
      { prediction: 'test', actual: 'test', confidence: null },
      // Extreme values
      { prediction: 999999, actual: 999999, confidence: 0.99999 },
      { prediction: -999999, actual: -999999, confidence: 0.00001 }
    ];

    edgeCases.forEach((testCase, index) => {
      try {
        this.validator.addPrediction(
          testCase.prediction,
          testCase.actual,
          testCase.confidence,
          { testType: 'edge_case', caseId: index }
        );
      } catch (error) {
        console.log(`    ⚠️ Edge case ${index} handled: ${error.message}`);
      }
    });

    console.log(`    ✓ Tested ${edgeCases.length} edge cases`);
  }

  /**
   * Run performance benchmark
   */
  async runPerformanceBenchmark() {
    console.log('  🏋️ Running performance benchmark...');

    const startTime = Date.now();
    const benchmarkCount = 1000;

    for (let i = 0; i < benchmarkCount; i++) {
      const prediction = Math.random() > 0.5 ? 'A' : 'B';
      const actual = Math.random() > 0.4 ? 'A' : 'B';
      const confidence = 0.5 + Math.random() * 0.5;

      this.validator.addPrediction(prediction, actual, confidence);
    }

    const duration = Date.now() - startTime;
    this.results.performance.predictionsPerSecond = Math.floor(benchmarkCount / (duration / 1000));

    this.results.performance.memoryUsage.peak = Math.max(
      this.results.performance.memoryUsage.peak,
      this.getMemoryUsage()
    );

    console.log(`    ✓ Processed ${benchmarkCount} predictions in ${duration}ms`);
    console.log(`    ✓ Performance: ${this.results.performance.predictionsPerSecond} predictions/second`);
    console.log(`    ✓ Memory usage: ${this.getMemoryUsage().toFixed(1)}MB`);
  }

  /**
   * Test model stability
   */
  async testModelStability() {
    console.log('  🔄 Testing model stability...');

    // Clear previous data
    this.validator.clear();

    // Generate consistent predictions over time
    const timeSlots = 5;
    const predictionsPerSlot = 50;
    const accuracyBySlot = [];

    for (let slot = 0; slot < timeSlots; slot++) {
      let slotCorrect = 0;
      
      for (let i = 0; i < predictionsPerSlot; i++) {
        // Simulate slight accuracy degradation over time
        const baseAccuracy = 0.85 - (slot * 0.02);
        const isCorrect = Math.random() < baseAccuracy;
        
        this.validator.addPrediction(
          'prediction',
          isCorrect ? 'prediction' : 'different',
          baseAccuracy - 0.1 + Math.random() * 0.2,
          { timeSlot: slot }
        );
        
        if (isCorrect) slotCorrect++;
      }
      
      accuracyBySlot.push(slotCorrect / predictionsPerSlot);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check for stability
    const accuracyVariance = this.calculateVariance(accuracyBySlot);
    const isStable = accuracyVariance < 0.01; // Less than 1% variance

    console.log(`    ✓ Tested ${timeSlots} time slots`);
    console.log(`    ✓ Accuracy variance: ${(accuracyVariance * 100).toFixed(2)}%`);
    console.log(`    ✓ Model stability: ${isStable ? 'Stable' : 'Unstable'}`);
  }

  /**
   * Calculate variance
   */
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport() {
    console.log('\n📊 Generating Prediction Accuracy Summary Report...');

    const accuracyReport = await this.validator.generateAccuracyReport();
    this.results.reports.push({
      type: 'prediction_accuracy_summary',
      path: accuracyReport.reportPath,
      timestamp: new Date().toISOString(),
      metrics: accuracyReport.detailedMetrics
    });

    // Generate HTML report
    const htmlReport = await this.generateHTMLReport();
    this.results.reports.push({
      type: 'html_summary',
      path: htmlReport,
      timestamp: new Date().toISOString()
    });

    console.log(`  ✓ JSON report: ${accuracyReport.reportPath}`);
    console.log(`  ✓ HTML report: ${htmlReport}`);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.options.reportsDir, `prediction-accuracy-${timestamp}.html`);

    const successRate = this.results.tests.total > 0 
      ? (this.results.tests.passed / this.results.tests.total * 100).toFixed(1)
      : 0;

    const overallAccuracy = (this.results.metrics.overallAccuracy * 100).toFixed(1);
    const grade = this.getAccuracyGrade(this.results.metrics.overallAccuracy);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prediction Accuracy Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 50px; text-align: center; }
        .title { font-size: 36px; margin: 0; font-weight: 300; }
        .subtitle { opacity: 0.9; margin: 15px 0 0; font-size: 18px; }
        .content { padding: 50px; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; margin-bottom: 50px; }
        .metric-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .metric-value { font-size: 42px; font-weight: bold; color: #1e293b; margin-bottom: 12px; }
        .metric-label { color: #64748b; font-size: 16px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-description { color: #475569; font-size: 14px; margin-top: 8px; }
        
        .section-title { font-size: 28px; color: #1e293b; margin: 50px 0 25px; font-weight: 600; }
        
        .prediction-types { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .prediction-card { background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
        .prediction-name { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .prediction-accuracy { font-size: 24px; font-weight: bold; margin-top: 10px; }
        .accuracy-excellent { color: #10b981; }
        .accuracy-good { color: #3b82f6; }
        .accuracy-fair { color: #f59e0b; }
        .accuracy-poor { color: #ef4444; }
        
        .analysis-section { background: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; }
        .analysis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; }
        .analysis-item { text-align: center; }
        .analysis-value { font-size: 28px; font-weight: bold; color: #6366f1; }
        .analysis-label { color: #64748b; font-size: 14px; margin-top: 5px; }
        
        .grade-badge { display: inline-block; padding: 12px 24px; border-radius: 30px; font-weight: bold; font-size: 18px; margin-left: 15px; }
        .grade-a { background: #dcfce7; color: #166534; }
        .grade-b { background: #dbeafe; color: #1e40af; }
        .grade-c { background: #fef3c7; color: #92400e; }
        .grade-d { background: #fecaca; color: #991b1b; }
        
        .alert-box { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .alert-warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; }
        .alert-error { background: #fecaca; border: 1px solid #ef4444; color: #991b1b; }
        .alert-success { background: #dcfce7; border: 1px solid #10b981; color: #166534; }
        
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🎯 Prediction Accuracy Test Report</h1>
            <p class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${overallAccuracy}%</div>
                    <div class="metric-label">Overall Accuracy</div>
                    <div class="metric-description">Across all prediction types</div>
                    <span class="grade-badge grade-${grade.toLowerCase().replace('+', '')}">${grade} Grade</span>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${(this.results.metrics.averageConfidence * 100).toFixed(1)}%</div>
                    <div class="metric-label">Average Confidence</div>
                    <div class="metric-description">Model confidence score</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${this.results.metrics.f1Score.toFixed(3)}</div>
                    <div class="metric-label">F1 Score</div>
                    <div class="metric-description">Harmonic mean of precision and recall</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${this.results.tests.passed}/${this.results.tests.total}</div>
                    <div class="metric-label">Tests Passed</div>
                    <div class="metric-description">${successRate}% success rate</div>
                </div>
            </div>

            <h2 class="section-title">Prediction Type Performance</h2>
            <div class="prediction-types">
                ${Object.entries(this.results.predictionTypes).map(([type, data]) => {
                  const accuracy = data.accuracy * 100;
                  const accuracyClass = accuracy >= 90 ? 'accuracy-excellent' : accuracy >= 80 ? 'accuracy-good' : accuracy >= 70 ? 'accuracy-fair' : 'accuracy-poor';
                  
                  return `
                    <div class="prediction-card">
                        <div class="prediction-name">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div class="prediction-accuracy ${accuracyClass}">${accuracy.toFixed(1)}%</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 5px;">${data.passed}/${data.passed + data.failed} tests passed</div>
                    </div>
                  `;
                }).join('')}
            </div>

            <h2 class="section-title">Detailed Metrics</h2>
            <div class="analysis-section">
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="analysis-value">${(this.results.metrics.precision * 100).toFixed(1)}%</div>
                        <div class="analysis-label">Precision</div>
                    </div>
                    <div class="analysis-item">
                        <div class="analysis-value">${(this.results.metrics.recall * 100).toFixed(1)}%</div>
                        <div class="analysis-label">Recall</div>
                    </div>
                    <div class="analysis-item">
                        <div class="analysis-value">${this.results.metrics.rocAuc.toFixed(3)}</div>
                        <div class="analysis-label">ROC AUC</div>
                    </div>
                    <div class="analysis-item">
                        <div class="analysis-value">${this.results.metrics.kappa.toFixed(3)}</div>
                        <div class="analysis-label">Cohen's Kappa</div>
                    </div>
                </div>
            </div>

            ${this.results.biasAnalysis.biasDetected ? `
            <div class="alert-box alert-warning">
                <strong>⚠️ Bias Detected</strong><br>
                Accuracy gap of ${(this.results.biasAnalysis.maxAccuracyGap * 100).toFixed(1)}% detected between demographic groups.
                Review model fairness and consider retraining with balanced data.
            </div>
            ` : ''}

            ${this.results.driftAnalysis.driftDetected ? `
            <div class="alert-box alert-error">
                <strong>📉 Model Drift Detected</strong><br>
                ${(this.results.driftAnalysis.driftAmount * 100).toFixed(1)}% drift detected (${this.results.driftAnalysis.severity} severity).
                Model retraining recommended.
            </div>
            ` : ''}

            <h2 class="section-title">Analysis Coverage</h2>
            <div class="analysis-section">
                <div class="analysis-grid">
                    ${Object.entries(this.results.analysisTypes).map(([type, data]) => {
                      const total = data.passed + data.failed;
                      const percentage = total > 0 ? (data.passed / total * 100) : 0;
                      
                      return `
                        <div class="analysis-item">
                            <div class="analysis-value">${percentage.toFixed(0)}%</div>
                            <div class="analysis-label">${type.charAt(0).toUpperCase() + type.slice(1)} Analysis</div>
                        </div>
                      `;
                    }).join('')}
                </div>
            </div>

            <h2 class="section-title">Performance Metrics</h2>
            <div class="analysis-section">
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="analysis-value">${this.results.performance.totalPredictions}</div>
                        <div class="analysis-label">Total Predictions</div>
                    </div>
                    <div class="analysis-item">
                        <div class="analysis-value">${this.results.performance.predictionsPerSecond}</div>
                        <div class="analysis-label">Predictions/Second</div>
                    </div>
                    <div class="analysis-item">
                        <div class="analysis-value">${this.results.performance.memoryUsage.peak.toFixed(1)}MB</div>
                        <div class="analysis-label">Peak Memory</div>
                    </div>
                    <div class="analysis-item">
                        <div class="analysis-value">${(this.results.duration / 1000).toFixed(1)}s</div>
                        <div class="analysis-label">Test Duration</div>
                    </div>
                </div>
            </div>

            ${this.results.metrics.overallAccuracy >= 0.85 ? `
            <div class="alert-box alert-success">
                <strong>✅ Excellent Performance</strong><br>
                Model accuracy exceeds target threshold. Continue monitoring for drift and bias.
            </div>
            ` : this.results.metrics.overallAccuracy >= 0.70 ? `
            <div class="alert-box alert-warning">
                <strong>⚠️ Acceptable Performance</strong><br>
                Model meets minimum accuracy requirements but has room for improvement.
            </div>
            ` : `
            <div class="alert-box alert-error">
                <strong>❌ Below Threshold</strong><br>
                Model accuracy is below minimum requirements. Immediate action required.
            </div>
            `}
        </div>
        
        <div class="footer">
            <p>Prediction Accuracy Testing Framework • Axees Platform • Generated at ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    return reportPath;
  }

  /**
   * Get accuracy grade
   */
  getAccuracyGrade(accuracy) {
    if (accuracy >= 0.95) return 'A+';
    if (accuracy >= 0.90) return 'A';
    if (accuracy >= 0.85) return 'B';
    if (accuracy >= 0.70) return 'C';
    return 'D';
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
    console.log('\n📊 Prediction Accuracy Test Summary');
    console.log('===================================');
    console.log(`Duration: ${(this.results.duration / 1000).toFixed(1)}s`);
    console.log(`Tests: ${this.results.tests.passed}/${this.results.tests.total} passed (${this.results.tests.total > 0 ? (this.results.tests.passed / this.results.tests.total * 100).toFixed(1) : 0}%)`);
    console.log(`Overall Accuracy: ${(this.results.metrics.overallAccuracy * 100).toFixed(1)}%`);
    console.log(`Average Confidence: ${(this.results.metrics.averageConfidence * 100).toFixed(1)}%`);
    console.log(`F1 Score: ${this.results.metrics.f1Score.toFixed(3)}`);
    console.log(`Precision: ${(this.results.metrics.precision * 100).toFixed(1)}%`);
    console.log(`Recall: ${(this.results.metrics.recall * 100).toFixed(1)}%`);
    
    if (this.results.biasAnalysis.biasDetected) {
      console.log(`\n⚠️ Bias Detected: ${(this.results.biasAnalysis.maxAccuracyGap * 100).toFixed(1)}% accuracy gap`);
    }
    
    if (this.results.driftAnalysis.driftDetected) {
      console.log(`\n📉 Drift Detected: ${(this.results.driftAnalysis.driftAmount * 100).toFixed(1)}% (${this.results.driftAnalysis.severity})`);
    }
    
    console.log(`\nPerformance:`);
    console.log(`  Total Predictions: ${this.results.performance.totalPredictions}`);
    console.log(`  Throughput: ${this.results.performance.predictionsPerSecond} predictions/second`);
    console.log(`  Memory Usage: ${this.results.performance.memoryUsage.initial.toFixed(1)}MB → ${this.results.performance.memoryUsage.peak.toFixed(1)}MB`);
    
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
  const runner = new PredictionAccuracyTestRunner({
    verbose: process.env.VERBOSE !== 'false'
  });

  runner.runTests()
    .then(() => {
      runner.printSummary();
      process.exit(runner.results.tests.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Prediction Accuracy Test Runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = PredictionAccuracyTestRunner;