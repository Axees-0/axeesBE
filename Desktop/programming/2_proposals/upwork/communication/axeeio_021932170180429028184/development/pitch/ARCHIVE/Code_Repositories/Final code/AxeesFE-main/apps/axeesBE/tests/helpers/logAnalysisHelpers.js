// tests/helpers/logAnalysisHelpers.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * LogAnalyzer - Comprehensive log analysis and monitoring utilities
 * 
 * Provides functionality for:
 * - Log pattern detection and analysis
 * - Error tracking and categorization
 * - Performance metrics extraction
 * - Log aggregation and filtering
 * - Real-time log monitoring simulation
 * - Security event detection
 */
class LogAnalyzer {
  constructor(options = {}) {
    this.logBuffer = [];
    this.patterns = {
      error: [
        /ERROR/gi,
        /Exception/gi,
        /Failed/gi,
        /Timeout/gi,
        /Connection refused/gi,
        /Memory leak/gi,
        /Stack overflow/gi
      ],
      warning: [
        /WARN/gi,
        /Warning/gi,
        /Deprecated/gi,
        /Slow query/gi,
        /High memory usage/gi,
        /Connection pool exhausted/gi
      ],
      info: [
        /INFO/gi,
        /Started/gi,
        /Connected/gi,
        /Completed/gi,
        /Success/gi
      ],
      security: [
        /Authentication failed/gi,
        /Unauthorized access/gi,
        /Invalid token/gi,
        /Rate limit exceeded/gi,
        /Suspicious activity/gi,
        /Brute force/gi,
        /SQL injection/gi,
        /XSS attempt/gi
      ],
      performance: [
        /response time: (\d+)ms/gi,
        /query took (\d+)ms/gi,
        /memory usage: (\d+)MB/gi,
        /CPU usage: (\d+)%/gi,
        /request processed in (\d+)ms/gi
      ]
    };
    
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      securityEvents: 0,
      performanceEvents: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      errorRate: 0,
      uptime: 0
    };

    this.categories = {
      database: [/database/gi, /mongo/gi, /query/gi, /connection/gi],
      api: [/api/gi, /endpoint/gi, /request/gi, /response/gi],
      auth: [/auth/gi, /login/gi, /token/gi, /session/gi],
      chat: [/chat/gi, /message/gi, /room/gi, /sse/gi],
      system: [/system/gi, /server/gi, /process/gi, /memory/gi]
    };

    this.alertThresholds = {
      errorRate: 0.05, // 5% error rate
      responseTime: 1000, // 1 second
      memoryUsage: 80, // 80% memory usage
      securityEvents: 10, // 10 security events per hour
      connectionErrors: 5 // 5 connection errors per minute
    };

