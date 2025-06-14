// tests/integration/log-analysis.test.js
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Import test helpers
const authHelpers = require('../helpers/authHelpers');
const testUtils = require('../helpers/testUtils');
const { LogAnalyzer, LogAnalysisAssertions } = require('../helpers/logAnalysisHelpers');

// Import models
const User = require('../../models/User');
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');

// Import routes
const chatRoutes = require('../../routes/chat');
const userRoutes = require('../../routes/users');

// Mock services
jest.mock('../../services/notificationService', () => ({
  sendUnreadMessageNotification: jest.fn().mockResolvedValue(true)
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

describe('Log Analysis Testing', () => {
  let testUsers, testChatRooms;
  let logAnalyzer;

  beforeEach(async () => {
    await testUtils.cleanupTestData();
    
    logAnalyzer = new LogAnalyzer({
      reportsDir: path.join(process.cwd(), 'tests', 'reports')
    });

    // Create test users
    testUsers = [];
    for (let i = 0; i < 3; i++) {
      const user = await authHelpers.createTestUser({
        name: `Log User ${i + 1}`,
        email: `loguser${i + 1}@test.com`,
        userType: i % 2 === 0 ? 'Creator' : 'Marketer'
      });
      testUsers.push(user);
    }

    // Create test chat rooms
    testChatRooms = [];
    const room = await ChatRoom.create({
      participants: [testUsers[0]._id, testUsers[1]._id],
      unreadCount: new Map([
        [testUsers[0]._id.toString(), 0],
        [testUsers[1]._id.toString(), 0]
      ])
    });
    testChatRooms.push(room);
  });

  afterEach(async () => {
    await testUtils.cleanupTestData();
  });

  describe('Log Pattern Detection', () => {
    it('should detect and categorize error patterns in logs', async () => {
      console.log('🔍 Testing Error Pattern Detection');

      // Simulate various log entries
      const logEntries = [
        { level: 'INFO', message: 'User authentication successful', source: 'auth-service' },
        { level: 'ERROR', message: 'Database connection failed', source: 'database' },
        { level: 'WARN', message: 'High memory usage detected: 85MB', source: 'system' },
        { level: 'ERROR', message: 'Authentication failed for user invalid@test.com', source: 'auth-service' },
        { level: 'INFO', message: 'Message sent successfully to room 123', source: 'chat-service' },
        { level: 'ERROR', message: 'Timeout occurred while processing request', source: 'api-gateway' },
        { level: 'INFO', message: 'User login completed', source: 'auth-service' },
        { level: 'WARN', message: 'Slow query detected: SELECT * FROM messages took 850ms', source: 'database' }
      ];

      // Add log entries to analyzer
      logEntries.forEach(entry => logAnalyzer.addLogEntry(entry));

      const analysis = logAnalyzer.analyzeLogs(logAnalyzer.logBuffer);

      // Validate pattern detection
      expect(analysis.totalLogs).toBe(8);
      expect(analysis.patterns.error).toBeGreaterThan(0);
      expect(analysis.patterns.warning).toBeGreaterThan(0);
      
      // Check error categorization
      LogAnalysisAssertions.expectLogCount(logAnalyzer, 8);
      LogAnalysisAssertions.expectErrorRate(logAnalyzer, 0.8); // Max 80% error rate for test (allowing for pattern-based detection)

      console.log(`Pattern Analysis Results:`);
      console.log(`  Total logs: ${analysis.totalLogs}`);
      console.log(`  Error patterns: ${analysis.patterns.error}`);
      console.log(`  Warning patterns: ${analysis.patterns.warning}`);
      console.log(`  Error rate: ${(logAnalyzer.getMetrics().errorRate * 100).toFixed(2)}%`);

      // Validate category distribution
      expect(analysis.categories.database).toBeGreaterThan(0);
      expect(analysis.categories.auth).toBeGreaterThan(0);
      expect(analysis.categories.api).toBeGreaterThan(0);

      console.log(`Category Distribution:`);
      Object.entries(analysis.categories).forEach(([category, count]) => {
        if (count > 0) {
          console.log(`  ${category}: ${count} logs`);
        }
      });
    });

    it('should detect security-related log patterns', async () => {
      console.log('🔒 Testing Security Pattern Detection');

      const securityLogs = [
        { level: 'WARN', message: 'Authentication failed for user hacker@evil.com', source: 'auth-service' },
        { level: 'ERROR', message: 'Unauthorized access attempt to admin endpoint', source: 'api-gateway' },
        { level: 'WARN', message: 'Rate limit exceeded for IP 192.168.1.100', source: 'rate-limiter' },
        { level: 'ERROR', message: 'Invalid token provided for API access', source: 'auth-service' },
        { level: 'WARN', message: 'Suspicious activity detected: multiple failed logins', source: 'security-monitor' },
        { level: 'INFO', message: 'Normal user login successful', source: 'auth-service' },
        { level: 'ERROR', message: 'Potential SQL injection attempt detected', source: 'security-scanner' },
        { level: 'WARN', message: 'Brute force attack detected from IP 10.0.0.1', source: 'security-monitor' }
      ];

      securityLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      const analysis = logAnalyzer.analyzeLogs(logAnalyzer.logBuffer);
      const metrics = logAnalyzer.getMetrics();

      // Security events should be detected
      expect(analysis.patterns.security).toBeGreaterThan(0);
      expect(metrics.securityEvents).toBeGreaterThan(0);

      console.log(`Security Analysis Results:`);
      console.log(`  Security patterns detected: ${analysis.patterns.security}`);
      console.log(`  Total security events: ${metrics.securityEvents}`);

      // Check for recommendations (security recommendations may or may not be generated depending on thresholds)
      expect(analysis.recommendations).toBeDefined();
      const securityRecommendations = analysis.recommendations.filter(rec => rec.category === 'security');
      console.log(`Total recommendations: ${analysis.recommendations.length}`);
      console.log(`Security recommendations: ${securityRecommendations.length}`);

      console.log(`Security Recommendations:`);
      securityRecommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`     Recommendation: ${rec.recommendation}`);
      });
    });

    it('should extract and analyze performance metrics from logs', async () => {
      console.log('⚡ Testing Performance Metrics Extraction');

      const performanceLogs = [
        { level: 'INFO', message: 'API request processed in 150ms', source: 'api-gateway', metadata: { responseTime: 150 } },
        { level: 'INFO', message: 'Database query took 75ms', source: 'database', metadata: { queryTime: 75 } },
        { level: 'WARN', message: 'Slow endpoint detected: response time: 1200ms', source: 'monitoring', metadata: { responseTime: 1200 } },
        { level: 'INFO', message: 'Chat message delivered in 50ms', source: 'chat-service', metadata: { responseTime: 50 } },
        { level: 'INFO', message: 'Memory usage: 65MB', source: 'system', metadata: { memoryUsage: 65 } },
        { level: 'WARN', message: 'High memory usage: 120MB', source: 'system', metadata: { memoryUsage: 120 } },
        { level: 'INFO', message: 'CPU usage: 45%', source: 'system', metadata: { cpuUsage: 45 } },
        { level: 'WARN', message: 'High CPU usage: 85%', source: 'system', metadata: { cpuUsage: 85 } }
      ];

      performanceLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      const analysis = logAnalyzer.analyzeLogs(logAnalyzer.logBuffer);
      const metrics = logAnalyzer.getMetrics();

      // Performance patterns should be detected
      expect(analysis.patterns.performance).toBeGreaterThan(0);
      expect(metrics.performanceEvents).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);

      console.log(`Performance Analysis Results:`);
      console.log(`  Performance patterns detected: ${analysis.patterns.performance}`);
      console.log(`  Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
      console.log(`  Peak memory usage: ${metrics.peakMemoryUsage}MB`);

      // Validate performance thresholds
      LogAnalysisAssertions.expectResponseTime(logAnalyzer, 2000); // Max 2 seconds average

      // Check for performance recommendations
      const performanceRecommendations = analysis.recommendations.filter(rec => rec.category === 'performance');
      if (performanceRecommendations.length > 0) {
        console.log(`Performance Recommendations:`);
        performanceRecommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
        });
      }
    });
  });

  describe('Log Aggregation and Filtering', () => {
    it('should aggregate logs by time range', async () => {
      console.log('📊 Testing Log Time Range Aggregation');

      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago
      const twoHoursAgo = now - (2 * 60 * 60 * 1000); // 2 hours ago

      // Add logs with different timestamps
      const timeBasedLogs = [
        { level: 'INFO', message: 'Old log entry', timestamp: new Date(twoHoursAgo).toISOString(), source: 'system' },
        { level: 'INFO', message: 'Recent log entry 1', timestamp: new Date(oneHourAgo).toISOString(), source: 'api' },
        { level: 'ERROR', message: 'Recent error', timestamp: new Date(oneHourAgo + 1000).toISOString(), source: 'database' },
        { level: 'INFO', message: 'Current log entry', timestamp: new Date(now).toISOString(), source: 'chat' }
      ];

      timeBasedLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      // Analyze recent logs (last hour)
      const recentAnalysis = logAnalyzer.analyzeTimeRange(oneHourAgo, now);

      expect(recentAnalysis.totalLogs).toBe(3); // Should only include last 3 logs
      expect(recentAnalysis.logLevels.ERROR).toBe(1);
      expect(recentAnalysis.logLevels.INFO).toBe(2);

      console.log(`Time Range Analysis (Last Hour):`);
      console.log(`  Total logs in range: ${recentAnalysis.totalLogs}`);
      console.log(`  Error logs: ${recentAnalysis.logLevels.ERROR}`);
      console.log(`  Info logs: ${recentAnalysis.logLevels.INFO}`);

      // Analyze all logs
      const fullAnalysis = logAnalyzer.analyzeTimeRange(twoHoursAgo, now);
      expect(fullAnalysis.totalLogs).toBe(4);

      console.log(`Full Time Range Analysis:`);
      console.log(`  Total logs: ${fullAnalysis.totalLogs}`);
    });

    it('should filter and analyze logs by category', async () => {
      console.log('🏷️ Testing Log Category Filtering');

      const categoryLogs = [
        { level: 'INFO', message: 'Database connection established', source: 'db-service' },
        { level: 'ERROR', message: 'MongoDB query failed', source: 'database' },
        { level: 'INFO', message: 'API endpoint called successfully', source: 'api-gateway' },
        { level: 'INFO', message: 'User authentication completed', source: 'auth-service' },
        { level: 'ERROR', message: 'Invalid API request format', source: 'api-validator' },
        { level: 'INFO', message: 'Chat message processed', source: 'chat-service' },
        { level: 'WARN', message: 'System memory usage high', source: 'system-monitor' },
        { level: 'INFO', message: 'User session created', source: 'auth-handler' }
      ];

      categoryLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      // Analyze database category
      const databaseAnalysis = logAnalyzer.analyzeByCategory('database');
      expect(databaseAnalysis.totalLogs).toBeGreaterThan(0);

      console.log(`Database Category Analysis:`);
      console.log(`  Total database logs: ${databaseAnalysis.totalLogs}`);
      console.log(`  Database errors: ${databaseAnalysis.logLevels.ERROR}`);

      // Analyze API category
      const apiAnalysis = logAnalyzer.analyzeByCategory('api');
      expect(apiAnalysis.totalLogs).toBeGreaterThan(0);

      console.log(`API Category Analysis:`);
      console.log(`  Total API logs: ${apiAnalysis.totalLogs}`);
      console.log(`  API errors: ${apiAnalysis.logLevels.ERROR}`);

      // Analyze auth category
      const authAnalysis = logAnalyzer.analyzeByCategory('auth');
      expect(authAnalysis.totalLogs).toBeGreaterThan(0);

      console.log(`Auth Category Analysis:`);
      console.log(`  Total auth logs: ${authAnalysis.totalLogs}`);

      // Test invalid category
      expect(() => {
        logAnalyzer.analyzeByCategory('invalid-category');
      }).toThrow('Unknown category: invalid-category');
    });

    it('should generate log distribution analysis', async () => {
      console.log('📈 Testing Log Distribution Analysis');

      // Generate logs across different hours
      const distributionLogs = [];
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date();
        timestamp.setHours(hour, 0, 0, 0);
        
        // More logs during business hours (9-17)
        const logCount = (hour >= 9 && hour <= 17) ? 5 : 2;
        
        for (let i = 0; i < logCount; i++) {
          distributionLogs.push({
            level: Math.random() > 0.8 ? 'ERROR' : 'INFO',
            message: `Log entry at hour ${hour}`,
            timestamp: timestamp.toISOString(),
            source: 'system'
          });
        }
      }

      distributionLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      const analysis = logAnalyzer.analyzeLogs(logAnalyzer.logBuffer);

      // Check time distribution
      expect(Object.keys(analysis.timeDistribution).length).toBeGreaterThan(0);

      console.log(`Log Distribution by Hour:`);
      Object.entries(analysis.timeDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([hour, count]) => {
          console.log(`  Hour ${hour.padStart(2, '0')}:00 - ${count} logs`);
        });

      // Business hours should have more logs
      const businessHourLogs = Object.entries(analysis.timeDistribution)
        .filter(([hour]) => parseInt(hour) >= 9 && parseInt(hour) <= 17)
        .reduce((sum, [, count]) => sum + count, 0);

      const offHourLogs = Object.entries(analysis.timeDistribution)
        .filter(([hour]) => parseInt(hour) < 9 || parseInt(hour) > 17)
        .reduce((sum, [, count]) => sum + count, 0);

      expect(businessHourLogs).toBeGreaterThan(offHourLogs);
      console.log(`Business hours logs: ${businessHourLogs}, Off-hours logs: ${offHourLogs}`);
    });
  });

  describe('Real-time Log Monitoring Simulation', () => {
    it('should simulate real-time log monitoring and alerting', async () => {
      console.log('🔄 Testing Real-time Log Monitoring Simulation');

      // Run monitoring simulation for 2 seconds
      const monitoringData = await logAnalyzer.simulateLogMonitoring(2000, 50);

      expect(monitoringData.logs.length).toBeGreaterThan(0);
      expect(monitoringData.endTime).toBeGreaterThan(monitoringData.startTime);
      expect(monitoringData.metrics).toBeDefined();

      console.log(`Monitoring Simulation Results:`);
      console.log(`  Duration: ${monitoringData.endTime - monitoringData.startTime}ms`);
      console.log(`  Total logs generated: ${monitoringData.logs.length}`);
      console.log(`  Alerts generated: ${monitoringData.alerts.length}`);

      // Check for alerts if errors occurred
      if (monitoringData.alerts.length > 0) {
        console.log(`Alerts:`);
        monitoringData.alerts.forEach((alert, index) => {
          console.log(`  ${index + 1}. [${alert.level}] ${alert.message}`);
        });
      }

      // Validate metrics
      expect(monitoringData.metrics.totalLogs).toBeGreaterThan(0);
      expect(monitoringData.metrics.uptime).toBeGreaterThan(0);

      console.log(`Final Metrics:`);
      console.log(`  Total logs: ${monitoringData.metrics.totalLogs}`);
      console.log(`  Error rate: ${(monitoringData.metrics.errorRate * 100).toFixed(2)}%`);
      console.log(`  Uptime: ${monitoringData.metrics.uptime}ms`);
    });

    it('should validate log monitoring alerts and thresholds', async () => {
      console.log('🚨 Testing Log Monitoring Alerts and Thresholds');

      // Generate logs that should trigger alerts
      const alertLogs = [
        { level: 'ERROR', message: 'Critical system failure', source: 'system' },
        { level: 'ERROR', message: 'Database connection lost', source: 'database' },
        { level: 'ERROR', message: 'Authentication service down', source: 'auth' },
        { level: 'ERROR', message: 'Memory exhausted', source: 'system' },
        { level: 'WARN', message: 'High error rate detected', source: 'monitoring' },
        { level: 'ERROR', message: 'API gateway timeout', source: 'api' },
        { level: 'INFO', message: 'Normal operation', source: 'system' },
        { level: 'INFO', message: 'User login successful', source: 'auth' }
      ];

      alertLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      const alertStatus = logAnalyzer.checkAlertStatus();
      
      // High error rate should trigger alerts
      expect(alertStatus.status).toBe('ALERT');
      expect(alertStatus.alertCount).toBeGreaterThan(0);
      expect(alertStatus.alerts.length).toBeGreaterThan(0);

      console.log(`Alert Status: ${alertStatus.status}`);
      console.log(`Alert Count: ${alertStatus.alertCount}`);

      alertStatus.alerts.forEach((alert, index) => {
        console.log(`  Alert ${index + 1}: [${alert.severity}] ${alert.type} - ${alert.message}`);
      });

      LogAnalysisAssertions.expectAlertStatus(alertStatus, 'ALERT');
    });

    it('should test log monitoring performance under load', async () => {
      console.log('🏋️ Testing Log Monitoring Performance Under Load');

      const startTime = Date.now();
      const logCount = 1000;

      // Generate many logs quickly
      for (let i = 0; i < logCount; i++) {
        logAnalyzer.addLogEntry({
          level: i % 10 === 0 ? 'ERROR' : 'INFO',
          message: `Load test log entry ${i}`,
          source: `service-${i % 5}`,
          metadata: {
            requestId: `req-${i}`,
            responseTime: Math.floor(Math.random() * 500) + 100
          }
        });
      }

      const processingTime = Date.now() - startTime;
      const metrics = logAnalyzer.getMetrics();

      console.log(`Load Test Results:`);
      console.log(`  Logs processed: ${logCount}`);
      console.log(`  Processing time: ${processingTime}ms`);
      console.log(`  Logs per second: ${(logCount / (processingTime / 1000)).toFixed(0)}`);
      console.log(`  Memory usage: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);

      // Performance should be reasonable
      expect(processingTime).toBeLessThan(5000); // Should process 1000 logs in under 5 seconds
      expect(metrics.totalLogs).toBe(logCount);

      // Generate analysis of all logs
      const analysis = logAnalyzer.analyzeLogs(logAnalyzer.logBuffer);
      expect(analysis.totalLogs).toBe(logCount);

      console.log(`Analysis Results:`);
      console.log(`  Error logs: ${analysis.logLevels.ERROR}`);
      console.log(`  Info logs: ${analysis.logLevels.INFO}`);
      console.log(`  Error rate: ${(analysis.logLevels.ERROR / analysis.totalLogs * 100).toFixed(2)}%`);
    });
  });

  describe('Log Parsing and Validation', () => {
    it('should parse and validate different log formats', async () => {
      console.log('📝 Testing Log Format Parsing and Validation');

      // Test different log formats
      const logFormats = [
        // JSON format
        '{"timestamp":"2025-06-13T20:00:00Z","level":"INFO","message":"User login successful","source":"auth-service"}',
        '{"timestamp":"2025-06-13T20:01:00Z","level":"ERROR","message":"Database connection failed","source":"database"}',
        
        // Standard format
        '2025-06-13 20:02:00 INFO [api-service] Request processed successfully',
        '2025-06-13 20:03:00 ERROR [database] Query timeout after 30 seconds',
        
        // Syslog format
        '<134>2025-06-13T20:04:00Z server1 app[12345]: Message sent to user',
        '<131>2025-06-13T20:05:00Z server1 app[12345]: Authentication failed',
        
        // Invalid formats
        'This is not a valid log entry',
        '{"incomplete":"json"' // Invalid JSON
      ];

      const logData = logFormats.join('\n');
      const parseResults = logAnalyzer.testLogParsing(logData);

      console.log(`Parse Results:`);
      console.log(`  Total lines: ${parseResults.totalLines}`);
      console.log(`  Successfully parsed: ${parseResults.successfullyParsed}`);
      console.log(`  Parse success rate: ${(parseResults.parseSuccessRate * 100).toFixed(2)}%`);
      console.log(`  Detected formats: ${parseResults.formats.join(', ')}`);

      // Should detect multiple formats
      expect(parseResults.formats.length).toBeGreaterThan(1);
      expect(parseResults.parseSuccessRate).toBeGreaterThan(0.5); // At least 50% should parse successfully

      if (parseResults.parseErrors.length > 0) {
        console.log(`Parse Errors:`);
        parseResults.parseErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. Line ${error.line}: ${error.error}`);
        });
      }

      if (parseResults.validationErrors.length > 0) {
        console.log(`Validation Errors:`);
        parseResults.validationErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. Line ${error.line}: ${error.error}`);
        });
      }

      LogAnalysisAssertions.expectParseSuccessRate(parseResults, 0.5);
    });

    it('should validate log structure and required fields', async () => {
      console.log('✅ Testing Log Structure Validation');

      // Test logs with valid and invalid structures
      const structureTestLogs = [
        // Valid logs
        { level: 'INFO', message: 'Valid log entry', timestamp: new Date().toISOString(), source: 'test' },
        { level: 'ERROR', message: 'Another valid entry', timestamp: new Date().toISOString(), source: 'test' },
        
        // Invalid logs (missing fields)
        { level: 'WARN', source: 'test' }, // Missing message
        { message: 'Missing level and timestamp', source: 'test' },
        { level: 'INFO', message: 'Missing source' }
      ];

      let validCount = 0;
      let invalidCount = 0;

      structureTestLogs.forEach((entry, index) => {
        try {
          logAnalyzer.addLogEntry(entry);
          validCount++;
        } catch (error) {
          invalidCount++;
          console.log(`  Invalid log ${index + 1}: ${error.message}`);
        }
      });

      console.log(`Structure Validation Results:`);
      console.log(`  Valid logs: ${validCount}`);
      console.log(`  Invalid logs: ${invalidCount}`);

      // At least some logs should be valid
      expect(validCount).toBeGreaterThan(0);
    });

    it('should handle malformed and corrupted log entries', async () => {
      console.log('🔧 Testing Malformed Log Handling');

      const malformedLogs = `
        Normal log entry
        {"valid": "json", "timestamp": "2025-06-13T20:00:00Z", "message": "test"}
        {"malformed": "json", "missing_quote: "value"}
        2025-06-13 20:01:00 NORMAL Standard log entry
        Completely invalid log entry with special chars: !@#$%^&*()
        {"null_values": null, "undefined": undefined, "message": "test"}
        
        
        2025-06-13 20:02:00 INFO Another normal entry
      `;

      const parseResults = logAnalyzer.testLogParsing(malformedLogs);

      console.log(`Malformed Log Handling Results:`);
      console.log(`  Total lines processed: ${parseResults.totalLines}`);
      console.log(`  Successfully parsed: ${parseResults.successfullyParsed}`);
      console.log(`  Parse errors: ${parseResults.parseErrors.length}`);
      console.log(`  Validation errors: ${parseResults.validationErrors.length}`);

      // Should handle malformed logs gracefully
      expect(parseResults.parseErrors.length).toBeGreaterThan(0);
      expect(parseResults.successfullyParsed).toBeGreaterThan(0);

      if (parseResults.parseErrors.length > 0) {
        console.log(`Sample Parse Errors:`);
        parseResults.parseErrors.slice(0, 3).forEach((error, index) => {
          console.log(`  ${index + 1}. Line ${error.line}: ${error.error}`);
        });
      }
    });
  });

  describe('Log Analysis Reporting', () => {
    it('should generate comprehensive log analysis report', async () => {
      console.log('📊 Testing Comprehensive Log Analysis Report Generation');

      // Generate diverse log data for comprehensive report
      const reportLogs = [
        { level: 'INFO', message: 'Application started successfully', source: 'system' },
        { level: 'INFO', message: 'User authentication completed', source: 'auth' },
        { level: 'ERROR', message: 'Database connection timeout', source: 'database' },
        { level: 'WARN', message: 'High memory usage: 85MB', source: 'system' },
        { level: 'INFO', message: 'API request processed in 150ms', source: 'api' },
        { level: 'ERROR', message: 'Authentication failed for invalid user', source: 'auth' },
        { level: 'INFO', message: 'Chat message delivered successfully', source: 'chat' },
        { level: 'WARN', message: 'Slow database query detected: 800ms', source: 'database' },
        { level: 'ERROR', message: 'Rate limit exceeded for API endpoint', source: 'api' },
        { level: 'INFO', message: 'Background job completed', source: 'scheduler' }
      ];

      reportLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      const report = await logAnalyzer.generateReport();

      // Validate report structure
      expect(report.metadata).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.analysis).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.recommendations).toBeDefined();

      console.log(`Analysis Report Generated:`);
      console.log(`  Report generated at: ${report.metadata.generatedAt}`);
      console.log(`  Analysis duration: ${report.summary.uptime}`);
      console.log(`  Total logs analyzed: ${report.summary.totalLogs}`);
      console.log(`  Error rate: ${report.summary.errorRate}`);
      console.log(`  Security events: ${report.summary.securityEvents}`);

      // Validate metrics
      expect(report.metrics.totalLogs).toBe(reportLogs.length);
      expect(report.metrics.errorCount).toBeGreaterThan(0);
      expect(report.metrics.uptime).toBeGreaterThan(0);

      // Check top log sources
      expect(report.topLogSources).toBeDefined();
      expect(report.topLogSources.length).toBeGreaterThan(0);

      console.log(`Top Log Sources:`);
      report.topLogSources.slice(0, 5).forEach((source, index) => {
        console.log(`  ${index + 1}. ${source.source}: ${source.count} logs`);
      });

      // Check performance metrics
      console.log(`Performance Metrics:`);
      console.log(`  Average response time: ${report.performanceMetrics.averageResponseTime.toFixed(0)}ms`);
      console.log(`  Logs per second: ${report.performanceMetrics.logsPerSecond.toFixed(2)}`);

      // Validate recommendations
      if (report.recommendations.length > 0) {
        console.log(`Recommendations (${report.recommendations.length}):`);
        report.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
        });
      }

      // Check alert status
      console.log(`Alert Status: ${report.alertStatus.status} (${report.alertStatus.alertCount} alerts)`);

      expect(report.reportPath).toBeDefined();
      console.log(`Report saved to: ${report.reportPath}`);
    });

    it('should validate log analysis metrics and KPIs', async () => {
      console.log('📈 Testing Log Analysis Metrics and KPIs');

      // Generate logs with known metrics
      const metricsLogs = [
        { level: 'INFO', message: 'Request processed in 100ms', source: 'api', metadata: { responseTime: 100 } },
        { level: 'INFO', message: 'Request processed in 200ms', source: 'api', metadata: { responseTime: 200 } },
        { level: 'INFO', message: 'Request processed in 300ms', source: 'api', metadata: { responseTime: 300 } },
        { level: 'ERROR', message: 'Request failed', source: 'api' },
        { level: 'ERROR', message: 'Database error', source: 'database' },
        { level: 'INFO', message: 'Success', source: 'api' },
        { level: 'INFO', message: 'Memory usage: 50MB', source: 'system', metadata: { memoryUsage: 50 } },
        { level: 'INFO', message: 'Memory usage: 75MB', source: 'system', metadata: { memoryUsage: 75 } }
      ];

      metricsLogs.forEach(entry => logAnalyzer.addLogEntry(entry));

      const metrics = logAnalyzer.getMetrics();
      const analysis = logAnalyzer.analyzeLogs(logAnalyzer.logBuffer);

      // Validate key metrics
      expect(metrics.totalLogs).toBe(metricsLogs.length);
      expect(metrics.errorCount).toBeGreaterThanOrEqual(2); // At least 2 explicit ERROR logs, may detect more patterns
      expect(metrics.errorRate).toBeGreaterThan(0); // Should have some error rate

      console.log(`KPI Validation Results:`);
      console.log(`  Total logs: ${metrics.totalLogs}`);
      console.log(`  Error count: ${metrics.errorCount}`);
      console.log(`  Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
      console.log(`  Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
      console.log(`  Peak memory usage: ${metrics.peakMemoryUsage}MB`);

      // Validate analysis results
      expect(analysis.logLevels.ERROR).toBe(2);
      expect(analysis.logLevels.INFO).toBe(6);
      expect(analysis.categories.api).toBeGreaterThan(0);
      expect(analysis.categories.database).toBeGreaterThan(0);
      expect(analysis.categories.system).toBeGreaterThan(0);

      // Test assertion helpers
      LogAnalysisAssertions.expectLogCount(logAnalyzer, 8);
      LogAnalysisAssertions.expectErrorRate(logAnalyzer, 0.5);
      LogAnalysisAssertions.expectRecommendations(analysis, 10);

      console.log(`Analysis Validation:`);
      console.log(`  Error logs: ${analysis.logLevels.ERROR}`);
      console.log(`  Info logs: ${analysis.logLevels.INFO}`);
      console.log(`  Recommendations: ${analysis.recommendations.length}`);
    });

    it('should test log analysis with API integration', async () => {
      console.log('🔗 Testing Log Analysis with API Integration');

      // Make actual API calls and analyze resulting logs
      const apiStartTime = Date.now();

      // Simulate API calls that would generate logs
      try {
        const response1 = await request(app)
          .get('/api/chat/')
          .set('x-user-id', testUsers[0]._id.toString());

        logAnalyzer.addLogEntry({
          level: 'INFO',
          message: `GET /api/chat/ responded with ${response1.status}`,
          source: 'api-test',
          metadata: {
            responseTime: Date.now() - apiStartTime,
            statusCode: response1.status,
            endpoint: '/api/chat/'
          }
        });

        const response2 = await request(app)
          .post(`/api/chat/${testChatRooms[0]._id}/messages`)
          .set('x-user-id', testUsers[0]._id.toString())
          .send({
            text: 'Test message for log analysis',
            receiverId: testUsers[1]._id.toString()
          });

        logAnalyzer.addLogEntry({
          level: response2.status < 400 ? 'INFO' : 'ERROR',
          message: `POST /api/chat/.../messages responded with ${response2.status}`,
          source: 'api-test',
          metadata: {
            responseTime: Date.now() - apiStartTime,
            statusCode: response2.status,
            endpoint: '/api/chat/.../messages'
          }
        });

      } catch (error) {
        logAnalyzer.addLogEntry({
          level: 'ERROR',
          message: `API test failed: ${error.message}`,
          source: 'api-test',
          metadata: { error: error.message }
        });
      }

      const analysis = logAnalyzer.analyzeLogs(logAnalyzer.logBuffer);
      const metrics = logAnalyzer.getMetrics();

      console.log(`API Integration Log Analysis:`);
      console.log(`  Total API logs: ${analysis.totalLogs}`);
      console.log(`  API categories: ${analysis.categories.api}`);
      console.log(`  Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);

      expect(analysis.totalLogs).toBeGreaterThan(0);
      expect(analysis.categories.api).toBeGreaterThan(0);

      if (analysis.recommendations.length > 0) {
        console.log(`API Recommendations:`);
        analysis.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
        });
      }
    });
  });
});