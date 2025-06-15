// Mock external services first, before any requires
jest.mock('../../utils/messageCentral', () => ({
  sendOtp: jest.fn().mockResolvedValue(123456),
  verifyOtp: jest.fn().mockResolvedValue(true),
  getMessageCentralToken: jest.fn().mockResolvedValue('mock-token-12345')
}));

jest.mock('../../utils/pushNotifications', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}));

const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
const EventSource = require('eventsource');

describe('Concurrent Chat System Simulation Tests', () => {
  let marketerUsers = [];
  let creatorUsers = [];
  let chatRooms = [];
  const performanceMetrics = {};
  const concurrencyMetrics = {};

  beforeAll(async () => {
    await connect();
    
    // Create multiple test users for concurrent testing
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    
    // Create 5 marketer users
    for (let i = 0; i < 5; i++) {
      const marketer = await User.create({
        phone: `+1212555${1000 + i}`,
        name: `Concurrent Marketer ${i}`,
        userName: `concurrent_marketer_${i}`,
        email: `marketer${i}@concurrent.com`,
        password: hashedPassword,
        userType: 'Marketer',
        isActive: true,
        marketerData: {
          companyName: `Concurrent Company ${i}`,
          industry: 'Technology',
          website: `https://concurrent${i}.com`,
          businessLicense: `CONCURRENT${i}`,
          totalCampaigns: 10 + i,
          successfulCampaigns: 8 + i,
          averageRating: 4.0 + (i * 0.2)
        }
      });
      marketerUsers.push(marketer);
    }

    // Create 5 creator users
    for (let i = 0; i < 5; i++) {
      const creator = await User.create({
        phone: `+1212555${2000 + i}`,
        name: `Concurrent Creator ${i}`,
        userName: `concurrent_creator_${i}`,
        email: `creator${i}@concurrent.com`,
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        platforms: [{
          platform: 'instagram',
          handle: `@concurrent_creator_${i}`,
          followersCount: 10000 + (i * 1000)
        }],
        creatorData: {
          platforms: ['Instagram'],
          categories: ['technology'],
          nicheTopics: ['tech'],
          achievements: `Concurrent achievements ${i}`,
          businessVentures: `Concurrent business ${i}`,
          portfolio: [],
          totalFollowers: 10000 + (i * 1000)
        }
      });
      creatorUsers.push(creator);
    }

    // Create chat rooms between each marketer and creator
    for (let i = 0; i < marketerUsers.length; i++) {
      for (let j = 0; j < creatorUsers.length; j++) {
        const chatRoom = await ChatRoom.create({
          participants: [marketerUsers[i]._id, creatorUsers[j]._id],
          lastMessage: {
            text: 'Initial chat setup',
            sender: marketerUsers[i]._id,
            createdAt: new Date()
          },
          unreadCount: {
            [marketerUsers[i]._id.toString()]: 0,
            [creatorUsers[j]._id.toString()]: 0
          }
        });
        chatRooms.push(chatRoom);
      }
    }
  });

  beforeEach(async () => {
    // Reset message counts for each test
    await Message.deleteMany({});
    
    // Reset unread counts
    for (const room of chatRooms) {
      await ChatRoom.findByIdAndUpdate(room._id, {
        'unreadCount': {
          [room.participants[0].toString()]: 0,
          [room.participants[1].toString()]: 0
        }
      });
    }
  });

  afterAll(async () => {
    // Output performance summary
    console.log('\n🚀 CONCURRENT CHAT SIMULATION RESULTS');
    console.log('=====================================');
    Object.entries(performanceMetrics).forEach(([test, metrics]) => {
      console.log(`\n${test}:`);
      console.log(`  Average: ${metrics.average}ms`);
      console.log(`  Min: ${metrics.min}ms`);
      console.log(`  Max: ${metrics.max}ms`);
      console.log(`  Total operations: ${metrics.count}`);
      if (metrics.rps) {
        console.log(`  Operations/second: ${metrics.rps}`);
      }
      if (metrics.successRate) {
        console.log(`  Success rate: ${metrics.successRate}%`);
      }
    });

    console.log('\n📊 CONCURRENCY METRICS');
    console.log('=======================');
    Object.entries(concurrencyMetrics).forEach(([test, metrics]) => {
      console.log(`\n${test}:`);
      console.log(`  Concurrent operations: ${metrics.concurrent}`);
      console.log(`  Total duration: ${metrics.duration}ms`);
      console.log(`  Throughput: ${metrics.throughput} ops/sec`);
      if (metrics.memoryUsage) {
        console.log(`  Memory usage: ${metrics.memoryUsage}MB`);
      }
    });
    console.log('\n=====================================\n');
    
    await closeDatabase();
  });

  // Helper function to measure and record performance
  const measurePerformance = (testName, duration, options = {}) => {
    if (!performanceMetrics[testName]) {
      performanceMetrics[testName] = {
        times: [],
        count: 0,
        total: 0
      };
    }
    
    performanceMetrics[testName].times.push(duration);
    performanceMetrics[testName].count++;
    performanceMetrics[testName].total += duration;
    performanceMetrics[testName].average = Math.round(performanceMetrics[testName].total / performanceMetrics[testName].count);
    performanceMetrics[testName].min = Math.min(...performanceMetrics[testName].times);
    performanceMetrics[testName].max = Math.max(...performanceMetrics[testName].times);
    
    if (options.rps) {
      performanceMetrics[testName].rps = options.rps;
    }
    if (options.successRate) {
      performanceMetrics[testName].successRate = options.successRate;
    }
  };

  // Helper function to measure concurrency metrics
  const measureConcurrency = (testName, concurrent, duration, options = {}) => {
    concurrencyMetrics[testName] = {
      concurrent,
      duration,
      throughput: Math.round((concurrent * 1000) / duration)
    };
    
    if (options.memoryUsage) {
      concurrencyMetrics[testName].memoryUsage = options.memoryUsage;
    }
  };

  describe('Concurrent Message Sending Load Tests', () => {
    it('should handle 50 concurrent messages across multiple chat rooms', async () => {
      const concurrentMessages = 50;
      const startTime = Date.now();
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Create promises for concurrent message sending
      const messagePromises = Array.from({ length: concurrentMessages }, (_, i) => {
        const roomIndex = i % chatRooms.length;
        const room = chatRooms[roomIndex];
        const senderIndex = i % 2; // Alternate between marketer and creator
        const senderId = room.participants[senderIndex];
        const receiverId = room.participants[1 - senderIndex];
        
        return request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', senderId.toString())
          .send({
            text: `Concurrent load test message ${i} - timestamp: ${Date.now()}`,
            receiverId: receiverId.toString(),
            roomId: room._id.toString()
          });
      });

      // Execute all concurrent requests
      const responses = await Promise.all(messagePromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryUsed = Math.round(memoryAfter - memoryBefore);

      // Analyze results
      const successfulResponses = responses.filter(r => r.status === 201);
      const successRate = Math.round((successfulResponses.length / responses.length) * 100);
      const averageTime = totalDuration / concurrentMessages;
      const rps = Math.round((concurrentMessages * 1000) / totalDuration);

      measurePerformance('Concurrent Message Sending - 50 msgs', averageTime, { rps, successRate });
      measureConcurrency('50 Concurrent Messages', concurrentMessages, totalDuration, { memoryUsage: memoryUsed });

      // Assertions
      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(totalDuration).toBeLessThan(3000); // Complete within 3 seconds
      expect(averageTime).toBeLessThan(300); // Average response under 300ms
      
      console.log(`✅ Concurrent messages: ${concurrentMessages} messages in ${totalDuration}ms (${rps} RPS, ${successRate}% success)`);
    });

    it('should handle 100 concurrent messages with sustained load', async () => {
      const concurrentMessages = 100;
      const startTime = Date.now();
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Create promises for sustained concurrent load
      const messagePromises = Array.from({ length: concurrentMessages }, (_, i) => {
        const roomIndex = i % chatRooms.length;
        const room = chatRooms[roomIndex];
        const senderIndex = i % 2;
        const senderId = room.participants[senderIndex];
        const receiverId = room.participants[1 - senderIndex];
        
        return request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', senderId.toString())
          .send({
            text: `Sustained load message ${i} - batch: ${Math.floor(i / 10)} - ${Date.now()}`,
            receiverId: receiverId.toString(),
            roomId: room._id.toString()
          });
      });

      const responses = await Promise.all(messagePromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryUsed = Math.round(memoryAfter - memoryBefore);

      const successfulResponses = responses.filter(r => r.status === 201);
      const successRate = Math.round((successfulResponses.length / responses.length) * 100);
      const averageTime = totalDuration / concurrentMessages;
      const rps = Math.round((concurrentMessages * 1000) / totalDuration);

      measurePerformance('Concurrent Message Sending - 100 msgs', averageTime, { rps, successRate });
      measureConcurrency('100 Concurrent Messages', concurrentMessages, totalDuration, { memoryUsage: memoryUsed });

      // Verify database state
      const messageCount = await Message.countDocuments();
      expect(messageCount).toBe(successfulResponses.length);

      // Performance expectations
      expect(successRate).toBeGreaterThan(90); // 90% success rate for higher load
      expect(totalDuration).toBeLessThan(5000); // Complete within 5 seconds
      expect(rps).toBeGreaterThan(20); // At least 20 requests per second
      
      console.log(`✅ Sustained load: ${concurrentMessages} messages in ${totalDuration}ms (${rps} RPS, ${successRate}% success)`);
    });
  });

  describe('Chat Room Load Testing', () => {
    it('should handle multiple users joining chat rooms simultaneously', async () => {
      const concurrentRoomAccess = 25;
      const startTime = Date.now();
      
      // Test concurrent access to different chat rooms
      const accessPromises = Array.from({ length: concurrentRoomAccess }, (_, i) => {
        const roomIndex = i % chatRooms.length;
        const room = chatRooms[roomIndex];
        const userIndex = i % 2;
        const userId = room.participants[userIndex];
        
        return request(app)
          .get(`/api/v1/chat/messages/${room._id}`)
          .set('x-user-id', userId.toString())
          .query({ limit: 20 });
      });

      const responses = await Promise.all(accessPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      const successRate = Math.round((successfulResponses.length / responses.length) * 100);
      const averageTime = totalDuration / concurrentRoomAccess;
      const rps = Math.round((concurrentRoomAccess * 1000) / totalDuration);

      measurePerformance('Concurrent Room Access', averageTime, { rps, successRate });
      measureConcurrency('25 Concurrent Room Access', concurrentRoomAccess, totalDuration);

      expect(successRate).toBe(100); // All room access should succeed
      expect(totalDuration).toBeLessThan(2000); // Complete within 2 seconds
      expect(averageTime).toBeLessThan(200); // Average response under 200ms
      
      console.log(`✅ Room access: ${concurrentRoomAccess} accesses in ${totalDuration}ms (${rps} RPS, ${successRate}% success)`);
    });

    it('should handle mixed concurrent operations (send + retrieve)', async () => {
      const concurrentOperations = 60; // 30 sends + 30 retrieves
      const startTime = Date.now();
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Create mixed operations: 50% sends, 50% message retrieval
      const operationPromises = Array.from({ length: concurrentOperations }, (_, i) => {
        const roomIndex = i % chatRooms.length;
        const room = chatRooms[roomIndex];
        const userIndex = i % 2;
        const userId = room.participants[userIndex];
        
        if (i % 2 === 0) {
          // Send message
          const receiverId = room.participants[1 - userIndex];
          return request(app)
            .post('/api/v1/chat/send')
            .set('x-user-id', userId.toString())
            .send({
              text: `Mixed operation send ${i} - ${Date.now()}`,
              receiverId: receiverId.toString(),
              roomId: room._id.toString()
            });
        } else {
          // Retrieve messages
          return request(app)
            .get(`/api/v1/chat/messages/${room._id}`)
            .set('x-user-id', userId.toString())
            .query({ limit: 15 });
        }
      });

      const responses = await Promise.all(operationPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryUsed = Math.round(memoryAfter - memoryBefore);

      const successfulResponses = responses.filter(r => r.status === 200 || r.status === 201);
      const successRate = Math.round((successfulResponses.length / responses.length) * 100);
      const averageTime = totalDuration / concurrentOperations;
      const rps = Math.round((concurrentOperations * 1000) / totalDuration);

      measurePerformance('Mixed Concurrent Operations', averageTime, { rps, successRate });
      measureConcurrency('60 Mixed Operations', concurrentOperations, totalDuration, { memoryUsage: memoryUsed });

      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(totalDuration).toBeLessThan(4000); // Complete within 4 seconds
      expect(averageTime).toBeLessThan(250); // Average response under 250ms
      
      console.log(`✅ Mixed operations: ${concurrentOperations} ops in ${totalDuration}ms (${rps} RPS, ${successRate}% success)`);
    });
  });

  describe('Message Throughput Testing', () => {
    it('should maintain high throughput with rapid consecutive messages', async () => {
      const messagesPerUser = 10;
      const totalMessages = marketerUsers.length * messagesPerUser;
      const startTime = Date.now();
      
      // Each marketer sends 10 rapid messages to different creators
      const rapidMessagePromises = [];
      
      for (let i = 0; i < marketerUsers.length; i++) {
        const marketer = marketerUsers[i];
        
        for (let j = 0; j < messagesPerUser; j++) {
          const creatorIndex = j % creatorUsers.length;
          const creator = creatorUsers[creatorIndex];
          const room = chatRooms.find(r => 
            r.participants.includes(marketer._id) && r.participants.includes(creator._id)
          );
          
          rapidMessagePromises.push(
            request(app)
              .post('/api/v1/chat/send')
              .set('x-user-id', marketer._id.toString())
              .send({
                text: `Rapid message ${j} from marketer ${i} - ${Date.now()}`,
                receiverId: creator._id.toString(),
                roomId: room._id.toString()
              })
          );
        }
      }

      const responses = await Promise.all(rapidMessagePromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 201);
      const successRate = Math.round((successfulResponses.length / responses.length) * 100);
      const averageTime = totalDuration / totalMessages;
      const messagesPerSecond = Math.round((totalMessages * 1000) / totalDuration);

      measurePerformance('High Throughput Messages', averageTime, { rps: messagesPerSecond, successRate });
      measureConcurrency('Rapid Message Throughput', totalMessages, totalDuration);

      // Verify database consistency
      const dbMessageCount = await Message.countDocuments();
      expect(dbMessageCount).toBe(successfulResponses.length);

      expect(successRate).toBeGreaterThan(90); // 90% success rate
      expect(messagesPerSecond).toBeGreaterThan(15); // At least 15 messages per second
      expect(totalDuration).toBeLessThan(6000); // Complete within 6 seconds
      
      console.log(`✅ High throughput: ${totalMessages} messages in ${totalDuration}ms (${messagesPerSecond} msg/sec, ${successRate}% success)`);
    });

    it('should handle burst traffic patterns', async () => {
      const burstSize = 20;
      const burstCount = 3;
      const burstDelay = 100; // 100ms between bursts
      
      const allBurstResults = [];
      const overallStartTime = Date.now();
      
      for (let burst = 0; burst < burstCount; burst++) {
        const burstStartTime = Date.now();
        
        // Create burst of messages
        const burstPromises = Array.from({ length: burstSize }, (_, i) => {
          const roomIndex = (burst * burstSize + i) % chatRooms.length;
          const room = chatRooms[roomIndex];
          const senderIndex = i % 2;
          const senderId = room.participants[senderIndex];
          const receiverId = room.participants[1 - senderIndex];
          
          return request(app)
            .post('/api/v1/chat/send')
            .set('x-user-id', senderId.toString())
            .send({
              text: `Burst ${burst} message ${i} - ${Date.now()}`,
              receiverId: receiverId.toString(),
              roomId: room._id.toString()
            });
        });

        const burstResponses = await Promise.all(burstPromises);
        const burstEndTime = Date.now();
        const burstDuration = burstEndTime - burstStartTime;
        
        const burstSuccessCount = burstResponses.filter(r => r.status === 201).length;
        allBurstResults.push({
          burst,
          duration: burstDuration,
          successCount: burstSuccessCount,
          total: burstSize
        });

        console.log(`  Burst ${burst + 1}: ${burstSuccessCount}/${burstSize} in ${burstDuration}ms`);
        
        // Small delay between bursts
        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, burstDelay));
        }
      }

      const overallEndTime = Date.now();
      const overallDuration = overallEndTime - overallStartTime;
      const totalMessages = burstSize * burstCount;
      const totalSuccessful = allBurstResults.reduce((sum, result) => sum + result.successCount, 0);
      const overallSuccessRate = Math.round((totalSuccessful / totalMessages) * 100);
      const overallThroughput = Math.round((totalMessages * 1000) / overallDuration);

      measurePerformance('Burst Traffic Pattern', overallDuration / totalMessages, { 
        rps: overallThroughput, 
        successRate: overallSuccessRate 
      });
      measureConcurrency('3 Message Bursts', totalMessages, overallDuration);

      expect(overallSuccessRate).toBeGreaterThan(85); // 85% success rate for burst patterns
      expect(overallDuration).toBeLessThan(8000); // Complete within 8 seconds
      
      console.log(`✅ Burst pattern: ${totalMessages} messages in ${burstCount} bursts, ${overallDuration}ms total (${overallThroughput} msg/sec, ${overallSuccessRate}% success)`);
    });
  });

  describe('Database Performance Under Load', () => {
    it('should maintain query performance with high message volume', async () => {
      // First, create a high volume of messages
      const messageVolume = 200;
      const room = chatRooms[0];
      const marketer = marketerUsers[0];
      const creator = creatorUsers[0];
      
      // Bulk create messages for testing
      const bulkMessages = Array.from({ length: messageVolume }, (_, i) => ({
        chatId: room._id,
        senderId: i % 2 === 0 ? marketer._id : creator._id,
        text: `Bulk message ${i} for performance testing`,
        createdAt: new Date(Date.now() - ((messageVolume - i) * 60000)) // Spread over time
      }));

      await Message.insertMany(bulkMessages);

      // Test query performance with high volume
      const queryIterations = 10;
      const queryTimes = [];

      for (let i = 0; i < queryIterations; i++) {
        const queryStartTime = Date.now();
        
        const response = await request(app)
          .get(`/api/v1/chat/messages/${room._id}`)
          .set('x-user-id', marketer._id.toString())
          .query({ limit: 30 });
        
        const queryEndTime = Date.now();
        const queryDuration = queryEndTime - queryStartTime;
        queryTimes.push(queryDuration);

        expect(response.status).toBe(200);
        expect(response.body.messages.length).toBeGreaterThan(0);
      }

      const averageQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      const maxQueryTime = Math.max(...queryTimes);
      const minQueryTime = Math.min(...queryTimes);

      measurePerformance('High Volume Query Performance', averageQueryTime);

      expect(averageQueryTime).toBeLessThan(300); // Queries should be fast even with high volume
      expect(maxQueryTime).toBeLessThan(500); // No single query should be too slow
      
      console.log(`✅ High volume queries: ${queryIterations} queries, avg ${Math.round(averageQueryTime)}ms (min: ${minQueryTime}ms, max: ${maxQueryTime}ms)`);
    });

    it('should handle concurrent database operations efficiently', async () => {
      const concurrentQueries = 30;
      const startTime = Date.now();
      
      // Mix of different database operations
      const dbOperationPromises = Array.from({ length: concurrentQueries }, (_, i) => {
        const roomIndex = i % chatRooms.length;
        const room = chatRooms[roomIndex];
        const userIndex = i % 2;
        const userId = room.participants[userIndex];
        
        if (i % 3 === 0) {
          // Query messages
          return request(app)
            .get(`/api/v1/chat/messages/${room._id}`)
            .set('x-user-id', userId.toString())
            .query({ limit: 25 });
        } else if (i % 3 === 1) {
          // Send message (involves multiple DB operations)
          const receiverId = room.participants[1 - userIndex];
          return request(app)
            .post('/api/v1/chat/send')
            .set('x-user-id', userId.toString())
            .send({
              text: `Concurrent DB test ${i} - ${Date.now()}`,
              receiverId: receiverId.toString(),
              roomId: room._id.toString()
            });
        } else {
          // Query messages with pagination
          return request(app)
            .get(`/api/v1/chat/messages/${room._id}`)
            .set('x-user-id', userId.toString())
            .query({ limit: 15, cursor: new Date(Date.now() - 3600000).toISOString() });
        }
      });

      const responses = await Promise.all(dbOperationPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200 || r.status === 201);
      const successRate = Math.round((successfulResponses.length / responses.length) * 100);
      const averageTime = totalDuration / concurrentQueries;
      const operationsPerSecond = Math.round((concurrentQueries * 1000) / totalDuration);

      measurePerformance('Concurrent DB Operations', averageTime, { rps: operationsPerSecond, successRate });
      measureConcurrency('30 Concurrent DB Ops', concurrentQueries, totalDuration);

      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(totalDuration).toBeLessThan(3000); // Complete within 3 seconds
      expect(operationsPerSecond).toBeGreaterThan(10); // At least 10 operations per second
      
      console.log(`✅ Concurrent DB ops: ${concurrentQueries} operations in ${totalDuration}ms (${operationsPerSecond} ops/sec, ${successRate}% success)`);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should maintain stable memory usage under sustained load', async () => {
      const sustainedOperations = 150;
      const memorySnapshots = [];
      
      // Take initial memory snapshot
      const initialMemory = process.memoryUsage();
      memorySnapshots.push({
        operation: 0,
        heapUsed: initialMemory.heapUsed / 1024 / 1024,
        heapTotal: initialMemory.heapTotal / 1024 / 1024
      });

      const startTime = Date.now();
      
      // Perform sustained operations with memory monitoring
      for (let batch = 0; batch < 5; batch++) {
        const batchPromises = Array.from({ length: 30 }, (_, i) => {
          const globalIndex = batch * 30 + i;
          const roomIndex = globalIndex % chatRooms.length;
          const room = chatRooms[roomIndex];
          const senderIndex = globalIndex % 2;
          const senderId = room.participants[senderIndex];
          const receiverId = room.participants[1 - senderIndex];
          
          return request(app)
            .post('/api/v1/chat/send')
            .set('x-user-id', senderId.toString())
            .send({
              text: `Memory test message ${globalIndex} - batch ${batch} - ${Date.now()}`,
              receiverId: receiverId.toString(),
              roomId: room._id.toString()
            });
        });

        await Promise.all(batchPromises);
        
        // Take memory snapshot after each batch
        const currentMemory = process.memoryUsage();
        memorySnapshots.push({
          operation: (batch + 1) * 30,
          heapUsed: currentMemory.heapUsed / 1024 / 1024,
          heapTotal: currentMemory.heapTotal / 1024 / 1024
        });
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      // Analyze memory usage patterns
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryIncrease = finalMemory.heapUsed - memorySnapshots[0].heapUsed;
      const averageMemoryPerOperation = memoryIncrease / sustainedOperations;

      measurePerformance('Sustained Load Memory Test', totalDuration / sustainedOperations);
      measureConcurrency('150 Sustained Operations', sustainedOperations, totalDuration, { 
        memoryUsage: Math.round(memoryIncrease) 
      });

      // Memory usage should be reasonable
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
      expect(averageMemoryPerOperation).toBeLessThan(0.5); // Less than 0.5MB per operation
      expect(finalMemory.heapUsed).toBeLessThan(200); // Total heap under 200MB
      
      console.log(`✅ Memory stability: ${sustainedOperations} ops, ${Math.round(memoryIncrease)}MB increase (${Math.round(averageMemoryPerOperation * 1000)}KB/op)`);
      console.log(`   Memory progression: ${memorySnapshots[0].heapUsed.toFixed(1)}MB → ${finalMemory.heapUsed.toFixed(1)}MB`);
    });
  });
});