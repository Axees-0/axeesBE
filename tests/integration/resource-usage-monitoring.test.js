const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const Offer = require('../../models/offer');
const mongoose = require('mongoose');

describe('Resource Usage Monitoring Tests', () => {
  const resourceMetrics = {
    memoryUsage: {},
    cpuPerformance: {},
    databaseResources: {},
    networkResources: {},
    systemLoad: {}
  };

  let baselineMetrics = {};
  let testUsers = [];

  beforeAll(async () => {
    await connect();
    
    // Capture baseline system metrics
    baselineMetrics = {
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: Date.now()
    };

    // Create test users for resource testing
    const hashedPassword = await require('bcrypt').hash('ResourceTest123!', 10);
    
    for (let i = 0; i < 3; i++) {
      const user = await User.create({
        phone: `+1212555${5000 + i}`,
        name: `Resource Test User ${i}`,
        userName: `resource_user_${i}`,
        email: `resource${i}@test.com`,
        password: hashedPassword,
        userType: i === 0 ? 'Marketer' : 'Creator',
        isActive: true,
        platforms: [{
          platform: 'instagram',
          handle: `@resource_user_${i}`,
          followersCount: 2000 + (i * 1000)
        }],
        ...(i === 0 ? {
          marketerData: {
            companyName: `Resource Company ${i}`,
            industry: 'Technology',
            website: `https://resource${i}.com`,
            businessLicense: `RES${i}`,
            totalCampaigns: 10,
            successfulCampaigns: 8,
            averageRating: 4.7
          }
        } : {
          creatorData: {
            platforms: ['Instagram'],
            categories: ['technology'],
            nicheTopics: ['tech'],
            achievements: `Resource achievements ${i}`,
            businessVentures: `Resource business ${i}`,
            portfolio: [],
            totalFollowers: 2000 + (i * 1000)
          }
        })
      });
      testUsers.push(user);
    }
  });

  beforeEach(async () => {
    // Clear transactional data
    await Offer.deleteMany({});
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  afterAll(async () => {
    // Output comprehensive resource usage analysis
    console.log('\n📊 RESOURCE USAGE MONITORING RESULTS');
    console.log('====================================');
    
    Object.entries(resourceMetrics).forEach(([category, results]) => {
      console.log(`\n📋 ${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`);
      
      if (Object.keys(results).length === 0) {
        console.log('   No measurements recorded');
        return;
      }
      
      Object.entries(results).forEach(([test, metrics]) => {
        console.log(`\n   🔍 ${test}:`);
        
        if (metrics.peak !== undefined) {
          console.log(`      Peak: ${metrics.peak}${metrics.unit || ''}`);
        }
        if (metrics.average !== undefined) {
          console.log(`      Average: ${metrics.average}${metrics.unit || ''}`);
        }
        if (metrics.baseline !== undefined) {
          console.log(`      Baseline: ${metrics.baseline}${metrics.unit || ''}`);
        }
        if (metrics.increase !== undefined) {
          console.log(`      Increase: ${metrics.increase}${metrics.unit || ''} (${metrics.increasePercent || 0}%)`);
        }
        if (metrics.efficiency !== undefined) {
          console.log(`      Efficiency: ${metrics.efficiency}`);
        }
        if (metrics.memoryLeakDetected !== undefined) {
          console.log(`      Memory Leak: ${metrics.memoryLeakDetected ? '⚠️  Detected' : '✅ None detected'}`);
        }
        if (metrics.status !== undefined) {
          const statusIcon = metrics.status === 'optimal' ? '🟢' : metrics.status === 'acceptable' ? '🟡' : '🔴';
          console.log(`      Status: ${statusIcon} ${metrics.status.toUpperCase()}`);
        }
      });
    });
    
    // Resource usage recommendations
    console.log('\n🎯 RESOURCE OPTIMIZATION RECOMMENDATIONS');
    console.log('========================================');
    
    const memoryTests = Object.values(resourceMetrics.memoryUsage);
    const highMemoryUsage = memoryTests.filter(test => test.status === 'concerning').length;
    const cpuTests = Object.values(resourceMetrics.cpuPerformance);
    const highCpuUsage = cpuTests.filter(test => test.status === 'concerning').length;
    
    if (highMemoryUsage > 0) {
      console.log(`   ⚠️  ${highMemoryUsage} memory usage issues detected`);
      console.log('      - Consider implementing memory pooling');
      console.log('      - Review object lifecycle management');
      console.log('      - Monitor for memory leaks in production');
    } else {
      console.log('   ✅ Memory usage within acceptable limits');
    }
    
    if (highCpuUsage > 0) {
      console.log(`   ⚠️  ${highCpuUsage} CPU performance issues detected`);
      console.log('      - Optimize computational operations');
      console.log('      - Consider caching for expensive operations');
      console.log('      - Review database query efficiency');
    } else {
      console.log('   ✅ CPU performance within acceptable limits');
    }
    
    console.log('\n====================================\n');
    
    await closeDatabase();
  });

  // Helper function to record resource metrics
  const recordResourceMetric = (category, testName, metrics) => {
    resourceMetrics[category][testName] = metrics;
  };

  // Helper function to measure memory usage
  const measureMemoryUsage = (baseline, current) => {
    const increase = {
      heapUsed: current.heapUsed - baseline.heapUsed,
      heapTotal: current.heapTotal - baseline.heapTotal,
      external: current.external - baseline.external,
      rss: current.rss - baseline.rss
    };
    
    const increasePercent = {
      heapUsed: Math.round((increase.heapUsed / baseline.heapUsed) * 100),
      heapTotal: Math.round((increase.heapTotal / baseline.heapTotal) * 100),
      external: Math.round((increase.external / baseline.external) * 100),
      rss: Math.round((increase.rss / baseline.rss) * 100)
    };
    
    return { increase, increasePercent, baseline, current };
  };

  // Helper function to format bytes
  const formatBytes = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return Math.round(mb * 100) / 100; // Round to 2 decimal places
  };

  describe('Memory Usage Monitoring', () => {
    it('should monitor memory usage during API operations', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Perform multiple API operations to stress memory
      const operations = 50;
      const promises = [];
      
      for (let i = 0; i < operations; i++) {
        promises.push(
          request(app)
            .get('/api/users/profile')
            .set('x-user-id', testUsers[0]._id.toString())
        );
      }
      
      await Promise.all(promises);
      
      // Wait a moment for garbage collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const memoryAfter = process.memoryUsage();
      const memoryAnalysis = measureMemoryUsage(memoryBefore, memoryAfter);
      
      const peakHeapMB = formatBytes(memoryAfter.heapUsed);
      const increaseHeapMB = formatBytes(memoryAnalysis.increase.heapUsed);
      const increasePercent = memoryAnalysis.increasePercent.heapUsed;
      
      // Determine memory usage status
      let status = 'optimal';
      if (increasePercent > 50 || increaseHeapMB > 50) {
        status = 'concerning';
      } else if (increasePercent > 20 || increaseHeapMB > 20) {
        status = 'acceptable';
      }

      recordResourceMetric('memoryUsage', 'API Operations Memory', {
        peak: peakHeapMB,
        unit: 'MB',
        baseline: formatBytes(memoryBefore.heapUsed),
        increase: increaseHeapMB,
        increasePercent,
        operations,
        status,
        efficiency: `${(operations / increaseHeapMB).toFixed(2)} ops/MB`
      });

      expect(increasePercent).toBeLessThan(100); // Memory shouldn't double
      expect(peakHeapMB).toBeLessThan(500); // Peak memory should be reasonable
    });

    it('should detect memory leaks during sustained operations', async () => {
      const iterations = 5;
      const memoryMeasurements = [];
      
      // Perform sustained operations and measure memory
      for (let i = 0; i < iterations; i++) {
        // Perform operations
        await request(app)
          .get('/api/users/profile')
          .set('x-user-id', testUsers[0]._id.toString());
        
        await User.find({ isActive: true }).limit(10);
        
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        // Wait and measure
        await new Promise(resolve => setTimeout(resolve, 50));
        memoryMeasurements.push(process.memoryUsage().heapUsed);
      }
      
      // Analyze memory trend
      const firstMeasurement = memoryMeasurements[0];
      const lastMeasurement = memoryMeasurements[memoryMeasurements.length - 1];
      const memoryGrowth = lastMeasurement - firstMeasurement;
      const growthPercent = Math.round((memoryGrowth / firstMeasurement) * 100);
      
      // Check if memory consistently increases (potential leak)
      let consistentGrowth = true;
      for (let i = 1; i < memoryMeasurements.length; i++) {
        if (memoryMeasurements[i] <= memoryMeasurements[i - 1] * 1.1) { // Allow 10% variance
          consistentGrowth = false;
          break;
        }
      }
      
      const memoryLeakDetected = consistentGrowth && growthPercent > 20;
      
      recordResourceMetric('memoryUsage', 'Memory Leak Detection', {
        baseline: formatBytes(firstMeasurement),
        peak: formatBytes(lastMeasurement),
        unit: 'MB',
        increase: formatBytes(memoryGrowth),
        increasePercent: growthPercent,
        memoryLeakDetected,
        measurements: iterations,
        status: memoryLeakDetected ? 'concerning' : growthPercent > 10 ? 'acceptable' : 'optimal'
      });

      expect(memoryLeakDetected).toBe(false);
      expect(growthPercent).toBeLessThan(50); // Memory growth should be reasonable
    });

    it('should monitor memory usage during database operations', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Perform database-intensive operations
      const marketer = testUsers.find(u => u.userType === 'Marketer');
      const creator = testUsers.find(u => u.userType === 'Creator');
      
      // Create and query offers
      const offers = [];
      for (let i = 0; i < 25; i++) {
        const offer = await Offer.create({
          marketerId: marketer._id,
          creatorId: creator._id,
          offerName: `Memory Test Offer ${i}`,
          proposedAmount: 1000 + (i * 50),
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: `Memory test offer ${i}`,
          status: 'Sent'
        });
        offers.push(offer);
      }
      
      // Perform aggregation
      await Offer.aggregate([
        { $match: { marketerId: marketer._id } },
        { $group: { _id: '$status', count: { $sum: 1 }, avgAmount: { $avg: '$proposedAmount' } } }
      ]);
      
      const memoryAfter = process.memoryUsage();
      const memoryAnalysis = measureMemoryUsage(memoryBefore, memoryAfter);
      
      const peakHeapMB = formatBytes(memoryAfter.heapUsed);
      const increaseHeapMB = formatBytes(memoryAnalysis.increase.heapUsed);
      const increasePercent = memoryAnalysis.increasePercent.heapUsed;
      
      let status = 'optimal';
      if (increasePercent > 40 || increaseHeapMB > 30) {
        status = 'concerning';
      } else if (increasePercent > 15 || increaseHeapMB > 15) {
        status = 'acceptable';
      }

      recordResourceMetric('memoryUsage', 'Database Operations Memory', {
        peak: peakHeapMB,
        unit: 'MB',
        baseline: formatBytes(memoryBefore.heapUsed),
        increase: increaseHeapMB,
        increasePercent,
        operations: offers.length + 1, // +1 for aggregation
        status,
        efficiency: `${((offers.length + 1) / increaseHeapMB).toFixed(2)} ops/MB`
      });

      expect(increasePercent).toBeLessThan(80); // Memory increase should be reasonable
      expect(peakHeapMB).toBeLessThan(300); // Peak memory for DB ops should be manageable
    });
  });

  describe('CPU Performance Monitoring', () => {
    it('should monitor CPU usage during computational operations', async () => {
      const cpuBefore = process.cpuUsage();
      const timeBefore = process.hrtime.bigint();
      
      // Perform CPU-intensive operations
      const iterations = 10000;
      let computationResult = 0;
      
      for (let i = 0; i < iterations; i++) {
        // Simulate computational work
        computationResult += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
        
        if (i % 1000 === 0) {
          // Simulate API call processing
          JSON.parse(JSON.stringify({ 
            id: i, 
            data: testUsers[0].name,
            timestamp: Date.now()
          }));
        }
      }
      
      const timeAfter = process.hrtime.bigint();
      const cpuAfter = process.cpuUsage(cpuBefore);
      const wallClockTime = Number((timeAfter - timeBefore) / 1000000n); // Convert to milliseconds
      
      const cpuUserMS = cpuAfter.user / 1000; // Convert microseconds to milliseconds
      const cpuSystemMS = cpuAfter.system / 1000;
      const totalCpuMS = cpuUserMS + cpuSystemMS;
      
      const cpuUtilization = Math.round((totalCpuMS / wallClockTime) * 100);
      const operationsPerSecond = Math.round((iterations * 1000) / wallClockTime);
      
      let status = 'optimal';
      if (cpuUtilization > 80 || wallClockTime > 1000) {
        status = 'concerning';
      } else if (cpuUtilization > 50 || wallClockTime > 500) {
        status = 'acceptable';
      }

      recordResourceMetric('cpuPerformance', 'Computational Operations', {
        wallClockTime,
        unit: 'ms',
        cpuUserTime: Math.round(cpuUserMS),
        cpuSystemTime: Math.round(cpuSystemMS),
        cpuUtilization: `${cpuUtilization}%`,
        operationsPerSecond,
        iterations,
        status,
        efficiency: `${operationsPerSecond} ops/sec`
      });

      expect(cpuUtilization).toBeLessThan(90); // CPU utilization should be reasonable
      expect(wallClockTime).toBeLessThan(2000); // Operations should complete in reasonable time
      expect(operationsPerSecond).toBeGreaterThan(5000); // Should maintain good throughput
    });

    it('should monitor CPU efficiency during API request processing', async () => {
      const cpuBefore = process.cpuUsage();
      const timeBefore = process.hrtime.bigint();
      
      // Process multiple API requests
      const requests = 20;
      const promises = [];
      
      for (let i = 0; i < requests; i++) {
        promises.push(
          request(app)
            .post('/api/marketer/offers')
            .set('x-user-id', testUsers[0]._id.toString())
            .send({
              creatorId: testUsers[1]._id.toString(),
              offerName: `CPU Test Offer ${i}`,
              proposedAmount: 1000 + (i * 100),
              currency: 'USD',
              platforms: ['Instagram'],
              deliverables: ['Post'],
              desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              description: `CPU test offer ${i}`
            })
        );
      }
      
      const responses = await Promise.all(promises);
      
      const timeAfter = process.hrtime.bigint();
      const cpuAfter = process.cpuUsage(cpuBefore);
      const wallClockTime = Number((timeAfter - timeBefore) / 1000000n);
      
      const cpuUserMS = cpuAfter.user / 1000;
      const cpuSystemMS = cpuAfter.system / 1000;
      const totalCpuMS = cpuUserMS + cpuSystemMS;
      
      const successfulRequests = responses.filter(r => r.status === 201).length;
      const requestsPerSecond = Math.round((requests * 1000) / wallClockTime);
      const cpuPerRequest = Math.round(totalCpuMS / requests);
      const successRate = Math.round((successfulRequests / requests) * 100);
      
      let status = 'optimal';
      if (cpuPerRequest > 50 || requestsPerSecond < 10) {
        status = 'concerning';
      } else if (cpuPerRequest > 20 || requestsPerSecond < 20) {
        status = 'acceptable';
      }

      recordResourceMetric('cpuPerformance', 'API Request Processing', {
        wallClockTime,
        unit: 'ms',
        cpuPerRequest,
        requestsPerSecond,
        successRate: `${successRate}%`,
        totalRequests: requests,
        status,
        efficiency: `${requestsPerSecond} req/sec`
      });

      expect(cpuPerRequest).toBeLessThan(100); // CPU time per request should be reasonable
      expect(requestsPerSecond).toBeGreaterThan(5); // Should maintain reasonable throughput
      expect(successRate).toBeGreaterThan(80); // Most requests should succeed
    });
  });

  describe('Database Resource Monitoring', () => {
    it('should monitor database connection pool usage', async () => {
      const connectionsBefore = mongoose.connections.length;
      
      // Perform multiple concurrent database operations
      const concurrentOps = 15;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentOps }, (_, i) => 
        User.findById(testUsers[i % testUsers.length]._id)
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      const connectionsAfter = mongoose.connections.length;
      const averageQueryTime = totalTime / concurrentOps;
      const queriesPerSecond = Math.round((concurrentOps * 1000) / totalTime);
      
      let status = 'optimal';
      if (averageQueryTime > 100 || queriesPerSecond < 50) {
        status = 'concerning';
      } else if (averageQueryTime > 50 || queriesPerSecond < 100) {
        status = 'acceptable';
      }

      recordResourceMetric('databaseResources', 'Connection Pool Usage', {
        concurrentOperations: concurrentOps,
        totalTime,
        unit: 'ms',
        averageQueryTime: Math.round(averageQueryTime),
        queriesPerSecond,
        connectionsBefore,
        connectionsAfter,
        connectionsCreated: connectionsAfter - connectionsBefore,
        successfulQueries: results.filter(r => r !== null).length,
        status,
        efficiency: `${queriesPerSecond} queries/sec`
      });

      expect(averageQueryTime).toBeLessThan(200); // Queries should be fast
      expect(queriesPerSecond).toBeGreaterThan(30); // Good database throughput
      expect(results.every(r => r !== null)).toBe(true); // All queries should succeed
    });

    it('should monitor database memory usage patterns', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Create and query large dataset
      const dataSize = 50;
      const offers = [];
      
      const marketer = testUsers.find(u => u.userType === 'Marketer');
      const creator = testUsers.find(u => u.userType === 'Creator');
      
      // Create offers
      for (let i = 0; i < dataSize; i++) {
        const offer = await Offer.create({
          marketerId: marketer._id,
          creatorId: creator._id,
          offerName: `DB Memory Test Offer ${i}`,
          proposedAmount: 1000 + (i * 25),
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post', 'Story'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: `Database memory test offer ${i} with extended description to increase memory usage`,
          status: ['Sent', 'Accepted', 'Rejected'][i % 3]
        });
        offers.push(offer);
      }
      
      // Query and aggregate data
      const allOffers = await Offer.find({ marketerId: marketer._id });
      const aggregationResult = await Offer.aggregate([
        { $match: { marketerId: marketer._id } },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 }, 
            avgAmount: { $avg: '$proposedAmount' },
            maxAmount: { $max: '$proposedAmount' },
            minAmount: { $min: '$proposedAmount' }
          } 
        },
        { $sort: { count: -1 } }
      ]);
      
      const memoryAfter = process.memoryUsage();
      const memoryIncrease = formatBytes(memoryAfter.heapUsed - memoryBefore.heapUsed);
      const memoryPerRecord = memoryIncrease / dataSize;
      
      let status = 'optimal';
      if (memoryPerRecord > 0.5 || memoryIncrease > 25) {
        status = 'concerning';
      } else if (memoryPerRecord > 0.2 || memoryIncrease > 10) {
        status = 'acceptable';
      }

      recordResourceMetric('databaseResources', 'Database Memory Usage', {
        recordsCreated: dataSize,
        recordsQueried: allOffers.length,
        aggregationGroups: aggregationResult.length,
        memoryIncrease,
        unit: 'MB',
        memoryPerRecord: Math.round(memoryPerRecord * 1000) / 1000, // Round to 3 decimal places
        peakMemory: formatBytes(memoryAfter.heapUsed),
        status,
        efficiency: `${(1 / memoryPerRecord).toFixed(1)} records/MB`
      });

      expect(memoryPerRecord).toBeLessThan(1); // Memory per record should be efficient
      expect(memoryIncrease).toBeLessThan(50); // Total memory increase should be reasonable
      expect(allOffers.length).toBe(dataSize); // All records should be retrievable
      expect(aggregationResult.length).toBeGreaterThan(0); // Aggregation should work
    });
  });

  describe('Network Resource Monitoring', () => {
    it('should monitor network latency and throughput', async () => {
      const requestSizes = [
        { name: 'Small', size: 'basic profile request' },
        { name: 'Medium', size: 'offer creation with data' },
        { name: 'Large', size: 'bulk data retrieval' }
      ];
      
      const networkMetrics = {};
      
      for (const requestType of requestSizes) {
        const iterations = 10;
        const latencies = [];
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          const requestStart = Date.now();
          
          let response;
          if (requestType.name === 'Small') {
            response = await request(app)
              .get('/api/users/profile')
              .set('x-user-id', testUsers[0]._id.toString());
          } else if (requestType.name === 'Medium') {
            response = await request(app)
              .post('/api/marketer/offers')
              .set('x-user-id', testUsers[0]._id.toString())
              .send({
                creatorId: testUsers[1]._id.toString(),
                offerName: `Network Test Offer ${i}`,
                proposedAmount: 1500,
                currency: 'USD',
                platforms: ['Instagram', 'TikTok'],
                deliverables: ['Post', 'Story', 'Reel'],
                desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                description: 'Network performance test offer with extended description and detailed requirements'
              });
          } else {
            // Large request - get multiple users
            response = await request(app)
              .get('/api/users/profile')
              .set('x-user-id', testUsers[0]._id.toString());
          }
          
          const requestEnd = Date.now();
          latencies.push(requestEnd - requestStart);
        }
        
        const totalTime = Date.now() - startTime;
        const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const minLatency = Math.min(...latencies);
        const maxLatency = Math.max(...latencies);
        const throughput = Math.round((iterations * 1000) / totalTime);
        
        networkMetrics[requestType.name] = {
          averageLatency: Math.round(averageLatency),
          minLatency,
          maxLatency,
          throughput,
          iterations
        };
      }
      
      recordResourceMetric('networkResources', 'Network Performance', networkMetrics);

      // Validate network performance
      expect(networkMetrics.Small.averageLatency).toBeLessThan(200);
      expect(networkMetrics.Medium.averageLatency).toBeLessThan(500);
      expect(networkMetrics.Large.averageLatency).toBeLessThan(800);
      expect(networkMetrics.Small.throughput).toBeGreaterThan(20);
    });

    it('should monitor concurrent network load handling', async () => {
      const concurrentConnections = 25;
      const startTime = Date.now();
      const memoryBefore = process.memoryUsage();
      
      // Create concurrent requests
      const promises = Array.from({ length: concurrentConnections }, (_, i) => {
        const userIndex = i % testUsers.length;
        const requestStart = Date.now();
        
        return request(app)
          .get('/api/users/profile')
          .set('x-user-id', testUsers[userIndex]._id.toString())
          .then(response => ({
            latency: Date.now() - requestStart,
            status: response.status,
            success: response.status === 200
          }))
          .catch(error => ({
            latency: Date.now() - requestStart,
            status: 0,
            success: false,
            error: error.message
          }));
      });
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const memoryAfter = process.memoryUsage();
      
      const successfulRequests = results.filter(r => r.success).length;
      const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
      const maxLatency = Math.max(...results.map(r => r.latency));
      const minLatency = Math.min(...results.map(r => r.latency));
      const successRate = Math.round((successfulRequests / concurrentConnections) * 100);
      const requestsPerSecond = Math.round((concurrentConnections * 1000) / totalTime);
      const memoryIncrease = formatBytes(memoryAfter.heapUsed - memoryBefore.heapUsed);
      
      let status = 'optimal';
      if (successRate < 90 || averageLatency > 1000 || requestsPerSecond < 10) {
        status = 'concerning';
      } else if (successRate < 95 || averageLatency > 500 || requestsPerSecond < 20) {
        status = 'acceptable';
      }

      recordResourceMetric('networkResources', 'Concurrent Load Handling', {
        concurrentConnections,
        successfulRequests,
        successRate: `${successRate}%`,
        averageLatency: Math.round(averageLatency),
        minLatency,
        maxLatency,
        unit: 'ms',
        requestsPerSecond,
        totalTime,
        memoryIncrease,
        status,
        efficiency: `${requestsPerSecond} req/sec`
      });

      expect(successRate).toBeGreaterThan(85);
      expect(averageLatency).toBeLessThan(1500);
      expect(requestsPerSecond).toBeGreaterThan(8);
    });
  });

  describe('System Load Monitoring', () => {
    it('should monitor overall system load under mixed operations', async () => {
      const startTime = Date.now();
      const memoryBefore = process.memoryUsage();
      const cpuBefore = process.cpuUsage();
      
      // Simulate mixed system load
      const operations = {
        apiRequests: 0,
        dbOperations: 0,
        computations: 0
      };
      
      const mixedOperations = [];
      
      // API requests
      for (let i = 0; i < 15; i++) {
        mixedOperations.push(
          request(app)
            .get('/api/users/profile')
            .set('x-user-id', testUsers[i % testUsers.length]._id.toString())
            .then(() => { operations.apiRequests++; })
        );
      }
      
      // Database operations
      for (let i = 0; i < 10; i++) {
        mixedOperations.push(
          User.find({ isActive: true }).limit(5)
            .then(() => { operations.dbOperations++; })
        );
      }
      
      // CPU-intensive computations
      for (let i = 0; i < 5; i++) {
        mixedOperations.push(
          new Promise(resolve => {
            setTimeout(() => {
              let result = 0;
              for (let j = 0; j < 5000; j++) {
                result += Math.sqrt(j) * Math.sin(j);
              }
              operations.computations++;
              resolve(result);
            }, 10);
          })
        );
      }
      
      await Promise.all(mixedOperations);
      
      const endTime = Date.now();
      const memoryAfter = process.memoryUsage();
      const cpuAfter = process.cpuUsage(cpuBefore);
      
      const totalTime = endTime - startTime;
      const memoryIncrease = formatBytes(memoryAfter.heapUsed - memoryBefore.heapUsed);
      const cpuUserMS = cpuAfter.user / 1000;
      const cpuSystemMS = cpuAfter.system / 1000;
      const totalCpuMS = cpuUserMS + cpuSystemMS;
      const cpuUtilization = Math.round((totalCpuMS / totalTime) * 100);
      
      const totalOperations = operations.apiRequests + operations.dbOperations + operations.computations;
      const operationsPerSecond = Math.round((totalOperations * 1000) / totalTime);
      
      let status = 'optimal';
      if (cpuUtilization > 70 || memoryIncrease > 20 || operationsPerSecond < 20) {
        status = 'concerning';
      } else if (cpuUtilization > 40 || memoryIncrease > 10 || operationsPerSecond < 40) {
        status = 'acceptable';
      }

      recordResourceMetric('systemLoad', 'Mixed Operations Load', {
        totalOperations,
        apiRequests: operations.apiRequests,
        dbOperations: operations.dbOperations,
        computations: operations.computations,
        totalTime,
        unit: 'ms',
        operationsPerSecond,
        cpuUtilization: `${cpuUtilization}%`,
        memoryIncrease,
        memoryUnit: 'MB',
        status,
        efficiency: `${operationsPerSecond} ops/sec`
      });

      expect(totalOperations).toBe(30); // All operations should complete
      expect(cpuUtilization).toBeLessThan(80); // CPU should not be overwhelmed
      expect(memoryIncrease).toBeLessThan(30); // Memory increase should be reasonable
      expect(operationsPerSecond).toBeGreaterThan(15); // Should maintain good throughput
    });
  });
});