const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const Offer = require('../../models/offer');
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');

describe('Latency Measurement Framework', () => {
  const latencyMetrics = {
    apiEndpoints: {},
    databaseOperations: {},
    concurrentLoad: {},
    networkLatency: {},
    systemPerformance: {}
  };

  let testUsers = [];
  let testData = {};

  beforeAll(async () => {
    await connect();
    
    // Create test data for latency measurements
    const hashedPassword = await require('bcrypt').hash('TestPassword123!', 10);
    
    // Create test users
    for (let i = 0; i < 5; i++) {
      const user = await User.create({
        phone: `+1212555${4000 + i}`,
        name: `Latency Test User ${i}`,
        userName: `latency_user_${i}`,
        email: `latency${i}@test.com`,
        password: hashedPassword,
        userType: i < 2 ? 'Marketer' : 'Creator',
        isActive: true,
        platforms: [{
          platform: 'instagram',
          handle: `@latency_user_${i}`,
          followersCount: 1000 + (i * 500)
        }],
        ...(i < 2 ? {
          marketerData: {
            companyName: `Latency Company ${i}`,
            industry: 'Technology',
            website: `https://latency${i}.com`,
            businessLicense: `LAT${i}`,
            totalCampaigns: 5,
            successfulCampaigns: 4,
            averageRating: 4.5
          }
        } : {
          creatorData: {
            platforms: ['Instagram'],
            categories: ['technology'],
            nicheTopics: ['tech'],
            achievements: `Latency achievements ${i}`,
            businessVentures: `Latency business ${i}`,
            portfolio: [],
            totalFollowers: 1000 + (i * 500)
          }
        })
      });
      testUsers.push(user);
    }

    testData.users = testUsers;
  });

  beforeEach(async () => {
    // Clear transactional data for clean latency tests
    await Offer.deleteMany({});
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
  });

  afterAll(async () => {
    // Output comprehensive latency analysis
    console.log('\n⚡ LATENCY MEASUREMENT FRAMEWORK RESULTS');
    console.log('========================================');
    
    Object.entries(latencyMetrics).forEach(([category, results]) => {
      console.log(`\n📊 ${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`);
      
      if (Object.keys(results).length === 0) {
        console.log('   No measurements recorded');
        return;
      }
      
      Object.entries(results).forEach(([test, metrics]) => {
        console.log(`\n   🔍 ${test}:`);
        if (metrics.average !== undefined) {
          console.log(`      Average: ${metrics.average}ms`);
          console.log(`      Min: ${metrics.min}ms`);
          console.log(`      Max: ${metrics.max}ms`);
          console.log(`      P95: ${metrics.p95 || 'N/A'}ms`);
          console.log(`      P99: ${metrics.p99 || 'N/A'}ms`);
          console.log(`      Samples: ${metrics.samples || metrics.measurements?.length || 0}`);
          
          if (metrics.successRate !== undefined) {
            console.log(`      Success Rate: ${metrics.successRate}%`);
          }
          
          if (metrics.rps !== undefined) {
            console.log(`      Requests/sec: ${metrics.rps}`);
          }
        } else {
          console.log(`      ${JSON.stringify(metrics, null, 6)}`);
        }
      });
    });
    
    // Performance benchmarks and recommendations
    console.log('\n🎯 PERFORMANCE BENCHMARKS');
    console.log('==========================');
    
    const allLatencies = Object.values(latencyMetrics)
      .flatMap(category => Object.values(category))
      .filter(metric => metric.average !== undefined);
    
    if (allLatencies.length > 0) {
      const avgLatencies = allLatencies.map(m => m.average);
      const overallAverage = avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length;
      const fastOperations = allLatencies.filter(m => m.average < 100).length;
      const slowOperations = allLatencies.filter(m => m.average > 500).length;
      
      console.log(`   Overall Average Latency: ${Math.round(overallAverage)}ms`);
      console.log(`   Fast Operations (<100ms): ${fastOperations}/${allLatencies.length}`);
      console.log(`   Slow Operations (>500ms): ${slowOperations}/${allLatencies.length}`);
      
      if (overallAverage < 200) {
        console.log('   🟢 EXCELLENT PERFORMANCE');
      } else if (overallAverage < 500) {
        console.log('   🟡 GOOD PERFORMANCE');
      } else {
        console.log('   🔴 PERFORMANCE OPTIMIZATION NEEDED');
      }
    }
    
    console.log('\n========================================\n');
    
    await closeDatabase();
  });

  // Helper function to record latency measurements
  const recordLatency = (category, testName, measurements, additionalMetrics = {}) => {
    if (!Array.isArray(measurements)) {
      measurements = [measurements];
    }
    
    const sorted = measurements.sort((a, b) => a - b);
    const average = Math.round(measurements.reduce((a, b) => a + b, 0) / measurements.length);
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const p95Index = Math.floor(measurements.length * 0.95);
    const p99Index = Math.floor(measurements.length * 0.99);
    
    latencyMetrics[category][testName] = {
      measurements,
      average,
      min,
      max,
      p95: sorted[p95Index] || max,
      p99: sorted[p99Index] || max,
      samples: measurements.length,
      ...additionalMetrics
    };
  };

  // Helper function to measure operation latency
  const measureLatency = async (operation, iterations = 10) => {
    const measurements = [];
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      
      try {
        const result = await operation();
        const endTime = process.hrtime.bigint();
        const latencyMs = Number((endTime - startTime) / 1000000n); // Convert to milliseconds
        
        measurements.push(latencyMs);
        results.push({ success: true, result, latency: latencyMs });
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const latencyMs = Number((endTime - startTime) / 1000000n);
        
        measurements.push(latencyMs);
        results.push({ success: false, error: error.message, latency: latencyMs });
      }
    }
    
    const successRate = Math.round((results.filter(r => r.success).length / results.length) * 100);
    
    return {
      measurements,
      results,
      successRate
    };
  };

  describe('API Endpoint Latency Measurements', () => {
    it('should measure authentication endpoint latency', async () => {
      const { measurements, successRate } = await measureLatency(async () => {
        return request(app)
          .post('/api/auth/login')
          .send({
            phone: testUsers[0].phone,
            password: 'TestPassword123!'
          });
      }, 15);

      recordLatency('apiEndpoints', 'Authentication Login', measurements, { successRate });

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(1000); // Authentication should be under 1 second
      expect(successRate).toBeGreaterThan(80); // 80% success rate minimum
    });

    it('should measure user profile retrieval latency', async () => {
      const { measurements, successRate } = await measureLatency(async () => {
        return request(app)
          .get('/api/users/profile')
          .set('x-user-id', testUsers[0]._id.toString());
      }, 20);

      recordLatency('apiEndpoints', 'User Profile Retrieval', measurements, { successRate });

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(300); // Profile retrieval should be fast
      expect(successRate).toBeGreaterThan(90); // High success rate expected
    });

    it('should measure offer creation latency', async () => {
      const marketer = testUsers.find(u => u.userType === 'Marketer');
      const creator = testUsers.find(u => u.userType === 'Creator');

      const { measurements, successRate } = await measureLatency(async () => {
        return request(app)
          .post('/api/marketer/offers')
          .set('x-user-id', marketer._id.toString())
          .send({
            creatorId: creator._id.toString(),
            offerName: `Latency Test Offer ${Date.now()}`,
            proposedAmount: 1000,
            currency: 'USD',
            platforms: ['Instagram'],
            deliverables: ['Post'],
            desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            description: 'Latency test offer'
          });
      }, 10);

      recordLatency('apiEndpoints', 'Offer Creation', measurements, { successRate });

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(500); // Offer creation should be reasonably fast
      expect(successRate).toBeGreaterThan(85); // Good success rate
    });

    it('should measure chat message sending latency', async () => {
      // Create a chat room first
      const marketer = testUsers.find(u => u.userType === 'Marketer');
      const creator = testUsers.find(u => u.userType === 'Creator');
      
      const chatRoom = await ChatRoom.create({
        participants: [marketer._id, creator._id],
        lastMessage: {
          text: 'Initial setup',
          sender: marketer._id,
          createdAt: new Date()
        },
        unreadCount: {
          [marketer._id.toString()]: 0,
          [creator._id.toString()]: 0
        }
      });

      const { measurements, successRate } = await measureLatency(async () => {
        return request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketer._id.toString())
          .send({
            text: `Latency test message ${Date.now()}`,
            receiverId: creator._id.toString(),
            roomId: chatRoom._id.toString()
          });
      }, 15);

      recordLatency('apiEndpoints', 'Chat Message Sending', measurements, { successRate });

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(400); // Message sending should be fast for real-time feel
      expect(successRate).toBeGreaterThan(90); // High success rate for messaging
    });
  });

  describe('Database Operation Latency', () => {
    it('should measure user query latency', async () => {
      const { measurements } = await measureLatency(async () => {
        return User.findById(testUsers[0]._id);
      }, 25);

      recordLatency('databaseOperations', 'User Query by ID', measurements);

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(50); // Direct DB queries should be very fast
    });

    it('should measure complex aggregation latency', async () => {
      // Create some offers for aggregation
      const marketer = testUsers.find(u => u.userType === 'Marketer');
      const creator = testUsers.find(u => u.userType === 'Creator');
      
      for (let i = 0; i < 10; i++) {
        await Offer.create({
          marketerId: marketer._id,
          creatorId: creator._id,
          offerName: `Aggregation Test Offer ${i}`,
          proposedAmount: 1000 + (i * 100),
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: `Aggregation test ${i}`,
          status: ['Sent', 'Accepted', 'Rejected'][i % 3]
        });
      }

      const { measurements } = await measureLatency(async () => {
        return Offer.aggregate([
          { $match: { marketerId: marketer._id } },
          { $group: { _id: '$status', count: { $sum: 1 }, avgAmount: { $avg: '$proposedAmount' } } },
          { $sort: { count: -1 } }
        ]);
      }, 15);

      recordLatency('databaseOperations', 'Offer Aggregation', measurements);

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(200); // Aggregations should be optimized
    });

    it('should measure batch insert latency', async () => {
      const { measurements } = await measureLatency(async () => {
        const batchMessages = Array.from({ length: 20 }, (_, i) => ({
          chatId: testUsers[0]._id, // Using user ID as placeholder
          senderId: testUsers[0]._id,
          text: `Batch message ${i} - ${Date.now()}`,
          createdAt: new Date()
        }));
        
        return Message.insertMany(batchMessages);
      }, 10);

      recordLatency('databaseOperations', 'Batch Insert (20 messages)', measurements);

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(300); // Batch operations should be efficient
    });

    it('should measure text search latency', async () => {
      const { measurements } = await measureLatency(async () => {
        return User.find({
          $or: [
            { name: { $regex: 'Test', $options: 'i' } },
            { userName: { $regex: 'test', $options: 'i' } }
          ]
        }).limit(10);
      }, 20);

      recordLatency('databaseOperations', 'Text Search', measurements);

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(150); // Text searches should be reasonably fast
    });
  });

  describe('Concurrent Load Latency', () => {
    it('should measure latency under concurrent user load', async () => {
      const concurrentRequests = 20;
      const startTime = process.hrtime.bigint();
      
      // Create concurrent requests
      const promises = Array.from({ length: concurrentRequests }, (_, i) => {
        const userIndex = i % testUsers.length;
        const measureStart = process.hrtime.bigint();
        
        return request(app)
          .get('/api/users/profile')
          .set('x-user-id', testUsers[userIndex]._id.toString())
          .then(response => {
            const measureEnd = process.hrtime.bigint();
            return {
              latency: Number((measureEnd - measureStart) / 1000000n),
              status: response.status,
              success: response.status === 200
            };
          })
          .catch(error => {
            const measureEnd = process.hrtime.bigint();
            return {
              latency: Number((measureEnd - measureStart) / 1000000n),
              status: 0,
              success: false,
              error: error.message
            };
          });
      });

      const results = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number((endTime - startTime) / 1000000n);
      
      const measurements = results.map(r => r.latency);
      const successRate = Math.round((results.filter(r => r.success).length / results.length) * 100);
      const rps = Math.round((concurrentRequests * 1000) / totalTime);

      recordLatency('concurrentLoad', `${concurrentRequests} Concurrent Requests`, measurements, { 
        successRate, 
        rps,
        totalTime 
      });

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(800); // Should handle concurrent load reasonably
      expect(successRate).toBeGreaterThan(80); // Most requests should succeed
      expect(rps).toBeGreaterThan(10); // Reasonable throughput
    });

    it('should measure database latency under concurrent load', async () => {
      const concurrentQueries = 15;
      const startTime = process.hrtime.bigint();
      
      const promises = Array.from({ length: concurrentQueries }, (_, i) => {
        const userIndex = i % testUsers.length;
        const measureStart = process.hrtime.bigint();
        
        return User.findById(testUsers[userIndex]._id)
          .then(result => {
            const measureEnd = process.hrtime.bigint();
            return {
              latency: Number((measureEnd - measureStart) / 1000000n),
              success: !!result
            };
          })
          .catch(error => {
            const measureEnd = process.hrtime.bigint();
            return {
              latency: Number((measureEnd - measureStart) / 1000000n),
              success: false,
              error: error.message
            };
          });
      });

      const results = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number((endTime - startTime) / 1000000n);
      
      const measurements = results.map(r => r.latency);
      const successRate = Math.round((results.filter(r => r.success).length / results.length) * 100);
      const qps = Math.round((concurrentQueries * 1000) / totalTime);

      recordLatency('concurrentLoad', `${concurrentQueries} Concurrent DB Queries`, measurements, { 
        successRate, 
        qps,
        totalTime 
      });

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(100); // DB should handle concurrent queries well
      expect(successRate).toBe(100); // All DB queries should succeed
      expect(qps).toBeGreaterThan(50); // Good database throughput
    });
  });

  describe('Network and System Latency', () => {
    it('should measure memory allocation latency', async () => {
      const { measurements } = await measureLatency(async () => {
        // Simulate memory-intensive operation
        const largeArray = new Array(10000).fill(0).map((_, i) => ({
          id: i,
          data: `test data ${i}`,
          timestamp: Date.now()
        }));
        
        // Perform some operations on the array
        const filtered = largeArray.filter(item => item.id % 2 === 0);
        return filtered.length;
      }, 20);

      recordLatency('systemPerformance', 'Memory Allocation (10k objects)', measurements);

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(50); // Memory operations should be very fast
    });

    it('should measure JSON parsing latency', async () => {
      const largeObject = {
        users: testUsers.map(user => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          metadata: {
            createdAt: user.createdAt,
            platforms: user.platforms,
            description: 'Large JSON parsing test data'
          }
        })),
        metadata: {
          count: testUsers.length,
          generated: new Date(),
          test: 'latency measurement'
        }
      };

      const jsonString = JSON.stringify(largeObject);

      const { measurements } = await measureLatency(async () => {
        return JSON.parse(jsonString);
      }, 25);

      recordLatency('systemPerformance', 'JSON Parsing', measurements, {
        dataSize: Math.round(jsonString.length / 1024) // Size in KB
      });

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(10); // JSON parsing should be extremely fast
    });

    it('should measure crypto operations latency', async () => {
      const bcrypt = require('bcrypt');
      
      const { measurements } = await measureLatency(async () => {
        return bcrypt.hash('test-password-for-latency', 10);
      }, 5); // Fewer iterations since bcrypt is intentionally slow

      recordLatency('systemPerformance', 'Password Hashing (bcrypt)', measurements);

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(average).toBeLessThan(500); // bcrypt should complete within reasonable time
      expect(average).toBeGreaterThan(50); // bcrypt should take some time for security
    });
  });

  describe('Latency Regression Detection', () => {
    it('should establish baseline performance metrics', async () => {
      // This test establishes baseline metrics for regression testing
      const baselineTests = [
        {
          name: 'Simple User Query',
          operation: () => User.findById(testUsers[0]._id),
          expected: 50 // ms
        },
        {
          name: 'Basic API Request',
          operation: () => request(app).get('/'),
          expected: 200 // ms
        },
        {
          name: 'Profile API Request',
          operation: () => request(app)
            .get('/api/users/profile')
            .set('x-user-id', testUsers[0]._id.toString()),
          expected: 300 // ms
        }
      ];

      const baselineResults = {};

      for (const test of baselineTests) {
        const { measurements } = await measureLatency(test.operation, 10);
        const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        
        baselineResults[test.name] = {
          average,
          expected: test.expected,
          regression: average > test.expected * 1.5, // 50% regression threshold
          performance: average < test.expected ? 'better' : average < test.expected * 1.2 ? 'acceptable' : 'concerning'
        };

        // Record for reporting
        recordLatency('networkLatency', `Baseline ${test.name}`, measurements, {
          expected: test.expected,
          performance: baselineResults[test.name].performance
        });
      }

      // Check for regressions
      const regressions = Object.entries(baselineResults).filter(([, result]) => result.regression);
      
      if (regressions.length > 0) {
        console.warn(`⚠️  Performance regressions detected: ${regressions.map(([name]) => name).join(', ')}`);
      }

      // At least 70% of baseline tests should perform acceptably
      const acceptableTests = Object.values(baselineResults).filter(result => 
        result.performance === 'better' || result.performance === 'acceptable'
      ).length;
      
      expect(acceptableTests / baselineTests.length).toBeGreaterThan(0.7);
    });
  });
});