    this.reportsDir = options.reportsDir || path.join(process.cwd(), 'tests', 'reports');
    this.startTime = Date.now();
    this.analysisResults = new Map();
  }

  /**
   * Add log entry for analysis
   */
  addLogEntry(entry) {
    const logEntry = {
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level || 'INFO',
      message: entry.message || '',
      source: entry.source || 'unknown',
      userId: entry.userId || null,
      requestId: entry.requestId || this.generateId(),
      metadata: entry.metadata || {}
    };

    this.logBuffer.push(logEntry);
    this.metrics.totalLogs++;
    
    // Real-time analysis
    this.analyzeLogEntry(logEntry);
    
    return logEntry;
  }

  /**
   * Generate unique identifier
   */
  generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Analyze individual log entry
   */
  analyzeLogEntry(entry) {
    const message = entry.message.toLowerCase();
    
    // Categorize by level
    switch (entry.level.toUpperCase()) {
      case 'ERROR':
        this.metrics.errorCount++;
        break;
      case 'WARN':
      case 'WARNING':
        this.metrics.warningCount++;
        break;
      case 'INFO':
        this.metrics.infoCount++;
        break;
    }

    // Pattern matching
    if (this.matchesPatterns(entry.message, this.patterns.error)) {
      this.metrics.errorCount++;
    }
    
    if (this.matchesPatterns(entry.message, this.patterns.security)) {
      this.metrics.securityEvents++;
    }
    
    if (this.matchesPatterns(entry.message, this.patterns.performance)) {
      this.metrics.performanceEvents++;
      this.extractPerformanceMetrics(entry.message);
    }

    // Update error rate
    this.metrics.errorRate = this.metrics.errorCount / this.metrics.totalLogs;
  }

  /**
   * Check if message matches any pattern
   */
  matchesPatterns(message, patterns) {
    return patterns.some(pattern => pattern.test(message));
  }

  /**
   * Extract performance metrics from log messages
   */
  extractPerformanceMetrics(message) {
    // Extract response times
    const responseTimeMatch = message.match(/response time: (\d+)ms/i);
    if (responseTimeMatch) {
      const responseTime = parseInt(responseTimeMatch[1]);
      this.updateAverageResponseTime(responseTime);
    }

    // Extract memory usage
    const memoryMatch = message.match(/memory usage: (\d+)MB/i);
    if (memoryMatch) {
      const memoryUsage = parseInt(memoryMatch[1]);
      if (memoryUsage > this.metrics.peakMemoryUsage) {
        this.metrics.peakMemoryUsage = memoryUsage;
      }
    }
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(newTime) {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = newTime;
    } else {
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime + newTime) / 2;
    }
  }

  /**
   * Analyze logs by time range
   */
  analyzeTimeRange(startTime, endTime) {
    const filteredLogs = this.logBuffer.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= startTime && entryTime <= endTime;
    });

    return this.analyzeLogs(filteredLogs);
  }

  /**
   * Analyze logs by category
   */
  analyzeByCategory(category) {
    if (!this.categories[category]) {
      throw new Error(`Unknown category: ${category}`);
    }

    const categoryLogs = this.logBuffer.filter(entry =>
      this.matchesPatterns(entry.message, this.categories[category])
    );

    return this.analyzeLogs(categoryLogs);
  }

  /**
   * Analyze log collection
   */
  analyzeLogs(logs) {
    const analysis = {
      totalLogs: logs.length,
      logLevels: { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 },
      patterns: { error: 0, warning: 0, security: 0, performance: 0 },
      categories: {},
      timeDistribution: {},
      topErrors: [],
      recommendations: []
    };

    // Initialize categories
    Object.keys(this.categories).forEach(cat => {
      analysis.categories[cat] = 0;
    });

    logs.forEach(entry => {
      // Count by log level
      const level = entry.level.toUpperCase();
      if (analysis.logLevels[level] !== undefined) {
        analysis.logLevels[level]++;
      }

      // Pattern analysis
      if (this.matchesPatterns(entry.message, this.patterns.error)) {
        analysis.patterns.error++;
      }
      if (this.matchesPatterns(entry.message, this.patterns.warning)) {
        analysis.patterns.warning++;
      }
      if (this.matchesPatterns(entry.message, this.patterns.security)) {
        analysis.patterns.security++;
      }
      if (this.matchesPatterns(entry.message, this.patterns.performance)) {
        analysis.patterns.performance++;
      }

      // Category analysis
      Object.entries(this.categories).forEach(([category, patterns]) => {
        if (this.matchesPatterns(entry.message, patterns)) {
          analysis.categories[category]++;
        }
      });

      // Time distribution (by hour)
      const hour = new Date(entry.timestamp).getHours();
      analysis.timeDistribution[hour] = (analysis.timeDistribution[hour] || 0) + 1;
    });

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    const errorRate = analysis.patterns.error / analysis.totalLogs;
    if (errorRate > this.alertThresholds.errorRate) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        issue: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        recommendation: 'Investigate error patterns and implement error handling improvements'
      });
    }

    if (analysis.patterns.security > this.alertThresholds.securityEvents) {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        issue: `${analysis.patterns.security} security events detected`,
        recommendation: 'Review security logs and implement additional security measures'
      });
    }

    if (this.metrics.averageResponseTime > this.alertThresholds.responseTime) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        issue: `Average response time: ${this.metrics.averageResponseTime.toFixed(0)}ms`,
        recommendation: 'Optimize slow endpoints and database queries'
      });
    }

    return recommendations;
  }

  /**
   * Simulate log monitoring for testing
   */
  async simulateLogMonitoring(duration = 10000, logInterval = 100) {
    const monitoringData = {
      startTime: Date.now(),
      endTime: null,
      logs: [],
      alerts: [],
      metrics: {}
    };

    const logTypes = [
      { level: 'INFO', message: 'User login successful', weight: 0.6 },
      { level: 'INFO', message: 'Message sent successfully', weight: 0.2 },
      { level: 'WARN', message: 'High memory usage: 75MB', weight: 0.1 },
      { level: 'ERROR', message: 'Database connection failed', weight: 0.05 },
      { level: 'ERROR', message: 'Authentication failed for user', weight: 0.03 },
      { level: 'INFO', message: 'Chat room created', weight: 0.02 }
    ];

    const endTime = Date.now() + duration;

    while (Date.now() < endTime) {
      // Generate random log entry
      const randomValue = Math.random();
      let cumulativeWeight = 0;
      let selectedLog = logTypes[0];

      for (const logType of logTypes) {
        cumulativeWeight += logType.weight;
        if (randomValue <= cumulativeWeight) {
          selectedLog = logType;
          break;
        }
      }

      const logEntry = this.addLogEntry({
        level: selectedLog.level,
        message: selectedLog.message,
        source: 'monitoring-simulation',
        metadata: {
          responseTime: Math.floor(Math.random() * 500) + 100,
          memoryUsage: Math.floor(Math.random() * 100) + 50
        }
      });

      monitoringData.logs.push(logEntry);

      // Check for alerts
      if (selectedLog.level === 'ERROR') {
        monitoringData.alerts.push({
          timestamp: logEntry.timestamp,
          level: 'ERROR',
          message: logEntry.message,
          severity: 'high'
        });
      }

      await new Promise(resolve => setTimeout(resolve, logInterval));
    }

    monitoringData.endTime = Date.now();
    monitoringData.metrics = this.getMetrics();

    return monitoringData;
  }

  /**
   * Test log parsing and validation
   */
  testLogParsing(logData) {
    const parseResults = {
      totalLines: 0,
      successfullyParsed: 0,
      parseErrors: [],
      validationErrors: [],
      formats: new Set()
    };

    const lines = logData.split('\n').filter(line => line.trim());
    parseResults.totalLines = lines.length;

    lines.forEach((line, index) => {
      try {
        // Try parsing as JSON
        if (line.trim().startsWith('{')) {
          const parsed = JSON.parse(line);
          parseResults.formats.add('json');
          
          // Validate required fields
          if (!parsed.timestamp || !parsed.message) {
            parseResults.validationErrors.push({
              line: index + 1,
              error: 'Missing required fields (timestamp, message)'
            });
          } else {
            parseResults.successfullyParsed++;
          }
        } 
        // Try parsing as standard log format
        else if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
          parseResults.formats.add('standard');
          parseResults.successfullyParsed++;
        }
        // Try parsing as syslog format
        else if (line.match(/^<\d+>/)) {
          parseResults.formats.add('syslog');
          parseResults.successfullyParsed++;
        }
        else {
          parseResults.parseErrors.push({
            line: index + 1,
            content: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
            error: 'Unrecognized log format'
          });
        }
      } catch (error) {
        parseResults.parseErrors.push({
          line: index + 1,
          content: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
          error: error.message
        });
      }
    });

    parseResults.formats = Array.from(parseResults.formats);
    parseResults.parseSuccessRate = parseResults.successfullyParsed / parseResults.totalLines;

    return parseResults;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      bufferSize: this.logBuffer.length
    };
  }

  /**
   * Generate comprehensive log analysis report
   */
  async generateReport() {
    const analysis = this.analyzeLogs(this.logBuffer);
    const metrics = this.getMetrics();
    
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisStartTime: new Date(this.startTime).toISOString(),
        totalDuration: metrics.uptime,
        version: '1.0.0'
      },
      summary: {
        totalLogs: metrics.totalLogs,
        errorRate: (metrics.errorRate * 100).toFixed(2) + '%',
        averageResponseTime: metrics.averageResponseTime.toFixed(0) + 'ms',
        securityEvents: metrics.securityEvents,
        uptime: this.formatDuration(metrics.uptime)
      },
      analysis,
      metrics,
      recommendations: analysis.recommendations,
      alertStatus: this.checkAlertStatus(),
      topLogSources: this.getTopLogSources(),
      performanceMetrics: this.getPerformanceMetrics()
    };

    // Save report to file
    const reportPath = path.join(this.reportsDir, `log-analysis-${Date.now()}.json`);
    try {
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      report.reportPath = reportPath;
    } catch (error) {
      console.warn('Failed to save report:', error.message);
    }

    return report;
  }

  /**
   * Check alert status
   */
  checkAlertStatus() {
    const alerts = [];

    if (this.metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate ${(this.metrics.errorRate * 100).toFixed(2)}% exceeds threshold`,
        threshold: this.alertThresholds.errorRate
      });
    }

    if (this.metrics.averageResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'medium',
        message: `Average response time ${this.metrics.averageResponseTime.toFixed(0)}ms exceeds threshold`,
        threshold: this.alertThresholds.responseTime
      });
    }

    if (this.metrics.securityEvents > this.alertThresholds.securityEvents) {
      alerts.push({
        type: 'security_events',
        severity: 'critical',
        message: `${this.metrics.securityEvents} security events exceed threshold`,
        threshold: this.alertThresholds.securityEvents
      });
    }

    return {
      status: alerts.length > 0 ? 'ALERT' : 'OK',
      alertCount: alerts.length,
      alerts
    };
  }

  /**
   * Get top log sources
   */
  getTopLogSources() {
    const sources = {};
    this.logBuffer.forEach(entry => {
      sources[entry.source] = (sources[entry.source] || 0) + 1;
    });

    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      averageResponseTime: this.metrics.averageResponseTime,
      peakMemoryUsage: this.metrics.peakMemoryUsage,
      performanceEvents: this.metrics.performanceEvents,
      logsPerSecond: this.metrics.totalLogs / (this.metrics.uptime / 1000)
    };
  }

  /**
   * Format duration in readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Clear log buffer
   */
  clearLogs() {
    this.logBuffer = [];
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      securityEvents: 0,
      performanceEvents: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      errorRate: 0,
      uptime: 0
    };
    this.startTime = Date.now();
  }
}

/**
 * LogAnalysisAssertions - Assertion helpers for log analysis tests
 */
class LogAnalysisAssertions {
  static expectLogCount(analyzer, expectedCount) {
    const actualCount = analyzer.getMetrics().totalLogs;
    expect(actualCount).toBe(expectedCount);
  }

  static expectErrorRate(analyzer, maxErrorRate) {
    const errorRate = analyzer.getMetrics().errorRate;
    expect(errorRate).toBeLessThanOrEqual(maxErrorRate);
  }

  static expectNoSecurityEvents(analyzer) {
    const securityEvents = analyzer.getMetrics().securityEvents;
    expect(securityEvents).toBe(0);
  }

  static expectParseSuccessRate(parseResults, minSuccessRate) {
    expect(parseResults.parseSuccessRate).toBeGreaterThanOrEqual(minSuccessRate);
  }

  static expectRecommendations(analysis, maxRecommendations) {
    expect(analysis.recommendations.length).toBeLessThanOrEqual(maxRecommendations);
  }

  static expectAlertStatus(alertStatus, expectedStatus) {
    expect(alertStatus.status).toBe(expectedStatus);
  }

  static expectResponseTime(analyzer, maxResponseTime) {
    const avgResponseTime = analyzer.getMetrics().averageResponseTime;
    expect(avgResponseTime).toBeLessThanOrEqual(maxResponseTime);
  }
}

module.exports = {
  LogAnalyzer,
  LogAnalysisAssertions
};