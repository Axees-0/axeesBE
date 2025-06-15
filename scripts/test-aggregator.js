#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TestResultAggregator {
  constructor(options = {}) {
    this.config = {
      reportsDir: options.reportsDir || './test-reports',
      outputFile: options.outputFile || 'aggregated-results.json',
      includeHistory: options.includeHistory !== false,
      maxHistoryDays: options.maxHistoryDays || 30,
      ...options
    };
    
    this.aggregatedData = {
      summary: {},
      trends: {},
      categoryAnalysis: {},
      recommendations: [],
      history: []
    };
  }

  async aggregateResults() {
    console.log('📊 Starting Test Result Aggregation');
    console.log('===================================');
    
    // Load current test results
    const currentResults = await this.loadCurrentResults();
    if (!currentResults) {
      console.error('❌ No test results found to aggregate');
      return null;
    }

    // Load historical data if available
    const historicalData = await this.loadHistoricalData();
    
    // Perform aggregation
    this.aggregatedData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        testRunTime: currentResults.runInfo?.endTime || new Date().toISOString(),
        version: this.getVersionInfo()
      },
      summary: this.generateSummary(currentResults),
      trends: this.analyzeTrends(currentResults, historicalData),
      categoryAnalysis: this.analyzeCategoriesInDepth(currentResults),
      performanceMetrics: this.extractPerformanceMetrics(currentResults),
      recommendations: this.generateRecommendations(currentResults),
      history: this.updateHistory(currentResults, historicalData)
    };

    // Save aggregated results
    await this.saveAggregatedResults();
    
    // Generate insights report
    await this.generateInsightsReport();
    
    console.log('✅ Test result aggregation completed');
    return this.aggregatedData;
  }

  async loadCurrentResults() {
    const resultsPath = path.join(this.config.reportsDir, 'test-results.json');
    
    if (!fs.existsSync(resultsPath)) {
      console.warn('⚠️  No current test results found');
      return null;
    }

    try {
      const data = fs.readFileSync(resultsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load current test results:', error.message);
      return null;
    }
  }

  async loadHistoricalData() {
    const historyPath = path.join(this.config.reportsDir, 'test-history.json');
    
    if (!fs.existsSync(historyPath)) {
      return [];
    }

    try {
      const data = fs.readFileSync(historyPath, 'utf8');
      const history = JSON.parse(data);
      
      // Filter out old entries
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxHistoryDays);
      
      return history.filter(entry => new Date(entry.timestamp) > cutoffDate);
    } catch (error) {
      console.warn('⚠️  Failed to load historical data:', error.message);
      return [];
    }
  }

  generateSummary(results) {
    const { summary } = results;
    const passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    const failRate = summary.total > 0 ? Math.round((summary.failed / summary.total) * 100) : 0;
    
    return {
      overview: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        skippedTests: summary.skipped,
        passRate,
        failRate,
        duration: summary.duration,
        status: passRate >= 95 ? 'excellent' : passRate >= 85 ? 'good' : passRate >= 70 ? 'acceptable' : 'poor'
      },
      categories: results.categories.map(category => ({
        name: category.category,
        tests: category.summary.total,
        passed: category.summary.passed,
        failed: category.summary.failed,
        passRate: category.summary.total > 0 ? 
          Math.round((category.summary.passed / category.summary.total) * 100) : 0,
        duration: category.summary.duration,
        status: this.getCategoryStatus(category.summary)
      })),
      testFiles: this.summarizeTestFiles(results.categories)
    };
  }

  analyzeTrends(currentResults, historicalData) {
    if (!historicalData || historicalData.length === 0) {
      return {
        available: false,
        message: 'Insufficient historical data for trend analysis'
      };
    }

    const trends = {
      available: true,
      passRateTrend: this.calculateTrend(historicalData, 'passRate'),
      durationTrend: this.calculateTrend(historicalData, 'duration'),
      categoryTrends: this.calculateCategoryTrends(historicalData),
      insights: []
    };

    // Generate trend insights
    if (trends.passRateTrend.direction === 'improving') {
      trends.insights.push('📈 Test pass rate is improving over time');
    } else if (trends.passRateTrend.direction === 'declining') {
      trends.insights.push('📉 Test pass rate is declining - needs attention');
    }

    if (trends.durationTrend.direction === 'increasing') {
      trends.insights.push('⏱️  Test execution time is increasing - consider optimization');
    } else if (trends.durationTrend.direction === 'decreasing') {
      trends.insights.push('🚀 Test execution time is improving');
    }

    return trends;
  }

  analyzeCategoriesInDepth(results) {
    const analysis = {};
    
    results.categories.forEach(category => {
      const files = category.files || [];
      const slowestFiles = files
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3);
      
      const flakyTests = files.filter(file => 
        file.tests.total > 0 && 
        file.tests.failed > 0 && 
        file.tests.passed > 0
      );

      analysis[category.category] = {
        performance: {
          averageDuration: files.length > 0 ? 
            Math.round(files.reduce((sum, f) => sum + f.duration, 0) / files.length) : 0,
          slowestFiles: slowestFiles.map(f => ({
            file: f.file,
            duration: f.duration,
            status: f.status
          }))
        },
        reliability: {
          flakyTests: flakyTests.length,
          flakyFiles: flakyTests.map(f => f.file),
          consistencyScore: this.calculateConsistencyScore(files)
        },
        coverage: {
          totalFiles: files.length,
          passingFiles: files.filter(f => f.status === 'passed').length,
          failingFiles: files.filter(f => f.status === 'failed').length
        }
      };
    });

    return analysis;
  }

  extractPerformanceMetrics(results) {
    const metrics = {
      executionTime: {
        total: results.summary.duration,
        average: results.categories.length > 0 ?
          Math.round(results.summary.duration / results.categories.length) : 0,
        slowestCategory: null,
        fastestCategory: null
      },
      throughput: {
        testsPerSecond: results.summary.duration > 0 ?
          Math.round((results.summary.total * 1000) / results.summary.duration) : 0,
        testsPerMinute: results.summary.duration > 0 ?
          Math.round((results.summary.total * 60000) / results.summary.duration) : 0
      },
      resourceUsage: this.estimateResourceUsage(results)
    };

    // Find slowest and fastest categories
    if (results.categories.length > 0) {
      const sortedByDuration = results.categories.sort((a, b) => b.summary.duration - a.summary.duration);
      metrics.executionTime.slowestCategory = {
        name: sortedByDuration[0].category,
        duration: sortedByDuration[0].summary.duration
      };
      metrics.executionTime.fastestCategory = {
        name: sortedByDuration[sortedByDuration.length - 1].category,
        duration: sortedByDuration[sortedByDuration.length - 1].summary.duration
      };
    }

    return metrics;
  }

  generateRecommendations(results) {
    const recommendations = [];
    const summary = results.summary;
    const passRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;

    // Pass rate recommendations
    if (passRate < 70) {
      recommendations.push({
        type: 'critical',
        category: 'quality',
        title: 'Critical: Low test pass rate',
        description: `Only ${Math.round(passRate)}% of tests are passing. Immediate action required.`,
        action: 'Review and fix failing tests immediately',
        priority: 1
      });
    } else if (passRate < 85) {
      recommendations.push({
        type: 'warning',
        category: 'quality',
        title: 'Warning: Below target pass rate',
        description: `Pass rate is ${Math.round(passRate)}%. Target is 85%+.`,
        action: 'Investigate and fix failing tests',
        priority: 2
      });
    }

    // Performance recommendations
    if (summary.duration > 600000) { // 10 minutes
      recommendations.push({
        type: 'warning',
        category: 'performance',
        title: 'Long test execution time',
        description: `Tests take ${Math.round(summary.duration / 60000)} minutes to complete.`,
        action: 'Consider parallel execution or test optimization',
        priority: 3
      });
    }

    // Category-specific recommendations
    results.categories.forEach(category => {
      const categoryPassRate = category.summary.total > 0 ?
        (category.summary.passed / category.summary.total) * 100 : 0;

      if (categoryPassRate < 80) {
        recommendations.push({
          type: 'warning',
          category: 'category-specific',
          title: `${category.category} category needs attention`,
          description: `${category.category} tests have ${Math.round(categoryPassRate)}% pass rate.`,
          action: `Review ${category.category} test implementations`,
          priority: category.category === 'core' ? 1 : 2
        });
      }
    });

    // Flaky test recommendations
    const flakyFiles = [];
    results.categories.forEach(category => {
      if (category.files) {
        category.files.forEach(file => {
          if (file.tests.total > 0 && file.tests.failed > 0 && file.tests.passed > 0) {
            flakyFiles.push(`${category.category}/${file.file}`);
          }
        });
      }
    });

    if (flakyFiles.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'reliability',
        title: 'Flaky tests detected',
        description: `${flakyFiles.length} test files show inconsistent results.`,
        action: 'Investigate and stabilize flaky tests',
        priority: 2,
        details: flakyFiles
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  updateHistory(currentResults, historicalData) {
    const newEntry = {
      timestamp: new Date().toISOString(),
      passRate: currentResults.summary.total > 0 ?
        Math.round((currentResults.summary.passed / currentResults.summary.total) * 100) : 0,
      duration: currentResults.summary.duration,
      totalTests: currentResults.summary.total,
      passedTests: currentResults.summary.passed,
      failedTests: currentResults.summary.failed,
      categories: currentResults.categories.map(cat => ({
        name: cat.category,
        passRate: cat.summary.total > 0 ?
          Math.round((cat.summary.passed / cat.summary.total) * 100) : 0,
        duration: cat.summary.duration
      }))
    };

    const updatedHistory = [...(historicalData || []), newEntry];
    
    // Keep only recent entries
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.maxHistoryDays);
    
    return updatedHistory.filter(entry => new Date(entry.timestamp) > cutoffDate);
  }

  calculateTrend(data, metric) {
    if (data.length < 2) {
      return { direction: 'stable', change: 0, confidence: 'low' };
    }

    const values = data.map(entry => entry[metric]);
    const recent = values.slice(-5); // Last 5 data points
    const older = values.slice(0, Math.max(1, values.length - 5));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    const direction = Math.abs(change) < 2 ? 'stable' :
                     change > 0 ? 'improving' : 'declining';

    return {
      direction,
      change: Math.round(change * 100) / 100,
      confidence: data.length > 10 ? 'high' : data.length > 5 ? 'medium' : 'low'
    };
  }

  calculateCategoryTrends(historicalData) {
    const categoryTrends = {};
    
    if (historicalData.length === 0) return categoryTrends;

    // Get all unique categories
    const categories = new Set();
    historicalData.forEach(entry => {
      if (entry.categories) {
        entry.categories.forEach(cat => categories.add(cat.name));
      }
    });

    categories.forEach(categoryName => {
      const categoryData = historicalData
        .map(entry => {
          const cat = entry.categories?.find(c => c.name === categoryName);
          return cat ? { passRate: cat.passRate, duration: cat.duration } : null;
        })
        .filter(Boolean);

      if (categoryData.length > 1) {
        categoryTrends[categoryName] = {
          passRate: this.calculateTrend(categoryData, 'passRate'),
          duration: this.calculateTrend(categoryData, 'duration')
        };
      }
    });

    return categoryTrends;
  }

  calculateConsistencyScore(files) {
    if (files.length === 0) return 100;
    
    const passingFiles = files.filter(f => f.status === 'passed').length;
    return Math.round((passingFiles / files.length) * 100);
  }

  estimateResourceUsage(results) {
    // Rough estimation based on test execution patterns
    const totalDuration = results.summary.duration;
    const totalTests = results.summary.total;
    
    return {
      estimatedCpuTime: Math.round(totalDuration * 0.7), // 70% CPU utilization estimate
      estimatedMemoryPeak: Math.round(totalTests * 2), // 2MB per test estimate
      estimatedIOOperations: totalTests * 10, // 10 IO ops per test estimate
      efficiency: totalTests > 0 ? Math.round((totalTests / totalDuration) * 1000) : 0 // tests per second
    };
  }

  getCategoryStatus(summary) {
    const passRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
    return passRate >= 95 ? 'excellent' : 
           passRate >= 85 ? 'good' : 
           passRate >= 70 ? 'acceptable' : 'poor';
  }

  summarizeTestFiles(categories) {
    const allFiles = [];
    
    categories.forEach(category => {
      if (category.files) {
        category.files.forEach(file => {
          allFiles.push({
            file: file.file,
            category: category.category,
            status: file.status,
            duration: file.duration,
            tests: file.tests
          });
        });
      }
    });

    return {
      total: allFiles.length,
      passed: allFiles.filter(f => f.status === 'passed').length,
      failed: allFiles.filter(f => f.status === 'failed').length,
      slowest: allFiles.sort((a, b) => b.duration - a.duration).slice(0, 5),
      fastest: allFiles.sort((a, b) => a.duration - b.duration).slice(0, 5)
    };
  }

  async saveAggregatedResults() {
    const outputPath = path.join(this.config.reportsDir, this.config.outputFile);
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.aggregatedData, null, 2));
      console.log(`📄 Aggregated results saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to save aggregated results:', error.message);
    }

    // Save history separately
    const historyPath = path.join(this.config.reportsDir, 'test-history.json');
    try {
      fs.writeFileSync(historyPath, JSON.stringify(this.aggregatedData.history, null, 2));
      console.log(`📈 Test history saved to: ${historyPath}`);
    } catch (error) {
      console.error('❌ Failed to save test history:', error.message);
    }
  }

  async generateInsightsReport() {
    const insights = {
      summary: this.aggregatedData.summary.overview,
      keyFindings: this.generateKeyFindings(),
      actionItems: this.aggregatedData.recommendations.filter(r => r.priority <= 2),
      trends: this.aggregatedData.trends.insights || [],
      nextSteps: this.generateNextSteps()
    };

    const insightsPath = path.join(this.config.reportsDir, 'insights-report.json');
    
    try {
      fs.writeFileSync(insightsPath, JSON.stringify(insights, null, 2));
      console.log(`🔍 Insights report saved to: ${insightsPath}`);
    } catch (error) {
      console.error('❌ Failed to save insights report:', error.message);
    }

    // Generate text summary for quick reading
    this.generateTextSummary(insights);
  }

  generateKeyFindings() {
    const findings = [];
    const { summary, trends, performanceMetrics } = this.aggregatedData;

    // Overall status finding
    findings.push({
      type: 'overall',
      title: `Test Suite Status: ${summary.overview.status.toUpperCase()}`,
      description: `${summary.overview.passRate}% of tests passing (${summary.overview.passedTests}/${summary.overview.totalTests})`
    });

    // Performance finding
    if (performanceMetrics.executionTime.total > 300000) { // 5 minutes
      findings.push({
        type: 'performance',
        title: 'Long execution time detected',
        description: `Test suite takes ${Math.round(performanceMetrics.executionTime.total / 60000)} minutes to complete`
      });
    }

    // Category analysis
    const poorCategories = summary.categories.filter(cat => cat.status === 'poor');
    if (poorCategories.length > 0) {
      findings.push({
        type: 'quality',
        title: 'Categories needing attention',
        description: `${poorCategories.map(cat => cat.name).join(', ')} have low pass rates`
      });
    }

    return findings;
  }

  generateNextSteps() {
    const steps = [];
    const { summary, recommendations } = this.aggregatedData;

    if (summary.overview.status === 'poor') {
      steps.push('Immediate: Fix critical failing tests');
      steps.push('Short-term: Analyze and resolve test instability');
    }

    if (recommendations.length > 0) {
      steps.push('Review and address high-priority recommendations');
    }

    steps.push('Monitor test trends and performance over time');
    steps.push('Consider test optimization for improved execution time');

    return steps;
  }

  generateTextSummary(insights) {
    const summaryText = `
AXEES TEST SUITE INSIGHTS SUMMARY
=================================

📊 OVERALL STATUS: ${insights.summary.status.toUpperCase()}
   Tests: ${insights.summary.passedTests}/${insights.summary.totalTests} passed (${insights.summary.passRate}%)
   Duration: ${Math.round(insights.summary.duration / 60000)} minutes

🔍 KEY FINDINGS:
${insights.keyFindings.map(f => `   • ${f.title}: ${f.description}`).join('\n')}

⚠️  ACTION ITEMS (${insights.actionItems.length}):
${insights.actionItems.map(a => `   ${a.priority}. ${a.title} - ${a.action}`).join('\n')}

📈 TRENDS:
${insights.trends.map(t => `   • ${t}`).join('\n')}

🎯 NEXT STEPS:
${insights.nextSteps.map((step, i) => `   ${i + 1}. ${step}`).join('\n')}

Generated: ${new Date().toLocaleString()}
`;

    const summaryPath = path.join(this.config.reportsDir, 'summary.txt');
    try {
      fs.writeFileSync(summaryPath, summaryText);
      console.log(`📝 Text summary saved to: ${summaryPath}`);
    } catch (error) {
      console.error('❌ Failed to save text summary:', error.message);
    }
  }

  getVersionInfo() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return {
          name: packageJson.name || 'unknown',
          version: packageJson.version || '0.0.0'
        };
      }
    } catch (error) {
      console.warn('Could not determine version info:', error.message);
    }
    
    return { name: 'axees-backend', version: '1.0.0' };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--reports-dir':
      case '-r':
        options.reportsDir = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputFile = args[++i];
        break;
      case '--max-history':
      case '-h':
        options.maxHistoryDays = parseInt(args[++i]);
        break;
      case '--no-history':
        options.includeHistory = false;
        break;
      case '--help':
        console.log(`
Test Result Aggregator for Axees

Usage: node test-aggregator.js [options]

Options:
  -r, --reports-dir <dir>    Reports directory (default: ./test-reports)
  -o, --output <file>        Output file name (default: aggregated-results.json)
  -h, --max-history <days>   Max history days to keep (default: 30)
  --no-history              Don't include historical analysis
  --help                     Show this help

Examples:
  node test-aggregator.js
  node test-aggregator.js -r ./reports -h 60
        `);
        process.exit(0);
    }
  }
  
  const aggregator = new TestResultAggregator(options);
  
  aggregator.aggregateResults()
    .then(results => {
      if (results) {
        console.log('✅ Test result aggregation completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Test result aggregation failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Aggregation failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestResultAggregator;