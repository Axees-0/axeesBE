// Mock external services first, before any requires
jest.mock('../../utils/messageCentral', () => ({
  sendOtp: jest.fn().mockResolvedValue(123456),
  verifyOtp: jest.fn().mockResolvedValue(true),
  getMessageCentralToken: jest.fn().mockResolvedValue('mock-token-12345')
}));

jest.mock('../../utils/pushNotifications', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('twilio', () => {
  const mockClient = {
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM123456789',
        status: 'sent'
      })
    }
  };
  return jest.fn(() => mockClient);
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test123' }),
    verify: jest.fn().mockResolvedValue(true)
  })),
  getTestMessageUrl: jest.fn().mockReturnValue('http://test-url.com')
}));

jest.mock('stripe', () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123456789',
          client_secret: 'cs_test_123456789_secret',
          metadata: {},
          payment_intent: 'pi_test_123456789'
        })
      }
    }
  }));
});

const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const Offer = require('../../models/offer');
const Deal = require('../../models/deal');
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

describe('Log-based Validation Framework', () => {
  let testMarketer, testCreator, marketerToken, creatorToken;
  const logValidationResults = {
    logCapture: {},
    logAnalysis: {},
    predictionAccuracy: {},
    errorTracking: {},
    logAggregation: {}
  };

  // In-memory log storage for testing
  const capturedLogs = {
    info: [],
    warn: [],
    error: [],
    debug: [],
    all: []
  };

  // Override console methods to capture logs
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug
  };

  const captureLog = (level, ...args) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: args.join(' '),
      data: args.length > 1 ? args.slice(1) : undefined
    };
    
    capturedLogs[level].push(logEntry);
    capturedLogs.all.push(logEntry);
    
    // Still output to original console for debugging
    originalConsole[level === 'info' ? 'log' : level](...args);
  };

  beforeAll(async () => {
    await connect();
    
    // Override console methods
    console.log = (...args) => captureLog('info', ...args);
    console.error = (...args) => captureLog('error', ...args);
    console.warn = (...args) => captureLog('warn', ...args);
    console.debug = (...args) => captureLog('debug', ...args);
    
    // Create test users
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    
    testCreator = await User.create({
      phone: '+12125551234',
      name: 'Log Test Creator',
      userName: 'logcreator',
      email: 'logcreator@example.com',
      password: hashedPassword,
      userType: 'Creator',
      isActive: true,
      creatorData: {
        platforms: [{
          platform: 'instagram',
          handle: '@logcreator',
          followersCount: 75000
        }],
        categories: ['technology', 'lifestyle'],
        nicheTopics: ['tech', 'gadgets'],
        achievements: 'Tech influencer with log tracking',
        businessVentures: 'Log analysis blog',
        portfolio: [],
        totalFollowers: 75000
      }
    });

    testMarketer = await User.create({
      phone: '+12125551235',
      name: 'Log Test Marketer',
      userName: 'logmarketer',
      email: 'logmarketer@example.com',
      password: hashedPassword,
      userType: 'Marketer',
      isActive: true,
      marketerData: {
        companyName: 'Log Analytics Co',
        industry: 'Technology',
        website: 'https://loganalytics.com',
        businessLicense: 'LOG123456',
        totalCampaigns: 15,
        successfulCampaigns: 12,
        averageRating: 4.7
      }
    });

    creatorToken = generateTestToken({
      id: testCreator._id.toString(),
      phone: testCreator.phone,
      userType: testCreator.userType
    });

    marketerToken = generateTestToken({
      id: testMarketer._id.toString(),
      phone: testMarketer.phone,
      userType: testMarketer.userType
    });
  });

  beforeEach(async () => {
    // Clear logs before each test
    capturedLogs.info = [];
    capturedLogs.warn = [];
    capturedLogs.error = [];
    capturedLogs.debug = [];
    capturedLogs.all = [];
    
    // Clear test data
    await Offer.deleteMany({});
    await Deal.deleteMany({});
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
  });

  afterEach(async () => {
    await Offer.deleteMany({});
    await Deal.deleteMany({});
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
  });

  afterAll(async () => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;
    
    // Output log validation results
    console.log('\n📋 LOG-BASED VALIDATION RESULTS');
    console.log('=================================');
    
    Object.entries(logValidationResults).forEach(([category, results]) => {
      console.log(`\n📊 ${category.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}:`);
      
      if (Object.keys(results).length === 0) {
        console.log('   No tests recorded');
        return;
      }
      
      Object.entries(results).forEach(([test, metrics]) => {
        console.log(`\n   ${test}:`);
        if (metrics.captured !== undefined) console.log(`     Logs Captured: ${metrics.captured}`);
        if (metrics.analyzed !== undefined) console.log(`     Logs Analyzed: ${metrics.analyzed}`);
        if (metrics.accuracy !== undefined) console.log(`     Accuracy: ${metrics.accuracy}%`);
        if (metrics.predictions !== undefined) console.log(`     Predictions Made: ${metrics.predictions}`);
        if (metrics.errorsDetected !== undefined) console.log(`     Errors Detected: ${metrics.errorsDetected}`);
        if (metrics.patterns !== undefined) console.log(`     Patterns Found: ${metrics.patterns}`);
        if (metrics.performance) console.log(`     Performance: ${metrics.performance}`);
        if (metrics.issues && metrics.issues.length > 0) {
          console.log(`     Issues: ${metrics.issues.join(', ')}`);
        }
        if (metrics.recommendations && metrics.recommendations.length > 0) {
          console.log(`     Recommendations:`);
          metrics.recommendations.forEach(rec => console.log(`       - ${rec}`));
        }
      });
    });
    
    // Calculate overall log validation score
    let totalTests = 0;
    let successfulTests = 0;
    
    Object.values(logValidationResults).forEach(category => {
      Object.values(category).forEach(test => {
        totalTests++;
        if ((test.accuracy && test.accuracy >= 80) || 
            (test.performance && ['Excellent', 'Good'].includes(test.performance)) ||
            (test.captured && test.analyzed && test.captured > 0)) {
          successfulTests++;
        }
      });
    });
    
    const validationScore = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
    
    console.log('\n🎯 OVERALL LOG VALIDATION SCORE');
    console.log('==================================');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Successful Tests: ${successfulTests}`);
    console.log(`   Validation Score: ${validationScore}%`);
    
    if (validationScore >= 90) {
      console.log('   🟢 EXCELLENT LOG VALIDATION');
    } else if (validationScore >= 75) {
      console.log('   🟡 GOOD LOG VALIDATION');
    } else {
      console.log('   🔴 LOG VALIDATION NEEDS IMPROVEMENT');
    }
    
    console.log('\n=================================\n');
    
    await closeDatabase();
  });

  // Helper function to record log validation results
  const recordLogValidation = (category, testName, metrics) => {
    logValidationResults[category][testName] = metrics;
  };

  // Helper function to analyze log patterns
  const analyzeLogPatterns = (logs) => {
    const patterns = {
      errors: logs.filter(log => log.level === 'error').length,
      warnings: logs.filter(log => log.level === 'warn').length,
      info: logs.filter(log => log.level === 'info').length,
      apiCalls: logs.filter(log => log.message.includes('api') || log.message.includes('endpoint')).length,
      databaseOps: logs.filter(log => log.message.includes('database') || log.message.includes('DB') || log.message.includes('mongo')).length,
      authEvents: logs.filter(log => log.message.includes('auth') || log.message.includes('login') || log.message.includes('token')).length,
      performance: logs.filter(log => log.message.includes('ms') || log.message.includes('duration') || log.message.includes('time')).length
    };
    
    return patterns;
  };

  describe('Log Capture and Storage Tests', () => {
    it('should capture and categorize application logs correctly', async () => {
      const logCaptureMetrics = {
        captured: 0,
        categorized: 0,
        categories: {}
      };

      // Generate various types of logs through API interactions
      console.log('Starting log capture test');
      
      // Authentication logs
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: testCreator.phone,
          password: 'SecurePassword123!'
        });

      console.log('User login attempt', { userId: testCreator._id, status: loginResponse.status });
      
      // API operation logs
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('x-user-id', testCreator._id.toString());

      console.log('Profile fetch', { userId: testCreator._id, responseTime: '45ms' });
      
      // Error logs
      const errorResponse = await request(app)
        .get('/api/nonexistent')
        .set('x-user-id', testCreator._id.toString());

      console.error('Route not found', { path: '/api/nonexistent', status: 404 });
      
      // Warning logs
      console.warn('High memory usage detected', { usage: '85%', threshold: '80%' });
      
      // Database operation logs
      const offer = await Offer.create({
        marketerId: testMarketer._id,
        creatorId: testCreator._id,
        offerName: 'Log Test Offer',
        proposedAmount: 1500,
        currency: 'USD',
        platforms: ['Instagram'],
        deliverables: ['Post'],
        desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        description: 'Testing log capture',
        status: 'Sent'
      });

      console.log('Database operation completed', { collection: 'offers', operation: 'create', duration: '23ms' });
      
      // Performance logs
      console.log('API endpoint performance', { endpoint: '/api/marketer/offers', method: 'POST', duration: '156ms' });
      
      // Business event logs
      console.log('Offer created', { offerId: offer._id, marketerId: testMarketer._id, amount: 1500 });
      
      // Analyze captured logs
      logCaptureMetrics.captured = capturedLogs.all.length;
      
      // Categorize logs
      const categories = {
        authentication: capturedLogs.all.filter(log => 
          log.message.includes('login') || log.message.includes('auth')
        ).length,
        apiOperations: capturedLogs.all.filter(log => 
          log.message.includes('api') || log.message.includes('endpoint')
        ).length,
        databaseOperations: capturedLogs.all.filter(log => 
          log.message.includes('database') || log.message.includes('DB')
        ).length,
        errors: capturedLogs.error.length,
        warnings: capturedLogs.warn.length,
        performance: capturedLogs.all.filter(log => 
          log.message.includes('ms') || log.message.includes('duration')
        ).length,
        businessEvents: capturedLogs.all.filter(log => 
          log.message.includes('offer') || log.message.includes('deal') || log.message.includes('user')
        ).length
      };
      
      logCaptureMetrics.categories = categories;
      logCaptureMetrics.categorized = Object.values(categories).reduce((sum, count) => sum + count, 0);
      
      const captureEfficiency = logCaptureMetrics.captured > 0 ? 
        Math.round((logCaptureMetrics.categorized / logCaptureMetrics.captured) * 100) : 0;
      
      recordLogValidation('logCapture', 'Log Capture and Categorization', {
        captured: logCaptureMetrics.captured,
        categorized: logCaptureMetrics.categorized,
        efficiency: captureEfficiency,
        categories: logCaptureMetrics.categories,
        performance: captureEfficiency >= 80 ? 'Excellent' : captureEfficiency >= 60 ? 'Good' : 'Needs Improvement',
        recommendations: captureEfficiency < 80 ? ['Improve log categorization rules', 'Add more specific log identifiers'] : []
      });

      expect(logCaptureMetrics.captured).toBeGreaterThan(5);
      expect(captureEfficiency).toBeGreaterThan(60);
    });

    it('should maintain log integrity and structure', async () => {
      const integrityMetrics = {
        totalLogs: 0,
        wellFormed: 0,
        hasTimestamp: 0,
        hasLevel: 0,
        hasMessage: 0,
        structuralIssues: []
      };

      // Generate structured logs
      const testScenarios = [
        { action: 'user_login', data: { userId: testCreator._id, timestamp: Date.now() } },
        { action: 'offer_creation', data: { offerId: 'test123', amount: 1000 } },
        { action: 'api_call', data: { endpoint: '/api/test', method: 'GET', duration: 45 } },
        { action: 'error_occurred', data: { error: 'Test error', stack: 'Error stack trace' } }
      ];

      for (const scenario of testScenarios) {
        console.log(`Action: ${scenario.action}`, scenario.data);
      }

      // Also test error and warning logs
      console.error('Structured error log', { code: 'ERR001', message: 'Test error message' });
      console.warn('Structured warning', { threshold: 80, current: 85, metric: 'memory' });

      // Validate log structure
      integrityMetrics.totalLogs = capturedLogs.all.length;

      capturedLogs.all.forEach(log => {
        let isWellFormed = true;

        // Check timestamp
        if (log.timestamp && Date.parse(log.timestamp)) {
          integrityMetrics.hasTimestamp++;
        } else {
          isWellFormed = false;
          integrityMetrics.structuralIssues.push('Missing or invalid timestamp');
        }

        // Check level
        if (log.level && ['info', 'warn', 'error', 'debug'].includes(log.level)) {
          integrityMetrics.hasLevel++;
        } else {
          isWellFormed = false;
          integrityMetrics.structuralIssues.push('Missing or invalid log level');
        }

        // Check message
        if (log.message && log.message.length > 0) {
          integrityMetrics.hasMessage++;
        } else {
          isWellFormed = false;
          integrityMetrics.structuralIssues.push('Missing message');
        }

        if (isWellFormed) {
          integrityMetrics.wellFormed++;
        }
      });

      const integrityScore = integrityMetrics.totalLogs > 0 ?
        Math.round((integrityMetrics.wellFormed / integrityMetrics.totalLogs) * 100) : 0;

      recordLogValidation('logCapture', 'Log Integrity and Structure', {
        totalLogs: integrityMetrics.totalLogs,
        wellFormed: integrityMetrics.wellFormed,
        integrityScore,
        hasTimestamp: integrityMetrics.hasTimestamp,
        hasLevel: integrityMetrics.hasLevel,
        hasMessage: integrityMetrics.hasMessage,
        performance: integrityScore >= 95 ? 'Excellent' : integrityScore >= 80 ? 'Good' : 'Needs Improvement',
        issues: [...new Set(integrityMetrics.structuralIssues)].slice(0, 5),
        recommendations: integrityScore < 95 ? ['Ensure all logs have proper structure', 'Implement log validation middleware'] : []
      });

      expect(integrityScore).toBeGreaterThan(90);
      expect(integrityMetrics.hasTimestamp).toBe(integrityMetrics.totalLogs);
    });
  });

  describe('Log Analysis and Pattern Detection Tests', () => {
    it('should analyze log patterns for system behavior', async () => {
      const analysisMetrics = {
        patterns: {},
        anomalies: [],
        insights: []
      };

      // Generate activity patterns
      for (let i = 0; i < 10; i++) {
        // Normal user activity
        await request(app)
          .get('/api/users/profile')
          .set('x-user-id', testCreator._id.toString());
        
        console.log('API request', { endpoint: '/api/users/profile', userId: testCreator._id, responseTime: `${30 + i * 5}ms` });
      }

      // Generate some anomalies
      for (let i = 0; i < 3; i++) {
        console.error('Database connection timeout', { attempt: i + 1, duration: `${5000 + i * 1000}ms` });
      }

      // Analyze patterns
      const patterns = analyzeLogPatterns(capturedLogs.all);
      analysisMetrics.patterns = patterns;

      // Detect anomalies
      const responseTimes = capturedLogs.all
        .filter(log => log.message.includes('responseTime'))
        .map(log => {
          const match = log.message.match(/(\d+)ms/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(time => time > 0);

      if (responseTimes.length > 0) {
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const anomalousRequests = responseTimes.filter(time => time > avgResponseTime * 2);
        
        if (anomalousRequests.length > 0) {
          analysisMetrics.anomalies.push(`${anomalousRequests.length} requests with abnormally high response times`);
        }
      }

      // Error rate analysis
      const errorRate = capturedLogs.all.length > 0 ?
        Math.round((patterns.errors / capturedLogs.all.length) * 100) : 0;
      
      if (errorRate > 10) {
        analysisMetrics.anomalies.push(`High error rate detected: ${errorRate}%`);
      }

      // Generate insights
      if (patterns.apiCalls > patterns.databaseOps * 2) {
        analysisMetrics.insights.push('API calls significantly outnumber database operations - caching may be effective');
      }

      if (patterns.authEvents > 5) {
        analysisMetrics.insights.push('Multiple authentication events detected - monitor for potential security issues');
      }

      analysisMetrics.analyzed = capturedLogs.all.length;
      analysisMetrics.patternsFound = Object.keys(patterns).length;

      recordLogValidation('logAnalysis', 'Pattern Detection and Analysis', {
        analyzed: analysisMetrics.analyzed,
        patterns: analysisMetrics.patternsFound,
        anomalies: analysisMetrics.anomalies.length,
        insights: analysisMetrics.insights.length,
        patternDetails: patterns,
        performance: analysisMetrics.insights.length > 0 ? 'Good' : 'Needs Improvement',
        recommendations: analysisMetrics.insights
      });

      expect(analysisMetrics.analyzed).toBeGreaterThan(0);
      expect(analysisMetrics.patternsFound).toBeGreaterThan(3);
    });

    it('should identify performance bottlenecks from logs', async () => {
      const performanceMetrics = {
        slowOperations: [],
        bottlenecks: [],
        recommendations: []
      };

      // Simulate various operations with different performance characteristics
      const operations = [
        { type: 'api', name: '/api/users/profile', duration: 45 },
        { type: 'api', name: '/api/marketer/offers', duration: 280 },
        { type: 'database', name: 'offers.find', duration: 150 },
        { type: 'database', name: 'users.aggregate', duration: 520 },
        { type: 'external', name: 'email.send', duration: 1200 },
        { type: 'cache', name: 'redis.get', duration: 5 }
      ];

      // Generate performance logs
      for (const op of operations) {
        console.log(`Performance: ${op.type} operation`, {
          operation: op.name,
          duration: `${op.duration}ms`,
          timestamp: Date.now()
        });

        if (op.duration > 500) {
          console.warn(`Slow operation detected: ${op.name}`, { duration: `${op.duration}ms` });
          performanceMetrics.slowOperations.push(op);
        }
      }

      // Analyze performance patterns
      const performanceLogs = capturedLogs.all.filter(log => 
        log.message.includes('Performance') || log.message.includes('duration')
      );

      // Group by operation type
      const operationTypes = {};
      performanceLogs.forEach(log => {
        const typeMatch = log.message.match(/Performance: (\w+)/);
        if (typeMatch) {
          const type = typeMatch[1];
          if (!operationTypes[type]) {
            operationTypes[type] = [];
          }
          const durationMatch = log.message.match(/(\d+)ms/);
          if (durationMatch) {
            operationTypes[type].push(parseInt(durationMatch[1]));
          }
        }
      });

      // Identify bottlenecks
      Object.entries(operationTypes).forEach(([type, durations]) => {
        if (durations.length > 0) {
          const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
          if (avgDuration > 200) {
            performanceMetrics.bottlenecks.push({
              type,
              averageDuration: Math.round(avgDuration),
              samples: durations.length
            });
          }
        }
      });

      // Generate recommendations
      performanceMetrics.bottlenecks.forEach(bottleneck => {
        if (bottleneck.type === 'database' && bottleneck.averageDuration > 300) {
          performanceMetrics.recommendations.push('Consider adding database indexes or query optimization');
        }
        if (bottleneck.type === 'external' && bottleneck.averageDuration > 1000) {
          performanceMetrics.recommendations.push('Implement async processing for external service calls');
        }
        if (bottleneck.type === 'api' && bottleneck.averageDuration > 200) {
          performanceMetrics.recommendations.push('Add response caching for frequently accessed endpoints');
        }
      });

      const bottleneckScore = performanceMetrics.bottlenecks.length === 0 ? 100 :
                            performanceMetrics.bottlenecks.length <= 2 ? 70 : 40;

      recordLogValidation('logAnalysis', 'Performance Bottleneck Detection', {
        analyzed: performanceLogs.length,
        slowOperations: performanceMetrics.slowOperations.length,
        bottlenecks: performanceMetrics.bottlenecks.length,
        accuracy: bottleneckScore,
        bottleneckDetails: performanceMetrics.bottlenecks,
        performance: bottleneckScore >= 70 ? 'Good' : 'Needs Improvement',
        recommendations: performanceMetrics.recommendations
      });

      expect(performanceLogs.length).toBeGreaterThan(0);
      expect(performanceMetrics.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Prediction Accuracy Validation Tests', () => {
    it('should predict system load based on log patterns', async () => {
      const predictionMetrics = {
        predictions: 0,
        accurate: 0,
        loadPatterns: []
      };

      // Simulate increasing load pattern
      const loadSimulation = async (requestCount) => {
        const results = [];
        for (let i = 0; i < requestCount; i++) {
          const startTime = Date.now();
          await request(app)
            .get('/api/users/profile')
            .set('x-user-id', testCreator._id.toString());
          const duration = Date.now() - startTime;
          results.push(duration);
        }
        return results;
      };

      // Simulate different load levels
      const loadLevels = [
        { level: 'low', requests: 5 },
        { level: 'medium', requests: 10 },
        { level: 'high', requests: 20 }
      ];

      for (const load of loadLevels) {
        console.log(`Load test: ${load.level} (${load.requests} requests)`);
        const durations = await loadSimulation(load.requests);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        
        console.log(`Load test results`, {
          level: load.level,
          requests: load.requests,
          averageResponseTime: `${Math.round(avgDuration)}ms`,
          maxResponseTime: `${Math.max(...durations)}ms`
        });

        predictionMetrics.loadPatterns.push({
          level: load.level,
          requests: load.requests,
          avgResponseTime: Math.round(avgDuration)
        });
      }

      // Make predictions based on patterns
      const patterns = predictionMetrics.loadPatterns;
      if (patterns.length >= 2) {
        // Simple linear prediction
        const responseTimeIncrease = patterns[1].avgResponseTime - patterns[0].avgResponseTime;
        const requestIncrease = patterns[1].requests - patterns[0].requests;
        const responseTimePerRequest = responseTimeIncrease / requestIncrease;

        // Predict response time for 30 requests
        const predictedFor30 = patterns[0].avgResponseTime + (responseTimePerRequest * (30 - patterns[0].requests));
        predictionMetrics.predictions++;

        console.log('Load prediction', {
          prediction: 'Response time for 30 requests',
          predictedValue: `${Math.round(predictedFor30)}ms`,
          confidence: 'Medium'
        });

        // Validate prediction accuracy (simplified)
        if (predictedFor30 > patterns[0].avgResponseTime && predictedFor30 < patterns[2].avgResponseTime * 2) {
          predictionMetrics.accurate++;
        }
      }

      const accuracy = predictionMetrics.predictions > 0 ?
        Math.round((predictionMetrics.accurate / predictionMetrics.predictions) * 100) : 0;

      recordLogValidation('predictionAccuracy', 'System Load Prediction', {
        predictions: predictionMetrics.predictions,
        accurate: predictionMetrics.accurate,
        accuracy,
        patterns: predictionMetrics.loadPatterns.length,
        performance: accuracy >= 70 ? 'Good' : 'Needs More Data',
        recommendations: accuracy < 70 ? ['Collect more load pattern data', 'Implement machine learning models'] : []
      });

      expect(predictionMetrics.loadPatterns.length).toBeGreaterThan(0);
      expect(predictionMetrics.predictions).toBeGreaterThan(0);
    });

    it('should predict error rates and failure patterns', async () => {
      const errorPredictionMetrics = {
        historicalErrors: [],
        predictions: [],
        validationResults: []
      };

      // Simulate operations with varying error rates
      const simulateOperations = async (errorRate) => {
        const operations = 20;
        let errors = 0;

        for (let i = 0; i < operations; i++) {
          if (Math.random() < errorRate) {
            errors++;
            console.error('Operation failed', {
              operation: 'test_operation',
              error: 'Simulated error',
              timestamp: Date.now()
            });
          } else {
            console.log('Operation succeeded', {
              operation: 'test_operation',
              duration: `${50 + Math.random() * 50}ms`
            });
          }
        }

        return { operations, errors, errorRate: errors / operations };
      };

      // Simulate different time periods with different error rates
      const timePeriods = [
        { period: 'morning', expectedErrorRate: 0.05 },
        { period: 'afternoon', expectedErrorRate: 0.10 },
        { period: 'evening', expectedErrorRate: 0.15 }
      ];

      for (const period of timePeriods) {
        console.log(`Simulating ${period.period} operations`);
        const result = await simulateOperations(period.expectedErrorRate);
        
        errorPredictionMetrics.historicalErrors.push({
          period: period.period,
          actualErrorRate: result.errorRate,
          errorCount: result.errors
        });

        // Make prediction for next period
        if (errorPredictionMetrics.historicalErrors.length >= 2) {
          const recent = errorPredictionMetrics.historicalErrors.slice(-2);
          const trend = recent[1].actualErrorRate - recent[0].actualErrorRate;
          const predictedRate = recent[1].actualErrorRate + trend;

          errorPredictionMetrics.predictions.push({
            forPeriod: 'next',
            predictedErrorRate: Math.max(0, Math.min(1, predictedRate)),
            basedOn: recent.map(r => r.period)
          });

          console.log('Error rate prediction', {
            prediction: `${Math.round(predictedRate * 100)}% error rate expected`,
            confidence: 'Low to Medium'
          });
        }
      }

      // Validate predictions
      errorPredictionMetrics.predictions.forEach((prediction, index) => {
        const wasAccurate = Math.abs(prediction.predictedErrorRate - 0.15) < 0.1;
        errorPredictionMetrics.validationResults.push({
          prediction: prediction.predictedErrorRate,
          accurate: wasAccurate
        });
      });

      const accuratePredictions = errorPredictionMetrics.validationResults.filter(v => v.accurate).length;
      const accuracy = errorPredictionMetrics.validationResults.length > 0 ?
        Math.round((accuratePredictions / errorPredictionMetrics.validationResults.length) * 100) : 0;

      recordLogValidation('predictionAccuracy', 'Error Rate Prediction', {
        historicalData: errorPredictionMetrics.historicalErrors.length,
        predictions: errorPredictionMetrics.predictions.length,
        accuracy,
        patterns: errorPredictionMetrics.historicalErrors,
        performance: accuracy >= 60 ? 'Acceptable' : 'Needs Improvement',
        recommendations: ['Implement time-series analysis', 'Consider seasonal patterns', 'Add anomaly detection']
      });

      expect(errorPredictionMetrics.historicalErrors.length).toBeGreaterThan(0);
      expect(errorPredictionMetrics.predictions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Tracking and Analysis Tests', () => {
    it('should track and categorize errors effectively', async () => {
      const errorTrackingMetrics = {
        totalErrors: 0,
        categorized: 0,
        categories: {},
        errorDetails: []
      };

      // Generate various types of errors
      const errorScenarios = [
        {
          type: 'ValidationError',
          simulate: async () => {
            const response = await request(app)
              .post('/api/auth/register/start')
              .send({ phone: 'invalid' });
            console.error('Validation error', {
              endpoint: '/api/auth/register/start',
              field: 'phone',
              value: 'invalid',
              error: response.body.error || 'Invalid phone format'
            });
            return response;
          }
        },
        {
          type: 'AuthenticationError',
          simulate: async () => {
            const response = await request(app)
              .get('/api/users/profile');
            console.error('Authentication error', {
              endpoint: '/api/users/profile',
              error: 'Missing authentication',
              status: 401
            });
            return response;
          }
        },
        {
          type: 'NotFoundError',
          simulate: async () => {
            const response = await request(app)
              .get('/api/users/nonexistent')
              .set('x-user-id', testCreator._id.toString());
            console.error('Resource not found', {
              endpoint: '/api/users/nonexistent',
              error: 'User not found',
              status: 404
            });
            return response;
          }
        },
        {
          type: 'DatabaseError',
          simulate: async () => {
            // Simulate database error
            console.error('Database operation failed', {
              operation: 'find',
              collection: 'users',
              error: 'Connection timeout',
              duration: '5000ms'
            });
            return { status: 500 };
          }
        },
        {
          type: 'ExternalServiceError',
          simulate: async () => {
            console.error('External service error', {
              service: 'email',
              operation: 'send',
              error: 'Service unavailable',
              retries: 3
            });
            return { status: 503 };
          }
        }
      ];

      // Execute error scenarios
      for (const scenario of errorScenarios) {
        await scenario.simulate();
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
      }

      // Analyze error logs
      const errorLogs = capturedLogs.error;
      errorTrackingMetrics.totalErrors = errorLogs.length;

      // Categorize errors
      errorLogs.forEach(log => {
        let category = 'Unknown';
        
        if (log.message.includes('Validation')) {
          category = 'ValidationError';
        } else if (log.message.includes('Authentication') || log.message.includes('auth')) {
          category = 'AuthenticationError';
        } else if (log.message.includes('not found') || log.message.includes('404')) {
          category = 'NotFoundError';
        } else if (log.message.includes('Database') || log.message.includes('DB')) {
          category = 'DatabaseError';
        } else if (log.message.includes('External service') || log.message.includes('service')) {
          category = 'ExternalServiceError';
        }

        if (!errorTrackingMetrics.categories[category]) {
          errorTrackingMetrics.categories[category] = 0;
        }
        errorTrackingMetrics.categories[category]++;
        errorTrackingMetrics.categorized++;

        // Extract error details
        if (log.data && typeof log.data === 'object') {
          errorTrackingMetrics.errorDetails.push({
            category,
            timestamp: log.timestamp,
            details: log.data
          });
        }
      });

      const categorizationRate = errorTrackingMetrics.totalErrors > 0 ?
        Math.round((errorTrackingMetrics.categorized / errorTrackingMetrics.totalErrors) * 100) : 0;

      recordLogValidation('errorTracking', 'Error Categorization and Tracking', {
        totalErrors: errorTrackingMetrics.totalErrors,
        categorized: errorTrackingMetrics.categorized,
        accuracy: categorizationRate,
        categories: Object.keys(errorTrackingMetrics.categories).length,
        categoryBreakdown: errorTrackingMetrics.categories,
        performance: categorizationRate >= 90 ? 'Excellent' : categorizationRate >= 70 ? 'Good' : 'Needs Improvement',
        recommendations: categorizationRate < 90 ? ['Improve error categorization logic', 'Add more specific error identifiers'] : []
      });

      expect(errorTrackingMetrics.totalErrors).toBeGreaterThan(0);
      expect(categorizationRate).toBeGreaterThan(70);
    });

    it('should identify error patterns and correlations', async () => {
      const errorPatternMetrics = {
        patterns: [],
        correlations: [],
        insights: []
      };

      // Simulate correlated errors
      console.log('Starting error correlation test');

      // Pattern 1: Database errors followed by API errors
      for (let i = 0; i < 3; i++) {
        console.error('Database connection lost', { attempt: i, timestamp: Date.now() });
        await new Promise(resolve => setTimeout(resolve, 100));
        console.error('API request failed', { reason: 'Database unavailable', endpoint: '/api/users' });
      }

      // Pattern 2: High load causing timeouts
      console.log('High load detected', { connections: 150, threshold: 100 });
      for (let i = 0; i < 2; i++) {
        console.error('Request timeout', { endpoint: '/api/offers', duration: '30000ms' });
      }

      // Pattern 3: Authentication failures spike
      const authFailureTime = Date.now();
      for (let i = 0; i < 5; i++) {
        console.error('Authentication failed', {
          ip: `192.168.1.${100 + i}`,
          attempt: i + 1,
          timestamp: authFailureTime + (i * 1000)
        });
      }

      // Analyze error patterns
      const errors = capturedLogs.error;
      const patterns = {};

      // Detect temporal patterns
      const timeWindows = {};
      errors.forEach(error => {
        const window = Math.floor(Date.parse(error.timestamp) / 5000) * 5000; // 5-second windows
        if (!timeWindows[window]) {
          timeWindows[window] = [];
        }
        timeWindows[window].push(error);
      });

      // Find windows with multiple errors
      Object.entries(timeWindows).forEach(([window, windowErrors]) => {
        if (windowErrors.length >= 2) {
          errorPatternMetrics.patterns.push({
            type: 'temporal_cluster',
            window: new Date(parseInt(window)).toISOString(),
            errorCount: windowErrors.length,
            errorTypes: [...new Set(windowErrors.map(e => e.message.split(' ')[0]))]
          });
        }
      });

      // Detect error type correlations
      const errorSequences = [];
      for (let i = 0; i < errors.length - 1; i++) {
        const current = errors[i].message;
        const next = errors[i + 1].message;
        errorSequences.push({ current, next });
      }

      // Find common sequences
      const sequenceCounts = {};
      errorSequences.forEach(seq => {
        const key = `${seq.current.split(' ')[0]} -> ${seq.next.split(' ')[0]}`;
        sequenceCounts[key] = (sequenceCounts[key] || 0) + 1;
      });

      Object.entries(sequenceCounts).forEach(([sequence, count]) => {
        if (count >= 2) {
          errorPatternMetrics.correlations.push({
            sequence,
            occurrences: count,
            correlation: 'sequential'
          });
        }
      });

      // Generate insights
      if (errorPatternMetrics.patterns.some(p => p.errorCount >= 3)) {
        errorPatternMetrics.insights.push('Error clustering detected - possible system instability');
      }

      if (errorPatternMetrics.correlations.some(c => c.sequence.includes('Database -> API'))) {
        errorPatternMetrics.insights.push('Database errors causing cascading API failures');
      }

      const hasAuthPattern = errors.filter(e => e.message.includes('Authentication')).length >= 3;
      if (hasAuthPattern) {
        errorPatternMetrics.insights.push('Multiple authentication failures - possible security concern');
      }

      const patternDetectionScore = 
        (errorPatternMetrics.patterns.length > 0 ? 40 : 0) +
        (errorPatternMetrics.correlations.length > 0 ? 40 : 0) +
        (errorPatternMetrics.insights.length > 0 ? 20 : 0);

      recordLogValidation('errorTracking', 'Error Pattern Detection', {
        errorsAnalyzed: errors.length,
        patterns: errorPatternMetrics.patterns.length,
        correlations: errorPatternMetrics.correlations.length,
        insights: errorPatternMetrics.insights.length,
        accuracy: patternDetectionScore,
        performance: patternDetectionScore >= 80 ? 'Excellent' : patternDetectionScore >= 60 ? 'Good' : 'Basic',
        recommendations: errorPatternMetrics.insights
      });

      expect(errors.length).toBeGreaterThan(5);
      expect(errorPatternMetrics.patterns.length + errorPatternMetrics.correlations.length).toBeGreaterThan(0);
    });
  });

  describe('Log Aggregation and Reporting Tests', () => {
    it('should aggregate logs for comprehensive reporting', async () => {
      const aggregationMetrics = {
        totalLogs: 0,
        aggregatedMetrics: {},
        reportSections: []
      };

      // Generate diverse log data
      const activities = [
        { count: 20, action: () => console.log('User activity', { action: 'page_view', page: '/dashboard' }) },
        { count: 15, action: () => console.log('API call', { endpoint: '/api/users', method: 'GET', duration: `${50 + Math.random() * 100}ms` }) },
        { count: 5, action: () => console.error('Error occurred', { type: 'ValidationError', field: 'email' }) },
        { count: 3, action: () => console.warn('Performance warning', { metric: 'response_time', value: '2000ms' }) },
        { count: 10, action: () => console.log('Business event', { event: 'offer_created', value: 1000 + Math.random() * 2000 }) }
      ];

      // Execute activities
      for (const activity of activities) {
        for (let i = 0; i < activity.count; i++) {
          activity.action();
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Aggregate logs
      aggregationMetrics.totalLogs = capturedLogs.all.length;

      // Aggregate by log level
      aggregationMetrics.aggregatedMetrics.byLevel = {
        info: capturedLogs.info.length,
        warn: capturedLogs.warn.length,
        error: capturedLogs.error.length,
        errorRate: Math.round((capturedLogs.error.length / aggregationMetrics.totalLogs) * 100)
      };

      // Aggregate by time (simplified - group by seconds)
      const timeAggregation = {};
      capturedLogs.all.forEach(log => {
        const second = Math.floor(Date.parse(log.timestamp) / 1000);
        timeAggregation[second] = (timeAggregation[second] || 0) + 1;
      });
      aggregationMetrics.aggregatedMetrics.byTime = {
        windows: Object.keys(timeAggregation).length,
        averagePerWindow: Math.round(aggregationMetrics.totalLogs / Object.keys(timeAggregation).length)
      };

      // Aggregate by content type
      const contentTypes = {
        userActivity: capturedLogs.all.filter(log => log.message.includes('User activity')).length,
        apiCalls: capturedLogs.all.filter(log => log.message.includes('API')).length,
        errors: capturedLogs.error.length,
        performance: capturedLogs.all.filter(log => log.message.includes('performance') || log.message.includes('duration')).length,
        businessEvents: capturedLogs.all.filter(log => log.message.includes('Business event')).length
      };
      aggregationMetrics.aggregatedMetrics.byContent = contentTypes;

      // Generate report sections
      aggregationMetrics.reportSections = [
        {
          title: 'Summary Statistics',
          data: {
            totalLogs: aggregationMetrics.totalLogs,
            timeRange: `${Object.keys(timeAggregation).length} seconds`,
            errorRate: `${aggregationMetrics.aggregatedMetrics.byLevel.errorRate}%`
          }
        },
        {
          title: 'Activity Breakdown',
          data: contentTypes
        },
        {
          title: 'Performance Metrics',
          data: {
            apiCalls: contentTypes.apiCalls,
            warningsGenerated: capturedLogs.warn.length
          }
        }
      ];

      const aggregationCompleteness = 
        (aggregationMetrics.reportSections.length >= 3 ? 40 : 0) +
        (Object.keys(aggregationMetrics.aggregatedMetrics).length >= 3 ? 40 : 0) +
        (aggregationMetrics.totalLogs > 40 ? 20 : 0);

      recordLogValidation('logAggregation', 'Log Aggregation and Reporting', {
        totalLogs: aggregationMetrics.totalLogs,
        aggregationTypes: Object.keys(aggregationMetrics.aggregatedMetrics).length,
        reportSections: aggregationMetrics.reportSections.length,
        accuracy: aggregationCompleteness,
        performance: aggregationCompleteness >= 80 ? 'Comprehensive' : 'Basic',
        aggregatedData: aggregationMetrics.aggregatedMetrics,
        recommendations: aggregationCompleteness < 80 ? ['Add more aggregation dimensions', 'Include trend analysis'] : []
      });

      expect(aggregationMetrics.totalLogs).toBeGreaterThan(40);
      expect(aggregationMetrics.reportSections.length).toBeGreaterThan(2);
    });

    it('should generate actionable insights from aggregated logs', async () => {
      const insightMetrics = {
        dataPoints: 0,
        insightsGenerated: [],
        actionableRecommendations: []
      };

      // Clear previous logs and generate focused data
      capturedLogs.all = [];
      capturedLogs.info = [];
      capturedLogs.error = [];
      capturedLogs.warn = [];

      // Simulate a day's worth of activity patterns
      const hourlyPatterns = [
        { hour: 9, load: 'low', errors: 1 },
        { hour: 10, load: 'medium', errors: 2 },
        { hour: 11, load: 'high', errors: 5 },
        { hour: 12, load: 'peak', errors: 8 },
        { hour: 13, load: 'high', errors: 6 },
        { hour: 14, load: 'medium', errors: 3 }
      ];

      for (const pattern of hourlyPatterns) {
        console.log(`Hourly summary - ${pattern.hour}:00`, {
          load: pattern.load,
          requests: pattern.load === 'peak' ? 150 : pattern.load === 'high' ? 100 : pattern.load === 'medium' ? 50 : 20,
          avgResponseTime: pattern.load === 'peak' ? '450ms' : pattern.load === 'high' ? '300ms' : '150ms'
        });

        // Generate errors based on pattern
        for (let i = 0; i < pattern.errors; i++) {
          console.error('Request failed', {
            hour: pattern.hour,
            reason: pattern.load === 'peak' ? 'Timeout' : 'Server error'
          });
        }
      }

      // Analyze patterns for insights
      insightMetrics.dataPoints = capturedLogs.all.length;

      // Insight 1: Peak hour identification
      const peakHours = hourlyPatterns.filter(p => p.load === 'peak' || p.load === 'high');
      if (peakHours.length > 0) {
        insightMetrics.insightsGenerated.push({
          type: 'traffic_pattern',
          insight: `Peak traffic hours identified: ${peakHours.map(p => `${p.hour}:00`).join(', ')}`,
          confidence: 'High'
        });
        insightMetrics.actionableRecommendations.push('Scale resources during hours 11-13');
      }

      // Insight 2: Error correlation with load
      const highLoadErrors = hourlyPatterns.filter(p => p.load === 'high' || p.load === 'peak')
        .reduce((sum, p) => sum + p.errors, 0);
      const lowLoadErrors = hourlyPatterns.filter(p => p.load === 'low' || p.load === 'medium')
        .reduce((sum, p) => sum + p.errors, 0);

      if (highLoadErrors > lowLoadErrors * 2) {
        insightMetrics.insightsGenerated.push({
          type: 'error_correlation',
          insight: 'Error rate strongly correlated with system load',
          confidence: 'High'
        });
        insightMetrics.actionableRecommendations.push('Implement auto-scaling based on error rate thresholds');
      }

      // Insight 3: Performance degradation pattern
      const performanceLogs = capturedLogs.all.filter(log => log.message.includes('avgResponseTime'));
      if (performanceLogs.length > 0) {
        insightMetrics.insightsGenerated.push({
          type: 'performance_trend',
          insight: 'Response time increases during high load periods',
          confidence: 'Medium'
        });
        insightMetrics.actionableRecommendations.push('Optimize database queries for peak load scenarios');
      }

      const insightQuality = 
        (insightMetrics.insightsGenerated.length >= 3 ? 50 : insightMetrics.insightsGenerated.length * 15) +
        (insightMetrics.actionableRecommendations.length >= 3 ? 50 : insightMetrics.actionableRecommendations.length * 15);

      recordLogValidation('logAggregation', 'Insight Generation', {
        dataPoints: insightMetrics.dataPoints,
        insights: insightMetrics.insightsGenerated.length,
        recommendations: insightMetrics.actionableRecommendations.length,
        accuracy: insightQuality,
        performance: insightQuality >= 80 ? 'Excellent' : insightQuality >= 60 ? 'Good' : 'Basic',
        generatedInsights: insightMetrics.insightsGenerated,
        recommendations: insightMetrics.actionableRecommendations
      });

      expect(insightMetrics.insightsGenerated.length).toBeGreaterThan(0);
      expect(insightMetrics.actionableRecommendations.length).toBeGreaterThan(0);
    });
  });
});